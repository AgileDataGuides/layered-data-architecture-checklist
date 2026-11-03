# Layered Data Architecture Checklist Splits Save and Export

**26 March 2026**

AgileDataGuides today separated the Save and Export actions in the Layered Data Architecture Checklist. **Save** now writes the architecture's JSON directly to the project's `data/` folder where Claude can read it; **Export** continues to download files to the browser for sharing.

## The Problem

Originally every save or export action downloaded a file to the browser's downloads folder. Users who wanted Claude Code to analyse their architecture had to manually copy the downloaded JSON back into the project directory before Claude could see it — every time they made a change. That round-trip turned a "save and ask" workflow into "save, download, copy, switch app, paste, ask".

## The Solution

The two actions now do two different things:

- **Save** writes structured JSON files into the project's `data/` folder. Architectures land in `data/architectures/`, pattern lookups in `data/lookups/`, policies in `data/policies/`. Claude Code reads these files directly.
- **Export** downloads to the browser as before. Use it for sharing, backup, or uploading to Claude Chat.

## How It Works

The `data/` folder gains a tidy structure:

```
data/
├── architectures/   ← saved architectures (one JSON per architecture)
├── lookups/         ← pattern definitions, dropdown values, dictionary
└── policies/        ← shared policy library
```

Save uses the SvelteKit `+server.ts` API routes to write directly to disk. In static builds (where there's no server), Save gracefully falls back to downloading — so the same button works whether you're running locally or visiting a static demo.

## Key Benefits

- **No more copy-paste round-trips** — save once, ask Claude immediately
- **Clean folder structure** — architectures, lookups, policies each in their own subfolder
- **Export still works the same** — JSON, CSV, and Excel exports continue to land in your downloads folder
- **Version-controllable** — drop the `data/` folder into git and you have an architecture change history

The split Save / Export workflow is available now in the latest release.
