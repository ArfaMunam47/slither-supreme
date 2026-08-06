// ─────────────────────────────────────────────────────────────
// SlitherSupreme — Entry point
// Wires up the game and bootstraps the animated background.
// ─────────────────────────────────────────────────────────────

// Boot floating particle background (CSS handles aurora waves).
function initBackgroundParticles() {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let width = window.innerWidth;
  let height = window.innerHeight;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  const COLORS = ["#7ff3ff", "#ffd166", "#ff7bd5", "#a78bfa", "#7fff9e", "#ff8c66"];
  const particles = [];
  const COUNT = Math.min(70, Math.floor(width / 18));

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1 + Math.random() * 3,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.2 - Math.random() * 0.5,
      tw: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  }

  let raf;
  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.tw += 0.03;
      if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      const alpha = 0.35 + Math.abs(Math.sin(p.tw)) * 0.5;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    raf = requestAnimationFrame(draw);
  }
  draw();
}

// Boot the game once the DOM is ready.
window.addEventListener("DOMContentLoaded", () => {
  initBackgroundParticles();
  window.__game = new SnakeGame();
});
