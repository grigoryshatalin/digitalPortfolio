(function () {
  const root = document.documentElement;
  const btn = document.getElementById("themeToggle");

  // Theme init
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = saved || (prefersDark ? "dark" : "light");
  root.setAttribute("data-theme", initial);

  btn.addEventListener("click", function () {
    const current = root.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });

  // Entrance animations
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05 }
  );

  document.querySelectorAll(".animate-in").forEach((el) => observer.observe(el));

  // Particle constellation
  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");

  const PARTICLE_COUNT = 28;
  const CONNECT_DIST = 135;
  const REPEL_DIST = 95;

  let particles = [];
  let mouseX = -9999;
  let mouseY = -9999;

  function isDark() {
    return root.getAttribute("data-theme") === "dark";
  }

  function rgba(a) {
    return isDark()
      ? `rgba(245,244,244,${a})`
      : `rgba(10,10,10,${a})`;
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function makeParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.1 + 0.4,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, makeParticle);
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dark = isDark();
    const dotAlpha = dark ? 0.38 : 0.18;
    const lineAlphaMax = dark ? 0.16 : 0.07;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Mouse repulsion
      const dx = p.x - mouseX;
      const dy = p.y - mouseY;
      const d = Math.hypot(dx, dy);
      if (d < REPEL_DIST && d > 0) {
        const f = (1 - d / REPEL_DIST) * 0.09;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }

      // Dampen
      p.vx *= 0.97;
      p.vy *= 0.97;

      // Clamp speed
      const spd = Math.hypot(p.vx, p.vy);
      const MAX_SPEED = 1.0;
      if (spd > MAX_SPEED) {
        p.vx = (p.vx / spd) * MAX_SPEED;
        p.vy = (p.vy / spd) * MAX_SPEED;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Wrap edges
      if (p.x < -20) p.x = canvas.width + 20;
      else if (p.x > canvas.width + 20) p.x = -20;
      if (p.y < -20) p.y = canvas.height + 20;
      else if (p.y > canvas.height + 20) p.y = -20;

      // Draw dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(dotAlpha);
      ctx.fill();

      // Draw connections
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dist = Math.hypot(p.x - q.x, p.y - q.y);
        if (dist < CONNECT_DIST) {
          const a = lineAlphaMax * (1 - dist / CONNECT_DIST);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = rgba(a);
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
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

  init();
  tick();
})();
