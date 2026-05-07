(function () {
  // Theme
  const root = document.documentElement;
  const btn = document.getElementById("themeToggle");
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.setAttribute("data-theme", saved || (prefersDark ? "dark" : "light"));
  btn.addEventListener("click", function () {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });

  // Entrance animations
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          observer.unobserve(e.target);
        }
      }),
    { threshold: 0.05 }
  );
  document.querySelectorAll(".animate-in").forEach((el) => observer.observe(el));

  // Dot grid — cursor reveals hidden structure like a flashlight
  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");

  const SPACING = 32;
  const REVEAL_R = 185;
  const R2 = REVEAL_R * REVEAL_R;
  const SIGMA_SQ = (REVEAL_R / 2.2) ** 2;
  const DECAY = 0.91;   // how fast dots fade after cursor leaves
  const RISE  = 0.18;   // how fast dots illuminate as cursor approaches

  let mouseX = -9999;
  let mouseY = -9999;
  let cols = 0;
  let rows = 0;
  let brightness; // Float32Array — current brightness per dot
  let dotR;       // Float32Array — slight random size per dot

  function isDark() {
    return root.getAttribute("data-theme") === "dark";
  }

  function setupGrid() {
    cols = Math.ceil(canvas.width  / SPACING) + 2;
    rows = Math.ceil(canvas.height / SPACING) + 2;
    const n = cols * rows;
    brightness = new Float32Array(n);
    dotR = new Float32Array(n);
    for (let k = 0; k < n; k++) dotR[k] = 0.8 + Math.random() * 0.55;
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    setupGrid();
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dark     = isDark();
    const rgb      = dark ? "245,244,244" : "10,10,10";
    const maxAlpha = dark ? 0.88 : 0.65;

    for (let i = 0; i < cols; i++) {
      const gx = i * SPACING;
      for (let j = 0; j < rows; j++) {
        const idx = i * rows + j;
        const gy  = j * SPACING;

        // Gaussian brightness target based on distance to cursor
        let target = 0;
        if (mouseX !== -9999) {
          const dx = gx - mouseX;
          const dy = gy - mouseY;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2) target = Math.exp(-d2 / (2 * SIGMA_SQ));
        }

        // Approach target: quick rise, slow decay
        let b = brightness[idx];
        b = target > b ? b + (target - b) * RISE : b * DECAY;
        brightness[idx] = b;

        if (b < 0.004) continue;

        ctx.beginPath();
        ctx.arc(gx, gy, dotR[idx], 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${b * maxAlpha})`;
        ctx.fill();
      }
    }

    requestAnimationFrame(tick);
  }

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener("mouseleave", () => {
    mouseX = -9999;
    mouseY = -9999;
  });

  window.addEventListener("resize", resize);

  resize();
  tick();
})();
