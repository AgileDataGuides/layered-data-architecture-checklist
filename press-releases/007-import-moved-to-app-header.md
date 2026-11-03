# Layered Data Architecture Checklist Moves Import to the App Header

**24 April 2026**

AgileDataGuides today released a small but meaningful header cleanup for the Layered Data Architecture Checklist. The **Import** button moves out of the Tier 2 toolbar and into the dark App Header, sitting alongside **New Architecture** and **Delete**.

## The Problem

Import had been living in the Tier 2 white toolbar — wedged in among the export buttons. That was the wrong tier for it: importing affects *which* architecture you're working on (Tier 1, global concern), not the content *of* the current architecture (Tier 2, per-architecture concern). Users would look for Import next to **New Architecture** and **Delete** and not find it.

## The Solution

Import now lives in the dark App Header (Tier 1) sitting next to **New** and **Delete**. The Tier 2 white toolbar now holds only what affects the current architecture: name, description, and export buttons.

This change applies across the SA family — the same Import-to-App-Header move landed on Metric Trees, Data Contract, IPC, BEM, Glossary, Concept Model, and Dictionary at the same time, so the action lives in the same place across every Pattern Template app.

## Key Benefits

- **Right tier for the action** — Import is global (affects *which* architecture), not per-architecture
- **Cleaner Tier 2 toolbar** — the white toolbar now holds only export buttons + name/description
- **Consistent across apps** — the same Import-to-App-Header pattern in every SA app

The header cleanup is available now in the latest release.
