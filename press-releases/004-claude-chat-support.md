# Layered Data Architecture Checklist Now Works With Claude Chat

**30 March 2026**

AgileDataGuides today extended the Layered Data Architecture Checklist's AI integration to [claude.ai](https://claude.ai). Users without Claude Code installed can now export their architecture as an Excel file and upload it directly to Claude Chat for the same kind of analysis — no terminal, no installation, no setup.

## The Problem

The Checklist's "ask Claude about my architecture" workflow assumed users had Claude Code installed. That excluded a big chunk of the audience the Checklist was built for: business analysts, governance leads, compliance officers, and architecture reviewers — people who'd benefit from AI analysis but weren't going to install a CLI tool to get it.

## The Solution

The **Export Excel** button now produces a multi-sheet `.xlsx` workbook containing everything Claude needs:

- The architecture grid (layers × patterns)
- All cell notes
- The pattern lookup definitions
- The dictionary of pattern descriptions
- The policy library
- The policy-to-cell attachment matrix

That single file gives Claude Chat all the context it needs to analyse your architecture, identify gaps, compare layers, suggest improvements, and answer governance questions.

## How It Works

1. Build your architecture (or load the AgileData example).
2. Click **Export Excel** — the `.xlsx` lands in your downloads folder.
3. Open [claude.ai](https://claude.ai) and start a new conversation.
4. Attach the file using the paperclip icon and ask your questions.

The Instructions tab gains a dedicated **No Claude Code? Use Claude Chat instead** section walking through the flow.

## Key Benefits

- **Zero-install AI analysis** — anyone with a Claude Chat account can analyse the architecture
- **Self-contained file** — everything Claude needs is in the one Excel
- **Same questions, same answers** — Claude Chat understands the spreadsheet structure exactly the same way Claude Code understands the JSON
- **Mobile-friendly** — works from any device that can open claude.ai

Claude Chat support is available now in the latest release.
