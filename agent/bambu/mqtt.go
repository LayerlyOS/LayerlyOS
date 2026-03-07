package bambu

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"os"
	"sync"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

const (
	reportSuffix  = "/report"
	requestSuffix = "/request"
	sequenceID    = "0"
	pushallSeq    = "1"
)

// CloudConnect connects to Bambu Cloud MQTT (us.mqtt.bambulab.com:8883).
func CloudConnect(uid int64, accessToken string) (mqtt.Client, error) {
	broker := "tcps://us.mqtt.bambulab.com:8883"
	username := fmt.Sprintf("u_%d", uid)
	opts := mqtt.NewClientOptions()
	opts.AddBroker(broker)
	opts.SetUsername(username)
	opts.SetPassword(accessToken)
	opts.SetClientID(fmt.Sprintf("bambu_agent_%d_%d", uid, time.Now().Unix()))
	opts.SetConnectTimeout(15 * time.Second)
	opts.SetAutoReconnect(true)
	opts.SetTLSConfig(&tls.Config{MinVersion: tls.VersionTLS12})
	client := mqtt.NewClient(opts)
	tok := client.Connect()
	if !tok.WaitTimeout(20 * time.Second) {
		return nil, fmt.Errorf("MQTT connect timeout")
	}
	if err := tok.Error(); err != nil {
		return nil, err
	}
	return client, nil
}

// LANConnect connects to printer via MQTT over TLS (SNI = deviceID, bblp + accessCode, custom CA).
func LANConnect(printerIP, deviceID, accessCode, caCertPath string) (mqtt.Client, error) {
	broker := fmt.Sprintf("tcps://%s:8883", printerIP)
	opts := mqtt.NewClientOptions()
	opts.AddBroker(broker)
	opts.SetUsername("bblp")
	opts.SetPassword(accessCode)
	opts.SetClientID("bambu_agent_lan_" + deviceID)
	opts.SetConnectTimeout(15 * time.Second)
	opts.SetAutoReconnect(true)
	tlsCfg, err := tlsConfigLAN(deviceID, caCertPath)
	if err != nil {
		return nil, err
	}
	opts.SetTLSConfig(tlsCfg)
	client := mqtt.NewClient(opts)
	tok := client.Connect()
	if !tok.WaitTimeout(20 * time.Second) {
		return nil, fmt.Errorf("MQTT LAN connect timeout")
	}
	if err := tok.Error(); err != nil {
		return nil, err
	}
	return client, nil
}

func tlsConfigLAN(sni, caCertPath string) (*tls.Config, error) {
	caPEM, err := os.ReadFile(caCertPath)
	if err != nil {
		return nil, fmt.Errorf("read CA cert: %w", err)
	}
	pool, err := tlsCertPoolFromPEM(caPEM)
	if err != nil {
		return nil, err
	}
	return &tls.Config{
		MinVersion: tls.VersionTLS12,
		ServerName: sni,
		RootCAs:    pool,
	}, nil
}

func tlsCertPoolFromPEM(pemCerts []byte) (*x509.CertPool, error) {
	pool := x509.NewCertPool()
	if !pool.AppendCertsFromPEM(pemCerts) {
		return nil, fmt.Errorf("no certificates found in PEM")
	}
	return pool, nil
}

// ReportPayload is the JSON from device/{id}/report (print, info, etc.).
type ReportPayload map[string]interface{}

// RequestPushall sends pushall and waits for one report that contains print status; returns that payload.
func RequestPushall(client mqtt.Client, deviceID string, timeout time.Duration) (ReportPayload, error) {
	reportTopic := "device/" + deviceID + reportSuffix
	requestTopic := "device/" + deviceID + requestSuffix

	var once sync.Once
	var result ReportPayload
	var resultErr error
	done := make(chan struct{})

	token := client.Subscribe(reportTopic, 0, func(_ mqtt.Client, msg mqtt.Message) {
		once.Do(func() {
			defer close(done)
			var p ReportPayload
			if err := json.Unmarshal(msg.Payload(), &p); err != nil {
				resultErr = err
				return
			}
			printObj, _ := p["print"].(map[string]interface{})
			if printObj == nil {
				return
			}
			if printObj["gcode_state"] != nil || printObj["bed_temper"] != nil || printObj["nozzle_temper"] != nil {
				result = p
			}
		})
	})
	if !token.WaitTimeout(5 * time.Second) {
		return nil, fmt.Errorf("subscribe timeout")
	}
	if token.Error() != nil {
		return nil, token.Error()
	}
	defer client.Unsubscribe(reportTopic)

	req := map[string]interface{}{
		"pushing": map[string]interface{}{
			"sequence_id":  pushallSeq,
			"command":      "pushall",
			"version":      1,
			"push_target":  1,
		},
	}
	reqBody, _ := json.Marshal(req)
	tokPub := client.Publish(requestTopic, 0, false, reqBody)
	if !tokPub.WaitTimeout(3 * time.Second) {
		return nil, fmt.Errorf("publish pushall timeout")
	}

	select {
	case <-done:
		if resultErr != nil {
			return nil, resultErr
		}
		if result != nil {
			return result, nil
		}
		return nil, fmt.Errorf("no status response (pushall)")
	case <-time.After(timeout):
		return nil, fmt.Errorf("timeout waiting for report (%.0fs)", timeout.Seconds())
	}
}
