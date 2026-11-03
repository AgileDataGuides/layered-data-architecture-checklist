# Layered Data Architecture Checklist Adds the Status Pattern Type

**25 April 2026**

AgileDataGuides today released a new **Status** pattern type for the Layered Data Architecture Checklist. Each architectural cell can now record its lifecycle state — *Draft*, *Active*, *Deprecated*, or *Retired* — using the same vocabulary the Data Contract canvas uses for contract status.

## The Problem

Architectures evolve. A pattern at a layer might be the current production design, an aspirational target the team is working toward, a retired choice they're still maintaining for legacy reasons, or a draft idea under review. Users wanted a way to say "this is the *current* design here" vs "this is what we *plan* to do" — and there was no place for that lifecycle metadata in the Checklist grid.

Adding a new pattern just for status was the obvious answer, but inventing a new vocabulary felt wrong when the Data Contract canvas already had a perfectly good status vocabulary right next door.

## The Solution

The Checklist gains a **Status** pattern type pre-seeded with the Data Contract canvas's lifecycle values:

- **Draft** — design under review, not yet committed
- **Active** — current production design
- **Deprecated** — superseded by a newer choice but still maintained
- **Retired** — no longer in use; kept for historical reference

Like every other pattern in the Checklist, you can edit the values in the **Manage Patterns** tab if your team uses different lifecycle terms.

## How It Works

Status is a single-select pattern (one value per cell). The default values come from the same lookup the Data Contract uses for contract-level status, so the two canvases speak the same lifecycle language — useful when the Checklist drives a Data Contract or vice versa.

Existing architectures don't see Status until you opt in (it's added to the lookup library, not auto-attached to existing rows). New architectures get Status alongside the standard patterns by default.

## Key Benefits

- **Lifecycle visibility on the architecture itself** — no separate spreadsheet tracking which patterns are aspirational vs production
- **Same vocabulary as Data Contract** — Draft / Active / Deprecated / Retired across both canvases
- **Customisable** — change the values in Manage Patterns if your team uses different terms

The Status pattern type is available now in the latest release.
