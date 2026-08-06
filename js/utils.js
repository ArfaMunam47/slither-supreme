// ─────────────────────────────────────────────────────────────
// SlitherSupreme — Utility helpers
// Pure functions, no side effects.
// ─────────────────────────────────────────────────────────────

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const lerp = (a, b, t) => a + (b - a) * t;

export const rand = (min, max) => Math.random() * (max - min) + min;

export const randInt = (min, max) => Math.floor(rand(min, max + 1));

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const dist = (ax, ay, bx, by) =>
  Math.hypot(bx - ax, by - ay);

/** Weighted random selection from { key: weight } map. Returns key or null. */
export function weightedPick(map) {
  const entries = Object.entries(map);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [key, w] of entries) {
    roll -= w;
    if (roll <= 0) return key;
  }
  return entries.length ? entries[0][0] : null;
}

/** Interpolate a single hex color to a css color string with alpha. */
export function hexToRgba(hex, alpha = 1) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Return a color from a gradient array at progress t (0..1). */
export function gradientAt(colors, t) {
  if (colors.length === 1) return colors[0];
  const clamped = clamp(t, 0, 0.999999);
  const pos = clamped * (colors.length - 1);
  const i = Math.floor(pos);
  const frac = pos - i;
  const c1 = parseHex(colors[i]);
  const c2 = parseHex(colors[i + 1]);
  const r = Math.round(lerp(c1.r, c2.r, frac));
  const g = Math.round(lerp(c1.g, c2.g, frac));
  const b = Math.round(lerp(c1.b, c2.b, frac));
  return `rgb(${r},${g},${b})`;
}

function parseHex(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

/** Lighten or darken a hex color by amount (-1..1). */
export function shade(hex, amount) {
  const { r, g, b } = parseHex(hex);
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  const nr = Math.round(lerp(r, t, p));
  const ng = Math.round(lerp(g, t, p));
  const nb = Math.round(lerp(b, t, p));
  return `rgb(${nr},${ng},${nb})`;
}

/** DOM helper — create element with class(es). */
export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Format a number with commas. */
export function formatNumber(n) {
  return Number(n).toLocaleString("en-US");
}

/** Create a throttled function. */
export function throttle(fn, wait) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn(...args);
    }
  };
}

/** Device pixel ratio aware canvas sizing. */
export function setupCanvas(canvas, width, height) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}
