// ─────────────────────────────────────────────────────────────
// SlitherSupreme — Game engine
// Orchestrates state, power-ups, achievements, XP, combo,
// difficulty, and all visual/audio feedback.
// ─────────────────────────────────────────────────────────────

import {
  GRID_SIZE, BASE_TICK_MS, GAME_STATUS, FOOD_TYPES, POWERUPS,
  XP_GAINS, COMBO_WINDOW_MS, COMBO_MAX_MULTIPLIER, SNAKE_SKINS, BOARD_THEMES,
} from "./config.js";
import { Renderer } from "./renderer.js";
import { UIController } from "./ui.js";
import { InputController } from "./input.js";
import { SoundManager } from "./sound.js";
import { PowerupManager } from "./powerups.js";
import { AchievementManager } from "./achievements.js";
import {
  getHighScore, saveHighScore, getSettings, saveSettings,
  getSkinDef, getThemeDef, getDifficultyDef,
  addXP, getLevelInfo, getXP, unlockSkin, unlockTheme,
  isSkinUnlocked, isThemeUnlocked, getDayBest, saveDayBest,
} from "./storage.js";
import { weightedPick, randInt } from "./utils.js";

export class SnakeGame {
  constructor() {
    const settings = getSettings();
    this.settings = settings;
    this.skin = getSkinDef(settings.skin);
    this.theme = getThemeDef(settings.theme);
    this.difficulty = getDifficultyDef(settings.difficulty);

    this.canvas = document.getElementById("gameCanvas");
    this.renderer = new Renderer(this.canvas);
    this.renderer.setTheme(this.theme);
    this.renderer.setSkin(this.skin);

    this.sound = new SoundManager();
    this.achievements = new AchievementManager((def, xpInfo) =>
      this._onAchievementUnlock(def, xpInfo)
    );

    this.ui = new UIController({
      start: () => this.start(),
      pause: () => this.togglePause(),
      restart: () => this.restartToMenu(),
      menu: () => this.openMenu(),
      setSkin: (id) => this.setSkin(id),
      setTheme: (id) => this.setTheme(id),
      setDifficulty: (id) => this.setDifficulty(id),
      toggleSound: () => this.toggleSound(),
      toggleMusic: () => this.toggleMusic(),
      buySkin: (id) => this.buySkin(id),
      buyTheme: (id) => this.buyTheme(id),
    });

    this.input = new InputController(
      (dir) => this.handleDirection(dir),
      () => this.onPauseKey(),
      (action) => this.onMenuKey(action)
    );

    this.powerups = new PowerupManager(this.stateRef());

    this.status = GAME_STATUS.READY;
    this.accumulator = 0;
    this.lastFrameTime = 0;
    this.previousSnake = null;
    this.combo = 0;
    this.lastComboTime = 0;
    this.eatenThisRun = new Set();
    this.shieldUsed = false;
    this.newRecordShown = false;

    this.state = this.createInitialState();
    this.spawnFood();
    this.bindUI();
    this.renderer.draw(this.state, null, 0, performance.now(), {});
    this.startLoop();
    this.ui.showMainMenu();
    this.ui.setSoundState(this.sound.sfxEnabled);
    this.ui.setMusicState(this.sound.musicEnabled);
  }

  stateRef() {
    return () => this.state;
  }

  createInitialState() {
    const center = Math.floor(GRID_SIZE / 2);
    return {
      snake: [{ x: center, y: center }],
      direction: "right",
      nextDirection: "right",
      food: null,
      powerup: null,
      score: 0,
    };
  }

  // ── Settings ───────────────────────────────────────────────
  setSkin(id) {
    if (!isSkinUnlocked(id)) return;
    this.settings.skin = id;
    this.skin = getSkinDef(id);
    saveSettings(this.settings);
    this.renderer.setSkin(this.skin);
    this.sound.play("click");
  }

  setTheme(id) {
    if (!isThemeUnlocked(id)) return;
    this.settings.theme = id;
    this.theme = getThemeDef(id);
    saveSettings(this.settings);
    this.renderer.setTheme(this.theme);
    this.sound.play("click");
  }

  setDifficulty(id) {
    this.settings.difficulty = id;
    this.difficulty = getDifficultyDef(id);
    saveSettings(this.settings);
    this.sound.play("click");
  }

  toggleSound() {
    const enabled = this.sound.toggleSfx();
    this.ui.setSoundState(enabled);
    if (enabled) this.sound.play("click");
  }

