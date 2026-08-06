// ─────────────────────────────────────────────────────────────
// SlitherSupreme — Global Configuration
// Central place for all tunable game constants & definitions.
// ─────────────────────────────────────────────────────────────

export const GRID_SIZE = 20;
export const BASE_TICK_MS = 135;
export const MAX_CELL_SIZE = 24;
export const MIN_CELL_SIZE = 14;

export const GAME_STATUS = {
  READY: "ready",
  PLAYING: "playing",
  PAUSED: "paused",
  GAME_OVER: "gameover",
  VICTORY: "victory",
};

export const DIRECTION_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const OPPOSITE = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export const KEY_DIRECTIONS = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  W: "up",
  s: "down",
  S: "down",
  a: "left",
  A: "left",
  d: "right",
  D: "right",
};

// ── Storage keys ─────────────────────────────────────────────
export const STORAGE = {
  highScore: "slitherHighScore",
  xp: "slitherXP",
  dayBest: "slitherDayBest",
  settings: "slitherSettings",
  unlocks: "slitherUnlocks",
  achievements: "slitherAchievements",
};

// ── Food types ───────────────────────────────────────────────
export const FOOD_TYPES = {
  crystal: {
    id: "crystal",
    name: "Crystal",
    icon: "า",
    color: "#7ff3ff",
    glow: "rgba(127,243,255,0.8)",
    points: 1,
    weight: 55,
    spawnChance: 0.55,
  },
  star: {
    id: "star",
    name: "Star",
    icon: "⭐",
    color: "#ffd166",
    glow: "rgba(255,209,102,0.85)",
    points: 2,
    weight: 20,
    spawnChance: 0.2,
  },
  diamond: {
    id: "diamond",
    name: "Diamond",
    icon: "💎",
    color: "#c7a6ff",
    glow: "rgba(199,166,255,0.85)",
    points: 3,
    weight: 15,
    spawnChance: 0.15,
  },
  fruit: {
    id: "fruit",
    name: "Magic Fruit",
    icon: "🍇",
    color: "#ff7bd5",
    glow: "rgba(255,123,213,0.85)",
    points: 5,
    weight: 10,
    spawnChance: 0.1,
  },
};

// ── Power-ups ────────────────────────────────────────────────
export const POWERUPS = {
  speed: {
    id: "speed",
    name: "Speed Boost",
    icon: "⚡",
    color: "#ffd166",
    glow: "rgba(255,209,102,0.8)",
    durationMs: 6000,
    desc: "Move 40% faster",
  },
  slowmo: {
    id: "slowmo",
    name: "Slow Motion",
    icon: "🐌",
    color: "#7ff3ff",
    glow: "rgba(127,243,255,0.8)",
    durationMs: 5000,
    desc: "Time slows down",
  },
  double: {
    id: "double",
    name: "Double Score",
    icon: "✖2",
    color: "#ff9de2",
    glow: "rgba(255,157,226,0.8)",
    durationMs: 8000,
    desc: "Score ×2",
  },
  magnet: {
    id: "magnet",
    name: "Magnet",
    icon: "🧲",
    color: "#ff8c66",
    glow: "rgba(255,140,102,0.8)",
    durationMs: 7000,
    desc: "Attract nearby food",
  },
  ghost: {
    id: "ghost",
    name: "Ghost Mode",
    icon: "👻",
    color: "#c7a6ff",
    glow: "rgba(199,166,255,0.8)",
    durationMs: 6000,
    desc: "Pass through yourself",
  },
  shield: {
    id: "shield",
    name: "Shield",
    icon: "🛡",
    color: "#7fff9e",
    glow: "rgba(127,255,158,0.8)",
    durationMs: 8000,
    desc: "Survive one collision",
  },
};

export const POWERUP_WEIGHTS = {
  speed: 18,
  slowmo: 14,
  double: 16,
  magnet: 14,
  ghost: 12,
  shield: 26,
};

export const POWERUP_SPAWN_START_SCORE = 5;
export const POWERUP_SPAWN_INTERVAL_SCORE = 7;
export const POWERUP_MAX_ACTIVE = 2;

// ── Snake skins ──────────────────────────────────────────────
export const SNAKE_SKINS = {
  aurora: {
    id: "aurora",
    name: "Aurora",
    price: 0,
    gradient: ["#00c8ff", "#7ff3ff", "#a78bfa", "#ff7bd5"],
    head: "#ffffff",
    glow: "rgba(127,243,255,0.75)",
  },
  sunset: {
    id: "sunset",
    name: "Sunset",
    price: 300,
    gradient: ["#ff8c42", "#ff5e62", "#ff2e97"],
    head: "#fff3e0",
    glow: "rgba(255,94,98,0.75)",
  },
  emerald: {
    id: "emerald",
    name: "Emerald",
    price: 500,
    gradient: ["#00f5a0", "#00d9f5"],
    head: "#eafff5",
    glow: "rgba(0,245,160,0.75)",
  },
  gold: {
    id: "gold",
    name: "Royal Gold",
    price: 900,
    gradient: ["#ffd166", "#ff9e00", "#ff6b00"],
    head: "#ffffff",
    glow: "rgba(255,209,102,0.85)",
  },
};

