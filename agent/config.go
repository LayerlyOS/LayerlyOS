package main

import (
	"os"
	"path/filepath"
	"strings"
)

// Config holds agent configuration (env + optional config file).
type Config struct {
	// SaaS
	SaaSURL         string // base URL, e.g. http://localhost:3000
	AgentKey        string // X-Agent-Key (optional in dev)
	PushEvery       int    // seconds between push to SaaS (default 30)
	AuthCallbackPort int   // port for local callback when logging in via browser (default 38473)

	// Bambu Cloud
	BambuEmail    string
	BambuPassword string
	BambuTfaCode  string // 6-digit TOTP; if login returns 2FA, agent uses this
	CloudToken    string // if set, skip login and use this token

	// Bambu LAN (alternative to Cloud)
	Mode       string // "cloud" or "lan"
	PrinterIP  string
	DeviceID   string
	AccessCode string

	// Paths
	CACertPath string // path to Bambu CA cert for LAN MQTT (default: ../content/bambu/ca_cert.pem or ./certs/ca_cert.pem)
	TokenFile  string // where to persist Cloud token (default: ~/.layerly-bambu-token)
}

func loadConfig() Config {
	c := Config{
		SaaSURL:          getEnv("SAAS_URL", "http://localhost:3000"),
		AgentKey:         os.Getenv("AGENT_KEY"),
		PushEvery:        30,
		AuthCallbackPort: 38473,
		Mode:             strings.ToLower(strings.TrimSpace(getEnv("BAMBU_MODE", "cloud"))),
		CACertPath:       "",
		TokenFile:        "",
	}
	if v := os.Getenv("AUTH_CALLBACK_PORT"); v != "" {
		if n := parseInt(v); n > 0 && n < 65536 {
			c.AuthCallbackPort = n
		}
	}
	if c.Mode != "lan" {
		c.Mode = "cloud"
	}
	if v := os.Getenv("PUSH_EVERY"); v != "" {
		if n := parseInt(v); n > 0 {
			c.PushEvery = n
		}
	}
	c.BambuEmail = os.Getenv("BAMBU_EMAIL")
	c.BambuPassword = os.Getenv("BAMBU_PASSWORD")
	c.BambuTfaCode = os.Getenv("BAMBU_TFA_CODE")
	c.CloudToken = os.Getenv("BAMBU_CLOUD_TOKEN")
	c.PrinterIP = os.Getenv("BAMBU_PRINTER_IP")
	c.DeviceID = os.Getenv("BAMBU_DEVICE_ID")
	c.AccessCode = os.Getenv("BAMBU_ACCESS_CODE")
	c.CACertPath = getEnv("BAMBU_CA_CERT", "")
	c.TokenFile = getEnv("BAMBU_TOKEN_FILE", "")
	if c.TokenFile == "" {
		home, _ := os.UserHomeDir()
		if home != "" {
			c.TokenFile = filepath.Join(home, ".layerly-bambu-token")
		} else {
			c.TokenFile = ".layerly-bambu-token"
		}
	}
	if c.CACertPath == "" {
		// Try repo-relative and local certs
		for _, p := range []string{"../content/bambu/ca_cert.pem", "certs/ca_cert.pem", "content/bambu/ca_cert.pem"} {
			if abs, err := filepath.Abs(p); err == nil {
				if _, err := os.Stat(abs); err == nil {
					c.CACertPath = abs
					break
				}
			}
		}
	}
	return c
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return strings.TrimSpace(v)
	}
	return def
}

func parseInt(s string) int {
	var n int
	for _, c := range strings.TrimSpace(s) {
		if c >= '0' && c <= '9' {
			n = n*10 + int(c-'0')
		} else {
			return 0
		}
	}
	return n
}