  toggleMusic() {
    const enabled = this.sound.toggleMusic();
    this.ui.setMusicState(enabled);
    if (enabled) this.sound.startMusic();
  }

buySkin(id) {
    const def = SNAKE_SKINS[id];
    if (!def || isSkinUnlocked(id)) return;
    const xp = getXP();
    if (xp >= def.price) {
      addXP(-def.price);
      unlockSkin(id);
      this.setSkin(id);
      this.ui.refreshHUD();
      this.ui._updateShop();
      this.sound.play("achievement");
      this.ui.showToast("Skin Unlocked!", `${def.name} is now yours.`, "🐍");
    } else {
      this.sound.play("pause");
      this.ui.showToast("Not enough XP", `Need ${def.price - xp} more XP.`, "💤");
    }
  }

buyTheme(id) {
    const def = BOARD_THEMES[id];
    if (!def || isThemeUnlocked(id)) return;
    const xp = getXP();
    if (xp >= def.price) {
      addXP(-def.price);
      unlockTheme(id);
      this.setTheme(id);
      this.ui.refreshHUD();
      this.ui._updateShop();
      this.sound.play("achievement");
      this.ui.showToast("Theme Unlocked!", `${def.name} is now yours.`, "🎨");
    } else {
      this.sound.play("pause");
      this.ui.showToast("Not enough XP", `Need ${def.price - xp} more XP.`, "💤");
    }
  }

  // ── UI binding ─────────────────────────────────────────────
  bindUI() {
    this.ui.els.startBtn.addEventListener("click", () => this.handlePrimaryAction());
    this.ui.els.overlayBtn.addEventListener("click", () => this.handlePrimaryAction());
    this.ui.els.pauseBtn.addEventListener("click", () => this.togglePause());
    this.ui.els.restartBtn.addEventListener("click", () => this.restartToMenu());
  }

  // ── Menu / input routing ───────────────────────────────────
  onPauseKey() {
    if (this.status === GAME_STATUS.PLAYING) this.togglePause();
    else if (this.status === GAME_STATUS.PAUSED) this.resume();
  }

  onMenuKey(action) {
    if (action === "confirm") {
      if (this.status === GAME_STATUS.READY && this.ui.els.mainMenu.classList.contains("menu--open")) {
        this.ui.hideMainMenu();
        this.start();
      } else if (this.status === GAME_STATUS.PAUSED) {
        this.resume();
      }
    } else if (action === "back") {
      if (this.status === GAME_STATUS.PLAYING) this.togglePause();
    } else if (action === "mute") {
      this.toggleSound();
    }
  }

  openMenu() {
    if (this.status === GAME_STATUS.PLAYING) this.togglePause();
    this.ui.showMainMenu();
  }

  handlePrimaryAction() {
    if (this.status === GAME_STATUS.PLAYING) return;
    if (this.status === GAME_STATUS.PAUSED) this.resume();
    else if (this.status === GAME_STATUS.GAME_OVER || this.status === GAME_STATUS.VICTORY) {
      this.reset();
      this.start();
    } else this.start();
  }

  // ── Collision helpers ──────────────────────────────────────
  isSamePosition(a, b) {
    return a && b && a.x === b.x && a.y === b.y;
  }

  isOnSnake(cell) {
    return this.state.snake.some((s) => s.x === cell.x && s.y === cell.y);
  }

  spawnFood() {
    const maxCells = GRID_SIZE * GRID_SIZE;
    if (this.state.snake.length >= maxCells) return;

    let cell;
    let attempts = 0;
    do {
      cell = {
        x: randInt(0, GRID_SIZE - 1),
        y: randInt(0, GRID_SIZE - 1),
      };
      attempts++;
    } while (
      (this.isOnSnake(cell) || this.powerups.isOnBoardPowerup(cell)) &&
      attempts < maxCells
    );

    const type = weightedPick({
      crystal: FOOD_TYPES.crystal.spawnChance,
      star: FOOD_TYPES.star.spawnChance,
      diamond: FOOD_TYPES.diamond.spawnChance,
      fruit: FOOD_TYPES.fruit.spawnChance,
    });
    this.state.food = { ...cell, type };
  }

  snapSnake() {
    return this.state.snake.map((s) => ({ x: s.x, y: s.y }));
  }

