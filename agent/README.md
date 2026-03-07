# Layerly Agent

**Communication Bridge Between Printers and Cloud**

`agent` is a lightweight, efficient service written in Go that handles direct communication with 3D printers (primarily Bambu Lab) and transmits telemetry data to the main LayerlyOS system.

## Features

*   **MQTT Support:** Listens to and sends messages to Bambu Lab printers.
*   **Telemetry:** Relays print status, temperatures, progress, and errors to `layerly-core`.
*   **Security:** Encrypted communication with printers and the cloud.
*   **Performance:** Minimal resource usage, ideal for running on a Raspberry Pi or small server.

## Requirements

*   [Go](https://go.dev/) 1.21+
*   Network access to printers (local or via VPN).

## Installation & Usage

1.  **Download dependencies:**
    ```bash
    go mod download
    ```

2.  **Configure the Agent:**
    Create a configuration file (e.g., `config.yaml` or `.env`) with credentials for your printers and the LayerlyOS API.
    *(Configuration details coming soon)*

3.  **Run the Agent:**
    ```bash
    go run main.go
    ```

4.  **Build the executable:**
    ```bash
    go build -o layerly-agent main.go
    ```

## Project Structure

*   `main.go` - Application entry point.
*   `bambu/` - Logic specific to Bambu Lab printers.
*   `saas/` - Communication with the LayerlyOS cloud.
*   `config.go` - Configuration handling.

## Development

To add support for new printers or protocols, refer to the code in the `bambu/` directory and the manufacturer's MQTT documentation.
