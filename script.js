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
     Boot / typing sequence
  ================================================================ */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function typeInto(el, text, speed) {
    el.classList.add("is-typing");
    el.textContent = "";
    for (let i = 1; i <= text.length; i++) {
      el.textContent = text.slice(0, i);
      if (i < text.length) {
        // Slight jitter for an organic teletype feel
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
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.05, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  }

  async function bootSequence() {
    if (reduceMotion) {
      // Skip animation: render text instantly
      document.querySelectorAll(".boot-line, .display-line").forEach((el) => {
        el.textContent = el.dataset.text || "";
        if (el.classList.contains("is-prompt")) el.classList.add("is-done");
      });
      document.querySelector(".lede")?.classList.add("is-visible");
      startSectionObserver();
      return;
    }

    // Brief opening pause — like a cold boot
    await sleep(180);

    // Boot lines (sequential)
    for (const el of document.querySelectorAll(".boot-line")) {
      const text = el.dataset.text || "";
      const speed = parseInt(el.dataset.speed || "22", 10);
      await typeInto(el, text, speed);
      await sleep(110);
    }

    await sleep(260);

    // Display name
    for (const el of document.querySelectorAll(".display-line")) {
      const text = el.dataset.text || "";
      const speed = parseInt(el.dataset.speed || "75", 10);
      await typeInto(el, text, speed);
      await sleep(40);
    }

    await sleep(160);

    // Reveal lede
    document.querySelector(".lede")?.classList.add("is-visible");

    // Start observing sections (so they reveal as user scrolls / immediately if already in view)
    startSectionObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootSequence);
  } else {
    bootSequence();
  }

  /* ================================================================
     Particle constellation field
     - Slow flow-field drift in the background
     - Cursor exerts attractive + tangential force, scaled by cursor
       "energy" which ramps up on movement and decays when idle.
       So particles release & disperse instead of pooling.
  ================================================================ */
  if (reduceMotion) return;

  const canvas = document.getElementById("field");
  const ctx    = canvas.getContext("2d");

  let W, H, DPR;
  let particles = [];
  const PARTICLE_TARGET_DENSITY = 1 / 9000;
  const PARTICLE_MAX = 280;
  const CONN_DIST = 130;
  const CONN_DIST2 = CONN_DIST * CONN_DIST;
  const CELL = 130;

  // Cursor + energy
  let cx = -9999, cy = -9999;
  let lastMoveX = -9999, lastMoveY = -9999;
  let cursorEnergy = 0;
  const CURSOR_R = 220;
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

  function tick(now) {
    ctx.fillStyle = `rgba(${bgColor}, 0.10)`;
    ctx.fillRect(0, 0, W, H);

    // Cursor energy decays each frame — when idle, force fades to zero
    cursorEnergy *= 0.93;
    if (cursorEnergy < 0.001) cursorEnergy = 0;

    grid.clear();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (now < p.bornAt) continue;
      p.life = Math.min(1, (now - p.bornAt) / 900);

      // Slow drift via flow field
      const t = now * 0.00012;
      const ang = Math.sin(p.x * 0.0028 + t) + Math.cos(p.y * 0.0028 - t * 1.3);
      p.vx += Math.cos(ang) * 0.014;
      p.vy += Math.sin(ang) * 0.014;

      // Cursor force, only while energy > 0
      if (cursorEnergy > 0.01) {
        const dx = cx - p.x;
        const dy = cy - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < CURSOR_R2 && d2 > 1) {
          const d = Math.sqrt(d2);
          const f = (1 - d / CURSOR_R) * cursorEnergy * 0.55;
          // 40% attraction toward cursor + 60% tangential (orbit) = particles spiral in,
          // and when energy fades they peel off and drift away on the flow field.
          p.vx += ((dx / d) * 0.40 + (-dy / d) * 0.60) * f;
          p.vy += ((dy / d) * 0.40 + ( dx / d) * 0.60) * f;
        }
      }

      p.vx *= 0.955;
      p.vy *= 0.955;
      p.x  += p.vx;
      p.y  += p.vy;

      // Wrap
      if (p.x < -10) p.x = W + 10;
      else if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      else if (p.y > H + 10) p.y = -10;

      const gx = Math.floor(p.x / CELL);
      const gy = Math.floor(p.y / CELL);
      const key = gx * 73856093 ^ gy * 19349663;
      let cell = grid.get(key);
      if (!cell) { cell = []; grid.set(key, cell); }
      cell.push(p);
    }

    // Connection lines (spatial grid)
    ctx.lineWidth = 0.6;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.life <= 0) continue;

      const gx = Math.floor(p.x / CELL);
      const gy = Math.floor(p.y / CELL);

      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const cell = grid.get((gx + ox) * 73856093 ^ (gy + oy) * 19349663);
          if (!cell) continue;
          for (let k = 0; k < cell.length; k++) {
            const q = cell[k];
            if (q === p) continue;
            // De-duplicate pair: only draw once
            if (p.x > q.x || (p.x === q.x && p.y > q.y)) continue;

            const dx = p.x - q.x;
            const dy = p.y - q.y;
            const d2 = dx * dx + dy * dy;
            if (d2 > CONN_DIST2 || d2 < 1) continue;

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

    // Particles
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

  // Pointer events — track position AND ramp cursor energy by velocity
  document.addEventListener("pointermove", (e) => {
    const nx = e.clientX, ny = e.clientY;
    if (lastMoveX !== -9999) {
      const dx = nx - lastMoveX;
      const dy = ny - lastMoveY;
      const v = Math.sqrt(dx * dx + dy * dy);
      // Energy gain proportional to velocity. Capped at 1.
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
