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

      // Pre-blank elements that animate in: inside .reveal sections, or
      // the top-links nav (which has its own deferred reveal in bootSequence).
      // Everything else keeps its text and only glitches on link hover.
      if (!el.closest(".reveal") && !el.closest(".top-links")) return;

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
    // Only links glitch on hover. Hovering an anchor scrambles every
    // [data-decode] descendant (row-num, row-title, the link's own text, etc).
    document.querySelectorAll("a").forEach((a) => {
      a.addEventListener("pointerenter", () => {
        if (a.hasAttribute("data-decode")) glitchHover(a);
        a.querySelectorAll("[data-decode]").forEach((t) => glitchHover(t));
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
      document.querySelector(".top-links")?.classList.add("is-visible");
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

    // Top-links: fade in just after the lede settles, then decode each
    // entry left-to-right so they arrive deliberately, not all at once.
    await sleep(360);
    const topLinks = document.querySelector(".top-links");
    if (topLinks) {
      topLinks.classList.add("is-visible");
      const linkTargets = topLinks.querySelectorAll("[data-decode]");
      linkTargets.forEach((t, i) => {
        setTimeout(() => decodeInto(t, t.dataset.original || t.textContent, 30), 280 + i * 95);
      });
    }

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
    const newDPR = Math.min(window.devicePixelRatio || 1, 2);
    const newW = window.innerWidth;
    const newH = window.innerHeight;

    // No-op: mobile scroll fires resize even when dimensions are unchanged
    // (e.g. visualViewport jitter). Skip to avoid clearing the canvas backing
    // store and causing a one-frame blink.
    if (particles.length > 0 && newW === W && newH === H && newDPR === DPR) return;

    const oldW = W, oldH = H;
    DPR = newDPR;
    W = newW;
    H = newH;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    refreshTheme();

    // First-time setup: build particles. After that, mobile scroll fires
    // resize as the address bar toggles — rescale existing particles to
    // the new viewport instead of wiping them (which would replay the
    // 0–2.4s `bornAt` fade-in and cause visible blink-outs).
    if (particles.length === 0) {
      initParticles();
    } else if (oldW > 0 && oldH > 0) {
      const rx = W / oldW;
      const ry = H / oldH;
      for (const p of particles) {
        p.x *= rx;
        p.y *= ry;
      }
    }
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

  /* ================================================================
     Buffalo — particles assemble into a 🦬 silhouette
     - Sample alpha from a large emoji rendered to an offscreen canvas
     - Each sampled pixel becomes a particle target
     - Particles ease in from random positions and gently breathe in place
  ================================================================ */
  initBuffalo();

  function initBuffalo() {
    const bcanvas = document.getElementById("buffalo");
    if (!bcanvas) return;
    const bctx = bcanvas.getContext("2d");

    const SAMPLE_RES = 360;
    let bW = 0, bH = 0, bDPR = 1;
    let targetPoints = [];
    let buffaloAspect = 1;
    let bparticles = [];
    let startTime = 0;
    let visible = false;
    let braf;

    function buildTargets() {
      const off = document.createElement("canvas");
      off.width = off.height = SAMPLE_RES;
      const octx = off.getContext("2d");
      octx.fillStyle = "#000";
      const px = Math.floor(SAMPLE_RES * 0.78);
      octx.font = px + 'px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "EmojiOne Color", "Twemoji Mozilla", sans-serif';
      octx.textBaseline = "middle";
      octx.textAlign = "center";
      octx.fillText("🦬", SAMPLE_RES / 2, SAMPLE_RES / 2);

      const data = octx.getImageData(0, 0, SAMPLE_RES, SAMPLE_RES).data;

      let minX = SAMPLE_RES, minY = SAMPLE_RES, maxX = 0, maxY = 0;
      let hits = 0;
      for (let y = 0; y < SAMPLE_RES; y++) {
        for (let x = 0; x < SAMPLE_RES; x++) {
          if (data[(y * SAMPLE_RES + x) * 4 + 3] > 90) {
            hits++;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Fallback: if the platform rendered no emoji glyph, draw a CU monogram
      if (hits < 200) {
        octx.clearRect(0, 0, SAMPLE_RES, SAMPLE_RES);
        octx.fillStyle = "#000";
        octx.font = "700 " + Math.floor(SAMPLE_RES * 0.6) + 'px "Inter", sans-serif';
        octx.textBaseline = "middle";
        octx.textAlign = "center";
        octx.fillText("CU", SAMPLE_RES / 2, SAMPLE_RES / 2);
        const d2 = octx.getImageData(0, 0, SAMPLE_RES, SAMPLE_RES).data;
        minX = SAMPLE_RES; minY = SAMPLE_RES; maxX = 0; maxY = 0;
        for (let y = 0; y < SAMPLE_RES; y++) {
          for (let x = 0; x < SAMPLE_RES; x++) {
            if (d2[(y * SAMPLE_RES + x) * 4 + 3] > 90) {
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }
        const bwSrc = maxX - minX, bhSrc = maxY - minY;
        buffaloAspect = bwSrc / bhSrc;
        targetPoints = [];
        const step = 6;
        for (let y = minY; y <= maxY; y += step) {
          for (let x = minX; x <= maxX; x += step) {
            if (d2[(y * SAMPLE_RES + x) * 4 + 3] > 90) {
              targetPoints.push({ u: (x - minX) / bwSrc, v: (y - minY) / bhSrc });
            }
          }
        }
        return;
      }

      const bwSrc = maxX - minX;
      const bhSrc = maxY - minY;
      buffaloAspect = bwSrc / bhSrc;

      targetPoints = [];
      const step = 6;
      for (let y = minY; y <= maxY; y += step) {
        for (let x = minX; x <= maxX; x += step) {
          if (data[(y * SAMPLE_RES + x) * 4 + 3] > 90) {
            targetPoints.push({ u: (x - minX) / bwSrc, v: (y - minY) / bhSrc });
          }
        }
      }
    }

    function buildParticles() {
      bparticles = targetPoints.map((p) => ({
        u: p.u, v: p.v,
        startX: Math.random() * bW,
        startY: Math.random() * bH,
        x: 0, y: 0,
        phase: Math.random() * Math.PI * 2,
        delay: Math.random() * 700,
        r: 0.7 + Math.random() * 0.5,
      }));
    }

    function bResize() {
      bDPR = Math.min(window.devicePixelRatio || 1, 2);
      const cw = bcanvas.clientWidth;
      const ch = bcanvas.clientHeight;
      if (cw === 0 || ch === 0) return;
      const oldW = bW, oldH = bH;
      bW = cw; bH = ch;
      bcanvas.width = bW * bDPR;
      bcanvas.height = bH * bDPR;
      bctx.setTransform(bDPR, 0, 0, bDPR, 0, 0);
      if (bparticles.length === 0) {
        buildParticles();
      } else if (oldW > 0 && oldH > 0) {
        for (const p of bparticles) {
          p.startX = (p.startX / oldW) * bW;
          p.startY = (p.startY / oldH) * bH;
        }
      }
    }

    function btick(now) {
      if (!visible) {
        braf = requestAnimationFrame(btick);
        return;
      }
      if (startTime === 0) startTime = now;
      const elapsed = now - startTime;

      bctx.clearRect(0, 0, bW, bH);

      const cs = getComputedStyle(root);
      const fc = (cs.getPropertyValue("--buffalo-rgb").trim()
               || cs.getPropertyValue("--field-rgb").trim()
               || "244, 243, 239");

      const padding = 0.06;
      const availW = bW * (1 - 2 * padding);
      const availH = bH * (1 - 2 * padding);

      let drawW, drawH;
      if (availW / availH > buffaloAspect) {
        drawH = availH;
        drawW = drawH * buffaloAspect;
      } else {
        drawW = availW;
        drawH = drawW / buffaloAspect;
      }
      const offsetX = (bW - drawW) / 2;
      const offsetY = (bH - drawH) / 2;

      for (const p of bparticles) {
        const t = Math.max(0, Math.min(1, (elapsed - p.delay) / 1800));
        const ease = 1 - Math.pow(1 - t, 3);
        const wobbleX = Math.sin(now * 0.0009 + p.phase) * 1.5;
        const wobbleY = Math.cos(now * 0.0011 + p.phase * 1.3) * 1.5;
        const tx = offsetX + p.u * drawW + wobbleX;
        const ty = offsetY + p.v * drawH + wobbleY;
        p.x = p.startX * (1 - ease) + tx * ease;
        p.y = p.startY * (1 - ease) + ty * ease;
      }

      // Connections — short-range neighbors only, draws the buffalo as mesh
      const CONN = 16;
      const CONN2 = CONN * CONN;
      bctx.lineWidth = 0.55;
      for (let i = 0; i < bparticles.length; i++) {
        const p = bparticles[i];
        const ti = Math.max(0, Math.min(1, (elapsed - p.delay) / 1800));
        const fi = 1 - Math.pow(1 - ti, 3);
        if (fi < 0.35) continue;
        for (let j = i + 1; j < bparticles.length; j++) {
          const q = bparticles[j];
          const tj = Math.max(0, Math.min(1, (elapsed - q.delay) / 1800));
          const fj = 1 - Math.pow(1 - tj, 3);
          if (fj < 0.35) continue;
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > CONN2 || d2 < 0.5) continue;
          const a = (1 - Math.sqrt(d2) / CONN) * 0.22 * fi * fj;
          bctx.strokeStyle = "rgba(" + fc + ", " + a + ")";
          bctx.beginPath();
          bctx.moveTo(p.x, p.y);
          bctx.lineTo(q.x, q.y);
          bctx.stroke();
        }
      }

      // Particles
      for (const p of bparticles) {
        const t = Math.max(0, Math.min(1, (elapsed - p.delay) / 1800));
        const fade = 1 - Math.pow(1 - t, 3);
        const alpha = (0.45 + fade * 0.45);
        bctx.fillStyle = "rgba(" + fc + ", " + alpha + ")";
        bctx.beginPath();
        bctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        bctx.fill();
      }

      braf = requestAnimationFrame(btick);
    }

    buildTargets();
    bResize();

    const section = bcanvas.closest(".reveal");
    if (section) {
      const obs = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            visible = true;
            startTime = 0;
            obs.unobserve(e.target);
          }
        }
      }, { threshold: 0.15 });
      obs.observe(section);
    } else {
      visible = true;
    }

    let bResizeTO;
    window.addEventListener("resize", () => {
      clearTimeout(bResizeTO);
      bResizeTO = setTimeout(bResize, 140);
    });

    braf = requestAnimationFrame(btick);
  }
})();
