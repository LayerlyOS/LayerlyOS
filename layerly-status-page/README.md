# Layerly Status Page

**Public Status Page for Your Print Farm**

`layerly-status-page` is a dedicated Next.js application that allows you to publicly (or internally) share information about service status and print farm availability. It ensures transparency for clients and your team.

## Features

*   **Service Monitoring:** Display the status of individual system components (e.g., API, Database, Printers).
*   **Incident History:** Log and display past issues and downtimes.
*   **Notifications:** (Planned) Subscribe to status change notifications.
*   **Responsiveness:** Optimized for both mobile and desktop devices.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Database:** Shared with `layerly-core` (Supabase/PostgreSQL) or independent configuration.

## Installation & Setup

1.  **Install dependencies:**
    ```bash
    bun install
    ```

2.  **Configure environment variables:**
    Copy `.env.example` to `.env` and fill in the configuration.
    ```bash
    cp .env.example .env
    ```

3.  **Start the development server:**
    ```bash
    bun run dev
    ```

    The application defaults to port `3001` (to avoid conflict with `layerly-core`).
    Address: `http://localhost:3001`.

## Scripts

*   `bun run dev` - Starts the development server on port 3001.
*   `bun run build` - Builds the production version.
*   `bun run start` - Starts the production version.
*   `bun run lint` - Checks code quality.

## Integration

The application is designed to work with `layerly-core`. It can fetch status data directly from the database or via an API exposed by the main system.
