# The Tin Heart — Design

Date: 2026-11-16
Status: Approved by user 2026-11-16

## Intent

A short, fanciful browser game about crafting an artificial heart. It's being
made for fun and turned in as a class project. Realism doesn't matter. The
point is a charming crafting experience with a satisfying ending: the heart
you built starts beating.

**Why it exists.** The project is a demonstration of how useful Claude Code
is, and specifically of the Superpowers workflow (brainstorm → design → plan →
build with tests → review) and Playwright browser testing. There's no rubric
or deadline. So the process should leave visible evidence behind: the design
doc, the plan, the conversation log, a Playwright test suite in the repo, and
screenshots taken by Playwright.

## The game

**Premise.** You're an apprentice in a clockwork alchemist's workshop. A
mechanical companion sits on the bench with an empty chest. You need to craft
it a heart.

**Core loop (alchemy discovery).**
1. The **Shelf** holds every item you've discovered. You start with 4:
   **Brass, Ember, Quicksilver, Moth Wing**.
2. Put two items into the **Crucible** and press **Combine**. **One click per
   ingredient** (user decision, 2026-11-17): clicking/tapping a shelf item drops
   it into the first empty crucible slot (A, then B). If both slots are full,
   it replaces slot B. Clicking a filled slot empties it. Dragging an item onto
   a slot still works.
3. If the pair is a recipe, the result is added to the Shelf with a short
   flourish (glow plus a one-line flavor text). If it's already known, the
   crucible says so and adds nothing. A non-recipe gives a puff of smoke and a
   short "nothing happens" line.
4. Items are **never used up**. Discovering an item unlocks it permanently.
   Recipe order doesn't matter (A+B = B+A). An item can be combined with
   itself (Brass + Brass).
5. The **Recipe Book** lists the recipes you've found and shows "found / 20".
6. The companion's chest has **5 slots**: Left Chamber, Right Chamber, Flutter
   Valve, Spark Core and Rhythm Spring. **One click to install** (user
   decision, 2026-11-17): clicking an uninstalled heart part on the Shelf
   installs it straight into its own slot. No recipe uses a heart part as an
   ingredient, so the click is never ambiguous. Dragging a part onto a slot
   still works. A slot only takes its matching part, and a wrong part dragged
   onto it is rejected with a little shake. Clicking an installed part does
   nothing except show a short "already installed" message.
7. Once all 5 are installed: the heart thumps, the companion's eyes light up,
   a short ending text plays, and a **Play again** button resets the run.

**Hints.** After 3 failed combines in a row, the Recipe Book shows one
riddle-style hint for a recipe that can be made right now (both inputs
already discovered) and hasn't been found yet, preferring recipes on the path
to an uninstalled heart part. The fail counter resets on any successful
discovery.

**Length.** About 15–20 minutes for a first playthrough.

### Recipe tree (20 recipes)

Starting items: Brass, Ember, Quicksilver, Moth Wing.

| # | Inputs | Result | Notes |
|---|--------|--------|-------|
| 1 | Brass + Ember | Molten Brass | |
| 2 | Ember + Quicksilver | Living Vapor | |
| 3 | Quicksilver + Moth Wing | Silver Feather | |
| 4 | Brass + Moth Wing | Gilded Wing | |
| 5 | Ember + Ember | Spark | |
| 6 | Brass + Brass | Gear | |
| 7 | Quicksilver + Quicksilver | Mirror Drop | |
| 8 | Molten Brass + Gear | Cog Shell | |
| 9 | Gear + Spark | Ticking Gear | |
| 10 | Living Vapor + Moth Wing | Breath | |
| 11 | Silver Feather + Gilded Wing | Flutter Membrane | |
| 12 | Mirror Drop + Ember | Glow Glass | |
| 13 | Spark + Quicksilver | Lightning Bead | |
| 14 | Cog Shell + Breath | **Left Chamber** | heart part |
| 15 | Cog Shell + Living Vapor | **Right Chamber** | heart part |
| 16 | Flutter Membrane + Gear | **Flutter Valve** | heart part |
| 17 | Lightning Bead + Glow Glass | **Spark Core** | heart part |
| 18 | Ticking Gear + Silver Feather | **Rhythm Spring** | heart part |
| 19 | Moth Wing + Ember | Ash | side discovery, joke result |
| 20 | Breath + Spark | Firefly | side discovery, decorative |

Every heart part can be reached from the four starting items. The builder may
rename items or adjust non-heart recipes for flavor, as long as the 5 heart
parts stay reachable and the total stays around 20.

### Layout

Three panels on desktop. On narrow screens they stack vertically (Shelf,
Crucible, Companion).

