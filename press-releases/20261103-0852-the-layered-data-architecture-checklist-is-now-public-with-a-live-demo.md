# The Layered Data Architecture Checklist Is Now Public, With a Live Demo

**3 November 2026**

AgileDataGuides today published the Layered Data Architecture Checklist as an open-source app with a live demo, so any data team can document its layers and their patterns without installing anything.

## The Problem

The Layered Data Architecture Checklist helps a team agree how each layer of its data platform works: what it is called, who may use it, how data is stored, processed, changed and trusted, and who reads it. Until now the app lived only inside the Context Plane monorepo. A data team that heard about the checklist had no way to try it, and no way to run it on their own machine without access to that private repository. The other AgileDataGuides Pattern Template apps, such as the Information Product Canvas and the Concept Model, were already public with live demos, and the checklist was the one left behind.

## The Solution

The checklist now has its own public repository and a live demo on GitHub Pages. The demo opens on the 9 Steps tab with the AgileData reference architecture already filled in, so a visitor can walk through all nine steps, read what every pattern and value means, and compare it with the full Checklist grid. Everything a visitor enters stays in their own browser. A team that wants to keep using it can clone the repository and run it locally with one script.

## How It Works

The demo is a static build of the same app the monorepo runs, published by the AgileDataGuides publish script and redeployed by GitHub Actions whenever the public repository changes. It ships the pattern catalogue, the value descriptions, the policy library and the AgileData example architecture. Architectures a person saves on their own machine are never published.

## Key Benefits

- **Try it in a minute**: open the demo link and start with a complete reference architecture, no install
- **Your work stays yours**: the demo keeps everything in your browser, and a local install keeps it on your machine
- **Guided from the first click**: the 9 Steps tab walks a new team through the checklist one theme at a time
- **Open to use and adapt**: the code is MIT licensed and the documentation CC BY-SA 4.0

The Layered Data Architecture Checklist is available now at [github.com/AgileDataGuides/layered-data-architecture-checklist](https://github.com/AgileDataGuides/layered-data-architecture-checklist), with a [live demo](https://agiledataguides.github.io/layered-data-architecture-checklist).
