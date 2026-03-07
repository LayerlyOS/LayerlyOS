package bambu

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const (
	BambuAPI     = "https://api.bambulab.com"
	BambuTFALogin = "https://bambulab.com/api/sign-in/tfa"
)

var loginHeaders = map[string]string{
	"Content-Type":         "application/json",
	"Accept":               "application/json",
	"Accept-Encoding":     "gzip, deflate",
	"User-Agent":          "bambu_network_agent/01.09.05.01",
	"X-BBL-Client-Name":   "OrcaSlicer",
	"X-BBL-Client-Type":   "slicer",
	"X-BBL-Client-Version": "01.09.05.51",
	"X-BBL-Language":      "en-US",
	"X-BBL-OS-Type":       "darwin",
	"X-BBL-OS-Version":    "24.0.0",
	"X-BBL-Agent-Version": "01.09.05.01",
	"X-BBL-Executable-info": "{}",
	"X-BBL-Agent-OS-Type":  "darwin",
}

var tfaHeaders = map[string]string{
	"Content-Type":     "application/json",
	"Accept":           "application/json",
	"Accept-Language":  "en-US,en;q=0.9",
	"Origin":           "https://bambulab.com",
	"Referer":          "https://bambulab.com/",
	"User-Agent":       "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
}

// LoginResponse from api.bambulab.com/v1/user-service/user/login
type LoginResponse struct {
	LoginType   string `json:"loginType"`
	AccessToken string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	TfaKey      string `json:"tfaKey"`
	Code        int    `json:"code"`
	Message     string `json:"message"`
}

// Login with email+password. Returns token, or (token=="", tfaKey!="") when 2FA required.
func Login(account, password string) (token, tfaKey string, err error) {
	body := map[string]string{"account": account, "password": password}
	raw, _ := json.Marshal(body)
	req, err := http.NewRequest(http.MethodPost, BambuAPI+"/v1/user-service/user/login", bytes.NewReader(raw))
	if err != nil {
		return "", "", err
	}
	for k, v := range loginHeaders {
		req.Header.Set(k, v)
	}
	req.Header.Set("Content-Length", fmt.Sprintf("%d", len(raw)))
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", err
	}
	var lr LoginResponse
	if err := json.Unmarshal(data, &lr); err != nil {
		return "", "", fmt.Errorf("login response invalid JSON: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("login HTTP %d: %s", resp.StatusCode, lr.Message)
	}
	token = strings.TrimSpace(lr.AccessToken)
	if token != "" {
		return token, "", nil
	}
	if lr.LoginType == "tfa" && lr.TfaKey != "" {
		return "", strings.TrimSpace(lr.TfaKey), nil
	}
	if lr.LoginType == "verifyCode" {
		return "", "", fmt.Errorf("verification code from email required (verifyCode) – log in once in browser")
	}
	return "", "", fmt.Errorf("no token in response (loginType=%s)", lr.LoginType)
}

// LoginTFA completes 2FA: POST to bambulab.com with tfaKey + tfaCode; returns token from cookie or body.
func LoginTFA(tfaKey, tfaCode string) (token string, err error) {
	body := map[string]string{"tfaKey": tfaKey, "tfaCode": strings.TrimSpace(tfaCode)}
	raw, _ := json.Marshal(body)
	req, err := http.NewRequest(http.MethodPost, BambuTFALogin, bytes.NewReader(raw))
	if err != nil {
		return "", err
	}
	for k, v := range tfaHeaders {
		req.Header.Set(k, v)
	}
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	// Token may be in Set-Cookie: token=...
	for _, c := range resp.Cookies() {
		if c.Name == "token" && c.Value != "" {
			return c.Value, nil
		}
	}
	var m map[string]interface{}
	if err := json.Unmarshal(data, &m); err == nil {
		for _, key := range []string{"accessToken", "access_token", "token"} {
			if v, ok := m[key]; ok {
				if s, ok := v.(string); ok && s != "" {
					return s, nil
				}
			}
		}
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("TFA HTTP %d: %s", resp.StatusCode, string(data))
	}
	return "", fmt.Errorf("no token in TFA response (check 2FA code)")
}

// Preference returns uid for MQTT username (u_{uid}).
func Preference(accessToken string) (uid int64, err error) {
	req, err := http.NewRequest(http.MethodGet, BambuAPI+"/v1/design-user-service/my/preference", nil)
	if err != nil {
		return 0, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, err
	}
	var m struct {
		UID *int64 `json:"uid"`
	}
	if err := json.Unmarshal(data, &m); err != nil {
		return 0, err
	}
	if m.UID == nil {
		return 0, fmt.Errorf("no uid in preference")
	}
	return *m.UID, nil
}

// BindDevice from iot-service
type BindDevice struct {
	DevID         string `json:"dev_id"`
	Name          string `json:"name"`
	DevProductName string `json:"dev_product_name"`
	DevModelName  string `json:"dev_model_name"`
}

// Bind returns list of bound devices.
func Bind(accessToken string) (devices []BindDevice, err error) {
	req, err := http.NewRequest(http.MethodGet, BambuAPI+"/v1/iot-service/api/user/bind", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var m struct {
		Devices []BindDevice `json:"devices"`
	}
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, err
	}
	return m.Devices, nil
}
