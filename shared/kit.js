/* ================================================================
   Kit — the only code shared between worlds:
     - the registry of worlds + the visit cycle (used by /index.html):
       each browser gets its own random order of all ten worlds and walks
       it one step per visit/refresh, so nothing repeats until all ten
       have been seen, then it loops back to the first
     - a tiny, deliberately neutral "switch world" control
     - small helpers (escaping, a screen-reader summary of the content)
   Each world opts in by setting <html data-world="<id>">.
================================================================ */
(function () {
  const ROOT = new URL("..", document.currentScript.src).href;
  const INDEX = location.protocol === "file:" ? "index.html" : "";
  const LANDING = "metro"; // the front door: every fresh visit starts here
  const CYCLE_KEY = "gs-world-cycle"; // {"order":[ids…], "i": index of the world last shown}

  const WORLDS = [
    { id: "train",     name: "The Midnight Limited",   blurb: "An overnight train, one car per chapter" },
    { id: "metro",     name: "Shatalin Metro",          blurb: "A transit map of a career" },
    { id: "blueprint", name: "Drawing GS-26",           blurb: "An engineering drawing you can pan and zoom" },
    { id: "pixel",     name: "Shatalin Town",           blurb: "A tiny pixel RPG to walk around" },
    { id: "desktop",   name: "Grigory 98",              blurb: "A desktop operating system" },
    { id: "gazette",   name: "The Shatalin Gazette",    blurb: "A broadsheet newspaper" },
    { id: "abyss",     name: "Descent",                 blurb: "A dive to the bottom of the ocean" },
    { id: "record",    name: "Selected Works LP",       blurb: "A record on a turntable" },
    { id: "arcana",    name: "The Arcana",              blurb: "A career reading in cards" },
  ];

  function safeGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }

  const Kit = {
    ROOT,
    worlds: WORLDS,
    reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,

    esc(s) {
      return String(s).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    },

    // GitHub Pages serves folder URLs; a local file:// preview needs the file name.
    worldUrl(id) { return ROOT + "worlds/" + id + "/" + INDEX; },

    pick(exclude) {
      const pool = WORLDS.filter((w) => w.id !== exclude);
      return pool[Math.floor(Math.random() * pool.length)].id;
    },

    // The per-browser cycle. A stored order that no longer matches the
    // world list (worlds added/removed) is discarded and reshuffled.
    cycle() {
      let c = null;
      try { c = JSON.parse(safeGet(CYCLE_KEY)); } catch (_) {}
      // The landing world is never part of the random rotation.
      const ids = WORLDS.map((w) => w.id).filter((id) => id !== LANDING);
      const valid = c && Array.isArray(c.order) && c.order.length === ids.length &&
        ids.every((id) => c.order.includes(id)) && Number.isInteger(c.i);
      if (!valid) {
        const order = ids.slice();
        for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
        c = { order, i: -1 };
      }
      return c;
    },
    // Record that `id` is being shown, so the next step continues after it.
    markShown(id) {
      const c = Kit.cycle(), i = c.order.indexOf(id);
      if (i >= 0) { c.i = i; safeSet(CYCLE_KEY, JSON.stringify(c)); }
    },
    nextInCycle() {
      const c = Kit.cycle();
      return c.order[(c.i + 1) % c.order.length];
    },

    // Called by the root loader: honour ?world=<id>, otherwise always land
    // on the landing world. Randomizing happens from inside the worlds.
    goRandom() {
      const q = new URLSearchParams(location.search).get("world");
      const id = WORLDS.some((w) => w.id === q) ? q : LANDING;
      location.replace(Kit.worldUrl(id));
    },

    goAnother() {
      location.href = Kit.worldUrl(Kit.nextInCycle());
    },

    // A visually hidden, fully semantic copy of the content for worlds that
    // render mostly to canvas.
    srSummary() {
      const P = window.PORTFOLIO, e = Kit.esc;
      const sec = document.createElement("section");
      sec.className = "gs-sr";
      sec.innerHTML =
        `<h1>${e(P.name)} — ${e(P.role)}</h1><p>${e(P.intro)}</p>` +
        `<h2>Experience</h2><ul>${P.experience.map((x) =>
          `<li><h3>${e(x.role)}, ${e(x.org)}${x.team ? " (" + e(x.team) + ")" : ""}</h3><p>${e(x.location)} · ${e(x.dates)}</p><ul>${x.bullets.map((b) => `<li>${e(b)}</li>`).join("")}</ul></li>`).join("")}</ul>` +
        `<h2>Education</h2><ul>${P.education.map((x) => `<li>${e(x.degree)}, ${e(x.school)} — ${e(x.dates)}, GPA ${e(x.gpa)}</li>`).join("")}</ul>` +
        `<h2>Projects</h2><ul>${P.projects.map((x) => `<li><a href="${e(x.url)}">${e(x.name)}</a> — ${e(x.desc)}</li>`).join("")}</ul>` +
        `<h2>Skills</h2><ul>${P.skills.map((s) => `<li>${e(s.group)}: ${e(s.items.join(", "))}</li>`).join("")}</ul>` +
        `<h2>Contact</h2><ul>${P.contacts.map((c) => `<li><a href="${e(c.href)}">${e(c.label)}</a></li>`).join("")}</ul>`;
      document.body.prepend(sec);
      return sec;
    },

    switcher() {
      const cur = document.documentElement.dataset.world;
      const idx = WORLDS.findIndex((w) => w.id === cur);
      const here = idx >= 0 ? WORLDS[idx].name : "the original site";
      const pos = document.documentElement.dataset.switcher || "bl";
      const e = Kit.esc;

      const style = document.createElement("style");
      style.textContent = `
.gs-sr{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
.gs-switch{position:fixed;z-index:2147483000;font:500 11px/1.2 ui-monospace,"SF Mono",Menlo,Consolas,monospace;letter-spacing:.02em;color:#f4f4f5}
.gs-switch[data-pos="bl"]{left:max(12px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom))}
.gs-switch[data-pos="br"]{right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom))}
.gs-switch[data-pos="tl"]{left:max(12px,env(safe-area-inset-left));top:max(12px,env(safe-area-inset-top))}
.gs-switch[data-pos="tr"]{right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top))}
.gs-switch-btn{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border-radius:999px;cursor:pointer;
  background:rgba(14,14,18,.55);border:1px solid rgba(255,255,255,.16);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
  opacity:.55;transition:opacity .2s,transform .2s}
.gs-switch-btn:hover,.gs-switch-btn:focus-visible,.gs-switch-btn[aria-expanded="true"]{opacity:1}
.gs-switch-btn:focus-visible{outline:2px solid #fff;outline-offset:2px}
.gs-switch-btn svg{width:12px;height:12px}
.gs-switch-menu{position:absolute;width:268px;max-width:calc(100vw - 24px);padding:14px;border-radius:14px;background:rgba(16,16,20,.94);
  border:1px solid rgba(255,255,255,.12);box-shadow:0 20px 50px rgba(0,0,0,.45);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
.gs-switch[data-pos^="b"] .gs-switch-menu{bottom:calc(100% + 8px)}
.gs-switch[data-pos^="t"] .gs-switch-menu{top:calc(100% + 8px)}
.gs-switch[data-pos$="l"] .gs-switch-menu{left:0}
.gs-switch[data-pos$="r"] .gs-switch-menu{right:0}
.gs-switch-menu p{margin:0 0 10px;color:#a1a1aa;line-height:1.5}
.gs-switch-menu b{color:#f4f4f5;font-weight:600}
.gs-switch-menu ol{list-style:none;margin:0;padding:0;display:grid;gap:1px}
.gs-switch-menu a{display:flex;gap:10px;padding:6px 8px;border-radius:7px;color:#e4e4e7;text-decoration:none}
.gs-switch-menu a:hover,.gs-switch-menu a:focus-visible{background:rgba(255,255,255,.08);outline:none}
.gs-switch-menu a[aria-current]{color:#fff;background:rgba(255,255,255,.12)}
.gs-switch-menu a span{color:#71717a;min-width:2ch}
.gs-switch-row{display:flex;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.1)}
.gs-switch-row a{flex:1;justify-content:center;border:1px solid rgba(255,255,255,.14)}`;
      document.head.appendChild(style);

      const wrap = document.createElement("div");
      wrap.className = "gs-switch";
      wrap.dataset.pos = pos;
      wrap.innerHTML =
        `<button class="gs-switch-btn" type="button" aria-expanded="false" aria-controls="gs-switch-menu" aria-label="Switch to another version of this site">` +
        `<span>${idx >= 0 ? String(idx + 1).padStart(2, "0") + "/" + WORLDS.length : "orig"}</span>` +
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg></button>` +
        `<div class="gs-switch-menu" id="gs-switch-menu" hidden>` +
        `<p>${WORLDS.length} worlds, one person. You're in <b>${e(here)}</b>.</p>` +
        `<ol>${WORLDS.map((w, i) => `<li><a href="${Kit.worldUrl(w.id)}"${w.id === cur ? ' aria-current="page"' : ""} title="${e(w.blurb)}"><span>${String(i + 1).padStart(2, "0")}</span>${e(w.name)}</a></li>`).join("")}</ol>` +
        `<div class="gs-switch-row"><a href="#" data-shuffle>Randomize website</a><a href="${ROOT}classic/${INDEX}">Original</a></div></div>`;
      document.body.appendChild(wrap);

      const btn = wrap.querySelector("button");
      const menu = wrap.querySelector(".gs-switch-menu");
      const set = (open) => { menu.hidden = !open; btn.setAttribute("aria-expanded", String(open)); };
      btn.addEventListener("click", (ev) => { ev.stopPropagation(); set(menu.hidden); });
      wrap.querySelector("[data-shuffle]").addEventListener("click", (ev) => { ev.preventDefault(); Kit.goAnother(); });
      document.addEventListener("click", (ev) => { if (!wrap.contains(ev.target)) set(false); });
      // Keep world-level key/pointer handlers from reacting to the switcher.
      wrap.addEventListener("keydown", (ev) => {
        ev.stopPropagation();
        if (ev.key === "Escape" && !menu.hidden) { set(false); btn.focus(); }
      });
      ["pointerdown", "wheel", "touchstart", "mousedown"].forEach((t) =>
        wrap.addEventListener(t, (ev) => ev.stopPropagation(), { passive: true }));
    },
  };

  window.Kit = Kit;

  const world = document.documentElement.dataset.world;
  if (world) {
    // Refreshing a world moves on to the next one in the cycle; arriving any
    // other way (link, typed URL, back/forward) shows the world asked for.
    const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    if (nav && nav.type === "reload" && world !== LANDING) {
      const next = Kit.nextInCycle();
      // Only advance if this world is the one the cycle last showed; a reload
      // of a deep-linked world first joins the cycle at that world.
      const c = Kit.cycle();
      if (c.order[c.i] === world) { document.documentElement.style.visibility = "hidden"; Kit.markShown(next); location.replace(Kit.worldUrl(next) + location.search); return; }
    }
    Kit.markShown(world);
  }
  if (world !== undefined) {
    const mount = () => Kit.switcher();
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
    else mount();
  }
})();
