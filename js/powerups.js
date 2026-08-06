// ─────────────────────────────────────────────────────────────
// SlitherSupreme — Power-up system
// Spawning, lifetime tracking, and effect management.
// ─────────────────────────────────────────────────────────────

import { POWERUPS, POWERUP_WEIGHTS, POWERUP_SPAWN_START_SCORE, POWERUP_SPAWN_INTERVAL_SCORE, POWERUP_MAX_ACTIVE } from "./config.js";
import { weightedPick } from "./utils.js";

export class PowerupManager {
  constructor(stateRef) {
    this.stateRef = stateRef;
    this.active = []; // { id, type, expiresAt }
    this.boardPowerup = null; // { x, y, type }
    this._lastSpawnScore = 0;
  }

  reset() {
    this.active = [];
    this.boardPowerup = null;
    this._lastSpawnScore = 0;
  }

isOnSnake(cell) {
    return this.stateRef().snake.some((s) => s.x === cell.x && s.y === cell.y);
  }

  isOnFood(cell) {
    const f = this.stateRef().food;
    return f && f.x === cell.x && f.y === cell.y;
  }

  isOnBoardPowerup(cell) {
    return this.boardPowerup && this.boardPowerup.x === cell.x && this.boardPowerup.y === cell.y;
  }

  /** Attempt to spawn a power-up on the board based on score milestones. */
  updateSpawn(score) {
    if (score < POWERUP_SPAWN_START_SCORE) return;
    if (this.boardPowerup) return;
    if (this.active.length >= POWERUP_MAX_ACTIVE) return;

    const milestone = Math.floor((score - POWERUP_SPAWN_START_SCORE) / POWERUP_SPAWN_INTERVAL_SCORE);
    if (milestone <= this._lastSpawnScore) return;

    this._lastSpawnScore = milestone;
    this.spawnAtRandom();
  }

  spawnAtRandom() {
    const type = weightedPick(POWERUP_WEIGHTS);
    if (!type) return;

    const maxCells = 20 * 20;
    let attempts = 0;
    let x, y;
    do {
      x = Math.floor(Math.random() * 20);
      y = Math.floor(Math.random() * 20);
      attempts++;
    } while (
      (this.isOnSnake({ x, y }) || this.isOnFood({ x, y })) &&
      attempts < maxCells
    );

    this.boardPowerup = { x, y, type };
  }

  collectAt(x, y) {
    if (!this.boardPowerup || this.boardPowerup.x !== x || this.boardPowerup.y !== y) {
      return null;
    }
    const type = this.boardPowerup.type;
    this.boardPowerup = null;
    return this.activate(type);
  }

  activate(type) {
    const def = POWERUPS[type];
    if (!def) return null;

    // Remove existing same-type power-up
    this.active = this.active.filter((a) => a.type !== type);

    const item = {
      id: `${type}_${Date.now()}`,
      type,
      expiresAt: performance.now() + def.durationMs,
    };
    this.active.push(item);
    return item;
  }

  /** Expire finished power-ups; returns list of ended types. */
  update(now) {
    const ended = [];
    this.active = this.active.filter((a) => {
      if (now >= a.expiresAt) {
        ended.push(a.type);
        return false;
      }
      return true;
    });
    return ended;
  }

  has(type) {
    return this.active.some((a) => a.type === type);
  }

  getSpeedMultiplier(base) {
    if (this.has("speed")) return base * 0.6; // 40% faster
    if (this.has("slowmo")) return base * 1.6; // slower
    return base;
  }

  getScoreMultiplier() {
    return this.has("double") ? 2 : 1;
  }

  /** Fractional remaining time for a type (0..1), used for UI chips. */
  remainingFraction(type, now) {
    const item = this.active.find((a) => a.type === type);
    if (!item) return 0;
    const def = POWERUPS[type];
    return Math.max(0, (item.expiresAt - now) / def.durationMs);
  }
}
