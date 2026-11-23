# The Layered Data Architecture Checklist Public Repo Now Protects Its Main Branch

**9 November 2026**

AgileDataGuides today protected the `main` branch of the public Layered Data Architecture Checklist repo, so the code behind the live demo can no longer be force-pushed over or deleted.

## The Problem

The public Layered Data Architecture Checklist repo at `AgileDataGuides/layered-data-architecture-checklist` was published with no rule on its `main` branch. Anyone with write access could rewrite its history with a force-push or delete the branch outright. The live demo at https://agiledataguides.github.io/layered-data-architecture-checklist/ builds from `main`, so one bad push would have taken the demo down and lost the history every clone depends on. GitHub showed the gap on the repo's home page: "Your main branch isn't protected".

## The Solution

`main` now carries a protection rule that blocks force-pushes and deletion. The rule asks for no reviews and no status checks, because the monorepo's publish script pushes each release straight to `main`, and a review rule would stop it. The publish script now applies the same rule on every publish, so a mirror published in future starts protected and a rule removed by hand is restored on the next release.

## Key Benefits

- **The demo stays up** — the branch the live demo builds from cannot be deleted or rewritten
- **History is safe** — every clone and fork keeps a stable `main` to pull from
- **Future mirrors start protected** — the publish script sets the rule, so the gap cannot reopen on a new repo

The protection is live now on https://github.com/AgileDataGuides/layered-data-architecture-checklist.
