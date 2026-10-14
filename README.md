# Digital Portfolio

Personal portfolio site for Grigory Shatalin — nine completely different interactive websites built around the same person. Every visit starts on the metro map, with a button to randomize into the others. Vanilla HTML, CSS, JavaScript and canvas; no frameworks, no build step, no analytics.

## The worlds

| # | Folder | World | How you explore it |
|---|--------|-------|--------------------|
| 1 | `worlds/train` | **The Midnight Limited** — a particle train, one station per chapter | Next station / scroll / arrow keys; station line at the bottom |
| 2 | `worlds/metro` | **Shatalin Metro** — a transit map of the career | Tap any station; lines for work, study and projects |
| 3 | `worlds/blueprint` | **Drawing GS-26** — an engineering drawing with meshing gears | Guided tour (Next →), or pan and zoom freely |
| 4 | `worlds/pixel` | **Shatalin Town** — a pixel RPG town with enterable buildings | Walk (or tap) into any door; talk to objects inside; Map lists every building |
| 5 | `worlds/desktop` | **Grigory 98** — a retro desktop OS | Click icons or the taskbar buttons; draggable windows, Minesweeper |
| 6 | `worlds/gazette` | **The Shatalin Gazette** — a broadsheet newspaper | Turn pages between sections; halftone illustrations |
| 7 | `worlds/abyss` | **Descent** — a dive to the sea floor | Scroll to descend; depth gauge, flashlight in the dark |
| 8 | `worlds/record` | **Selected Works LP** — a record on a turntable | Click a track to play it; optional ambient music |
| 9 | `worlds/arcana` | **The Arcana** — a career reading in eight cards | Touch the deck, pick a card |

The previous single-page site lives on at `classic/`.

## How it fits together

- `shared/data.js` — **all the content** (experience, education, projects, skills, links). Edit it here once and every world updates.
- `shared/kit.js` — the world list, the visit cycle, the small "switch world" button shown in every world, and helpers.
- `index.html` — a tiny loader that sends each visit to the next world.
- `worlds/<name>/index.html` — each world is one self-contained file.

### Which world you see

Every visit lands on **Shatalin Metro**. Its **Randomize website** button (also in the corner switcher of every world) jumps to another world, using a per-browser random order stored in `localStorage` (`gs-world-cycle`) so nothing repeats until all of them have been seen. Refreshing any world other than the metro also moves on to the next one. `/?world=train` opens a specific world.

## Running locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server
```

## Hosting

Deployed with GitHub Pages from the root of `main` — pushing to `main` updates the live site.
