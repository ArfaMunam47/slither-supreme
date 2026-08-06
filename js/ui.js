// ─────────────────────────────────────────────────────────────
// SlitherSupreme — UI controller
// HUD, main menu, pause, settings, shop, achievements, toasts.
// ─────────────────────────────────────────────────────────────

class UIController {
  constructor(onAction) {
    this.onAction = onAction; // { start, pause, restart, setSkin, setTheme, setDifficulty, toggleSound, toggleMusic, resume }
    this.els = {};
    this._cache();
    this._buildMenus();
    this._bind();
    this.highScore = getHighScore();
    this.refreshHUD();
  }

  _cache() {
    const g = (id) => document.getElementById(id);
    this.els = {
      score: g("score"),
      highScore: g("highScore"),
      level: g("level"),
      levelXPText: g("levelXP"),
      xpFill: g("xpFill"),
      gameStatus: g("gameStatus"),
      combo: g("combo"),
      overlay: g("overlay"),
      overlayIcon: g("overlayIcon"),
      overlayTitle: g("overlayTitle"),
      overlayMessage: g("overlayMessage"),
      overlayScore: g("overlayScore"),
      overlayBtn: g("overlayBtn"),
      scoreCard: g("scoreCard"),
      powerBar: g("powerBar"),
      startBtn: g("startBtn"),
      pauseBtn: g("pauseBtn"),
      restartBtn: g("restartBtn"),
      soundBtn: g("soundBtn"),
      musicBtn: g("musicBtn"),
      menuBtn: g("menuBtn"),
      toast: g("toast"),
      toastTitle: g("toastTitle"),
      toastMsg: g("toastMsg"),
      // panels
      mainMenu: g("mainMenu"),
      settingsPanel: g("settingsPanel"),
      shopPanel: g("shopPanel"),
      achPanel: g("achPanel"),
      // menu buttons
      playBtn: g("playBtn"),
      settingsOpenBtn: g("settingsOpenBtn"),
      shopOpenBtn: g("shopOpenBtn"),
      achOpenBtn: g("achOpenBtn"),
      closeSettings: g("closeSettings"),
      closeShop: g("closeShop"),
      closeAch: g("closeAch"),
      // menu content
      skinGrid: g("skinGrid"),
      themeGrid: g("themeGrid"),
      diffGrid: g("diffGrid"),
      achList: g("achList"),
      achProgress: g("achProgress"),
      shopSkins: g("shopSkins"),
      shopThemes: g("shopThemes"),
      xpShop: g("xpShop"),
    };
    this.settingsPanel = this.els.settingsPanel;
    this.shopPanel = this.els.shopPanel;
    this.achPanel = this.els.achPanel;
  }

  _buildMenus() {
    this._buildSkinPicker(this.els.skinGrid);
    this._buildThemePicker(this.els.themeGrid);
    this._buildDifficultyPicker(this.els.diffGrid);
    this._buildAchievements();
    this._buildShop();
  }

  _bind() {
    const { els } = this;
    els.playBtn.addEventListener("click", () => {
      this.hideMainMenu();
      if (this.onAction.start) this.onAction.start();
    });
    els.settingsOpenBtn.addEventListener("click", () => this.openPanel("settingsPanel"));
    els.shopOpenBtn.addEventListener("click", () => this.openPanel("shopPanel"));
    els.achOpenBtn.addEventListener("click", () => this.openPanel("achPanel"));
    els.closeSettings.addEventListener("click", () => this.closePanel("settingsPanel"));
    els.closeShop.addEventListener("click", () => this.closePanel("shopPanel"));
    els.closeAch.addEventListener("click", () => this.closePanel("achPanel"));

    els.menuBtn.addEventListener("click", () => {
      if (this.onAction.menu) this.onAction.menu();
    });
    els.soundBtn.addEventListener("click", () => {
      if (this.onAction.toggleSound) this.onAction.toggleSound();
    });
    els.musicBtn.addEventListener("click", () => {
      if (this.onAction.toggleMusic) this.onAction.toggleMusic();
    });
  }

