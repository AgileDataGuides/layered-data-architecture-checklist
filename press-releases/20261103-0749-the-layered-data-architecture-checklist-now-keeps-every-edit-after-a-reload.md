# The Layered Data Architecture Checklist Now Keeps Every Edit After a Reload

**3 November 2026**

AgileDataGuides today released a fix for the Layered Data Architecture Checklist app, so every value, note, policy and layer change is kept in the browser and is still there after a reload.

## The Problem

The app said it saved changes to the browser automatically, and most of the time it looked as if it did. But when a person opened the app and edited the checklist that was already open, the edits only lived on the screen. The browser kept an older copy. A reload, a closed tab or a restart brought back the checklist as it was before the session, and the work was gone. Edits only reached the browser's copy after the person switched to another checklist or renamed one, which nobody does on purpose to save their work. A checklist that was new, imported or freshly loaded from the example lost its edits the same way. The Save button did not help: it writes a file for Claude to read, and the app never reads that file back.

## The Solution

The checklist on screen and the copy the browser keeps are now one and the same, so every edit is kept the moment it is made. Values, notes, policies, layer names, layer order and new or removed layers all come back after a reload, on a first visit and on every visit after, and in a checklist that was just created, imported or loaded from the example.

## Key Benefits

- **No lost work**: a reload or a closed tab no longer undoes a session's edits
- **Auto-save that does what it says**: nothing extra to click, and no need to switch checklists to keep your work
- **Safe for the new Steps tab**: a team that fills in the checklist step by step keeps every answer

The fix is available now in the Layered Data Architecture Checklist app in the Context Plane monorepo, and it reaches the public app at [github.com/AgileDataGuides/layered-data-architecture-checklist](https://github.com/AgileDataGuides/layered-data-architecture-checklist) on its next publish.
