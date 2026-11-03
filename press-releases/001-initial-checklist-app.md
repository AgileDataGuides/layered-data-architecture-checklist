# Layered Data Architecture Checklist Now Available

**24 March 2026**

AgileDataGuides today announced the release of the Layered Data Architecture Checklist, a free, open-source app that helps data teams document and evaluate the patterns they use across the layers of their data platform.

## The Problem

Data teams accumulate architectural decisions over years — which storage technology each layer uses, which load patterns they support, which retention rules apply, which data formats they expect. Most of those decisions live in people's heads, scattered across slide decks, or buried in vendor documentation. When a new team member joins, or when the architecture needs to be reviewed for a regulatory audit, there is no single place to look.

## The Solution

The Layered Data Architecture Checklist provides a structured grid based on the AgileData Layered Data Architecture pattern. Each row is an architectural pattern (e.g. *Data Storage Format*, *Change Detection*, *Retention Period*); each column is a layer in the architecture (e.g. Landing, History, Designed, Consume). Cells hold the chosen value for that pattern at that layer, picked from a curated dropdown of options.

The result is a one-page snapshot of the architecture's design choices that anyone can read, edit, or share.

## How It Works

Users open the app, click **Load AgileData Example** to see a fully-populated reference architecture, then create their own checklist by clicking **New** and adding layers. Click any cell to pick a value from the dropdown; multi-select patterns let you record multiple options at the layer.

Layers can be renamed by double-clicking the column header, reordered by dragging, and resized by dragging the right edge. The whole grid is editable inline with no modal interruptions.

## Key Benefits

- **One canonical view** — the matrix is the architecture; no separate decks or wikis to maintain
- **Reference example included** — the AgileData architecture ships with the app as a learning starting point
- **Multiple architectures per app** — model different parts of the platform separately or compare alternatives
- **Local first** — runs on your own machine, your data stays with you

The Layered Data Architecture Checklist is available now at [github.com/AgileDataGuides/layered-data-architecture-checklist](https://github.com/AgileDataGuides/layered-data-architecture-checklist).