  // ── Picker builders ────────────────────────────────────────
  _buildSkinPicker(grid) {
    const settings = getSettings();
    grid.innerHTML = "";
    Object.values(SNAKE_SKINS).forEach((skin) => {
      const unlocked = isSkinUnlocked(skin.id);
      const btn = el("button", "pick-card", skin.name);
      btn.dataset.skin = skin.id;
      btn.innerHTML = `<span class="pick-swatch" style="background:linear-gradient(135deg,${skin.gradient.join(",")})"></span><span class="pick-name">${skin.name}</span><span class="pick-lock">${unlocked ? "" : "🔒"}</span>`;
      if (settings.skin === skin.id) btn.classList.add("selected");
      if (!unlocked) btn.classList.add("locked");
      btn.addEventListener("click", () => {
        if (!unlocked) return;
        if (this.onAction.setSkin) this.onAction.setSkin(skin.id);
        grid.querySelectorAll(".pick-card").forEach((c) => c.classList.remove("selected"));
        btn.classList.add("selected");
      });
      grid.appendChild(btn);
    });
  }

  _buildThemePicker(grid) {
    const settings = getSettings();
    grid.innerHTML = "";
    Object.values(BOARD_THEMES).forEach((theme) => {
      const unlocked = isThemeUnlocked(theme.id);
      const btn = el("button", "pick-card", theme.name);
      btn.dataset.theme = theme.id;
      btn.innerHTML = `<span class="pick-swatch pick-swatch--theme" style="background:linear-gradient(135deg,${theme.bgTop},${theme.bgMid},${theme.bgBottom})"></span><span class="pick-name">${theme.name}</span><span class="pick-lock">${unlocked ? "" : "🔒"}</span>`;
      if (settings.theme === theme.id) btn.classList.add("selected");
      if (!unlocked) btn.classList.add("locked");
      btn.addEventListener("click", () => {
        if (!unlocked) return;
        if (this.onAction.setTheme) this.onAction.setTheme(theme.id);
        grid.querySelectorAll(".pick-card").forEach((c) => c.classList.remove("selected"));
        btn.classList.add("selected");
      });
      grid.appendChild(btn);
    });
  }

  _buildDifficultyPicker(grid) {
    const settings = getSettings();
    grid.innerHTML = "";
    Object.values(DIFFICULTIES).forEach((diff) => {
      const btn = el("button", "pick-card pick-card--diff", `${diff.icon}<span class="pick-name">${diff.name}</span><small>${diff.desc}</small>`);
      btn.dataset.diff = diff.id;
      if (settings.difficulty === diff.id) btn.classList.add("selected");
      btn.addEventListener("click", () => {
        if (this.onAction.setDifficulty) this.onAction.setDifficulty(diff.id);
        grid.querySelectorAll(".pick-card").forEach((c) => c.classList.remove("selected"));
        btn.classList.add("selected");
      });
      grid.appendChild(btn);
    });
  }

  _buildAchievements() {
    const { els } = this;
    const defs = getAchievementDefs();
    const unlocked = getUnlockedAchievements();
    els.achProgress.textContent = `Unlocked ${unlocked.length} / ${defs.length}`;
    els.achList.innerHTML = "";
    defs.forEach((def) => {
      const isUnlocked = unlocked.includes(def.id);
      const item = el("div", `ach-item${isUnlocked ? "" : " locked"}`);
      item.innerHTML = `<span class="ach-icon">${def.icon}</span><div class="ach-info"><strong>${def.name}</strong><p>${def.desc}</p></div><span class="ach-xp">+${def.xp} XP</span>`;
      els.achList.appendChild(item);
    });
  }

  _buildShop() {
    this._updateShop();
  }

