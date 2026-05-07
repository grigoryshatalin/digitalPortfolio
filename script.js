(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================================================================
     Theme
  ================================================================ */
  const themeBtn   = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.setAttribute("data-theme", savedTheme || (prefersDark ? "dark" : "light"));

  themeBtn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });

  /* ================================================================
     Decode / scramble effect (retro data-decoding)
     - Pre-blank every [data-decode] element on load (stash original text)
     - When a section enters view, decode each target with a stagger
  ================================================================ */
  const DECODE_CHARS = "!@#$%&*<>{}[]/\\=+-_01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  function randomChar() {
    return DECODE_CHARS[Math.floor(Math.random() * DECODE_CHARS.length)];
  }

  function prepDecodeTargets(scope = document) {
    scope.querySelectorAll("[data-decode]").forEach((el) => {
      if (el.dataset.original !== undefined) return;
      el.dataset.original = el.textContent;

      // Only pre-blank elements that will decode on reveal (inside .reveal).
      // Elements outside .reveal keep their text and only glitch on hover.
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
    if (el.dataset.glitching === "1") return; // prevent overlapping animations
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

  // Faster, snappier glitch used on hover.
  function glitchHover(el) {
    const text = el.dataset.original;
    if (!text) return;
    decodeInto(el, text, 16);
  }

  function setupHoverGlitch() {
    // Direct: each [data-decode] glitches on its own hover.
    document.querySelectorAll("[data-decode]").forEach((el) => {
      el.addEventListener("pointerenter", () => glitchHover(el));
    });

    // Container: hovering anywhere on a .row glitches its row-num + row-title.
    document.querySelectorAll(".row").forEach((row) => {
      row.addEventListener("pointerenter", () => {
        row.querySelectorAll("[data-decode]").forEach((t) => glitchHover(t));
      });
    });
  }

  function decodeSection(section, baseDelay = 180) {
    const targets = section.querySelectorAll("[data-decode]");
    targets.forEach((t, i) => {
      const text = t.dataset.original || t.textContent;
      const speed = text.length > 30 ? 22 : (text.length > 12 ? 32 : 50);
      setTimeout(() => decodeInto(t, text, speed), baseDelay + i * 75);
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
    // Pre-blank decode targets immediately so they don't flash real text
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
     Particle constellation field
     Forces each frame:
       - Slow flow-field drift
       - Cursor pull (energy-scaled, decays when idle)
       - Soft mutual repulsion at close range (anti-clump)
  ================================================================ */
  if (reduceMotion) return;

  const canvas = document.getElementById("field");
  const ctx    = canvas.getContext("2d");

  let W, H, DPR;
  let particles = [];
  const PARTICLE_TARGET_DENSITY = 1 / 9000;
  const PARTICLE_MAX = 280;
  const CONN_DIST  = 130;
  const CONN_DIST2 = CONN_DIST * CONN_DIST;
  const CELL = 130;

  // Cursor + energy
  let cx = -9999, cy = -9999;
  let lastMoveX = -9999, lastMoveY = -9999;
  let cursorEnergy = 0;
  const CURSOR_R  = 220;
  const CURSOR_R2 = CURSOR_R * CURSOR_R;

  let fieldColor = "244, 243, 239";
  let bgColor    = "6, 6, 7";
  function refreshTheme() {
    const cs = getComputedStyle(root);
    fieldColor = cs.getPropertyValue("--field-rgb").trim() || "244, 243, 239";
    bgColor    = (root.getAttribute("data-theme") === "dark") ? "6, 6, 7" : "244, 242, 237";
  }
  new MutationObserver(refreshTheme).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W   = window.innerWidth;
    H   = window.innerHeight;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    refreshTheme();
    initParticles();
  }

  function initParticles() {
    const target = Math.min(PARTICLE_MAX, Math.max(80, Math.floor(W * H * PARTICLE_TARGET_DENSITY)));
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
      });
    }
  }

  const grid = new Map();
  function gridKey(gx, gy) { return gx * 73856093 ^ gy * 19349663; }

  function tick(now) {
    ctx.fillStyle = `rgba(${bgColor}, 0.10)`;
    ctx.fillRect(0, 0, W, H);

    cursorEnergy *= 0.93;
    if (cursorEnergy < 0.001) cursorEnergy = 0;

    /* ---- update positions, build grid ---- */
    grid.clear();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (now < p.bornAt) continue;
      p.life = Math.min(1, (now - p.bornAt) / 900);

      // Flow field drift
      const t = now * 0.00012;
      const ang = Math.sin(p.x * 0.0028 + t) + Math.cos(p.y * 0.0028 - t * 1.3);
      p.vx += Math.cos(ang) * 0.014;
      p.vy += Math.sin(ang) * 0.014;

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
      p.vx *= 0.955;
      p.vy *= 0.955;
      p.x  += p.vx;
      p.y  += p.vy;

      // Off-screen → respawn at random position with fresh life.
      // Keeps the network abstract: clumps drift out and reset; new
      // arrivals appear at unpredictable spots and fade in.
      if (p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30) {
        p.x = Math.random() * W;
        p.y = Math.random() * H;
        p.vx = (Math.random() - 0.5) * 0.4;
        p.vy = (Math.random() - 0.5) * 0.4;
        p.life = 0;
        p.bornAt = now + Math.random() * 280;
      }

      const gx = Math.floor(p.x / CELL);
      const gy = Math.floor(p.y / CELL);
      const k = gridKey(gx, gy);
      let cell = grid.get(k);
      if (!cell) { cell = []; grid.set(k, cell); }
      cell.push(p);
    }

    /* ---- pairwise pass: connections + repulsion ---- */
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
            // Each pair exactly once
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

    /* ---- particles ---- */
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

      const alpha = (0.55 + glow * 0.4) * p.life;
      const r     = p.r + glow * 1.2;

      ctx.fillStyle = `rgba(${fieldColor}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(tick);
  }

  let raf;

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

  resize();
  raf = requestAnimationFrame(tick);
})();
