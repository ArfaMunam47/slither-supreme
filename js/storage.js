// ─────────────────────────────────────────────────────────────
// SlitherSupreme — Persistence layer (localStorage)
// Handles high score, XP/level, unlocked items, settings,
// and achievement flags with safe try/catch wrappers.
// ─────────────────────────────────────────────────────────────

import { STORAGE, SNAKE_SKINS, BOARD_THEMES, DIFFICULTIES, ACHIEVEMENTS } from "./config.js";

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
export function getHighScore() {
  return readJSON(STORAGE.highScore, DEFAULTS.highScore);
}

export function saveHighScore(score) {
  const current = getHighScore();
  if (score > current) {
    writeJSON(STORAGE.highScore, score);
    return score;
  }
  return current;
}

// ── Day best ─────────────────────────────────────────────────
export function getDayBest() {
  return readJSON(STORAGE.dayBest, DEFAULTS.dayBest);
}

export function saveDayBest(score) {
  if (score > getDayBest()) {
    writeJSON(STORAGE.dayBest, score);
    return score;
  }
  return getDayBest();
}

// ── XP / Level ───────────────────────────────────────────────
export function getXP() {
  return readJSON(STORAGE.xp, DEFAULTS.xp);
}

export function addXP(amount) {
  const xp = Math.max(0, getXP() + Math.floor(amount));
  writeJSON(STORAGE.xp, xp);
  return getLevelInfo(xp);
}

export function getLevelInfo(xp) {
  const level = Math.floor(xp / 100) + 1;
  const levelXp = xp % 100;
  return { level, levelXp, xp, nextLevelXp: 100 };
}

// ── Settings ─────────────────────────────────────────────────
export function getSettings() {
  const saved = readJSON(STORAGE.settings, null);
  return { ...DEFAULT_SETTINGS, ...(saved || {}) };
}

export function saveSettings(settings) {
  writeJSON(STORAGE.settings, settings);
}

// ── Unlocks (skins / themes) ─────────────────────────────────
export function getUnlocks() {
  const saved = readJSON(STORAGE.unlocks, null);
  return {
    skins: saved?.skins || [...DEFAULTS.unlocks.skins],
    themes: saved?.themes || [...DEFAULTS.unlocks.themes],
  };
}

export function unlockSkin(skinId) {
  const unlocks = getUnlocks();
  if (!unlocks.skins.includes(skinId)) {
    unlocks.skins.push(skinId);
    writeJSON(STORAGE.unlocks, unlocks);
  }
  return unlocks;
}

export function unlockTheme(themeId) {
  const unlocks = getUnlocks();
  if (!unlocks.themes.includes(themeId)) {
    unlocks.themes.push(themeId);
    writeJSON(STORAGE.unlocks, unlocks);
  }
  return unlocks;
}

export function isSkinUnlocked(skinId) {
  return getUnlocks().skins.includes(skinId);
}

export function isThemeUnlocked(themeId) {
  return getUnlocks().themes.includes(themeId);
}

// ── Achievements ─────────────────────────────────────────────
export function getUnlockedAchievements() {
  return readJSON(STORAGE.achievements, DEFAULTS.achievements);
}

export function isAchievementUnlocked(id) {
  return getUnlockedAchievements().includes(id);
}

export function unlockAchievement(id) {
  const list = getUnlockedAchievements();
  if (list.includes(id)) return false;
  list.push(id);
  writeJSON(STORAGE.achievements, list);
  return true;
}

// ── Validator helpers for UI ─────────────────────────────────
export function getSkinDef(skinId) {
  return SNAKE_SKINS[skinId] || SNAKE_SKINS.aurora;
}

export function getThemeDef(themeId) {
  return BOARD_THEMES[themeId] || BOARD_THEMES.candy;
}

export function getDifficultyDef(difficultyId) {
  return DIFFICULTIES[difficultyId] || DIFFICULTIES.classic;
}

export function getAchievementDefs() {
  return Object.values(ACHIEVEMENTS);
}
