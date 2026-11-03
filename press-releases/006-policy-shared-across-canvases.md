# Layered Data Architecture Checklist Now Shares Policies Across Canvases

**9 April 2026**

AgileDataGuides today released cross-canvas policy sharing for the Layered Data Architecture Checklist when running inside the Context Plane app. Policies created in the Checklist are now automatically visible to the Data Contract, Concept Model, and any other canvas that consumes governance rules — and vice versa.

## The Problem

Inside the Context Plane, multiple canvases work with the same governance rules. The Checklist attaches policies to architectural cells; the Data Contract attaches policies (Trust Rules) to columns and contracts. Until now, each canvas had its own private policy entity (`checklist_policy`, `contract_policy`, etc.), so creating "All PII columns MUST be encrypted at rest" in the Checklist did nothing for the Data Contract — users had to recreate the same policy on every canvas.

## The Solution

Policies now use the `global_policy` entity type when running inside the Context Plane (the standalone app's local-only mode is unchanged). A policy created on any canvas — Checklist, Data Contract, or any future canvas that consumes policies — becomes visible to all the others. Editing the rule in the Data Contract updates what the Checklist's shield-icon attachment shows, because they're the same node.

## How It Works

The Checklist's policy library now reads from and writes to the shared `global_policy` graph node table. Cell attachments still record per-cell references (which is what makes the shield badge appear), but the *policy itself* is the shared node. The standalone app continues to read its own `data/policies/policies.json` so single-app users see no change.

JSON imports also match existing policies by name (case-insensitive) before creating new ones, so re-importing an old export into the Context Plane links to the existing global policies rather than duplicating them.

## Key Benefits

- **One policy, one definition** — change the rule in any canvas, see it everywhere
- **No duplication on import** — match-by-name keeps the policy library clean
- **Cell attachments unchanged** — the per-cell shield badge UX is identical
- **Standalone unchanged** — single-app users see no behaviour change

Cross-canvas policy sharing is available now in the latest release.
