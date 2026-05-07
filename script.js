(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================================================================
     Theme — defaults to light
  ================================================================ */
  const themeBtn   = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("theme");
  root.setAttribute("data-theme", savedTheme || "light");

  themeBtn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    if (next === "dark") enterConstellationMode();
    else                 exitConstellationMode();
  });

  /* ================================================================
     Decode / glitch utilities
  ================================================================ */
  const DECODE_CHARS = "!@#$%&*<>{}[]/\\=+-_01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  function randomChar() {
    return DECODE_CHARS[Math.floor(Math.random() * DECODE_CHARS.length)];
  }

  function prepDecodeTargets(scope = document) {
    scope.querySelectorAll("[data-decode]").forEach((el) => {
      if (el.dataset.original !== undefined) return;
      el.dataset.original = el.textContent;
      if (!el.closest(".reveal")) return;
      let placeholder = "";
      for (let i = 0; i < el.dataset.original.length; i++) {
        const ch = el.dataset.original[i];
        placeholder += (ch === " " || ch === "\n") ? ch : randomChar();
      }
      el.textContent = placeholder;
    });
  }

  function decodeInto(el, finalText, durPerChar = 38) {
    const len = finalText.length;
    if (len === 0) return;
    if (el.dataset.glitching === "1") return;
    el.dataset.glitching = "1";

    const start = performance.now();
    const totalDur = len * durPerChar + 180;
    el.classList.add("is-decoding");

    function step(now) {
      const elapsed = now - start;
      let out = "";
      for (let i = 0; i < len; i++) {
        const lockAt = i * durPerChar;
        const ch = finalText[i];
        if (elapsed >= lockAt + 50 || ch === " " || ch === "\n") {
          out += ch;
        } else {
          out += randomChar();
        }
      }
      el.textContent = out;
      if (elapsed < totalDur) {
        requestAnimationFrame(step);
      } else {
        el.textContent = finalText;
        el.classList.remove("is-decoding");
        el.dataset.glitching = "0";
      }
    }
    requestAnimationFrame(step);
  }

  function glitchHover(el) {
    const text = el.dataset.original;
    if (!text) return;
    decodeInto(el, text, 16);
  }

  function setupHoverGlitch() {
    document.querySelectorAll("[data-decode]").forEach((el) => {
      if (el.closest(".row")) return;
      el.addEventListener("pointerenter", () => {
        el.classList.add("is-hovered");
        glitchHover(el);
      });
      el.addEventListener("pointerleave", () => {
        el.classList.remove("is-hovered");
      });
    });
    document.querySelectorAll(".row").forEach((row) => {
      const targets = row.querySelectorAll("[data-decode]");
      row.addEventListener("pointerenter", () => {
        targets.forEach((t) => {
          t.classList.add("is-hovered");
          glitchHover(t);
        });
      });
      row.addEventListener("pointerleave", () => {
        targets.forEach((t) => t.classList.remove("is-hovered"));
      });
    });
  }

  /* ================================================================
     Boot / typing sequence
  ================================================================ */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function typeInto(el, text, speed) {
    el.classList.add("is-typing");
    el.textContent = "";
    for (let i = 1; i <= text.length; i++) {
      el.textContent = text.slice(0, i);
      if (i < text.length) {
        const jitter = (Math.random() - 0.5) * speed * 0.45;
        await sleep(speed + jitter);
      }
    }
    el.classList.remove("is-typing");
    if (el.classList.contains("is-prompt")) {
      el.classList.add("is-done");
    }
  }

  function decodeSection(section, baseDelay = 180) {
    const targets = section.querySelectorAll("[data-decode]");
    targets.forEach((t, i) => {
      const text = t.dataset.original || t.textContent;
      const speed = text.length > 30 ? 22 : (text.length > 12 ? 32 : 50);
      setTimeout(() => decodeInto(t, text, speed), baseDelay + i * 75);
    });
  }

  function startSectionObserver() {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          decodeSection(e.target);
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.05, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  }

  async function bootSequence() {
    prepDecodeTargets();
    setupHoverGlitch();

    if (reduceMotion) {
      document.querySelectorAll(".boot-line, .display-line").forEach((el) => {
        el.textContent = el.dataset.text || "";
        if (el.classList.contains("is-prompt")) el.classList.add("is-done");
      });
      document.querySelectorAll("[data-decode]").forEach((el) => {
        el.textContent = el.dataset.original || el.textContent;
      });
      document.querySelector(".lede")?.classList.add("is-visible");
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
      return;
    }

    await sleep(180);
    for (const el of document.querySelectorAll(".boot-line")) {
      const text = el.dataset.text || "";
      const speed = parseInt(el.dataset.speed || "22", 10);
      await typeInto(el, text, speed);
      await sleep(110);
    }
    await sleep(260);
    for (const el of document.querySelectorAll(".display-line")) {
      const text = el.dataset.text || "";
      const speed = parseInt(el.dataset.speed || "75", 10);
      await typeInto(el, text, speed);
      await sleep(40);
    }
    await sleep(160);
    document.querySelector(".lede")?.classList.add("is-visible");
    startSectionObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootSequence);
  } else {
    bootSequence();
  }

  /* ================================================================
     Particle field
       - Light mode: free flow field, cursor pulls particles, off-screen
         particles respawn at random positions.
       - Dark mode: SAME physics, but particles glide into a constellation
         arrangement during a brief assembly window (~2.5s after toggle).
         After that, the spring force turns off — particles drift like in
         light mode and the constellations can be fully destroyed by the
         cursor; they don't reform.
  ================================================================ */
  if (reduceMotion) return;

  const canvas = document.getElementById("field");
  const ctx    = canvas.getContext("2d");

  let W, H, DPR;
  let particles = [];
  const PARTICLE_TARGET_DENSITY = 1 / 8500;
  const PARTICLE_MAX = 320;
  const CONN_DIST  = 130;
  const CONN_DIST2 = CONN_DIST * CONN_DIST;
  const CELL = 130;

  // Cursor + energy
  let cx = -9999, cy = -9999;
  let lastMoveX = -9999, lastMoveY = -9999;
  let cursorEnergy = 0;
  const CURSOR_R  = 200;
  const CURSOR_R2 = CURSOR_R * CURSOR_R;

  // How close the cursor must come to a constellation's stars to wake it.
  const TRIGGER_R  = 130;
  const TRIGGER_R2 = TRIGGER_R * TRIGGER_R;

  /* ----------------------------------------------------------------
     Constellations — public-domain astronomical patterns.
     Star coordinates and zones are my own layout decisions; the
     code and visual treatment are original.
  ---------------------------------------------------------------- */
  const CONSTELLATIONS = [
    { id:"cygnus", name:"Cygnus",
      stars:[{x:0.50,y:0.00},{x:0.50,y:0.45},{x:0.10,y:0.55},{x:0.92,y:0.32},{x:0.55,y:1.00}],
      edges:[[0,1],[1,2],[1,3],[1,4]],
      zone:{x:0.04, y:0.06, w:0.09, h:0.18} },

    { id:"cassiopeia", name:"Cassiopeia",
      stars:[{x:0.00,y:0.40},{x:0.25,y:0.70},{x:0.50,y:0.30},{x:0.75,y:0.80},{x:1.00,y:0.50}],
      edges:[[0,1],[1,2],[2,3],[3,4]],
      zone:{x:0.18, y:0.06, w:0.10, h:0.07} },

    { id:"triangulum", name:"Triangulum",
      stars:[{x:0.45,y:0.00},{x:0.00,y:1.00},{x:1.00,y:0.95}],
      edges:[[0,1],[1,2],[2,0]],
      zone:{x:0.34, y:0.07, w:0.05, h:0.05} },

    { id:"andromeda", name:"Andromeda",
      stars:[{x:0.00,y:0.55},{x:0.33,y:0.45},{x:0.66,y:0.35},{x:1.00,y:0.20}],
      edges:[[0,1],[1,2],[2,3]],
      zone:{x:0.46, y:0.07, w:0.13, h:0.07} },

    { id:"lyra", name:"Lyra",
      stars:[{x:0.50,y:0.00},{x:0.20,y:0.45},{x:0.80,y:0.50},{x:0.30,y:1.00},{x:0.70,y:1.00}],
      edges:[[0,1],[0,2],[1,2],[1,3],[2,4],[3,4]],
      zone:{x:0.66, y:0.06, w:0.06, h:0.12} },

    { id:"perseus", name:"Perseus",
      stars:[{x:0.10,y:0.10},{x:0.40,y:0.30},{x:0.60,y:0.55},{x:0.30,y:0.78},{x:0.85,y:0.85}],
      edges:[[0,1],[1,2],[2,3],[2,4]],
      zone:{x:0.84, y:0.18, w:0.10, h:0.16} },

    { id:"hercules", name:"Hercules",
      stars:[{x:0.25,y:0.10},{x:0.65,y:0.05},{x:0.78,y:0.50},{x:0.30,y:0.55},{x:0.00,y:0.95},{x:0.90,y:1.00}],
      edges:[[0,1],[1,2],[2,3],[3,0],[3,4],[2,5]],
      zone:{x:0.04, y:0.36, w:0.09, h:0.13} },

    { id:"cepheus", name:"Cepheus",
      stars:[{x:0.50,y:0.00},{x:0.00,y:0.45},{x:1.00,y:0.40},{x:0.20,y:1.00},{x:0.85,y:1.00}],
      edges:[[0,1],[0,2],[1,3],[2,4],[3,4]],
      zone:{x:0.74, y:0.36, w:0.08, h:0.12} },

    { id:"bootes", name:"Bootes",
      stars:[{x:0.50,y:0.00},{x:0.15,y:0.45},{x:0.85,y:0.50},{x:0.50,y:1.00}],
      edges:[[0,1],[0,2],[1,3],[2,3]],
      zone:{x:0.05, y:0.65, w:0.09, h:0.16} },

    { id:"corona", name:"Corona Borealis",
      stars:[{x:0.00,y:0.55},{x:0.20,y:0.20},{x:0.42,y:0.05},{x:0.65,y:0.10},{x:0.85,y:0.30},{x:1.00,y:0.70}],
      edges:[[0,1],[1,2],[2,3],[3,4],[4,5]],
      zone:{x:0.20, y:0.68, w:0.13, h:0.09} },

    { id:"ursa-major", name:"Ursa Major",
      stars:[{x:0.92,y:0.40},{x:0.92,y:0.70},{x:0.74,y:0.74},{x:0.74,y:0.44},{x:0.55,y:0.38},{x:0.32,y:0.28},{x:0.10,y:0.20}],
      edges:[[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]],
      zone:{x:0.40, y:0.66, w:0.22, h:0.12} },

    { id:"ursa-minor", name:"Ursa Minor",
      stars:[{x:0.95,y:0.30},{x:0.95,y:0.55},{x:0.78,y:0.58},{x:0.78,y:0.34},{x:0.55,y:0.26},{x:0.30,y:0.14},{x:0.10,y:0.05}],
      edges:[[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]],
      zone:{x:0.70, y:0.70, w:0.20, h:0.13} },
  ];

  function initDriftParams() {
    for (const c of CONSTELLATIONS) {
      c.driftPhase = Math.random() * Math.PI * 2;
      c.driftAmpX  = 22 + Math.random() * 30;
      c.driftAmpY  = 16 + Math.random() * 22;
      c.driftFreqX = 0.00006 + Math.random() * 0.00010;
      c.driftFreqY = 0.00004 + Math.random() * 0.00008;
      c.screenStars = [];
      c.activated   = false;
      c.activatedAt = 0;
    }
  }

  let constellationActive = false;
  let constellationStartedAt = 0;
  const SPRING_DURATION = 2500;     // ms — initial assembly window

  function setupConstellationLabels() {
    const container = document.querySelector(".constellation-labels");
    if (!container) return;
    container.innerHTML = "";
    for (const c of CONSTELLATIONS) {
      const el = document.createElement("div");
      el.className = "constellation-label";
      el.textContent = c.name;
      container.appendChild(el);
      c.labelEl = el;
    }
  }

  function computeStarPositions(c, now) {
    let dx = 0, dy = 0;
    if (c.activated) {
      // Drift ramps in over 800ms after activation so motion doesn't snap on.
      const elapsed = now - c.activatedAt;
      const driftFactor = Math.min(1, elapsed / 800);
      dx = Math.sin(now * c.driftFreqX + c.driftPhase) * c.driftAmpX * driftFactor;
      dy = Math.sin(now * c.driftFreqY + c.driftPhase * 1.4) * c.driftAmpY * driftFactor;
    }
    for (let i = 0; i < c.stars.length; i++) {
      const s = c.stars[i];
      if (!c.screenStars[i]) c.screenStars[i] = { x: 0, y: 0 };
      c.screenStars[i].x = (c.zone.x + s.x * c.zone.w) * W + dx;
      c.screenStars[i].y = (c.zone.y + s.y * c.zone.h) * H + dy;
    }
  }

  function setFillerAnchor(p, c) {
    if (Math.random() < 0.4) {
      p.homeAnchor = {
        type: "s", c,
        idx: Math.floor(Math.random() * c.stars.length),
        ox: (Math.random() - 0.5) * 12,
        oy: (Math.random() - 0.5) * 12,
      };
    } else {
      p.homeAnchor = {
        type: "e", c,
        idx: Math.floor(Math.random() * c.edges.length),
        t:   Math.random(),
        ox:  (Math.random() - 0.5) * 6,
        oy:  (Math.random() - 0.5) * 6,
      };
    }
    p.constellationId = c.id;
  }

  function resolveHome(p) {
    if (!p.homeAnchor) {
      p.homeX = undefined; p.homeY = undefined;
      return;
    }
    if (p.isStar) {
      const c = p.starOfC;
      const s = c && c.screenStars[p.starIdx];
      if (s) { p.homeX = s.x; p.homeY = s.y; }
      return;
    }
    const a = p.homeAnchor;
    const c = a.c;
    if (!c.screenStars.length) return;
    if (a.type === "s") {
      const s = c.screenStars[a.idx];
      if (s) { p.homeX = s.x + a.ox; p.homeY = s.y + a.oy; }
    } else {
      const e = c.edges[a.idx];
      const sa = c.screenStars[e[0]];
      const sb = c.screenStars[e[1]];
      if (sa && sb) {
        p.homeX = sa.x + (sb.x - sa.x) * a.t + a.ox;
        p.homeY = sa.y + (sb.y - sa.y) * a.t + a.oy;
      }
    }
  }

  function assignConstellationHomes() {
    initDriftParams();
    const now = performance.now();
    for (const c of CONSTELLATIONS) computeStarPositions(c, now);

    const N = particles.length;
    let pi = 0;

    for (const c of CONSTELLATIONS) {
      c.starParticleStartIdx = pi;
      for (let i = 0; i < c.stars.length; i++) {
        if (pi >= N) break;
        const p = particles[pi++];
        p.isStar = true;
        p.starOfC = c;
        p.starIdx = i;
        p.homeAnchor = { type: "_named", c };
        p.constellationId = c.id;
        p.r = 1.85;
      }
    }

    const remaining = N - pi;
    const totalWeight = CONSTELLATIONS.reduce(
      (s, c) => s + c.stars.length + c.edges.length * 2, 0);
    let allocated = 0;
    for (let ci = 0; ci < CONSTELLATIONS.length; ci++) {
      const c = CONSTELLATIONS[ci];
      const weight = (c.stars.length + c.edges.length * 2) / totalWeight;
      const count = (ci === CONSTELLATIONS.length - 1)
        ? Math.max(0, remaining - allocated)
        : Math.round(remaining * weight);
      allocated += count;
      for (let i = 0; i < count; i++) {
        if (pi >= N) break;
        const p = particles[pi++];
        p.isStar = false;
        p.starOfC = null;
        p.r = 0.85 + Math.random() * 0.5;
        setFillerAnchor(p, c);
      }
    }

    for (const p of particles) resolveHome(p);
  }

  /* Disturbance: how far the named-star particles are from where the
     constellation currently sits (its drifted screen position).      */
  function computeConstellationDisturbance(c) {
    if (c.starParticleStartIdx === undefined || !c.screenStars.length) return 1;
    let total = 0, count = 0;
    for (let i = 0; i < c.stars.length; i++) {
      const p = particles[c.starParticleStartIdx + i];
      const s = c.screenStars[i];
      if (!p || !s) continue;
      const dx = p.x - s.x;
      const dy = p.y - s.y;
      total += Math.sqrt(dx * dx + dy * dy);
      count++;
    }
    return count > 0 ? Math.min(1, (total / count) / 60) : 1;
  }

  function updateLabels() {
    if (!constellationActive) {
      for (const c of CONSTELLATIONS) {
        if (c.labelEl) c.labelEl.style.opacity = 0;
      }
      return;
    }
    for (const c of CONSTELLATIONS) {
      if (!c.labelEl || !c.screenStars.length) continue;
      let sumX = 0, maxY = -Infinity;
      for (const s of c.screenStars) {
        sumX += s.x;
        if (s.y > maxY) maxY = s.y;
      }
      const cx0 = sumX / c.screenStars.length;
      const cy0 = maxY + 18;
      const disturb = computeConstellationDisturbance(c);
      const vis = Math.max(0, 1 - disturb * 1.7);
      c.labelEl.style.left      = cx0 + "px";
      c.labelEl.style.top       = cy0 + "px";
      c.labelEl.style.transform = `translate(-50%, ${(disturb * -10).toFixed(2)}px)`;
      c.labelEl.style.opacity   = vis.toFixed(3);
      c.labelEl.style.filter    = `blur(${(disturb * 4).toFixed(2)}px)`;
    }
  }

  function enterConstellationMode() {
    if (!particles.length) return;
    constellationActive = true;
    constellationStartedAt = performance.now();
    cursorEnergy = 0;
    assignConstellationHomes();
    // Don't snap positions — particles drift home via spring force during
    // the SPRING_DURATION assembly window.
  }

  function exitConstellationMode() {
    constellationActive = false;
    // Drop anchors so disturbance doesn't keep computing
    for (const p of particles) {
      p.homeAnchor = null;
      p.homeX = undefined;
      p.homeY = undefined;
      p.constellationId = "_free";
      p.isStar = false;
    }
    for (const c of CONSTELLATIONS) {
      c.starParticleStartIdx = undefined;
      if (c.labelEl) c.labelEl.style.opacity = 0;
    }
  }

  /* ----------------------------------------------------------------
     Theme tokens for canvas rendering
  ---------------------------------------------------------------- */
  let fieldColor = "13, 14, 16";
  let bgColor    = "244, 242, 237";
  function refreshTheme() {
    const cs = getComputedStyle(root);
    fieldColor = cs.getPropertyValue("--field-rgb").trim() || "13, 14, 16";
    bgColor    = (root.getAttribute("data-theme") === "dark") ? "6, 6, 7" : "244, 242, 237";
  }
  new MutationObserver(refreshTheme).observe(root, {
    attributes: true, attributeFilter: ["data-theme"]
  });

  /* ----------------------------------------------------------------
     Resize
       - Always update canvas dimensions to match viewport
       - Only regenerate particles on initial setup or when WIDTH
         changes meaningfully (≥ 24px). On iOS the URL bar shrinks &
         expands the height during scroll, which previously wiped the
         particle field. Now we ignore height-only changes.
  ---------------------------------------------------------------- */
  function resize() {
    const newW = window.innerWidth;
    const newH = window.innerHeight;
    const isInitial   = !W || particles.length === 0;
    const widthMoved  = Math.abs(newW - (W || 0)) > 24;

    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W   = newW;
    H   = newH;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    refreshTheme();

    if (isInitial || widthMoved) {
      initParticles();
      if (constellationActive) assignConstellationHomes();
    }
  }

  function initParticles() {
    const target = Math.min(PARTICLE_MAX, Math.max(120, Math.floor(W * H * PARTICLE_TARGET_DENSITY)));
    particles = [];
    const now = performance.now();
    for (let i = 0; i < target; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        bornAt: now + Math.random() * 2400,
        life: 0,
        r: 0.9 + Math.random() * 0.7,
        homeX: undefined,
        homeY: undefined,
        homeAnchor: null,
        constellationId: "_free",
        isStar: false,
        starOfC: null,
        starIdx: 0,
      });
    }
  }

  const grid = new Map();
  function gridKey(gx, gy) { return gx * 73856093 ^ gy * 19349663; }

  // Spring & damping
  const SPRING_K       = 0.018;
  const DAMPING_FREE   = 0.955;
  const DAMPING_SPRING = 0.91;

  function tick(now) {
    ctx.fillStyle = `rgba(${bgColor}, 0.10)`;
    ctx.fillRect(0, 0, W, H);

    cursorEnergy *= 0.93;
    if (cursorEnergy < 0.001) cursorEnergy = 0;

    // 1. Drift constellations & resolve homes (only relevant during spring phase,
    //    but we also need screenStars during the whole dark mode for disturbance
    //    metric / labels / skeleton lines).
    const elapsedSinceEnter = constellationActive ? (now - constellationStartedAt) : Infinity;
    const inSpringPhase     = constellationActive && elapsedSinceEnter < SPRING_DURATION;

    if (constellationActive) {
      for (const c of CONSTELLATIONS) computeStarPositions(c, now);

      // Cursor proximity wakes a constellation. Only happens after the
      // initial spring assembly and only for non-activated constellations.
      if (!inSpringPhase && cx !== -9999) {
        for (const c of CONSTELLATIONS) {
          if (c.activated || !c.screenStars.length) continue;
          for (let i = 0; i < c.screenStars.length; i++) {
            const s = c.screenStars[i];
            const dxc = cx - s.x;
            const dyc = cy - s.y;
            if (dxc * dxc + dyc * dyc < TRIGGER_R2) {
              c.activated = true;
              c.activatedAt = now;
              break;
            }
          }
        }
      }

      // Resolve homes — used by spring (during assembly) and by locked
      // particles (so they snap to their static home each frame).
      for (const p of particles) resolveHome(p);
    }

    grid.clear();

    const damping = inSpringPhase ? DAMPING_SPRING : DAMPING_FREE;

    // 2. Particle physics
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (now < p.bornAt) continue;
      p.life = Math.min(1, (now - p.bornAt) / 900);

      // A particle is "locked" when its constellation hasn't been woken
      // by the cursor yet. Locked particles snap to their home each frame
      // and skip all forces, so untouched constellations stay perfectly
      // still until you mouse into them.
      const pc = p.isStar ? p.starOfC : (p.homeAnchor && p.homeAnchor.c);
      const isLocked = constellationActive && !inSpringPhase && pc && !pc.activated;

      if (isLocked && p.homeX !== undefined) {
        p.x = p.homeX;
        p.y = p.homeY;
        p.vx = 0;
        p.vy = 0;
      } else if (inSpringPhase && p.homeX !== undefined) {
        // Initial assembly: decaying spring pulls particles to home over
        // SPRING_DURATION ms.
        const t = elapsedSinceEnter / SPRING_DURATION;
        const fade = 1 - t * t * t;
        const k = SPRING_K * fade;
        p.vx += (p.homeX - p.x) * k;
        p.vy += (p.homeY - p.y) * k;
      } else {
        // Free flow field (light mode + activated dark-mode constellations)
        const tt = now * 0.00012;
        const ang = Math.sin(p.x * 0.0028 + tt) + Math.cos(p.y * 0.0028 - tt * 1.3);
        p.vx += Math.cos(ang) * 0.014;
        p.vy += Math.sin(ang) * 0.014;
      }

      if (!isLocked) {
        // Cursor force
        if (cursorEnergy > 0.01) {
          const dx = cx - p.x;
          const dy = cy - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < CURSOR_R2 && d2 > 1) {
            const d = Math.sqrt(d2);
            const f = (1 - d / CURSOR_R) * cursorEnergy * 0.55;
            p.vx += ((dx / d) * 0.40 + (-dy / d) * 0.60) * f;
            p.vy += ((dy / d) * 0.40 + ( dx / d) * 0.60) * f;
          }
        }

        // Damping + integrate
        p.vx *= damping;
        p.vy *= damping;
        p.x  += p.vx;
        p.y  += p.vy;

        // Off-screen → respawn at random. Locked particles never drift
        // off (they're pinned), so we only check unlocked ones.
        if (p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30) {
          p.x = Math.random() * W;
          p.y = Math.random() * H;
          p.vx = (Math.random() - 0.5) * 0.4;
          p.vy = (Math.random() - 0.5) * 0.4;
          p.life = 0;
          p.bornAt = now + Math.random() * 280;
        }
      }

      const gx = Math.floor(p.x / CELL);
      const gy = Math.floor(p.y / CELL);
      const k2 = gridKey(gx, gy);
      let cell = grid.get(k2);
      if (!cell) { cell = []; grid.set(k2, cell); }
      cell.push(p);
    }

    // 3. Skeleton lines per constellation — alpha tracks disturbance, so
    //    once particles drift, lines fade and disappear.
    if (constellationActive) {
      ctx.lineWidth = 0.8;
      for (const c of CONSTELLATIONS) {
        if (c.starParticleStartIdx === undefined) continue;
        const disturb = computeConstellationDisturbance(c);
        const alpha = (1 - disturb) * 0.45;
        if (alpha < 0.02) continue;
        ctx.strokeStyle = `rgba(${fieldColor}, ${alpha})`;
        for (let ei = 0; ei < c.edges.length; ei++) {
          const e = c.edges[ei];
          const pa = particles[c.starParticleStartIdx + e[0]];
          const pb = particles[c.starParticleStartIdx + e[1]];
          if (!pa || !pb) continue;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        }
      }
    }

    // 4. Pairwise connection lines via spatial grid
    ctx.lineWidth = 0.6;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.life <= 0) continue;
      const gx = Math.floor(p.x / CELL);
      const gy = Math.floor(p.y / CELL);
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const cell = grid.get(gridKey(gx + ox, gy + oy));
          if (!cell) continue;
          for (let k = 0; k < cell.length; k++) {
            const q = cell[k];
            if (q === p) continue;
            if (p.x > q.x || (p.x === q.x && p.y > q.y)) continue;
            const dx = p.x - q.x;
            const dy = p.y - q.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 1 || d2 > CONN_DIST2) continue;
            const d = Math.sqrt(d2);
            const fall = 1 - d / CONN_DIST;
            const alpha = fall * fall * 0.42 * p.life * q.life;
            ctx.strokeStyle = `rgba(${fieldColor}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
    }

    // 5. Particle dots
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.life <= 0) continue;
      let glow = 0;
      if (cursorEnergy > 0.05) {
        const dx = cx - p.x;
        const dy = cy - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < CURSOR_R2) {
          glow = (1 - Math.sqrt(d2) / CURSOR_R) * cursorEnergy;
        }
      }
      // Named stars stay slightly brighter while their constellation is
      // recognizable; brightness scales with that constellation's
      // (1 − disturbance), so as the formation breaks they fade in with
      // the rest of the field.
      let starBoost = 0;
      if (p.isStar && constellationActive && p.starOfC) {
        const disturb = computeConstellationDisturbance(p.starOfC);
        starBoost = 0.32 * (1 - disturb);
      }
      const alpha = Math.min(1, (0.55 + glow * 0.4 + starBoost) * p.life);
      const r     = p.r + glow * 1.2;
      ctx.fillStyle = `rgba(${fieldColor}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Floating labels
    updateLabels();

    raf = requestAnimationFrame(tick);
  }

  let raf;

  /* ----------------------------------------------------------------
     Pointer events (works for mouse, pen, touch).
  ---------------------------------------------------------------- */
  document.addEventListener("pointermove", (e) => {
    const nx = e.clientX, ny = e.clientY;
    if (lastMoveX !== -9999) {
      const dx = nx - lastMoveX;
      const dy = ny - lastMoveY;
      const v = Math.sqrt(dx * dx + dy * dy);
      cursorEnergy = Math.min(1, cursorEnergy + v * 0.022);
    }
    lastMoveX = nx; lastMoveY = ny;
    cx = nx; cy = ny;
  }, { passive: true });

  document.addEventListener("pointerleave", () => {
    cx = -9999; cy = -9999;
    lastMoveX = -9999; lastMoveY = -9999;
  });
  // Touch end: drop the position so cursor force fades, otherwise the
  // last touch keeps pulling.
  document.addEventListener("pointerup", () => {
    cx = -9999; cy = -9999;
    lastMoveX = -9999; lastMoveY = -9999;
  }, { passive: true });
  window.addEventListener("blur", () => {
    cx = -9999; cy = -9999;
    lastMoveX = -9999; lastMoveY = -9999;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else                 raf = requestAnimationFrame(tick);
  });

  let resizeTO;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(resize, 140);
  });
  // iOS / Android — orientation change fires after the viewport resize
  window.addEventListener("orientationchange", () => {
    setTimeout(resize, 200);
  });

  setupConstellationLabels();
  initDriftParams();
  resize();

  if (root.getAttribute("data-theme") === "dark") {
    enterConstellationMode();
  }

  raf = requestAnimationFrame(tick);
})();
