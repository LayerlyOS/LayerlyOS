package main

import (
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"bambu-agent/bambu"
	"bambu-agent/saas"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

func main() {
	cfg := loadConfig()
	log.SetFlags(log.Ldate | log.Ltime)

	if cfg.Mode == "cloud" {
		runCloud(cfg)
		return
	}
	runLAN(cfg)
}

func runLAN(cfg Config) {
	if cfg.PrinterIP == "" || cfg.DeviceID == "" || cfg.AccessCode == "" {
		log.Fatal("LAN mode: set BAMBU_PRINTER_IP, BAMBU_DEVICE_ID, BAMBU_ACCESS_CODE")
	}
	if cfg.CACertPath == "" {
		log.Fatal("LAN mode: set BAMBU_CA_CERT (path to content/bambu/ca_cert.pem)")
	}
	client, err := bambu.LANConnect(cfg.PrinterIP, cfg.DeviceID, cfg.AccessCode, cfg.CACertPath)
	if err != nil {
		log.Fatalf("MQTT LAN: %v", err)
	}
	defer client.Disconnect(250)

	saasClient := saas.New(cfg.SaaSURL, cfg.AgentKey)
	tick := time.NewTicker(time.Duration(cfg.PushEvery) * time.Second)
	defer tick.Stop()
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)

	log.Printf("Agent LAN: %s, push co %ds do %s", cfg.DeviceID, cfg.PushEvery, cfg.SaaSURL)
	for {
		payload, err := bambu.RequestPushall(client, cfg.DeviceID, 18*time.Second)
		if err != nil {
			log.Printf("pushall: %v", err)
		} else {
			out := map[string]interface{}{
				"source":   "agent",
				"mode":     "lan",
				"deviceId": cfg.DeviceID,
				"report":   payload,
				"at":       time.Now().Format(time.RFC3339),
			}
			if err := saasClient.Push(out); err != nil {
				log.Printf("SaaS push: %v", err)
			} else {
				log.Printf("pushed OK")
			}
		}
		select {
		case <-sig:
			log.Println("Shutting down")
			return
		case <-tick.C:
			// next iteration
		}
	}
}

func runCloud(cfg Config) {
	token := cfg.CloudToken
	if token == "" {
		tokenBytes, err := os.ReadFile(cfg.TokenFile)
		if err == nil && len(tokenBytes) > 0 {
			token = string(tokenBytes)
		}
	}
	if token == "" {
		if cfg.BambuEmail != "" && cfg.BambuPassword != "" {
			// First try local Python script (curl_cffi, like Home Assistant) – works with 2FA without SaaS
			tok, require2FA, err := runBambuLoginPython(cfg.BambuEmail, cfg.BambuPassword, cfg.BambuTfaCode)
			if err == nil && tok != "" {
				token = tok
			} else if require2FA && cfg.BambuTfaCode == "" {
				// No 2FA code in env – open browser
				log.Printf("2FA code required. Starting browser login (port %d)...", cfg.AuthCallbackPort)
				tok, err := RunAuthFlow(cfg.SaaSURL, cfg.AuthCallbackPort)
				if err != nil {
					log.Fatalf("Browser login: %v", err)
				}
				token = tok
			} else if err != nil || tok == "" {
				// Fallback: SaaS (when Python/curl_cffi missing or other error)
				saasClient := saas.New(cfg.SaaSURL, cfg.AgentKey)
				tok, saasErr := saasClient.Login(cfg.BambuEmail, cfg.BambuPassword, cfg.BambuTfaCode)
				if saasErr != nil {
					log.Fatalf("Login: %v", saasErr)
				}
				if tok != "" {
					token = tok
				}
			}
		}
		if token == "" {
			// Browser login: agent opens page, user logs in, token returns to localhost
			log.Printf("No token. Starting browser login (port %d)...", cfg.AuthCallbackPort)
			tok, err := RunAuthFlow(cfg.SaaSURL, cfg.AuthCallbackPort)
			if err != nil {
				log.Fatalf("Browser login: %v", err)
			}
			token = tok
		}
		if token == "" {
			log.Fatal("Failed to obtain token")
		}
		if err := os.WriteFile(cfg.TokenFile, []byte(token), 0600); err != nil {
			log.Printf("Failed to save token to file: %v", err)
		}
	}

	uid, err := bambu.Preference(token)
	if err != nil {
		log.Fatalf("Preference: %v", err)
	}
	devices, err := bambu.Bind(token)
	if err != nil {
		log.Fatalf("Bind: %v", err)
	}
	if len(devices) == 0 {
		log.Fatal("No printers linked to Bambu account")
	}

	client, err := bambu.CloudConnect(uid, token)
	if err != nil {
		log.Fatalf("MQTT Cloud: %v", err)
	}
	defer client.Disconnect(250)

	saasClient := saas.New(cfg.SaaSURL, cfg.AgentKey)
	tick := time.NewTicker(time.Duration(cfg.PushEvery) * time.Second)
	defer tick.Stop()
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)

	log.Printf("Agent Cloud: %d printers, push every %ds to %s", len(devices), cfg.PushEvery, cfg.SaaSURL)

	// Exponential backoff when printer off: less load on SaaS when offline for long.
	// Tier 0: 90s, 1: 3min, 2: 5min, 3: 10min, 4+: 15min (cap).
	backoffLevels := []time.Duration{
		90 * time.Second,
		3 * 60 * time.Second,
		5 * 60 * time.Second,
		10 * 60 * time.Second,
		15 * 60 * time.Second,
	}
	state := &cloudState{
		consecutiveFailures: make(map[string]int),
		backoffUntil:        make(map[string]time.Time),
		backoffTier:         make(map[string]int),
	}
	const failuresBeforeBackoff = 3

	// First push immediately
	pushCloud(cfg, saasClient, client, devices, state, backoffLevels, failuresBeforeBackoff)
	for {
		select {
		case <-sig:
			log.Println("Shutting down")
			return
		case <-tick.C:
			pushCloud(cfg, saasClient, client, devices, state, backoffLevels, failuresBeforeBackoff)
		}
	}
}

