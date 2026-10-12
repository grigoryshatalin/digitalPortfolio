# Digital Portfolio

Personal portfolio site for Grigory Shatalin — a single static page with a terminal-style boot sequence, decoding text, and an interactive particle field. Built with vanilla JavaScript, HTML5 canvas, and CSS. No frameworks, no build step, no analytics.

## Structure

- `index.html` — all content: header and links, Experience, Education, Building Now, Featured Work, Stack, Approach, Colophon
- `style.css` — layout and type, dark/light themes via CSS variables, mobile breakpoint at 640px, reduced-motion overrides
- `script.js` — all behavior (see below)
- `Software_Engineer_Resume.pdf` — linked from the header

## What `script.js` does

- **Theme toggle** — dark/light, saved to `localStorage`, defaults to the system preference
- **Boot sequence** — types out the `> initializing...` lines and the name, then fades in the intro and top links
- **Decode effect** — any element with `data-decode` scrambles and resolves when its `.reveal` section scrolls into view; links re-scramble on hover
- **Particle field** — full-page canvas (`#field`) with flow-field drift, cursor pull, and connecting lines between nearby particles
- **Buffalo** — in the Education section, particles assemble into a 🦬 silhouette sampled from the emoji (falls back to a "CU" monogram)
- **Agent P&L leaderboard** — fetches `leaderboard.json` from [modeltraining](https://github.com/grigoryshatalin/modeltraining) at runtime and ranks agents by percentage return, with an optional S&P 500 YTD benchmark row. Stays hidden until that file exists, so this repo never needs to change when the numbers do.

All animation is skipped when the visitor has `prefers-reduced-motion` enabled.

## Editing content

Everything lives in `index.html`:

- **Experience / Education** — each role is an `<li class="entry">` inside `<ol class="entries">`, with title, org, location, dates, and bullets
- **Projects** — each project in Building Now / Featured Work is an `<a class="row">` with a number, title, and description
- **Animated text** — add `data-decode` to an element to give it the decode effect
- **Colophon** — update "Last revision" when making changes

## Running locally

Open `index.html` in a browser, or serve the folder so the leaderboard fetch behaves as it does in production:

```sh
python3 -m http.server
```

## Hosting

Deployed with GitHub Pages from the root of `main` — pushing to `main` updates the live site.
