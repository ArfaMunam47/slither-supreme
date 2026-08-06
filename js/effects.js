// ─────────────────────────────────────────────────────────────
// SlitherSupreme — Visual effects engine
// Particle system, screen shake, floating text, fireworks,
// glow pulses. All overlay-draw friendly for the canvas.
// ─────────────────────────────────────────────────────────────

import { EFFECTS } from "./config.js";
import { rand, randInt, clamp, lerp } from "./utils.js";

export class Effects {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.shake = { active: false, start: 0, duration: 300, maxOffset: 8 };
    this.pulses = [];
  }

  clear() {
    this.particles = [];
    this.floatingTexts = [];
    this.pulses = [];
    this.shake.active = false;
  }

  // ── Screen shake ───────────────────────────────────────────
  shakeScreen(duration = EFFECTS.screenShakeDuration, maxOffset = EFFECTS.screenShakeMaxOffset) {
    this.shake = {
      active: true,
      start: performance.now(),
      duration,
      maxOffset,
    };
  }

  getShakeOffset() {
    if (!this.shake.active) return { x: 0, y: 0 };
    const t = (performance.now() - this.shake.start) / this.shake.duration;
    if (t >= 1) {
      this.shake.active = false;
      return { x: 0, y: 0 };
    }
    const decay = 1 - t;
    const a = t * 40;
    return {
      x: Math.sin(a) * this.shake.maxOffset * decay,
      y: Math.cos(a * 1.3) * this.shake.maxOffset * decay,
    };
  }

  // ── Particle bursts ────────────────────────────────────────
  burst(x, y, count, colors, opts = {}) {
    const { speed = 3, size = 3, life = 0.06, gravity = 0 } = opts;
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const spd = rand(0.4, 1) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 1,
        decay: rand(0.02, 0.05),
        size: rand(size * 0.5, size * 1.4),
        color: colors[randInt(0, colors.length - 1)],
        gravity,
        shape: opts.shape || "circle",
      });
    }
    this._trim();
  }

  confetti(x, y, colors, count = 30) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + rand(-20, 20),
        y: y + rand(-10, 10),
        vx: rand(-2, 2),
        vy: rand(-4, -1),
        life: 1,
        decay: rand(0.008, 0.02),
        size: rand(3, 6),
        color: colors[randInt(0, colors.length - 1)],
        gravity: 0.1,
        shape: rand(0, 1) > 0.5 ? "rect" : "circle",
        rot: rand(0, Math.PI * 2),
        vrot: rand(-0.2, 0.2),
      });
    }
    this._trim();
  }

  firework(x, y, colors) {
    this.burst(x, y, 26, colors, { speed: 4, size: 3.5, life: 0.05, shape: "star" });
    this.pulses.push({ x, y, r: 0, maxR: 40, life: 1, color: colors[0] });
  }

  spawnSparkle(x, y, color) {
    this.particles.push({
      x, y, vx: 0, vy: -0.4,
      life: 1, decay: 0.03, size: 2.5, color,
      shape: "sparkle",
    });
  }

  // ── Floating score text ────────────────────────────────────
  floatText(x, y, text, color = "#ffffff", size = 18) {
    this.floatingTexts.push({
      x, y, text, color, size,
      life: 1,
      start: performance.now(),
      duration: EFFECTS.floatTextDuration || 900,
      vy: -1.2,
    });
  }

  // ── Update & draw ──────────────────────────────────────────
  update() {
    const now = performance.now();

    this.particles = this.particles.filter((p) => {
      p.life -= p.decay;
      if (p.life <= 0) return false;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0;
      if (p.rot !== undefined) p.rot += p.vrot;
      return true;
    });

    this.floatingTexts = this.floatingTexts.filter((f) => {
      f.life = 1 - (now - f.start) / f.duration;
      if (f.life <= 0) return false;
      f.y += f.vy;
      return true;
    });

    this.pulses = this.pulses.filter((p) => {
      p.life -= 0.04;
      p.r += 2.5;
      return p.life > 0;
    });

    this._trim();
  }

  _trim() {
    if (this.particles.length > EFFECTS.maxParticles) {
      this.particles.splice(0, this.particles.length - EFFECTS.maxParticles);
    }
    if (this.floatingTexts.length > 12) this.floatingTexts.shift();
    if (this.pulses.length > 8) this.pulses.shift();
  }

  draw(ctx) {
    // pulses (expanding rings)
    this.pulses.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.life * 0.6;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.translate(p.x, p.y);
      if (p.rot) ctx.rotate(p.rot);

      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
      } else if (p.shape === "star") {
        this._drawStar(ctx, p.size);
      } else if (p.shape === "sparkle") {
        this._drawSparkle(ctx, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // floating text
    for (const f of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = clamp(f.life * 1.2, 0, 1);
      ctx.font = `800 ${f.size}px Outfit, sans-serif`;
      ctx.textAlign = "center";
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 18;
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }

  _drawStar(ctx, size) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outer = size;
      const inner = size * 0.45;
      const a = (i * 72 - 90) * (Math.PI / 180);
      const a2 = (i * 72 - 90 + 36) * (Math.PI / 180);
      ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
      ctx.lineTo(Math.cos(a2) * inner, Math.sin(a2) * inner);
    }
    ctx.closePath();
    ctx.fill();
  }

  _drawSparkle(ctx, size) {
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(0, 0, size, 0);
    ctx.quadraticCurveTo(0, 0, 0, size);
    ctx.quadraticCurveTo(0, 0, -size, 0);
    ctx.quadraticCurveTo(0, 0, 0, -size);
    ctx.fill();
  }
}
