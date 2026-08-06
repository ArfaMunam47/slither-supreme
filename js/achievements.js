// ─────────────────────────────────────────────────────────────
// SlitherSupreme — Achievement system
// Registry lookup, unlock checks, and XP rewards.
// ─────────────────────────────────────────────────────────────

class AchievementManager {
  constructor(onUnlock) {
    this.onUnlock = onUnlock; // callback (achievementDef, xpInfo) => void
    this._sessionUnlocks = [];
  }

  resetSession() {
    this._sessionUnlocks = [];
  }

  /** Try to unlock an achievement by id. Returns true if newly unlocked. */
  check(id) {
    if (isAchievementUnlocked(id)) return false;
    const def = ACHIEVEMENTS[id];
    if (!def) return false;

    if (unlockAchievement(id)) {
      this._sessionUnlocks.push(id);
      const xpInfo = addXP(XP_GAINS.achievement);
      if (this.onUnlock) this.onUnlock(def, xpInfo);
      return true;
    }
    return false;
  }

  /** Check a set/batch of achievements at once. */
  checkMany(ids) {
    const unlocked = [];
    ids.forEach((id) => {
      if (this.check(id)) unlocked.push(id);
    });
    return unlocked;
  }

  getProgress() {
    const all = Object.keys(ACHIEVEMENTS);
    const unlocked = getUnlockedAchievements();
    return { total: all.length, unlocked: unlocked.length };
  }

  getSessionXPGained() {
    return this._sessionUnlocks.length * XP_GAINS.achievement;
  }
}