  _updateShop() {
    const { els } = this;
    const xp = getXP();
    els.xpShop.textContent = `Your XP: ${formatNumber(xp)}`;

    // Skins
    els.shopSkins.innerHTML = "";
    Object.values(SNAKE_SKINS).forEach((skin) => {
      const unlocked = isSkinUnlocked(skin.id);
      const card = el("div", `shop-card${unlocked ? " owned" : ""}`);
      card.innerHTML = `<span class="shop-swatch" style="background:linear-gradient(135deg,${skin.gradient.join(",")})"></span><div><strong>${skin.name}</strong><p>${unlocked ? "Owned" : `${skin.price} XP`}</p></div>`;
      if (!unlocked) {
        const buy = el("button", "btn btn--mini", "Unlock");
        buy.addEventListener("click", () => {
          if (this.onAction.buySkin) this.onAction.buySkin(skin.id);
        });
        card.appendChild(buy);
      }
      els.shopSkins.appendChild(card);
    });

    // Themes
    els.shopThemes.innerHTML = "";
    Object.values(BOARD_THEMES).forEach((theme) => {
      const unlocked = isThemeUnlocked(theme.id);
      const card = el("div", `shop-card${unlocked ? " owned" : ""}`);
      card.innerHTML = `<span class="shop-swatch shop-swatch--theme" style="background:linear-gradient(135deg,${theme.bgTop},${theme.bgBottom})"></span><div><strong>${theme.name}</strong><p>${unlocked ? "Owned" : `${theme.price} XP`}</p></div>`;
      if (!unlocked) {
        const buy = el("button", "btn btn--mini", "Unlock");
        buy.addEventListener("click", () => {
          if (this.onAction.buyTheme) this.onAction.buyTheme(theme.id);
        });
        card.appendChild(buy);
      }
      els.shopThemes.appendChild(card);
    });
  }

  // ── Panel management ───────────────────────────────────────
  openPanel(name) {
    this.closeAllPanels();
    const panel = this.els[name];
    if (panel) {
      panel.classList.add("panel--open");
      if (name === "shopPanel") this._updateShop();
      if (name === "achPanel") this._buildAchievements();
    }
  }

  closePanel(name) {
    this.els[name]?.classList.remove("panel--open");
  }

  closeAllPanels() {
    this.settingsPanel?.classList.remove("panel--open");
    this.shopPanel?.classList.remove("panel--open");
    this.achPanel?.classList.remove("panel--open");
  }

  // ── Menu visibility ────────────────────────────────────────
  showMainMenu() {
    this.els.mainMenu.classList.add("menu--open");
  }

  hideMainMenu() {
    this.els.mainMenu.classList.remove("menu--open");
    this.closeAllPanels();
  }

  // ── HUD updates ────────────────────────────────────────────
  refreshHUD() {
    const xpInfo = getLevelInfo(getXP());
    this.els.level.textContent = `Lv ${xpInfo.level}`;
    this.els.levelXPText.textContent = `${xpInfo.levelXp}/${xpInfo.nextLevelXp} XP`;
    this.els.xpFill.style.width = `${(xpInfo.levelXp / xpInfo.nextLevelXp) * 100}%`;
    this.els.highScore.textContent = formatNumber(this.highScore);
  }

  setScore(score) {
    this.els.score.textContent = formatNumber(score);
    this.els.scoreCard.classList.remove("score-pop");
    requestAnimationFrame(() => this.els.scoreCard.classList.add("score-pop"));
  }

  setCombo(combo) {
    if (combo >= 2) {
      this.els.combo.textContent = `×${combo}`;
      this.els.combo.classList.add("show");
    } else {
      this.els.combo.classList.remove("show");
    }
  }

