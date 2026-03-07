package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const callbackHTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Agent Bambu</title></head>
<body style="font-family:system-ui;max-width:420px;margin:2rem auto;padding:1.5rem;text-align:center;">
  <h1 style="color:#059669;">Logged in</h1>
  <p>Token has been passed to the agent. You can close this tab.</p>
</body></html>`

// runBambuLoginPython runs agent/scripts/bambu_login.py (curl_cffi) and returns token, require2FA, or error.
func runBambuLoginPython(email, password, tfaCode string) (token string, require2FA bool, err error) {
	script := findBambuLoginScript()
	if script == "" {
		return "", false, fmt.Errorf("bambu_login.py script not found (see README: venv + pip install -r scripts/requirements.txt)")
	}
	pythonExe := findPythonForBambuLogin(script)
	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()
	args := []string{script, email, password}
	if tfaCode != "" {
		args = append(args, strings.TrimSpace(tfaCode))
	}
	cmd := exec.CommandContext(ctx, pythonExe, args...)
	cmd.Stdin = nil
	var stderr strings.Builder
	cmd.Stderr = &stderr
	out, runErr := cmd.Output()
	errStr := strings.TrimSpace(stderr.String())
	if runErr != nil {
		if exitErr, ok := runErr.(*exec.ExitError); ok && exitErr.ExitCode() == 1 {
			if strings.Contains(errStr, "REQUIRE_2FA") {
				return "", true, nil
			}
			if errStr != "" {
				return "", false, fmt.Errorf("%s", errStr)
			}
		}
		return "", false, fmt.Errorf("python: %w", runErr)
	}
	token = strings.TrimSpace(string(out))
	if token == "" {
		return "", false, fmt.Errorf("script did not return token")
	}
	return token, false, nil
}

func findBambuLoginScript() string {
	cwd, _ := os.Getwd()
	for _, rel := range []string{"scripts/bambu_login.py", "agent/scripts/bambu_login.py"} {
		p := filepath.Join(cwd, rel)
		if abs, err := filepath.Abs(p); err == nil {
			if _, err := os.Stat(abs); err == nil {
				return abs
			}
		}
	}
	exe, err := os.Executable()
	if err == nil {
		dir := filepath.Dir(exe)
		p := filepath.Join(dir, "scripts", "bambu_login.py")
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ""
}

// findPythonForBambuLogin returns path to Python that has curl_cffi (prefer venv in agent dir).
func findPythonForBambuLogin(scriptPath string) string {
	scriptDir := filepath.Dir(scriptPath)
	agentDir := filepath.Dir(scriptDir)
	for _, name := range []string{"venv", ".venv"} {
		python := filepath.Join(agentDir, name, "bin", "python3")
		if abs, err := filepath.Abs(python); err == nil {
			if _, err := os.Stat(abs); err == nil {
				return abs
			}
		}
	}
	return "python3"
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		TfaCode  string `json:"tfaCode"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "Invalid JSON"})
		return
	}
	email := strings.TrimSpace(body.Email)
	password := body.Password
	tfaCode := strings.TrimSpace(body.TfaCode)
	if email == "" || password == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "email and password required"})
		return
	}
	token, require2FA, err := runBambuLoginPython(email, password, tfaCode)
	if require2FA {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "require2FA": true})
		return
	}
	if err != nil {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "accessToken": token})
}

// RunAuthFlow starts a local HTTP server, opens the browser to the auth page, and returns the token when received.
// The server also exposes POST /login (JSON: email, password, tfaCode?) to run local Python login (curl_cffi).
func RunAuthFlow(saasURL string, port int) (token string, err error) {
	ch := make(chan string, 1)
	mux := http.NewServeMux()
	mux.HandleFunc("/login", handleLogin)
	mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}
		tok := strings.TrimSpace(r.URL.Query().Get("token"))
		if tok == "" {
			http.Error(w, "Missing token", http.StatusBadRequest)
			return
		}
		select {
		case ch <- tok:
		default:
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(callbackHTML))
	})
	addr := fmt.Sprintf("127.0.0.1:%d", port)
	srv := &http.Server{Addr: addr, Handler: mux, ReadHeaderTimeout: 5 * time.Second}
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("Auth server: %v", err)
		}
	}()
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		_ = srv.Shutdown(ctx)
	}()

	authURL := strings.TrimSuffix(saasURL, "/") + fmt.Sprintf("/bambu-agent-auth?port=%d", port)
	if err := openBrowser(authURL); err != nil {
		log.Printf("Open in browser: %s", authURL)
	} else {
		log.Printf("Browser opened. Log in to Bambu.")
	}

	select {
	case token = <-ch:
		return token, nil
	case <-time.After(5 * time.Minute):
		return "", fmt.Errorf("timeout: no login within 5 minutes")
	}
}

func openBrowser(u string) error {
	switch runtime.GOOS {
	case "darwin":
		return exec.Command("open", u).Start()
	case "windows":
		return exec.Command("rundll32", "url.dll,FileProtocolHandler", u).Start()
	default:
		return exec.Command("xdg-open", u).Start()
	}
}
