# Digital Portfolio

A minimal personal portfolio site, inspired by [emilkowal.ski](https://emilkowal.ski/).

## Structure

- `index.html` — all content
- `style.css` — styles + dark/light theme via CSS variables
- `script.js` — theme toggle (persists to `localStorage`)

## Customizing

1. **Name & role** — update `.name` and `.role` in the `<header>`
2. **Bio** — update the paragraph in the `Today` section
3. **Projects** — replace the four template `.item` cards with your real projects
4. **Writing** — replace the template article links
5. **More** — update the GitHub/Twitter/LinkedIn/email links

## Hosting on GitHub Pages

1. Push to a GitHub repo (e.g. `username/username.github.io` for a root domain, or any repo for `username.github.io/repo-name`)
2. Go to **Settings → Pages**
3. Set source to **Deploy from a branch → main → / (root)**
4. Save — the site will be live at `https://username.github.io` (or `/repo-name`)