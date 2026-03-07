# Layerly Core

**Main Management Dashboard for LayerlyOS**

`layerly-core` is the heart of the LayerlyOS system. It is a modern web application built on Next.js, designed for comprehensive 3D print farm management.

## Features

*   **Dashboard:** Real-time status overview of all printers.
*   **Fleet Management:** Add, remove, and configure printers (agent integration).
*   **Job Queue:** Schedule and monitor print jobs.
*   **File Management:** Store and organize G-code files.
*   **Users & Permissions:** Role-based access control for your team.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
*   **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Radix UI](https://www.radix-ui.com/) / [Shadcn UI](https://ui.shadcn.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Linting/Formatting:** [Biome](https://biomejs.dev/)

## Prerequisites

*   [Bun](https://bun.sh/) (Package Manager)
*   Node.js 18+
*   Supabase account (or local instance)

## Installation & Setup

1.  **Install dependencies:**
    ```bash
    bun install
    ```

2.  **Configure environment variables:**
    Create a `.env` file based on `.env.example` and fill in your Supabase credentials.
    ```bash
    cp .env.example .env
    ```

3.  **Run database migrations:**
    ```bash
    bun run drizzle:migrate
    ```

4.  **Start the development server:**
    ```bash
    bun run dev
    ```

    The application will be available at `http://localhost:3000`.

## Scripts

*   `bun run dev` - Starts development mode.
*   `bun run build` - Builds the production application.
*   `bun run start` - Starts the built application.
*   `bun run lint` / `bun run check` - Checks for code errors (Biome).
*   `bun run format` - Formats code (Biome).
*   `bun run drizzle:generate` - Generates Drizzle migrations.

## Directory Structure

*   `/app` - Main application code (Next.js App Router).
*   `/components` - Reusable React components.
*   `/lib` - Helper libraries and configuration.
*   `/drizzle` - Database schemas and migrations.
*   `/public` - Static assets.
