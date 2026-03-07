package saas

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Client pushes payloads to the SaaS agent push endpoint and can perform Bambu login via SaaS (for 2FA).
type Client struct {
	BaseURL  string
	AgentKey string
	HTTP     *http.Client
}

func New(baseURL, agentKey string) *Client {
	return &Client{
		BaseURL:  strings.TrimSuffix(baseURL, "/"),
		AgentKey: agentKey,
		HTTP:     &http.Client{Timeout: 30 * time.Second},
	}
}

// bambuLoginResponse matches POST /api/dev/bambu-login response.
type bambuLoginResponse struct {
	Success               bool   `json:"success"`
	AccessToken           string `json:"accessToken"`
	Error                 string `json:"error"`
	Require2FA            bool   `json:"require2FA"`
	RequireVerificationCode bool `json:"requireVerificationCode"`
	RequireTfaFromBrowser bool   `json:"requireTfaFromBrowser"`
	TfaKey                string `json:"tfaKey"`
}

// Login calls POST /api/dev/bambu-login with email, password, and optional tfaCode.
// Returns accessToken on success. 2FA is handled by the SaaS backend (node-curl-impersonate).
func (c *Client) Login(email, password, tfaCode string) (token string, err error) {
	body := map[string]string{"email": email, "password": password}
	if tfaCode != "" {
		body["tfaCode"] = strings.TrimSpace(tfaCode)
	}
	raw, _ := json.Marshal(body)
	req, err := http.NewRequest(http.MethodPost, c.BaseURL+"/api/dev/bambu-login", bytes.NewReader(raw))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	if c.AgentKey != "" {
		req.Header.Set("X-Agent-Key", c.AgentKey)
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	var r bambuLoginResponse
	if err := json.Unmarshal(data, &r); err != nil {
		return "", fmt.Errorf("bambu-login response invalid: %w", err)
	}
	if r.Success && r.AccessToken != "" {
		return strings.TrimSpace(r.AccessToken), nil
	}
	if r.Require2FA {
		return "", fmt.Errorf("2FA code required: set BAMBU_TFA_CODE (6 digits) or run agent without BAMBU_EMAIL/password – browser will open")
	}
	if r.RequireVerificationCode {
		return "", fmt.Errorf("verification code from email required – log in once in browser")
	}
	if r.RequireTfaFromBrowser {
		return "", fmt.Errorf("Cloudflare blocked TFA request: log in in browser and paste token from cookie (or ensure node-curl-impersonate is available on server)")
	}
	if r.Error != "" {
		return "", fmt.Errorf("%s", r.Error)
	}
	return "", fmt.Errorf("bambu-login HTTP %d: %s", resp.StatusCode, string(data))
}

// Push sends the payload to POST /api/dev/agent/push.
func (c *Client) Push(payload interface{}) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	url := c.BaseURL + "/api/dev/agent/push"
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if c.AgentKey != "" {
		req.Header.Set("X-Agent-Key", c.AgentKey)
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("SaaS push HTTP %d", resp.StatusCode)
	}
	return nil
}

// wakeCheckResponse matches GET /api/dev/agent/wake-check response.
type wakeCheckResponse struct {
	ForceCheck bool `json:"forceCheck"`
}

// WakeCheck calls GET /api/dev/agent/wake-check?deviceId=... and returns true if user requested immediate check.
func (c *Client) WakeCheck(deviceID string) bool {
	u := c.BaseURL + "/api/dev/agent/wake-check?deviceId=" + url.QueryEscape(strings.TrimSpace(deviceID))
	req, err := http.NewRequest(http.MethodGet, u, nil)
	if err != nil {
		return false
	}
	if c.AgentKey != "" {
		req.Header.Set("X-Agent-Key", c.AgentKey)
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusUnauthorized {
		return false
	}
	var r wakeCheckResponse
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return false
	}
	return r.ForceCheck
}
