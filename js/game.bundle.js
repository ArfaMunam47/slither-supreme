(() => {
  const GRID_SIZE = 20;
  const TICK_MS = 130;
  const MAX_CELL_SIZE = 22;
  const MIN_CELL_SIZE = 14;

  const COLORS = {
    board: "#080d1a",
    gridLine: "rgba(147, 112, 255, 0.06)",
    snakeHead: "#00ffc8",
    snakeHeadGlow: "rgba(0, 255, 200, 0.75)",
    snakeBody: "#00c896",
    snakeBodyGlow: "rgba(0, 200, 150, 0.45)",
    food: "#ff3d8a",
    foodGlow: "rgba(255, 61, 138, 0.75)",
    foodCore: "#ff8fc7",
    foodRing: "rgba(255, 140, 200, 0.35)",
  };

  const OPPOSITE = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };

  const KEY_DIRECTIONS = {
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

  const GAME_STATUS = {
    READY: "ready",
    PLAYING: "playing",
    PAUSED: "paused",
    GAME_OVER: "gameover",
    VICTORY: "victory",
  };

  const OVERLAY_CONTENT = {
    ready: {
      icon: "🐍",
      title: "Ready to Slither",
      message: "Collect glowing orbs, grow long, and chase your high score. Arrow keys or touch to move.",
      className: "overlay--ready",
      btnLabel: "Start Game",
    },
    paused: {
      icon: "⏸",
      title: "Game Paused",
      message: "Catch your breath — press Resume or Space to keep going.",
      className: "overlay--paused",
      btnLabel: "Resume",
    },
    gameover: {
      icon: "💀",
      title: "Game Over",
      message: "Your neon trail ends here. Think you can beat your best?",
      className: "overlay--gameover",
      btnLabel: "Play Again",
    },
    victory: {
      icon: "👑",
      title: "Victory!",
      message: "You conquered the entire grid. Absolute snake legend.",
      className: "overlay--victory",
      btnLabel: "Play Again",
    },
  };

  const HIGH_SCORE_KEY = "neonSnakeHighScore";
  const FIRE_MODE_SCORE = 10;

  const FIRE_COLORS = {
    head: "#ffb347",
    headGlow: "rgba(255, 179, 71, 0.85)",
    body: "#ff6b35",
    bodyGlow: "rgba(255, 107, 53, 0.6)",
    trail: "#ff4500",
  };

  function getHighScore() {
    try {
      return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    } catch {
      return 0;
    }
  }

  function saveHighScore(score) {
    try {
      const current = getHighScore();
      if (score > current) {
        localStorage.setItem(HIGH_SCORE_KEY, String(score));
        return score;
      }
      return current;
    } catch {
      return score;
    }
  }

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.cellSize = 20;
      this.effects = [];
      this.trailParticles = [];
      this._resize();
      window.addEventListener("resize", () => this._resize());
    }

    _resize() {
      const wrapper = this.canvas.parentElement;
      const available = wrapper.clientWidth;
      this.cellSize = Math.floor(
        Math.min(Math.max(available / GRID_SIZE, MIN_CELL_SIZE), MAX_CELL_SIZE)
      );
      const size = this.cellSize * GRID_SIZE;
      this.canvas.width = size;
      this.canvas.height = size;
    }

    clearTrails() {
      this.trailParticles = [];
      this.effects = [];
    }

    addEatEffect(x, y) {
      const cx = x * this.cellSize + this.cellSize / 2;
      const cy = y * this.cellSize + this.cellSize / 2;

      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        this.effects.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * 3,
          vy: Math.sin(angle) * 3,
          life: 1,
          color: i % 3 === 0 ? COLORS.food : i % 3 === 1 ? COLORS.snakeHead : "#c084fc",
        });
      }
    }

    _lerp(a, b, t) {
      return a + (b - a) * t;
    }

    _interpolateSnake(current, previous, progress) {
      if (!previous?.length) {
        return current.map((seg) => ({ x: seg.x, y: seg.y }));
      }

      const t = Math.max(0, Math.min(1, progress));

      return current.map((seg, i) => {
        const prev = previous[i] ?? previous[previous.length - 1] ?? seg;
        return {
          x: this._lerp(prev.x, seg.x, t),
          y: this._lerp(prev.y, seg.y, t),
        };
      });
    }

    _drawBoardBackground() {
      const { ctx, canvas } = this;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#0a1020");
      gradient.addColorStop(0.5, COLORS.board);
      gradient.addColorStop(1, "#0f0820");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    _drawGrid() {
      const { ctx, cellSize } = this;
      ctx.strokeStyle = COLORS.gridLine;
      ctx.lineWidth = 1;

      for (let i = 0; i <= GRID_SIZE; i++) {
        const pos = i * cellSize + 0.5;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, this.canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(this.canvas.width, pos);
        ctx.stroke();
      }
    }

    _drawRoundedCell(px, py, size, color, glowColor, glowBlur) {
      const { ctx } = this;
      const pad = 1.5;
      const r = size * 0.32;

      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = glowBlur;
      ctx.fillStyle = color;

      const x = px + pad;
      const y = py + pad;
      const w = size - pad * 2;
      const h = size - pad * 2;

      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
      ctx.restore();
    }

    _spawnTrailParticle(x, y) {
      this.trailParticles.push({
        x: x * this.cellSize + this.cellSize / 2 + (Math.random() - 0.5) * 5,
        y: y * this.cellSize + this.cellSize / 2 + (Math.random() - 0.5) * 5,
        life: 1,
        size: 2 + Math.random() * 4,
      });

      if (this.trailParticles.length > 50) {
        this.trailParticles.shift();
      }
    }

    _drawTrailParticles() {
      const remaining = [];

      this.trailParticles.forEach((p) => {
        p.life -= 0.03;

        if (p.life <= 0) return;

        remaining.push(p);

        this.ctx.save();
        this.ctx.globalAlpha = p.life * 0.75;
        this.ctx.fillStyle = FIRE_COLORS.trail;
        this.ctx.shadowColor = FIRE_COLORS.bodyGlow;
        this.ctx.shadowBlur = 12;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, Math.max(0.1, p.size * p.life), 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      });

      this.trailParticles = remaining;
    }

    _drawSnake(segments, fireMode, direction) {
      const colors = fireMode ? FIRE_COLORS : COLORS;

      segments.forEach((seg, index) => {
        const px = seg.x * this.cellSize;
        const py = seg.y * this.cellSize;
        const isHead = index === 0;

        if (isHead) {
          this._drawRoundedCell(
            px,
            py,
            this.cellSize,
            colors.snakeHead ?? colors.head,
            colors.snakeHeadGlow ?? colors.headGlow,
            fireMode ? 22 : 16
          );

          const cx = px + this.cellSize / 2;
          const cy = py + this.cellSize / 2;
          const eyeOffset = this.cellSize * 0.16;
          let ex1 = cx - eyeOffset;
          let ex2 = cx + eyeOffset;
          let ey = cy - eyeOffset * 0.4;

          if (direction === "left") { ex1 -= 2; ex2 -= 2; }
          if (direction === "right") { ex1 += 2; ex2 += 2; }
          if (direction === "up") { ey -= 2; }
          if (direction === "down") { ey += 2; }

          this.ctx.fillStyle = "#070b14";
          this.ctx.beginPath();
          this.ctx.arc(ex1, ey, 2.2, 0, Math.PI * 2);
          this.ctx.arc(ex2, ey, 2.2, 0, Math.PI * 2);
          this.ctx.fill();
        } else {
          const fade = 1 - (index / segments.length) * 0.4;
          const bodyColor = fireMode
            ? `rgba(255, 107, 53, ${fade})`
            : `rgba(0, 210, 160, ${fade})`;
          this._drawRoundedCell(
            px,
            py,
            this.cellSize,
            bodyColor,
            colors.snakeBodyGlow ?? colors.bodyGlow,
            fireMode ? 12 : 8
          );
        }
      });
    }

    _drawFood(food, timestamp) {
      const pulse = 0.82 + Math.sin(timestamp / 180) * 0.18;
      const cx = food.x * this.cellSize + this.cellSize / 2;
      const cy = food.y * this.cellSize + this.cellSize / 2;
      const outerRadius = (this.cellSize / 2 - 1) * pulse;
      const innerRadius = outerRadius * 0.55;

      const { ctx } = this;

      ctx.save();
      ctx.shadowColor = COLORS.foodGlow;
      ctx.shadowBlur = 22 * pulse;

      ctx.strokeStyle = COLORS.foodRing;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius + 2, 0, Math.PI * 2);
      ctx.stroke();

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerRadius);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.25, COLORS.foodCore);
      gradient.addColorStop(0.65, COLORS.food);
      gradient.addColorStop(1, "rgba(255, 61, 138, 0.15)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.arc(cx - innerRadius * 0.25, cy - innerRadius * 0.25, innerRadius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    _drawEffects() {
      const remaining = [];

      this.effects.forEach((fx) => {
        fx.x += fx.vx;
        fx.y += fx.vy;

        fx.life -= 0.035;
        fx.vx *= 0.96;
        fx.vy *= 0.96;

        if (fx.life <= 0) return;

        remaining.push(fx);

        this.ctx.save();
        this.ctx.globalAlpha = fx.life;
        this.ctx.fillStyle = fx.color || COLORS.food;
        this.ctx.shadowColor = fx.color || COLORS.foodGlow;
        this.ctx.shadowBlur = 10;

        this.ctx.beginPath();
        this.ctx.arc(fx.x, fx.y, Math.max(0.1, 3.5 * fx.life), 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      });

      this.effects = remaining;
    }

    draw(state, previousSnake, progress, timestamp, fireMode = false) {
      this._drawBoardBackground();
      this._drawGrid();

      const interpolated = this._interpolateSnake(state.snake, previousSnake, progress);

      if (fireMode && interpolated.length > 0) {
        const tail = interpolated[interpolated.length - 1];
        this._spawnTrailParticle(tail.x, tail.y);
        this._drawTrailParticles();
      }

      this._drawSnake(interpolated, fireMode, state.direction);
      this._drawFood(state.food, timestamp);
      this._drawEffects();
    }
  }

  class UIController {
    constructor() {
      this.els = {
        score: document.getElementById("score"),
        highScore: document.getElementById("highScore"),
        gameStatus: document.getElementById("gameStatus"),
        overlay: document.getElementById("overlay"),
        overlayIcon: document.getElementById("overlayIcon"),
        overlayTitle: document.getElementById("overlayTitle"),
        overlayMessage: document.getElementById("overlayMessage"),
        overlayScore: document.getElementById("overlayScore"),
        overlayBtn: document.getElementById("overlayBtn"),
        startBtn: document.getElementById("startBtn"),
        pauseBtn: document.getElementById("pauseBtn"),
        restartBtn: document.getElementById("restartBtn"),
        soundToggle: document.getElementById("soundToggle"),
        scoreCard: document.getElementById("scoreCard"),
        fireModeIcon: document.getElementById("fireModeIcon"),
      };

      this.highScore = getHighScore();
      this.els.highScore.textContent = String(this.highScore);
      this.setStatus(GAME_STATUS.READY);
      this.showOverlay("ready");
    }

    setScore(score) {
      this.els.score.textContent = String(score);

      if (!this.els.scoreCard) return;

      this.els.scoreCard.classList.remove("score-pop");
      requestAnimationFrame(() => {
        this.els.scoreCard.classList.add("score-pop");
      });
    }

    setFireMode(active) {
      if (!this.els.fireModeIcon) return;
      this.els.fireModeIcon.classList.toggle("hidden", !active);
      this.els.scoreCard?.classList.toggle("stat-card--fire", active);
    }

    setHighScore(score) {
      this.highScore = score;
      this.els.highScore.textContent = String(score);
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

    showOverlay(type, extra = {}) {
      const content = OVERLAY_CONTENT[type];
      if (!content) return;

      this.els.overlay.className = "overlay";
      if (content.className) {
        this.els.overlay.classList.add(content.className);
      }

      this.els.overlayIcon.textContent = content.icon;
      this.els.overlayTitle.textContent = content.title;
      this.els.overlayMessage.textContent = content.message;

      if (this.els.overlayBtn) {
        this.els.overlayBtn.textContent = content.btnLabel || "Continue";
        this.els.overlayBtn.classList.toggle("hidden", type === GAME_STATUS.PLAYING);
      }

      if (extra.score !== undefined) {
        this.els.overlayScore.textContent = `Final Score: ${extra.score}`;
        this.els.overlayScore.classList.remove("hidden");
      } else {
        this.els.overlayScore.classList.add("hidden");
      }

      if (extra.highScore !== undefined && extra.highScore > 0) {
        this.els.overlayScore.textContent += ` · Best: ${extra.highScore}`;
      }
    }

    hideOverlay() {
      this.els.overlay.classList.add("overlay--hidden");
    }

    revealOverlay() {
      this.els.overlay.classList.remove("overlay--hidden");
    }

    updateButtons(status) {
      const { startBtn, pauseBtn, restartBtn } = this.els;

      switch (status) {
        case GAME_STATUS.READY:
          startBtn.disabled = false;
          startBtn.innerHTML = '<span class="btn-shine"></span><span class="btn-content"><span class="btn-icon" aria-hidden="true">▶</span> Start</span>';
          pauseBtn.disabled = true;
          pauseBtn.innerHTML = '<span class="btn-content"><span class="btn-icon" aria-hidden="true">❚❚</span> Pause</span>';
          break;

        case GAME_STATUS.PLAYING:
          startBtn.disabled = true;
          pauseBtn.disabled = false;
          pauseBtn.innerHTML = '<span class="btn-content"><span class="btn-icon" aria-hidden="true">❚❚</span> Pause</span>';
          restartBtn.disabled = false;
          break;

        case GAME_STATUS.PAUSED:
          startBtn.disabled = false;
          startBtn.innerHTML = '<span class="btn-shine"></span><span class="btn-content"><span class="btn-icon" aria-hidden="true">▶</span> Resume</span>';
          pauseBtn.disabled = true;
          break;

        case GAME_STATUS.GAME_OVER:
        case GAME_STATUS.VICTORY:
          startBtn.disabled = false;
          startBtn.innerHTML = '<span class="btn-shine"></span><span class="btn-content"><span class="btn-icon" aria-hidden="true">▶</span> Play Again</span>';
          pauseBtn.disabled = true;
          restartBtn.disabled = false;
          break;

        default:
          break;
      }
    }

    setSoundEnabled(enabled) {
      this.els.soundToggle.setAttribute("aria-pressed", String(enabled));
      this.els.soundToggle.querySelector(".sound-on").classList.toggle("hidden", !enabled);
      this.els.soundToggle.querySelector(".sound-off").classList.toggle("hidden", enabled);
    }
  }

  class InputController {
    constructor(onDirection, onPause) {
      this.onDirection = onDirection;
      this.onPause = onPause;
      this._boundKeyDown = this._handleKeyDown.bind(this);
      document.addEventListener("keydown", this._boundKeyDown);
      this._bindTouchControls();
    }

    _bindTouchControls() {
      document.querySelectorAll(".touch-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const direction = btn.dataset.direction;
          if (direction) this.onDirection(direction);
        });
      });
    }

    _handleKeyDown(event) {
      if (event.code === "Space") {
        event.preventDefault();
        this.onPause();
        return;
      }

      const direction = KEY_DIRECTIONS[event.key];
      if (!direction) return;

      event.preventDefault();
      this.onDirection(direction);
    }

    setDirection(nextDirection, newDirection) {
      if (OPPOSITE[nextDirection] !== newDirection) {
        return newDirection;
      }
      return nextDirection;
    }

    destroy() {
      document.removeEventListener("keydown", this._boundKeyDown);
    }
  }

  class SoundManager {
    constructor() {
      this.enabled = true;
      this._ctx = null;

      this.sounds = {
        eat: { freq: 880, duration: 0.08, type: "sine" },
        move: { freq: 220, duration: 0.02, type: "triangle", volume: 0.05 },
        gameOver: { freq: 180, duration: 0.4, type: "sawtooth", slide: -80 },
        victory: { freq: 523, duration: 0.6, type: "sine", arpeggio: [523, 659, 784] },
        pause: { freq: 440, duration: 0.06, type: "sine" },
        start: { freq: 330, duration: 0.12, type: "sine", slide: 100 },
      };
    }

    _getContext() {
      if (!this._ctx) {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      return this._ctx;
    }

    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }

    play(name) {
      if (!this.enabled || !this.sounds[name]) return;

      try {
        const config = this.sounds[name];

        if (config.arpeggio) {
          config.arpeggio.forEach((freq, i) => {
            setTimeout(() => this._beep({ ...config, freq, duration: 0.15, volume: 0.12 }), i * 100);
          });
          return;
        }

        this._beep(config);
      } catch {
        // Audio unavailable — silently ignore
      }
    }

    _beep({ freq, duration, type = "sine", volume = 0.1, slide = 0 }) {
      const ctx = this._getContext();
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slide) {
        osc.frequency.linearRampToValueAtTime(freq + slide, ctx.currentTime + duration);
      }

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    }
  }

  class SnakeGame {
    constructor() {
      this.canvas = document.getElementById("gameCanvas");
      this.renderer = new Renderer(this.canvas);
      this.ui = new UIController();
      this.sound = new SoundManager();
      this.input = new InputController(
        (dir) => this.handleDirection(dir),
        () => this.togglePause()
      );

      this.status = GAME_STATUS.READY;
      this.accumulator = 0;
      this.lastFrameTime = 0;
      this.previousSnake = null;

      this.state = this.createInitialState();
      this.spawnFood();
      this.bindUI();
      this.renderer.draw(this.state, null, 0, performance.now(), false);
      this.startLoop();
    }

    createInitialState() {
      const center = Math.floor(GRID_SIZE / 2);
      return {
        snake: [{ x: center, y: center }],
        direction: "right",
        nextDirection: "right",
        food: { x: 0, y: 0 },
        score: 0,
      };
    }

    isFireMode() {
      return this.state.score >= FIRE_MODE_SCORE;
    }

    bindUI() {
      this.ui.els.startBtn.addEventListener("click", () => this.handlePrimaryAction());
      this.ui.els.overlayBtn.addEventListener("click", () => this.handlePrimaryAction());
      this.ui.els.pauseBtn.addEventListener("click", () => this.togglePause());
      this.ui.els.restartBtn.addEventListener("click", () => {
        this.reset();
        this.ui.hideOverlay();
        this.ui.showOverlay("ready");
      });
      this.ui.els.soundToggle.addEventListener("click", () => {
        const enabled = this.sound.toggle();
        this.ui.setSoundEnabled(enabled);
        if (enabled) this.sound.play("start");
      });
    }

    handlePrimaryAction() {
      if (this.status === GAME_STATUS.PLAYING) return;

      if (this.status === GAME_STATUS.PAUSED) {
        this.resume();
      } else if (
        this.status === GAME_STATUS.GAME_OVER ||
        this.status === GAME_STATUS.VICTORY
      ) {
        this.reset();
        this.start();
      } else {
        this.start();
      }
    }

    isSamePosition(a, b) {
      return a.x === b.x && a.y === b.y;
    }

    isOnSnake(position) {
      return this.state.snake.some((seg) => this.isSamePosition(seg, position));
    }

    spawnFood() {
      const maxCells = GRID_SIZE * GRID_SIZE;
      if (this.state.snake.length >= maxCells) return;

      let newFood;
      let attempts = 0;
      do {
        newFood = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        };
        attempts += 1;
      } while (this.isOnSnake(newFood) && attempts < maxCells);

      this.state.food = newFood;
    }

    snapSnake() {
      return this.state.snake.map((s) => ({ x: s.x, y: s.y }));
    }

    extendSnapshotForGrowth(snapshot) {
      const tail = snapshot[snapshot.length - 1];
      snapshot.push({ x: tail.x, y: tail.y });
      return snapshot;
    }

    reset() {
      this.state = this.createInitialState();
      this.spawnFood();
      this.previousSnake = null;
      this.accumulator = 0;
      this.lastFrameTime = 0;
      this.status = GAME_STATUS.READY;
      this.renderer.clearTrails();
      this.ui.setScore(0);
      this.ui.setFireMode(false);
      this.ui.setStatus(GAME_STATUS.READY);
      this.ui.updateButtons(GAME_STATUS.READY);
      this.ui.revealOverlay();
      this.ui.showOverlay("ready");
    }

    start() {
      this.status = GAME_STATUS.PLAYING;
      this.accumulator = 0;
      this.lastFrameTime = 0;
      this.previousSnake = this.snapSnake();
      this.ui.hideOverlay();
      this.ui.setStatus(GAME_STATUS.PLAYING);
      this.ui.updateButtons(GAME_STATUS.PLAYING);
      this.sound.play("start");
    }

    togglePause() {
      if (this.status === GAME_STATUS.PLAYING) {
        this.status = GAME_STATUS.PAUSED;
        this.accumulator = 0;
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
        default: break;
      }

      return newHead;
    }

    isWallCollision(head) {
      return head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE;
    }

    isSelfCollision(head, willEat) {
      const body = willEat ? this.state.snake : this.state.snake.slice(0, -1);
      return body.some((seg) => this.isSamePosition(seg, head));
    }

    step() {
      this.state.direction = this.state.nextDirection;
      const newHead = this.getNewHead();
      const willEat = this.isSamePosition(newHead, this.state.food);

      if (this.isWallCollision(newHead) || this.isSelfCollision(newHead, willEat)) {
        this.endGame(GAME_STATUS.GAME_OVER);
        return false;
      }

      this.state.snake.unshift(newHead);

      if (willEat) {
        this.state.score += 1;
        const eatenFood = { x: this.state.food.x, y: this.state.food.y };

        if (this.state.snake.length >= GRID_SIZE * GRID_SIZE) {
          this.onFoodEaten(eatenFood);
          this.endGame(GAME_STATUS.VICTORY);
          return false;
        }

        this.spawnFood();
        this.onFoodEaten(eatenFood);
      } else {
        this.state.snake.pop();
      }

      return true;
    }

    onFoodEaten(food) {
      this.renderer.addEatEffect(food.x, food.y);
      this.sound.play("eat");

      requestAnimationFrame(() => {
        this.ui.setScore(this.state.score);
        this.ui.setFireMode(this.isFireMode());
      });
    }

    endGame(status) {
      this.status = status;
      this.accumulator = 0;
      const best = saveHighScore(this.state.score);
      this.ui.setHighScore(Math.max(best, getHighScore()));

      this.ui.setStatus(status);
      this.ui.updateButtons(status);
      this.ui.revealOverlay();
      this.ui.showOverlay(status === GAME_STATUS.VICTORY ? "victory" : "gameover", {
        score: this.state.score,
        highScore: this.ui.highScore,
      });

      this.sound.play(status === GAME_STATUS.VICTORY ? "victory" : "gameOver");
    }

    startLoop() {
      const loop = (timestamp) => {
        if (!this.lastFrameTime) this.lastFrameTime = timestamp;
        const frameDelta = Math.min(timestamp - this.lastFrameTime, 250);
        this.lastFrameTime = timestamp;

        if (this.status === GAME_STATUS.PLAYING) {
          this.accumulator += frameDelta;

          while (this.accumulator >= TICK_MS) {
            let snapshot = this.snapSnake();
            const lengthBefore = this.state.snake.length;
            const stillPlaying = this.step();

            if (this.state.snake.length > lengthBefore) {
              snapshot = this.extendSnapshotForGrowth(snapshot);
            }

            this.previousSnake = snapshot;
            this.accumulator -= TICK_MS;

            if (!stillPlaying || this.status !== GAME_STATUS.PLAYING) break;
          }
        } else {
          this.accumulator = 0;
        }

        const progress = this.status === GAME_STATUS.PLAYING
          ? Math.min(this.accumulator / TICK_MS, 1)
          : 1;

        this.renderer.draw(
          this.state,
          this.previousSnake,
          progress,
          timestamp,
          this.isFireMode()
        );

        requestAnimationFrame(loop);
      };

      requestAnimationFrame(loop);
    }
  }

  new SnakeGame();
})();
