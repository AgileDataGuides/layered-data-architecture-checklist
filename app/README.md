# Data Architecture Layers Pattern Checklist

Document and evaluate data architecture layer patterns across your technology stack. Select patterns for each architectural layer, compare against reference architectures, and export your results.

An [AgileDataGuides](https://agiledataguides.com/agiledata-templates/) Pattern Template app.

## Try It Online

**[Launch the Live Demo](https://agiledataguides.github.io/layered-data-architecture-checklist)** — no install required. The demo runs entirely in your browser. Your data is saved in localStorage and never leaves your device.

The demo is seeded with the **AgileData reference architecture** so you can explore a fully-populated example straight away.

## What It Does

The Checklist maps architecture patterns across the layers of your data platform:

| Section | Purpose |
|---------|---------|
| **Layers** | Architectural layers (e.g. Ingestion, Storage, Processing, Serving) |
| **Patterns** | Technology patterns available for each layer (e.g. Batch, Streaming, CDC) |
| **Selections** | Your chosen patterns for each layer |
| **Policies** | Governance policies that apply across layers |

## Install and Run

Run `./start-checklist.sh` from the terminal.

The app starts at [http://localhost:5120](http://localhost:5120).

**Requires**: [Node.js](https://nodejs.org/) (v18+) and [pnpm](https://pnpm.io/) (`npm install -g pnpm`).

## Features

- **Checklist grid** — architectural layers as rows, pattern categories as columns
- **9 Steps tab**: the first tab and the one the app opens on. Nine guided steps fill in the checklist a few patterns at a time, with Back and Next, a hover card on every value that says what it means, and a final check for gaps
- **Pattern selection** — click cells to select patterns from predefined options
- **Reference architecture** — load the AgileData example to see a complete reference
- **Multiple architectures** — create, switch between, and delete checklists
- **Auto-save** — changes persist to browser localStorage
- **Export JSON** — download the checklist to share or re-import
- **Import JSON** — load a previously exported checklist
- **Export CSV/Excel** — export as a spreadsheet for sharing
- **Save to disk** — writes JSON to `data/` for direct access by Claude or other tools

## Works With Claude

Export your checklist as JSON and use it with [Claude Code](https://claude.ai/claude-code) or [Claude Chat](https://claude.ai):

- *"Which layers am I missing patterns for?"*
- *"Compare my architecture to common data platform patterns"*
- *"Suggest alternative patterns for the processing layer"*
- *"Are there any gaps in my governance policies?"*
- *"Draft a data architecture diagram description based on this checklist"*

## Data Storage

**Save** writes canvas files to the `data/` folder as JSON. This only works in dev mode (`pnpm dev`) where the server can write to disk. Claude Code can then read these files directly.

**Export** downloads files to your browser's downloads folder for sharing or backup.

**Auto-save** persists the current state to browser localStorage automatically.

## Security

This app is designed to run locally on your own machine. Do not expose it to the internet or deploy it on a public server. The Save feature writes files directly to your filesystem. There is no user authentication, so anyone who can reach the server can read and overwrite your data.

If you need to share your work, use the **Export** buttons to download files and share them manually.

## Tech Stack

- [SvelteKit 5](https://svelte.dev/) with Svelte 5 runes
- [Tailwind CSS 4](https://tailwindcss.com/)
- TypeScript
- pnpm

## Licensing

- **Code**: [MIT](./LICENSE)
- **Documentation**: [CC BY-SA 4.0](./docs/LICENSE)
