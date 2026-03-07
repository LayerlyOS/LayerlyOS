# Contributing to LayerlyOS

First off, thank you for considering contributing to LayerlyOS! 🎉

As an open-source project (AGPLv3) operating on an Open-Core model, we rely heavily on community engagement to create the absolute best software for 3D print farm management. Whether you're fixing a typo, squashing a bug, or proposing a massive new feature, your help is deeply appreciated.

By contributing to this repository, you are directly helping thousands of other print farm operators manage their businesses better, without relying on messy spreadsheets.

## 📜 Code of Conduct

We expect all project participants to treat each other with respect. We do not tolerate harassment, offensive comments, or discrimination. Our goal is to create a friendly, welcoming, and productive environment for everyone, regardless of their experience level.

## 💡 How Can You Help?

### 1. Reporting Bugs

If you find a bug while running LayerlyOS on your own setup, please report it in the **Issues** tab.

- Use the "Bug Report" template if available.
- Describe exactly how to reproduce the bug step-by-step.
- Provide your environment details (OS, Node/Bun version, Go version).
- Attach logs or screenshots if possible.

### 2. Requesting Features

Have an idea for a new feature? Ran into a workflow problem at your farm?

- Create a **Feature Request** issue.
- Explain **why** it would be valuable for users, not just what it is.
- Describe the business logic clearly (e.g., "We need to track failed prints to calculate hardware reliability over time").

### 3. Fixing Bugs and Coding

Browse the open Issues. If you see an issue labeled `good first issue` or `help wanted`, it's a great place to start!

If you want to tackle something, leave a comment on the issue so we know you are working on it and we avoid duplicate efforts.

## 🛠️ Development Setup & PR Process

### Local Environment Setup

To run the full stack locally, you will need:

- **Bun** (for `layerly-core` and `layerly-status-page`)
- **Go** (for the `agent`)
- **Flutter SDK** (for the `flutter-app`)
- A local or cloud **PostgreSQL database** (e.g., Supabase local development CLI)

### Making a Pull Request

1.  **Fork the Repository:** Create your own copy of the LayerlyOS repository on GitHub.
2.  **Clone your Fork:**
    ```bash
    git clone https://github.com/YOUR-USERNAME/LayerlyOS.git
    ```
3.  **Create a Branch:** Work on a new branch with a descriptive name. We prefer the following prefixes:
    - `feature/` (e.g., `feature/auto-filament-deduction`)
    - `fix/` (e.g., `fix/mqtt-disconnect`)
    - `docs/` (e.g., `docs/update-readme`)
4.  **Commit Changes:** Write clear and concise commit messages. Let us know *why* the change was made, not just *what* was changed.
5.  **Test:** Ensure your changes do not break existing functionality and work well within the multi-module ecosystem. Run formatters before committing!
6.  **Submit a PR:** Push your branch to your fork and submit a Pull Request to the main repository. In the description, explain what was changed. If it resolves an open issue, link to it (e.g., `Closes #12`).

## 🎨 Code Style & Linting

We strive to maintain a consistent code style throughout the project to make collaboration easier. Please ensure your code passes our linting rules before opening a PR:

### TypeScript/React (Next.js)
We use `biome` for formatting and linting. Before submitting changes, run:

```bash
bun run format
bun run check
```

### Go (Agent)
We use the standard Go formatting tools. Run:

```bash
go fmt ./...
```

### Flutter (Mobile App)
We use the standard Flutter formatting. Run:

```bash
flutter format .
```

## ⚖️ The Open-Core Agreement & License

Remember that by submitting your changes, you agree to release them under the **AGPLv3** license.

Your contributions to this repository will always remain free and open-source for the self-hosted community. Since LayerlyOS follows an Open-Core model, your improvements to the core system may also be utilized in our managed SaaS offering (Layerly Cloud). This symbiosis ensures the project remains actively maintained, financially sustainable, and available for years to come.

Thank you for your contribution! Together, we are building the future of 3D print management.