  setStatus(status) {
    const labels = {
      [GAME_STATUS.READY]: "Ready",
      [GAME_STATUS.PLAYING]: "Playing",
      [GAME_STATUS.PAUSED]: "Paused",
      [GAME_STATUS.GAME_OVER]: "Game Over",
      [GAME_STATUS.VICTORY]: "Victory",
    };
    const el = this.els.gameStatus;
    el.textContent = labels[status] || status;
    el.classList.toggle("is-danger", status === GAME_STATUS.GAME_OVER);
    el.classList.toggle("is-gold", status === GAME_STATUS.VICTORY);
    el.classList.toggle("is-live", status === GAME_STATUS.PLAYING);
  }

  // ── Power-up chips ─────────────────────────────────────────
  updatePowerChips(active, now) {
    const { els } = this;
    els.powerBar.innerHTML = "";
    active.forEach((item) => {
      const def = { speed: { icon: "⚡", name: "Speed" }, slowmo: { icon: "🐌", name: "Slow" }, double: { icon: "✖2", name: "Double" }, magnet: { icon: "🧲", name: "Magnet" }, ghost: { icon: "👻", name: "Ghost" }, shield: { icon: "🛡", name: "Shield" } }[item.type] || {};
      const chip = el("span", "power-chip");
      chip.innerHTML = `${def.icon} ${def.name}`;
      els.powerBar.appendChild(chip);
    });
  }

  // ── Overlay ────────────────────────────────────────────────
  showOverlay(type, extra = {}) {
    const content = OVERLAY_CONTENT[type];
    if (!content) return;
    const { els } = this;
    els.overlay.className = "overlay";
    if (content.className) els.overlay.classList.add(content.className);
    els.overlayIcon.textContent = content.icon;
    els.overlayTitle.textContent = content.title;
    els.overlayMessage.textContent = content.message;
    els.overlayBtn.textContent = content.btnLabel;
    els.overlayBtn.classList.toggle("hidden", type === GAME_STATUS.PLAYING);

    if (extra.score !== undefined) {
      els.overlayScore.textContent = `Final Score: ${formatNumber(extra.score)}`;
      els.overlayScore.classList.remove("hidden");
    } else {
      els.overlayScore.classList.add("hidden");
    }
  }

  hideOverlay() {
    this.els.overlay.classList.add("overlay--hidden");
  }

  revealOverlay() {
    this.els.overlay.classList.remove("overlay--hidden");
  }

  // ── Toast notifications ────────────────────────────────────
  showToast(title, msg, icon = "🎉") {
    const { els } = this;
    els.toastTitle.textContent = `${icon} ${title}`;
    els.toastMsg.textContent = msg;
    els.toast.classList.add("toast--show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => els.toast.classList.remove("toast--show"), 3200);
  }

  // ── Sound / music button states ────────────────────────────
  setSoundState(enabled) {
    this.els.soundBtn.textContent = enabled ? "🔊" : "🔇";
    this.els.soundBtn.classList.toggle("is-off", !enabled);
  }

  setMusicState(enabled) {
    this.els.musicBtn.textContent = enabled ? "🎵" : "🎵❌";
    this.els.musicBtn.classList.toggle("is-off", !enabled);
  }

  // ── Buttons ────────────────────────────────────────────────
  updateButtons(status) {
    const { startBtn, pauseBtn, restartBtn } = this.els;
    switch (status) {
      case GAME_STATUS.READY:
        startBtn.disabled = false;
        startBtn.innerHTML = '<span class="btn-icon">▶</span> Start';
        pauseBtn.disabled = true;
        break;
      case GAME_STATUS.PLAYING:
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        break;
      case GAME_STATUS.PAUSED:
        startBtn.disabled = false;
        startBtn.innerHTML = '<span class="btn-icon">▶</span> Resume';
        pauseBtn.disabled = true;
        break;
      case GAME_STATUS.GAME_OVER:
      case GAME_STATUS.VICTORY:
        startBtn.disabled = false;
        startBtn.innerHTML = '<span class="btn-icon">▶</span> Play Again';
        pauseBtn.disabled = true;
        break;
      default:
        break;
    }
  }
}
