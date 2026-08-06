// ─────────────────────────────────────────────────────────────
// SlitherSupreme — Canvas renderer
// 3D-styled snake, animated food, glass board, board themes,
// power-up auras, and particle overlays.
// ─────────────────────────────────────────────────────────────

import { GRID_SIZE, MAX_CELL_SIZE, MIN_CELL_SIZE, FOOD_TYPES, POWERUPS } from "./config.js";
import { setupCanvas, clamp, gradientAt, lerp, hexToRgba } from "./utils.js";
import { Effects } from "./effects.js";

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.cellSize = 20;
    this.effects = new Effects();
    this.trailParticles = [];
    this.theme = null;
    this.skin = null;
    this._resize();
    window.addEventListener("resize", () => this._resize());
  }

  setTheme(theme) {
    this.theme = theme;
  }

  setSkin(skin) {
    this.skin = skin;
  }

  _resize() {
    const available = Math.min(this.canvas.parentElement.clientWidth, 560);
    this.cellSize = Math.floor(
      Math.min(Math.max(available / GRID_SIZE, MIN_CELL_SIZE), MAX_CELL_SIZE)
    );
    const size = this.cellSize * GRID_SIZE;
    this.ctx = setupCanvas(this.canvas, size, size);
  }

  clear() {
    this.effects = new Effects();
    this.trailParticles = [];
  }

  // ── Board background ───────────────────────────────────────
  _drawBoard(now) {
    const { ctx, canvas } = this;
    const theme = this.theme || { bgTop: "#381a66", bgMid: "#5b2a86", bgBottom: "#2a1a4a", grid: "rgba(255,255,255,0.06)", accent: "#ff7bd5" };

    // Base vertical gradient
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, theme.bgTop);
    g.addColorStop(0.5, theme.bgMid);
    g.addColorStop(1, theme.bgBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Animated aurora blobs
    ctx.save();
    const t = now / 1000;
    const blobs = [
      { x: 0.2, y: 0.3, r: 0.5, c: theme.accent },
      { x: 0.8, y: 0.7, r: 0.45, c: "#7ff3ff" },
      { x: 0.5, y: 0.1, r: 0.4, c: "#ff7bd5" },
    ];
    blobs.forEach((b, i) => {
      const bx = (Math.sin(t * 0.4 + i * 2) * 0.15 + b.x) * canvas.width;
      const by = (Math.cos(t * 0.3 + i * 1.7) * 0.15 + b.y) * canvas.height;
      const r = b.r * canvas.width;
      const grad = ctx.createRadialGradient(bx, by, 0, bx, by, r);
      grad.addColorStop(0, hexToRgba(b.c, 0.22));
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(bx - r, by - r, r * 2, r * 2);
    });
    ctx.restore();

    // Grid
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      const pos = i * this.cellSize + 0.5;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(canvas.width, pos);
      ctx.stroke();
    }

    // Inner glow border
    ctx.save();
    const borderGlow = hexToRgba(theme.accent, 0.18);
    ctx.strokeStyle = borderGlow;
    ctx.lineWidth = 3;
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 18;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    ctx.restore();
  }

  // ── Snake ──────────────────────────────────────────────────
  _drawSnakeHead(x, y, direction, now) {
    const { ctx } = this;
    const size = this.cellSize;
    const cx = x + size / 2;
    const cy = y + size / 2;
    const bob = Math.sin(now / 200) * 0.8;
    const skin = this.skin || { gradient: ["#00c8ff", "#7ff3ff", "#a78bfa"], head: "#ffffff", glow: "rgba(127,243,255,0.75)" };

    // Glow halo
    ctx.save();
    ctx.shadowColor = skin.glow;
    ctx.shadowBlur = 22;
    const headGrad = ctx.createRadialGradient(cx, cy + bob, 0, cx, cy + bob, size * 0.6);
    headGrad.addColorStop(0, skin.head);
    headGrad.addColorStop(0.6, gradientAt(skin.gradient, 0));
    headGrad.addColorStop(1, hexToRgba(gradientAt(skin.gradient, 0), 0.1));
    ctx.fillStyle = headGrad;
    this._drawRoundedRect(ctx, x + 1.5, y + 1.5 + bob, size - 3, size - 3, size * 0.36);
    ctx.fill();
    ctx.restore();

    // Shine highlight
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.ellipse(cx - size * 0.12, cy + bob - size * 0.18, size * 0.16, size * 0.1, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Eyes
    const eyeOffset = size * 0.16;
    const dir = direction || "right";
    let ex1 = cx - eyeOffset;
    let ex2 = cx + eyeOffset;
    let ey = cy + bob - eyeOffset * 0.4;
    if (dir === "left") { ex1 -= 2; ex2 -= 2; }
    if (dir === "right") { ex1 += 2; ex2 += 2; }
    if (dir === "up") { ey -= 2; }
    if (dir === "down") { ey += 2; }

    ctx.fillStyle = "#0a0a1a";
    ctx.beginPath();
    ctx.arc(ex1, ey, size * 0.11, 0, Math.PI * 2);
    ctx.arc(ex2, ey, size * 0.11, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ex1 + 1, ey - 1.2, size * 0.035, 0, Math.PI * 2);
    ctx.arc(ex2 + 1, ey - 1.2, size * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawSnakeBody(segments, now) {
    const { ctx } = this;
    const size = this.cellSize;
    const skin = this.skin || { gradient: ["#00c8ff", "#7ff3ff", "#a78bfa"], head: "#ffffff", glow: "rgba(127,243,255,0.75)" };
    const len = segments.length;
    const t = now / 1000;

    // Draw body from tail to head so head overlaps
    for (let i = len - 1; i >= 1; i--) {
      const seg = segments[i];
      const px = seg.x * size;
      const py = seg.y * size;
      const gradT = i / Math.max(len, 1);
      const color = gradientAt(skin.gradient, gradT);

      // connection toward previous segment centroid
      const prev = segments[i - 1];
      const cx = (px + prev.x * size) / 2 + size / 2;
      const cy = (py + prev.y * size) / 2 + size / 2;

      ctx.save();
      const pulse = 0.9 + Math.sin(t * 6 + i * 0.5) * 0.06;
      ctx.shadowColor = skin.glow;
      ctx.shadowBlur = 10;
      const grad = ctx.createLinearGradient(px, py, px + size, py);
      grad.addColorStop(0, color);
      grad.addColorStop(1, gradientAt(skin.gradient, Math.min(gradT + 0.12, 1)));
      ctx.fillStyle = grad;
      ctx.strokeStyle = hexToRgba("#ffffff", 0.18);
      ctx.lineWidth = 1.2;

      const r = size * 0.30;
      ctx.beginPath();
      this._drawRoundedRect(ctx, px + 1.5, py + 1.5, size - 3, size - 3, r);
      ctx.fill();
      if (i % 3 === 0) ctx.stroke();
      ctx.restore();

      // body shine
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.beginPath();
      ctx.ellipse(px + size * 0.3, py + size * 0.28, size * 0.14, size * 0.07, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawSnake(segments, direction, now, ghost) {
    if (segments.length === 0) return;
    const { ctx } = this;
    ctx.save();
    if (ghost) ctx.globalAlpha = 0.55;
    this._drawSnakeBody(segments, now);
    const head = segments[0];
    this._drawSnakeHead(head.x * this.cellSize, head.y * this.cellSize, direction, now);
    ctx.restore();
  }

  // ── Food (varied by type) ──────────────────────────────────
  _drawFood(food, now) {
    if (!food) return;
    const type = FOOD_TYPES[food.type] || FOOD_TYPES.crystal;
    const cx = food.x * this.cellSize + this.cellSize / 2;
    const cy = food.y * this.cellSize + this.cellSize / 2;
    const s = this.cellSize;
    const t = now / 1000;

// Static rotating sparkles around (drawn, not spawned as particles)
    const sparkleCount = food.type === "diamond" || food.type === "fruit" ? 3 : 2;
    for (let i = 0; i < sparkleCount; i++) {
      const a = t * 2 + (i * Math.PI * 2) / sparkleCount;
      const rx = cx + Math.cos(a) * s * 0.42;
      const ry = cy + Math.sin(a) * s * 0.42;
      const tw = 0.5 + Math.sin(t * 5 + i) * 0.5;
      this.ctx.save();
      this.ctx.globalAlpha = tw;
      this.ctx.fillStyle = "#ffffff";
      this.ctx.shadowColor = type.glow;
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(rx, ry, 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    const pulse = 0.85 + Math.sin(t * 4) * 0.15;
    const bob = Math.sin(t * 3) * 1.5;

    this._drawFoodShape(cx, cy + bob, s * pulse, type, now);
  }

  _drawFoodShape(cx, cy, size, type, now) {
    const { ctx } = this;
    ctx.save();
    ctx.shadowColor = type.glow;
    ctx.shadowBlur = 20;

    if (type.id === "star" || type.id === "fruit") {
      // Star shape
      ctx.fillStyle = type.color;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const outer = size / 2;
        const inner = outer * 0.45;
        const a = (i * 72 - 90) * (Math.PI / 180);
        const a2 = (i * 72 - 90 + 36) * (Math.PI / 180);
        ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
        ctx.lineTo(cx + Math.cos(a2) * inner, cy + Math.sin(a2) * inner);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return;
    }

    if (type.id === "diamond") {
      // Rotating diamond
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(now / 900);
      ctx.fillStyle = type.color;
      ctx.shadowColor = type.glow;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      const r = size / 2;
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.7, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.7, 0);
      ctx.closePath();
      ctx.fill();
      // facet
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.7, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return;
    }

    // Crystal (default) — radial orb
    const r = size / 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.3, type.color);
    grad.addColorStop(1, hexToRgba(type.color, 0.15));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // highlight
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Power-up on board ──────────────────────────────────────
  _drawPowerup(powerup, now) {
    if (!powerup) return;
    const def = POWERUPS[powerup.type];
    if (!def) return;
    const cx = powerup.x * this.cellSize + this.cellSize / 2;
    const cy = powerup.y * this.cellSize + this.cellSize / 2;
    const t = now / 1000;
    const bob = Math.sin(t * 3) * 2;
    const pulse = 0.9 + Math.sin(t * 5) * 0.1;

    const { ctx } = this;
    ctx.save();
    ctx.shadowColor = def.glow;
    ctx.shadowBlur = 22 * pulse;

    // pulsing ring
    ctx.strokeStyle = def.glow;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy + bob, this.cellSize * 0.4 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // badge
    const grad = ctx.createRadialGradient(cx, cy + bob, 0, cx, cy + bob, this.cellSize * 0.34);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.4, def.color);
    grad.addColorStop(1, hexToRgba(def.color, 0.2));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy + bob, this.cellSize * 0.34 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // icon
    ctx.save();
    ctx.font = `${this.cellSize * 0.42}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = def.glow;
    ctx.shadowBlur = 12;
    ctx.fillText(def.icon, cx, cy + bob + 1);
    ctx.restore();
  }

  // ── Trail (speed boost) ────────────────────────────────────
  _spawnTrail(x, y) {
    this.trailParticles.push({
      x: x * this.cellSize + this.cellSize / 2 + (Math.random() - 0.5) * 4,
      y: y * this.cellSize + this.cellSize / 2 + (Math.random() - 0.5) * 4,
      life: 1,
      size: 2 + Math.random() * 4,
    });
    if (this.trailParticles.length > 60) this.trailParticles.shift();
  }

  _drawTrail() {
    const remaining = [];
    for (const p of this.trailParticles) {
      p.life -= 0.04;
      if (p.life <= 0) continue;
      remaining.push(p);
      this.ctx.save();
      this.ctx.globalAlpha = p.life * 0.6;
      this.ctx.fillStyle = "#ffd166";
      this.ctx.shadowColor = "#ffd166";
      this.ctx.shadowBlur = 12;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, Math.max(0.1, p.size * p.life), 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
    this.trailParticles = remaining;
  }

  // ── Public draw ────────────────────────────────────────────
  addEatEffect(x, y, color) {
    const cx = x * this.cellSize + this.cellSize / 2;
    const cy = y * this.cellSize + this.cellSize / 2;
    this.effects.burst(cx, cy, 14, [color, "#ffffff", "#ffd166"], { speed: 3.5, size: 3 });
    this.effects.pulses.push({ x: cx, y: cy, r: 4, maxR: 30, life: 1, color });
  }

  addPowerupEffect(x, y, color) {
    const cx = x * this.cellSize + this.cellSize / 2;
    const cy = y * this.cellSize + this.cellSize / 2;
    this.effects.burst(cx, cy, 22, [color, "#ffffff"], { speed: 4, size: 3.5 });
    this.effects.pulses.push({ x: cx, y: cy, r: 4, maxR: 36, life: 1, color });
  }

  floatText(x, y, text, color, size) {
    const px = x * this.cellSize + this.cellSize / 2;
    const py = y * this.cellSize + this.cellSize / 2;
    this.effects.floatText(px, py, text, color, size);
  }

  draw(state, previousSnake, progress, now, flags = {}) {
    const { ctx } = this;
    const shake = this.effects.getShakeOffset();

    ctx.save();
    ctx.translate(shake.x, shake.y);

    this._drawBoard(now);
    this._drawGridRounding();

    const interpolated = this._interpolateSnake(state.snake, previousSnake, progress);

    // trail for speed boost
    if (flags.speedBoost && interpolated.length > 0) {
      const tail = interpolated[interpolated.length - 1];
      this._spawnTrail(tail.x, tail.y);
      this._drawTrail();
    }

    this._drawSnake(interpolated, state.direction, now, flags.ghost);
    this._drawFood(state.food, now);
    this._drawPowerup(state.powerup, now);

    // magnet radius indicator
    if (flags.magnet) {
      const head = interpolated[0];
      const hx = head ? head.x * this.cellSize + this.cellSize / 2 : 0;
      const hy = head ? head.y * this.cellSize + this.cellSize / 2 : 0;
      ctx.save();
      ctx.strokeStyle = "rgba(255,140,102,0.35)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(hx, hy, this.cellSize * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    this.effects.update();
    this.effects.draw(ctx);

    ctx.restore();
  }

  _drawRoundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  _drawGridRounding() {
    // subtle inner vignette for depth
    const { ctx, canvas } = this;
    const grad = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
      canvas.width / 2, canvas.height / 2, canvas.width * 0.72
    );
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  _interpolateSnake(current, previous, progress) {
    if (!previous?.length) {
      return current.map((seg) => ({ x: seg.x, y: seg.y }));
    }
    const t = clamp(progress, 0, 1);
    return current.map((seg, i) => {
      const prev = previous[i] ?? previous[previous.length - 1] ?? seg;
      return {
        x: lerp(prev.x, seg.x, t),
        y: lerp(prev.y, seg.y, t),
      };
    });
  }
}