// ── Board themes ─────────────────────────────────────────────
export const BOARD_THEMES = {
  candy: {
    id: "candy",
    name: "Candy Cloud",
    price: 0,
    bgTop: "#381a66",
    bgMid: "#5b2a86",
    bgBottom: "#2a1a4a",
    grid: "rgba(255,255,255,0.06)",
    accent: "#ff7bd5",
  },
  sunset: {
    id: "sunset",
    name: "Sunset Reef",
    price: 400,
    bgTop: "#ff9e6d",
    bgMid: "#b84a8b",
    bgBottom: "#3a1a5e",
    grid: "rgba(255,255,255,0.07)",
    accent: "#ffd166",
  },
  ocean: {
    id: "ocean",
    name: "Ocean Depth",
    price: 600,
    bgTop: "#0a3d62",
    bgMid: "#1c6ea4",
    bgBottom: "#082032",
    grid: "rgba(255,255,255,0.06)",
    accent: "#7ff3ff",
  },
  midnight: {
    id: "midnight",
    name: "Midnight Galaxy",
    price: 800,
    bgTop: "#0f0c29",
    bgMid: "#302b63",
    bgBottom: "#24243e",
    grid: "rgba(199,166,255,0.07)",
    accent: "#c7a6ff",
  },
};

// ── Difficulty presets ───────────────────────────────────────
export const DIFFICULTIES = {
  casual: {
    id: "casual",
    name: "Casual",
    icon: "🌱",
    tickMs: 165,
    speedMult: 1,
    scoreMult: 1,
    desc: "Relaxed speed, easy start",
  },
  classic: {
    id: "classic",
    name: "Classic",
    icon: "🎮",
    tickMs: 135,
    speedMult: 1,
    scoreMult: 1,
    desc: "The balanced original",
  },
  speedy: {
    id: "speedy",
    name: "Speedy",
    icon: "⚡",
    tickMs: 105,
    speedMult: 1,
    scoreMult: 1.25,
    desc: "Fast snake, +25% score",
  },
  extreme: {
    id: "extreme",
    name: "Extreme",
    icon: "🔥",
    tickMs: 80,
    speedMult: 1,
    scoreMult: 1.5,
    desc: "Blazing fast, +50% score",
  },
};

// ── XP / Levels ──────────────────────────────────────────────
export const XP_PER_LEVEL = 100;
export const XP_GAINS = {
  eat: 2,
  eatGold: 5,
  powerup: 10,
  achievement: 25,
  gameWin: 50,
  newRecord: 40,
};

// ── Achievements ─────────────────────────────────────────────
export const ACHIEVEMENTS = {
  first_blood: { id: "first_blood", name: "First Bite", icon: "🍎", desc: "Eat your first food", xp: 15 },
  score_10: { id: "score_10", name: "Double Digits", icon: "🔟", desc: "Reach a score of 10", xp: 20 },
  score_25: { id: "score_25", name: "Snake on Fire", icon: "🔥", desc: "Reach a score of 25", xp: 35 },
  score_50: { id: "score_50", name: "Legend Slither", icon: "🏆", desc: "Reach a score of 50", xp: 60 },
  powerup_first: { id: "powerup_first", name: "Power Seeker", icon: "⚡", desc: "Collect your first power-up", xp: 20 },
  ghost_use: { id: "ghost_use", name: "Phantom", icon: "👻", desc: "Survive using Ghost Mode", xp: 25 },
  shield_save: { id: "shield_save", name: "Unbreakable", icon: "🛡", desc: "Shield saves you from a crash", xp: 30 },
  combo_5: { id: "combo_5", name: "Combo Starter", icon: "💫", desc: "Reach a 5× combo", xp: 25 },
  combo_10: { id: "combo_10", name: "Combo Master", icon: "✨", desc: "Reach a 10× combo", xp: 50 },
  collector: { id: "collector", name: "Magnet User", icon: "🧲", desc: "Collect food with Magnet", xp: 20 },
  all_food: { id: "all_food", name: "Gourmet", icon: "🍇", desc: "Eat every food type in one run", xp: 40 },
  speed_use: { id: "speed_use", name: "Speedster", icon: "⚡", desc: "Use a Speed Boost", xp: 20 },
  slowmo_use: { id: "slowmo_use", name: "Time Bender", icon: "🐌", desc: "Use Slow Motion", xp: 20 },
  double_use: { id: "double_use", name: "Double Trouble", icon: "✖2", desc: "Use Double Score", xp: 20 },
  win_game: { id: "win_game", name: "Grid Master", icon: "👑", desc: "Fill the entire board", xp: 100 },
};

// ── Effects tuning ───────────────────────────────────────────
export const EFFECTS = {
  screenShakeDuration: 350,
  screenShakeMaxOffset: 10,
  fireworkCount: 40,
  eatParticles: 14,
  floatTextDuration: 900,
  maxParticles: 260,
};

// Level-up thresholds for combo
export const COMBO_WINDOW_MS = 2500;
export const COMBO_MAX_MULTIPLIER = 10;

// ── Overlay / menu content ───────────────────────────────────
export const OVERLAY_CONTENT = {
  ready: {
    icon: "🐍",
    title: "Ready to Slither",
    message: "Collect crystals, stars & magic fruit. Grab power-ups to go gold. Arrow keys or touch to move.",
    btnLabel: "Start Game",
    className: "overlay--ready",
  },
  paused: {
    icon: "⏸",
    title: "Game Paused",
    message: "Catch your breath — press Resume or Space to keep going.",
    btnLabel: "Resume",
    className: "overlay--paused",
  },
  gameover: {
    icon: "💥",
    title: "Game Over",
    message: "Your trail ends here. Think you can beat your best?",
    btnLabel: "Play Again",
    className: "overlay--gameover",
  },
  victory: {
    icon: "👑",
    title: "Victory!",
    message: "You conquered the entire grid. Absolute legend!",
    btnLabel: "Play Again",
    className: "overlay--victory",
  },
};
