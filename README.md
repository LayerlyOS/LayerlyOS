<p align="center">
  <a href="https://github.com/LayerlyOS/LayerlyOS">
    <img src="./assets/logo-dark.svg#gh-dark-mode-only" alt="LayerlyOS Logo" width="420">
  </a>
</p>

<p align="center">
  <b>The Ultimate Open-Source Operating System for 3D Print Farms</b>
</p>

<p align="center">
  <a href="https://github.com/LayerlyOS/LayerlyOS/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-AGPLv3-blue.svg" alt="License">
  </a>
  <a href="https://github.com/LayerlyOS/lLayerlyOS/pulls">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/version-1.0.0--alpha-orange.svg" alt="Version">
  </a>
  <a href="https://discord.gg/umJxEmfuWz">
    <img src="https://img.shields.io/badge/Discord-Join_Community-7289da.svg" alt="Discord">
  </a>
</p>

<br />

**LayerlyOS** is a comprehensive, open-source solution designed specifically for managing and scaling 3D print farms. It replaces chaotic spreadsheets, scattered messenger chats, and generic invoicing tools with a modern, unified management dashboard.

With LayerlyOS, you get real-time machine monitoring, exact cost calculation, dynamic inventory tracking, and seamless integration with popular printers (e.g., Bambu Lab).

## ✨ Key Features

- **📊 True Profit Cost Calculator:** Stop quoting "by feel". LayerlyOS calculates exact print costs by factoring in filament weight, machine depreciation, energy rates, and your manual labor overhead (Burden Cost).
- **🧵 Dynamic Inventory Management:** Never run out of filament mid-print again. The system automatically deducts the exact grams used from your digital spools as soon as a print finishes.
- **🛰️ Real-Time Machine Telemetry:** Live monitoring of your printer fleet via our lightweight MQTT agent. Get instant alerts when a printer jams, finishes a job, or encounters an error.
- **👥 Team & Workflow Management:** Role-based access control (Owner, Admin, Operator). Assign jobs, track progress, and manage your entire B2B order pipeline from quoting to shipping.
- **📱 Mobile Ready:** Manage your farm from anywhere using the dedicated Flutter mobile app.

## 🛠️ Technology Stack

LayerlyOS is built with modern, high-performance tools to ensure scalability and an excellent developer experience:

- **Frontend & Backend API:** [Next.js](https://nextjs.org/) (App Router)
- **Runtime:** [Bun](https://bun.sh/) (for blazingly fast execution)
- **Database & Auth:** [PostgreSQL](https://www.postgresql.org/), [Drizzle ORM](https://orm.drizzle.team/), and [Supabase](https://supabase.com/)
- **Hardware Agent:** [Go](https://go.dev/) (for lightweight, concurrent MQTT connections to printers)
- **Mobile App:** [Flutter](https://flutter.dev/) (Cross-platform iOS/Android)

## 🏛️ Project Architecture

LayerlyOS is designed as a modular ecosystem. You can run the entire suite or just the components you need:

- **[layerly-core](./layerly-core)**: The heart of the system. A Next.js web application serving as the main administration and business panel. It handles quoting, users, printer fleets, inventory, and job queues.
- **[layerly-status-page](./layerly-status-page)**: A public-facing status page (Next.js) allowing your B2B clients or team members to track service availability and overall farm status transparently.
- **[agent](./agent)**: A lightweight Go service acting as a bridge between your physical printers (e.g., Bambu Lab) and the Layerly dashboard. It processes MQTT streams and ensures real-time communication.
- **[flutter-app](./flutter-app)**: The mobile companion app enabling on-the-go farm management and push notifications.

## 💼 Our Business Model & The Social Contract

LayerlyOS was born out of frustration with messy Excel sheets and expensive corporate ERPs. I decided to open-source the core of this system because every small 3D print farm deserves a transparent way to calculate costs and margins.

**Our Promise to the Community:**

1.  **Self-Hosted (Free Forever):** The code in this repository is completely free. You can download it, run it on your own hardware (Raspberry Pi, VPS, local server), and use all its features without paying a dime.
2.  **Layerly Cloud (Managed SaaS):** For farm owners who want the ultimate convenience—without managing Docker containers, Linux servers, SSL certificates, or database backups—we will offer a premium managed cloud version. Customers will pay a monthly subscription for hosting and priority support. This revenue allows us to sustainably develop and maintain the open-source core for everyone.

## 💖 Support the Project

LayerlyOS is built by an independent solo developer (Indie Hacker). I dedicate my free time, evenings, and weekends to building a tool that saves 3D print farm owners hundreds of hours and thousands of dollars in miscalculated quotes.

If the self-hosted version of LayerlyOS has helped your business grow, eliminated your Excel headaches, or saved you money, please consider supporting the development! Your contribution pays for server costs, coffee, and development time.

- ☕ **[Buy Me a Coffee](https://buymeacoffee.com/erwinowak)** - Make a one-time donation to fuel the late-night coding sessions.
- 🤝 **[GitHub Sponsors](https://github.com/sponsors/LayerlyOS)** - Become a monthly backer and get your logo/name featured on this README!
- ⭐ **[Star this repository](https://github.com/LayerlyOS/LayerlyOS)** - It's free, takes 1 second, and helps the project reach more people!

## 🚀 Getting Started (Self-Hosting)

To deploy LayerlyOS on your own infrastructure, follow the documentation inside each specific module:

1.  Deploy the database (Supabase/PostgreSQL).
2.  Launch **[layerly-core](./layerly-core)** as your central management hub.
3.  Configure the **[agent](./agent)** to securely connect your local printers to the core.
4.  (Optional) Deploy the **[layerly-status-page](./layerly-status-page)**.
5.  (Optional) Build and install the **[flutter-app](./flutter-app)** for mobile access.

*Detailed deployment guides (Docker, Vercel, manual) are coming soon in our official Docs.*

## 👨‍💻 About the Author

**Erwin Nowak** - Solo Developer, AI-Supported Solutions Architect, and 3D Printing Enthusiast.

I combine a passion for IT and modern web development to solve real-world manufacturing problems. I built LayerlyOS to scratch my own itch, focusing on delivering a solid, scalable system built with actual business needs—and true profit margins—in mind.

Follow my journey of building this in public on X/Twitter and LinkedIn.

## 📄 License

This project is strictly released under the **GNU Affero General Public License v3.0 (AGPLv3)**.

- You have **full rights** to use, modify, and distribute this software for personal or commercial use.
- **Crucially:** If you modify this code and provide it to users over a network (e.g., as a hosted SaaS service), you **must provide the source code of your modifications** under the same AGPLv3 license.

This protects the community and ensures the project remains open and transparent. Full license text can be found in the [LICENSE](./LICENSE) file.
