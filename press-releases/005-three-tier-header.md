# Layered Data Architecture Checklist Adopts the AgileDataGuides Three-Tier Header

**7 April 2026**

AgileDataGuides today released a redesigned header for the Layered Data Architecture Checklist, adopting the standardised three-tier header pattern used across every app in the AgileDataGuides Pattern Template family.

## The Problem

The original header crammed every control into one toolbar — switcher, name, save, exports, tabs — and the Checklist didn't visually match the Information Product Canvas, the Business Event Matrix, or any of the other Pattern Template apps. Users hopping between apps had to relearn where to find each action.

## The Solution

The Checklist now uses the AgileDataGuides three-tier pattern:

- **Tier 1 — Dark App Header** — A dark slate strip at the top hosts the architecture switcher dropdown, **New** and **Delete** buttons. The slate background marks these as global controls — actions that affect *which* architecture you're working on.
- **Tier 2 — White Toolbar** — A clean white card carrying the architecture name (click-to-edit), description (click-to-edit), and the export buttons (JSON, CSV, Excel).
- **Tier 3 — Tabs** — A tab strip below the toolbar: **Checklist**, **Manage Patterns**, **Policies**, **Instructions**.

## Key Benefits

- **Visual parity across apps** — the same header pattern in IPC, BEM, Glossary, Concept Model, Dictionary, Data Contract, and the Checklist
- **Information hierarchy** — global controls in the dark header, current-architecture controls in the white toolbar, view switching in tabs
- **Click-to-edit name and description** — single click on either turns it into an input; no double-click or modal needed
- **Consistent across modes** — works the same in the standalone app and the embedded Context Plane version

The three-tier header is available now in the latest release.