```
┌───────────────────────────────────────────────────────┐
│  THE TIN HEART                       Recipe Book 9/20 │
├──────────────┬──────────────────┬─────────────────────┤
│ SHELF        │    CRUCIBLE      │   COMPANION         │
│ [Brass]      │                  │      ___            │
│ [Ember]      │  [Ember]+[Brass] │     /   \  chest:   │
│ [Quicksilver]│                  │    | ♥?? | [chmbr]✓ │
│ [Moth Wing]  │   ( Combine )    │     \___/  [chmbr]  │
│ [Molten Br.] │                  │            [valve]  │
│ [Gear]       │  "A warm hum..." │            [spark]  │
│              │                  │            [spring] │
└──────────────┴──────────────────┴─────────────────────┘
```

Visual style: warm workshop palette (brass, copper, deep wood browns, ember
orange accents), drawn with inline SVG and CSS. No image files.

## Goals

- A complete, finishable game with a clear beginning, middle and ending.
- Discovery feels rewarding: every success gets visible feedback, and the
  ending feels earned.
- Easy to grade: opens straight from GitHub Pages, and the code is readable.

## Non-goals

- Medical or anatomical accuracy.
- Multiple levels, timers, scores, leaderboards.
- Accounts, a backend, or online features.

## Anti-goals (failure even if it "works")

- The player gets stuck with no way forward (hints exist to prevent this).
- It feels grindy or random, like trying every pair blindly with no feedback.
- It breaks when hosted on GitHub Pages or when opened offline.

## Constraints

- **Hosting: GitHub Pages.** The game is a single `index.html` at the repo
  root, with all CSS and JavaScript inline and only relative paths. No build
  step. It must also work when opened directly from disk (`file://`).
- No external libraries, fonts or network requests.
- **Saving:** progress (discovered items, installed parts, found recipes) is
  saved in `localStorage` after every change and restored on load. Every
  storage access is wrapped in try/catch, so the game still runs without
  storage (e.g. a private window). "Play again" clears the save.
- Works in current Chrome, Firefox, Edge and Safari. Playable with a mouse or
  touch. Desktop is the primary target.

## Approaches considered

- **A. Plain HTML/CSS/JavaScript with inline SVG art — CHOSEN.** No
  dependencies, works offline, and the DOM gives buttons, text, drag/click and
  layout for free. Effects (glow, smoke, heartbeat) are CSS animations. The
  code is easy for a grader to read.
- **B. HTML canvas, drawing everything by hand.** The most animation freedom,
  but UI, text and hit-testing all have to be built manually. Much more code
  for the same game.
- **C. A game framework (e.g. Phaser) from a CDN.** Built for action/physics
  games, overkill for a crafting UI, and it needs a network connection.

The user picked A.

## Testing and demo evidence (Claude's call, given the demo purpose)

- **Playwright test suite committed to the repo** (`@playwright/test`, with a
  `package.json` used only for testing, served locally). It covers at least:
  - The page loads with the 4 starting items and 0/20 found.
  - A valid combine adds an item. A dud adds nothing and shows smoke.
  - Reversed order works, and self-combine (Brass + Brass) works.
  - A hint appears after 3 failed combines.
  - Wrong parts are rejected by chest slots.
  - Progress survives a reload.
  - A full playthrough to the ending, with the heart beating.
  - A narrow (phone-width) viewport still allows a full playthrough.
- **Recipe-graph checks** (every heart part reachable, no duplicate pairs,
  exactly 20 recipes) run as part of the same suite.
- **Live browser check** with the Playwright browser tool during development,
  including screenshots at key moments (start, mid-game, ending) saved under
  `docs/screenshots/` for the README.
- **README.md** explaining what the game is, how to play, how to run the
  tests, and how it was built (links to the design doc, plan and conversation
  log).
- None of the test tooling affects GitHub Pages. Pages serves `index.html`, and
  `node_modules/` is git-ignored.

## Calls made during review (Claude's, not the user's)

- **Repo and publishing.** This repo is the one that goes on GitHub Pages.
  The user is fine with `conversation-history.txt` and the docs being public,
  so everything gets committed. Pushing to GitHub and turning on Pages are the
  user's steps. The plan will include short instructions for them.
- **Installed parts** stay on the Shelf, marked "installed" and greyed out.
  They can't be installed twice. (Since one-click installing, they can only
  be put in the crucible by dragging. No recipe uses them, so nothing is lost.)
- **Re-combining a known pair** doesn't count as a failure for the hint
  counter.
- **Reloading after the ending** shows the finished, beating companion and the
  Play again button. It doesn't replay the ending sequence.
- **Length** of 15–20 minutes is a rough estimate, not a hard target.

## Left to the builder

- Exact flavor text, hint riddles, item names (within the constraints above)
  and the ending text.
- SVG art for items, crucible and companion. A simple, consistent style is
  fine.
- Sound: optional. If added, synthesize it with the Web Audio API (no audio
  files), start it only after a user interaction, and include a mute toggle.
- How the code is organized inside `index.html`. It should keep recipe data in
  a single plain data table so it's easy to read and edit.
- Test file organization and selectors (see "Testing and demo evidence" for
  what must be covered).
