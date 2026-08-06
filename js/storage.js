// ─────────────────────────────────────────────────────────────
// SlitherSupreme — Persistence layer (localStorage)
// Handles high score, XP/level, unlocked items, settings,
// and achievement flags with safe try/catch wrappers.
// ─────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  sound: true,
  music: true,
  skin: "aurora",
  theme: "candy",
  difficulty: "classic",
};

const DEFAULTS = {
  highScore: 0,
  xp: 0,
  dayBest: 0,
  settings: DEFAULT_SETTINGS,
  unlocks: { skins: ["aurora"], themes: ["candy"] },
  achievements: [],
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ── High score ───────────────────────────────────────────────
function getHighScore() {
  return readJSON(STORAGE.highScore, DEFAULTS.highScore);
}

function saveHighScore(score) {
  const current = getHighScore();
  if (score > current) {
    writeJSON(STORAGE.highScore, score);
    return score;
  }
  return current;
}

// ── Day best ─────────────────────────────────────────────────
function getDayBest() {
  return readJSON(STORAGE.dayBest, DEFAULTS.dayBest);
}

function saveDayBest(score) {
  if (score > getDayBest()) {
    writeJSON(STORAGE.dayBest, score);
    return score;
  }
  return getDayBest();
}

// ── XP / Level ───────────────────────────────────────────────
function getXP() {
  return readJSON(STORAGE.xp, DEFAULTS.xp);
}

function addXP(amount) {
  const xp = Math.max(0, getXP() + Math.floor(amount));
  writeJSON(STORAGE.xp, xp);
  return getLevelInfo(xp);
}

function getLevelInfo(xp) {
  const level = Math.floor(xp / 100) + 1;
  const levelXp = xp % 100;
  return { level, levelXp, xp, nextLevelXp: 100 };
}

// ── Settings ─────────────────────────────────────────────────
function getSettings() {
  const saved = readJSON(STORAGE.settings, null);
  return { ...DEFAULT_SETTINGS, ...(saved || {}) };
}

function saveSettings(settings) {
  writeJSON(STORAGE.settings, settings);
}

// ── Unlocks (skins / themes) ─────────────────────────────────
function getUnlocks() {
  const saved = readJSON(STORAGE.unlocks, null);
  return {
    skins: saved?.skins || [...DEFAULTS.unlocks.skins],
    themes: saved?.themes || [...DEFAULTS.unlocks.themes],
  };
}

function unlockSkin(skinId) {
  const unlocks = getUnlocks();
  if (!unlocks.skins.includes(skinId)) {
    unlocks.skins.push(skinId);
    writeJSON(STORAGE.unlocks, unlocks);
  }
  return unlocks;
}

function unlockTheme(themeId) {
  const unlocks = getUnlocks();
  if (!unlocks.themes.includes(themeId)) {
    unlocks.themes.push(themeId);
    writeJSON(STORAGE.unlocks, unlocks);
  }
  return unlocks;
}

function isSkinUnlocked(skinId) {
  return getUnlocks().skins.includes(skinId);
}

function isThemeUnlocked(themeId) {
  return getUnlocks().themes.includes(themeId);
}

// ── Achievements ─────────────────────────────────────────────
function getUnlockedAchievements() {
  return readJSON(STORAGE.achievements, DEFAULTS.achievements);
}

function isAchievementUnlocked(id) {
  return getUnlockedAchievements().includes(id);
}

function unlockAchievement(id) {
  const list = getUnlockedAchievements();
  if (list.includes(id)) return false;
  list.push(id);
  writeJSON(STORAGE.achievements, list);
  return true;
}

// ── Validator helpers for UI ─────────────────────────────────
function getSkinDef(skinId) {
  return SNAKE_SKINS[skinId] || SNAKE_SKINS.aurora;
}

function getThemeDef(themeId) {
  return BOARD_THEMES[themeId] || BOARD_THEMES.candy;
}

function getDifficultyDef(difficultyId) {
  return DIFFICULTIES[difficultyId] || DIFFICULTIES.classic;
}

function getAchievementDefs() {
  return Object.values(ACHIEVEMENTS);
}