  extendSnapshotForGrowth(snapshot) {
    const tail = snapshot[snapshot.length - 1];
    snapshot.push({ x: tail.x, y: tail.y });
    return snapshot;
  }

  // ── Lifecycle ──────────────────────────────────────────────
  reset() {
    this.state = this.createInitialState();
    this.spawnFood();
    this.powerups.reset();
    this.previousSnake = null;
    this.accumulator = 0;
    this.lastFrameTime = 0;
    this.combo = 0;
    this.lastComboTime = 0;
    this.eatenThisRun = new Set();
    this.shieldUsed = false;
    this.newRecordShown = false;
    this.status = GAME_STATUS.READY;
    this.renderer.clear();
    this.ui.setScore(0);
    this.ui.setCombo(0);
    this.ui.setStatus(GAME_STATUS.READY);
    this.ui.updateButtons(GAME_STATUS.READY);
    this.ui.revealOverlay();
    this.ui.showOverlay("ready");
  }

  restartToMenu() {
    this.reset();
    this.ui.hideOverlay();
    this.ui.showMainMenu();
  }

  start() {
    this.status = GAME_STATUS.PLAYING;
    this.accumulator = 0;
    this.lastFrameTime = 0;
    this.previousSnake = this.snapSnake();
    this.sound.unlock();
    this.sound.startMusic();
    this.ui.hideOverlay();
    this.ui.hideMainMenu();
    this.ui.setStatus(GAME_STATUS.PLAYING);
    this.ui.updateButtons(GAME_STATUS.PLAYING);
    this.sound.play("start");
  }

  togglePause() {
    if (this.status === GAME_STATUS.PLAYING) {
      this.status = GAME_STATUS.PAUSED;
      this.ui.setStatus(GAME_STATUS.PAUSED);
      this.ui.updateButtons(GAME_STATUS.PAUSED);
      this.ui.revealOverlay();
      this.ui.showOverlay("paused");
      this.sound.play("pause");
    } else if (this.status === GAME_STATUS.PAUSED) {
      this.resume();
    }
  }

  resume() {
    this.status = GAME_STATUS.PLAYING;
    this.accumulator = 0;
    this.lastFrameTime = 0;
    this.previousSnake = this.snapSnake();
    this.ui.hideOverlay();
    this.ui.setStatus(GAME_STATUS.PLAYING);
    this.ui.updateButtons(GAME_STATUS.PLAYING);
    this.sound.play("start");
  }

  handleDirection(direction) {
    if (this.status !== GAME_STATUS.PLAYING) return;
    this.state.nextDirection = this.input.setDirection(
      this.state.nextDirection,
      direction
    );
  }

  getNewHead() {
    const head = this.state.snake[0];
    const newHead = { x: head.x, y: head.y };
    switch (this.state.direction) {
      case "up": newHead.y -= 1; break;
      case "down": newHead.y += 1; break;
      case "left": newHead.x -= 1; break;
      case "right": newHead.x += 1; break;
    }
    return newHead;
  }

  isWallCollision(head) {
    return head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE;
  }

  isSelfCollision(head, willEat) {
    if (this.powerups.has("ghost")) return false;
    const body = willEat ? this.state.snake : this.state.snake.slice(0, -1);
    return body.some((seg) => seg.x === head.x && seg.y === head.y);
  }

  // ── Main simulation step ───────────────────────────────────
  step(now) {
    this.state.direction = this.state.nextDirection;
    const newHead = this.getNewHead();

    // Magnet attraction: pull food toward head
    if (this.powerups.has("magnet") && this.state.food) {
      const dx = newHead.x - this.state.food.x;
      const dy = newHead.y - this.state.food.y;
      const d = Math.abs(dx) + Math.abs(dy);
      if (d <= 3 && d > 0) {
        let nx = this.state.food.x;
        let ny = this.state.food.y;
        if (dx > 0) nx += 1; else if (dx < 0) nx -= 1;
        if (dy > 0) ny += 1; else if (dy < 0) ny -= 1;
        if (!this.isOnSnake({ x: nx, y: ny })) {
          this.state.food.x = nx;
          this.state.food.y = ny;
        }
      }
    }

    const willEatFood = this.isSamePosition(newHead, this.state.food);
    const willCollectPowerup = this.powerups.isOnBoardPowerup(newHead);

    // Collision check
    if (this.isWallCollision(newHead)) {
      return this._handleCrash(newHead);
    }
    if (this.isSelfCollision(newHead, willEatFood)) {
      return this._handleCrash(newHead);
    }

    this.state.snake.unshift(newHead);

    // Collect power-up
    if (willCollectPowerup) {
      const item = this.powerups.collectAt(newHead.x, newHead.y);
      if (item) this._onPowerupCollected(item);
    }

    // Eat food
    if (willEatFood) {
      const eaten = { ...this.state.food };
      this.state.score += 1;
      this._onEat(eaten);
      this.powerups.updateSpawn(this.state.score);

      if (this.state.snake.length >= GRID_SIZE * GRID_SIZE) {
        this.endGame(GAME_STATUS.VICTORY);
        return false;
      }
      this.spawnFood();
    } else {
      this.state.snake.pop();
    }

    return true;
  }

