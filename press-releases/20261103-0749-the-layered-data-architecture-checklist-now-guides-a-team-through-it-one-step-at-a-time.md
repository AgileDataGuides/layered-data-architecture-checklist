# The Layered Data Architecture Checklist Now Guides a Team Through It One Step at a Time

**3 November 2026**

AgileDataGuides today released a 9 Steps tab for the Layered Data Architecture Checklist app, so a team can fill in its checklist a few questions at a time instead of facing a grid of 26 patterns and every layer at once.

## The Problem

The checklist showed everything on one grid: the layers as columns and 26 pattern rules as rows, from Alias to Last Mile Tools. That grid is the right view once a checklist is full, and the right view to compare layers. For a team starting a new checklist, it was a wall. People did not know where to start, so they clicked cells in no order, skipped patterns they did not understand, and left gaps they could not see without scanning every row. The meaning of each pattern sat behind a hover on its name, and the meaning of each value sat inside a dropdown, so a team in a workshop kept losing its place. The Concept Model already walks a team through its work one step at a time, and the checklist had nothing like it.

## The Solution

The app now opens on a **9 Steps** tab, the first tab, to the left of the **Checklist** tab. Nine steps run down the left, each with a line that reads off the checklist, for example "12 of 12 answered" or "17 gaps to look at". Click a step and its panel opens on the right, with the step's question, one line on what it covers, and the patterns it asks about. Each pattern shows what it means and a row for each layer. A Back and Next bar under the panel names the step before and the step after. The Checklist tab is unchanged and still shows the whole checklist on one grid.

## How It Works

The steps group the patterns by theme: name the layers, govern them, model the data, store it, process it, set the change rules, build trust in it, and give people access, then check for gaps. Step 1 adds, renames, reorders and removes layers, and Enter keeps the cursor in the field so a team can type every layer in one go. In the later steps, a short list of values shows every value as a chip, and a click gives it to the layer. A long list, such as the 75 compute technologies, shows the layer's values and opens the full list with a filter. Hover over any value and a card says what it means, and add a note to any row to say why. The last step lists every pattern a layer has no value for and goes straight to the step that fills it. Pattern types a team adds get their own Other Patterns step, and a step whose pattern types are all turned off is hidden. The steps are a checklist, never a wizard: every step is one click away at any time, and no step locks another. The Steps tab also shows inside the Context Plane, beside the checklist.

## Key Benefits

- **A way in for a new checklist**: the team answers a few related questions at a time, in an order that starts with the layers themselves
- **The meaning in plain view**: every pattern shows its description, and a hover card gives every value's meaning, with no dropdown to open
- **Gaps found before anyone relies on the checklist**: the last step names every empty pattern for every layer
- **Nothing to relearn**: the same values and notes as the grid, and the whole checklist one tab away

The 9 Steps tab is available now in the Layered Data Architecture Checklist app in the Context Plane monorepo, and it reaches the public app at [github.com/AgileDataGuides/layered-data-architecture-checklist](https://github.com/AgileDataGuides/layered-data-architecture-checklist) on its next publish.