type cloudState struct {
	consecutiveFailures map[string]int
	backoffUntil        map[string]time.Time
	backoffTier         map[string]int // backoff tier (0 = 90s, 4+ = 15min)
}

func pushCloud(cfg Config, c *saas.Client, client mqtt.Client, devices []bambu.BindDevice, state *cloudState, backoffLevels []time.Duration, failuresBeforeBackoff int) {
	now := time.Now()
	for _, dev := range devices {
		if until, inBackoff := state.backoffUntil[dev.DevID]; inBackoff {
			if now.Before(until) {
				// User may have clicked "Check now" – poll SaaS
				if c.WakeCheck(dev.DevID) {
					delete(state.backoffUntil, dev.DevID)
					state.backoffTier[dev.DevID] = 0
					log.Printf("[%s] User request: checking printer now.", dev.DevID)
				} else {
					continue
				}
			} else {
				delete(state.backoffUntil, dev.DevID)
			}
		}

		payload, err := bambu.RequestPushall(client, dev.DevID, 28*time.Second)
		if err != nil {
			state.consecutiveFailures[dev.DevID]++
			log.Printf("[%s] pushall: %v", dev.DevID, err)
			if state.consecutiveFailures[dev.DevID] >= failuresBeforeBackoff {
				tier := state.backoffTier[dev.DevID]
				if tier >= len(backoffLevels) {
					tier = len(backoffLevels) - 1
				}
				interval := backoffLevels[tier]
				state.backoffUntil[dev.DevID] = now.Add(interval)
				if state.backoffTier[dev.DevID] < len(backoffLevels)-1 {
					state.backoffTier[dev.DevID]++
				}
				log.Printf("[%s] Status: printer off / no response. Sending printer_off, retry in %v (tier %d).", dev.DevID, interval.Round(time.Second), tier)
				out := map[string]interface{}{
					"source":   "agent",
					"mode":     "cloud",
					"deviceId": dev.DevID,
					"name":     dev.Name,
					"status":   "printer_off",
					"at":       now.Format(time.RFC3339),
				}
				if cfg.PrinterIP != "" && cfg.AccessCode != "" {
					out["printerIp"] = cfg.PrinterIP
					out["accessCode"] = cfg.AccessCode
				}
				if pushErr := c.Push(out); pushErr != nil {
					log.Printf("[%s] SaaS push (printer_off): %v", dev.DevID, pushErr)
				}
			} else if strings.Contains(err.Error(), "timeout") {
				log.Printf("[%s] Printer may be off or disconnected from cloud. Attempt %d/%d.", dev.DevID, state.consecutiveFailures[dev.DevID], failuresBeforeBackoff)
			}
			continue
		}

		state.consecutiveFailures[dev.DevID] = 0
		state.backoffTier[dev.DevID] = 0
		delete(state.backoffUntil, dev.DevID)
		out := map[string]interface{}{
			"source":   "agent",
			"mode":     "cloud",
			"deviceId": dev.DevID,
			"name":     dev.Name,
			"report":   payload,
			"at":       now.Format(time.RFC3339),
		}
		if cfg.PrinterIP != "" && cfg.AccessCode != "" {
			out["printerIp"] = cfg.PrinterIP
			out["accessCode"] = cfg.AccessCode
		}
		if err := c.Push(out); err != nil {
			log.Printf("[%s] SaaS push: %v", dev.DevID, err)
			continue
		}
		log.Printf("[%s] pushed OK", dev.DevID)
	}
}