  _handleCrash(newHead) {
    // Shield saves the snake once
    if (this.powerups.has("shield")) {
      this.state.snake.pop();
      const shieldItem = this.powerups.active.find((a) => a.type === "shield");
      if (shieldItem) this.powerups.active = this.powerups.active.filter((a) => a.type !== "shield");
      this.sound.play("shieldSave");
      this.ui.showToast("Shield Saved You!", "Your shield absorbed the crash.", "🛡");
      this.achievements.check("shield_save");
      this.renderer.effects.shakeScreen(250, 6);
      return true;
    }

    this.endGame(GAME_STATUS.GAME_OVER);
    return false;
  }

  _onEat(eaten) {
    const typeInfo = FOOD_TYPES[eaten.type];
    const points = typeInfo ? typeInfo.points : 1;
    const mult = this.powerups.getScoreMultiplier();
    const gained = points * mult;

    this.state.score += gained - 1; // +1 already added in step

    // Combo
    const now = performance.now();
    if (now - this.lastComboTime <= COMBO_WINDOW_MS) {
      this.combo = Math.min(COMBO_MAX_MULTIPLIER, this.combo + 1);
    } else {
      this.combo = 1;
    }
    this.lastComboTime = now;

    // Record eaten types
    this.eatenThisRun.add(eaten.type);

    // Effects
    const cx = eaten.x, cy = eaten.y;
    this.renderer.addEatEffect(cx, cy, typeInfo.color);
this.renderer.floatText(
      cx, cy,
      this.combo >= 2 ? `+${gained} ×${this.combo}` : `+${gained}`,
      typeInfo.color,
      typeInfo.points >= 3 ? 20 : 16
    );

    // Sound per food type
    const soundMap = { crystal: "eatCrystal", star: "eatStar", diamond: "eatDiamond", fruit: "eatFruit" };
    this.sound.play(soundMap[eaten.type] || "eatCrystal");
    if (mult > 1) this.sound.play("combo");

    // XP
    const xpGain = typeInfo.points >= 3 ? XP_GAINS.eatGold : XP_GAINS.eat;
    const xpInfo = addXP(xpGain);
    this.ui.refreshHUD();

    // Achievements
    this.achievements.check("first_blood");
    if (typeInfo.points >= 3) this.achievements.check("all_food");
    if (this.eatenThisRun.size >= Object.keys(FOOD_TYPES).length) {
      this._allFoodCheck();
    }

    // Score-based achievements
    if (this.state.score >= 10) this.achievements.check("score_10");
    if (this.state.score >= 25) this.achievements.check("score_25");
    if (this.state.score >= 50) this.achievements.check("score_50");
    if (this.combo >= 5) this.achievements.check("combo_5");
    if (this.combo >= 10) this.achievements.check("combo_10");

    // UI
    requestAnimationFrame(() => {
      this.ui.setScore(this.state.score);
      this.ui.setCombo(this.combo);
    });
  }

  _allFoodCheck() {
    const all = Object.keys(FOOD_TYPES);
    let hasAll = true;
    all.forEach((t) => { if (!this.eatenThisRun.has(t)) hasAll = false; });
    if (hasAll) this.achievements.check("all_food");
  }

  _onPowerupCollected(item) {
    const def = POWERUPS[item.type];
this.renderer.addPowerupEffect(this.state.snake[0].x, this.state.snake[0].y, def.color);
    this.sound.play("powerup");

    // XP + achievement
    addXP(XP_GAINS.powerup);
    this.ui.refreshHUD();
    this.achievements.check("powerup_first");
    const typeAchievements = {
      speed: "speed_use", slowmo: "slowmo_use", double: "double_use",
      magnet: "collector", ghost: "ghost_use", shield: "shield_use",
    };
    const ach = typeAchievements[item.type];
    if (ach) this.achievements.check(ach);

    this.ui.showToast(`Power-Up: ${def.name}`, def.desc, def.icon);
    this.ui.updatePowerChips(this.powerups.active, performance.now());
  }

