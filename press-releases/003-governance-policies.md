# Layered Data Architecture Checklist Adds Governance Policies

**27 March 2026**

AgileDataGuides today released governance policy management for the Layered Data Architecture Checklist. Architects can now define rules like *"All PII columns MUST be encrypted at rest"* once, attach them to specific cells in the architecture, and see policy coverage at a glance.

## The Problem

Architecture and governance lived in two different artefacts. The architecture was a tidy grid; the governance rules were in a Word doc, a Confluence page, or someone's email signature. Tracing "which architectural choice satisfies which policy?" was a manual exercise — and the policy and the architecture would drift the moment anything changed.

## The Solution

The Checklist gains a **Policies** tab — a shared library where each policy captures:

- **Name** — short label (e.g. "PII at rest encryption")
- **Category** — Security / Quality / Compliance / Naming / Privacy / Governance / Retention
- **Description** — context, why the policy exists
- **Rule** — the natural-language assertion (e.g. *"All PII columns MUST be encrypted at rest using AES-256"*)

Once defined, a policy can be attached to any cell in the matrix via the shield icon. Cells with attached policies show a small shield badge with the count, making coverage instantly visible across the architecture.

## How It Works

Policies are stored in a shared library (`data/policies/policies.json`) that lives separately from individual architectures, so the same library is reusable across every architecture in your project.

Cell-level attachments travel with the architecture — when you export an architecture file, the policy *references* (by ID) come along, so the receiving app can re-attach them as long as it has access to the same policy library.

Excel exports include policies and their attachments as two extra sheets: a policy library sheet and a policy-to-cell attachment matrix. That makes the full governance picture visible to anyone who opens the spreadsheet, including stakeholders without the app installed.

## Key Benefits

- **Architecture and governance in one place** — no separate wiki or compliance doc
- **Reusable library** — define a policy once, attach it everywhere
- **Visible coverage** — shield badges on cells make gaps obvious
- **Export-friendly** — policies travel in JSON and Excel exports
- **Categorised + searchable** — filter the library by category to find what you need quickly

Governance policies are available now in the latest release.
