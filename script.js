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

  // Sand particle animation
  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");

  const N = 150;
  let particles = [];
  let mouseX = -9999;
  let mouseY = -9999;
  let mouseVX = 0;
  let mouseVY = 0;

  function isDark() {
    return root.getAttribute("data-theme") === "dark";
  }

  function sandColor(a) {
    return isDark()
      ? `rgba(210, 185, 135, ${a})`
      : `rgba(125, 100, 58, ${a})`;
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function makeParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.3 + 0.5,
      alpha: Math.random() * 0.35 + 0.1,
      alphaDir: Math.random() > 0.5 ? 1 : -1,
      alphaSpeed: Math.random() * 0.007 + 0.002,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: N }, makeParticle);
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Decay mouse velocity between frames
    mouseVX *= 0.78;
    mouseVY *= 0.78;

    const INFLUENCE = 105;
    const mouseSpeed = Math.hypot(mouseVX, mouseVY);

    for (const p of particles) {
      // Push particle in direction of mouse movement
      if (mouseX !== -9999) {
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const d = Math.hypot(dx, dy);
        if (d < INFLUENCE && d > 0 && mouseSpeed > 0.4) {
          const f = (1 - d / INFLUENCE) * 0.65;
          p.vx += (mouseVX / mouseSpeed) * f;
          p.vy += (mouseVY / mouseSpeed) * f;
        }
      }

      // Gentle random micro-drift + very slight gravity
      p.vx += (Math.random() - 0.5) * 0.014;
      p.vy += (Math.random() - 0.5) * 0.014 + 0.003;

      // Dampen
      p.vx *= 0.94;
      p.vy *= 0.94;

      // Clamp speed
      const spd = Math.hypot(p.vx, p.vy);
      const MAX = 2.8;
      if (spd > MAX) {
        p.vx = (p.vx / spd) * MAX;
        p.vy = (p.vy / spd) * MAX;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Wrap edges
      if (p.x < -4) p.x = canvas.width + 4;
      else if (p.x > canvas.width + 4) p.x = -4;
      if (p.y < -4) p.y = canvas.height + 4;
      else if (p.y > canvas.height + 4) p.y = -4;

      // Twinkle
      p.alpha += p.alphaDir * p.alphaSpeed;
      if (p.alpha > 0.52) { p.alpha = 0.52; p.alphaDir = -1; }
      if (p.alpha < 0.07) { p.alpha = 0.07; p.alphaDir = 1; }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = sandColor(p.alpha);
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  document.addEventListener("mousemove", (e) => {
    if (mouseX !== -9999) {
      mouseVX = e.clientX - mouseX;
      mouseVY = e.clientY - mouseY;
    }
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener("mouseleave", () => {
    mouseX = -9999;
    mouseY = -9999;
    mouseVX = 0;
    mouseVY = 0;
  });

  window.addEventListener("resize", resize);
  init();
  tick();
})();