  _onAchievementUnlock(def, xpInfo) {
    this.sound.play("achievement");
    this.ui.showToast(`Achievement: ${def.name}`, `${def.desc} · +${def.xp} XP`, def.icon);
    this.renderer.effects.confetti(
      this.canvas.width / 2, this.canvas.height / 2,
      ["#ffd166", "#ff7bd5", "#7ff3ff", "#a78bfa"],
      24
    );
    this.ui.refreshHUD();
  }

  // ── End game ───────────────────────────────────────────────
  endGame(status) {
    this.status = status;
    this.accumulator = 0;
    const isNewRecord = this.state.score > getHighScore();
    const best = saveHighScore(this.state.score);
    const dayBest = saveDayBest(this.state.score);
    this.ui.highScore = Math.max(best, getHighScore());
    this.ui.refreshHUD();

    // XP rewards
    let xpInfo = null;
    if (status === GAME_STATUS.VICTORY) {
      xpInfo = addXP(XP_GAINS.gameWin);
      this.achievements.check("win_game");
    }
    if (isNewRecord) {
      xpInfo = addXP(XP_GAINS.newRecord);
      this.newRecordShown = true;
    }
    if (xpInfo) this.ui.refreshHUD();

    this.ui.setStatus(status);
    this.ui.updateButtons(status);
    this.ui.revealOverlay();
    this.ui.showOverlay(status === GAME_STATUS.VICTORY ? "victory" : "gameover", {
      score: this.state.score,
      highScore: this.ui.highScore,
    });

    // Effects
    if (isNewRecord) {
      this.sound.play("newRecord");
      this.renderer.effects.shakeScreen(300, 6);
      setTimeout(() => {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            this.renderer.effects.firework(
              Math.random() * this.canvas.width,
              Math.random() * this.canvas.height * 0.6,
              ["#ffd166", "#ff7bd5", "#7ff3ff", "#a78bfa"]
            );
          }, i * 250);
        }
      }, 250);
      this.ui.showToast("New Record!", `You scored ${this.state.score}!`, "🏆");
    } else {
      this.sound.play(status === GAME_STATUS.VICTORY ? "victory" : "gameOver");
    }

    if (status === GAME_STATUS.GAME_OVER) {
      this.renderer.effects.shakeScreen(400, 12);
    }
  }

  // ── Game loop ──────────────────────────────────────────────
  startLoop() {
    const loop = (timestamp) => {
      if (!this.lastFrameTime) this.lastFrameTime = timestamp;
      const frameDelta = Math.min(timestamp - this.lastFrameTime, 250);
      this.lastFrameTime = timestamp;

      // Expire power-ups
      const ended = this.powerups.update(timestamp);
      if (ended.length) this.ui.updatePowerChips(this.powerups.active, timestamp);

      if (this.status === GAME_STATUS.PLAYING) {
        this.accumulator += frameDelta;
        const baseTick = this.difficulty.tickMs || BASE_TICK_MS;
        let tick = baseTick;
        if (this.powerups.has("speed")) tick *= 0.62;
        if (this.powerups.has("slowmo")) tick *= 1.6;

        while (this.accumulator >= tick) {
          let snapshot = this.snapSnake();
          const lengthBefore = this.state.snake.length;
          const stillPlaying = this.step(timestamp);

          if (this.state.snake.length > lengthBefore) {
            snapshot = this.extendSnapshotForGrowth(snapshot);
          }
          this.previousSnake = snapshot;
          this.accumulator -= tick;
          if (!stillPlaying || this.status !== GAME_STATUS.PLAYING) break;
        }
      } else {
        this.accumulator = 0;
      }

      const progress = this.status === GAME_STATUS.PLAYING
        ? Math.min(this.accumulator / (this.difficulty.tickMs || BASE_TICK_MS), 1)
        : 1;

      this.renderer.draw(
        this.state,
        this.previousSnake,
        progress,
        timestamp,
        {
          ghost: this.powerups.has("ghost"),
          speedBoost: this.powerups.has("speed"),
          magnet: this.powerups.has("magnet"),
        }
      );

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
