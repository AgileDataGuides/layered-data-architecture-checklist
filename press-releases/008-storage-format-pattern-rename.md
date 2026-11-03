# Layered Data Architecture Checklist Renames "Storage Format" to "Data Storage Format"

**24 April 2026**

AgileDataGuides today released a vocabulary clarification in the Layered Data Architecture Checklist. The **Storage Format** pattern is now **Data Storage Format**, removing an ambiguity that had been quietly confusing users.

## The Problem

"Storage Format" was ambiguous. Some users read it as "what file format the *data* is stored in" — Parquet, ORC, Avro, JSON. Others read it as "what *infrastructure format* the storage uses" — block storage, object storage, columnar database. The pattern was always meant to be the first interpretation (data file format), but the name didn't make that obvious, and reviewers occasionally filled the cell with infrastructure-flavoured answers.

## The Solution

The pattern is now **Data Storage Format**. The new name unambiguously describes what's being captured — the format the data lands in (Parquet, ORC, Avro, JSON, CSV, Delta, Iceberg, etc.) — without leaving room for the infrastructure-format reading.

The pattern's ID, lookup values, and dictionary descriptions are unchanged. Existing architectures continue to load without migration; only the displayed name changes.

## Key Benefits

- **Unambiguous question** — reviewers understand exactly what the cell is asking for
- **No data migration** — existing checklists load and save with the new label, no breaking change
- **Unblocks future patterns** — clears the way to add a separate "infrastructure format" pattern if we ever need one, without colliding on the name

The rename is available now in the latest release.
