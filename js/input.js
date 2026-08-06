// ─────────────────────────────────────────────────────────────
// SlitherSupreme — Input handling
// Keyboard + touch controls + menu navigation keys.
// ─────────────────────────────────────────────────────────────

import { KEY_DIRECTIONS, OPPOSITE } from "./config.js";

export class InputController {
  constructor(onDirection, onPause, onMenu) {
    this.onDirection = onDirection;
    this.onPause = onPause;
    this.onMenu = onMenu;
    this._boundKeyDown = this._handleKeyDown.bind(this);
    document.addEventListener("keydown", this._boundKeyDown);
    this._bindTouchControls();
  }

  _bindTouchControls() {
    document.querySelectorAll(".touch-btn").forEach((btn) => {
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
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
    if (event.key === "Enter") {
      event.preventDefault();
      this.onMenu("confirm");
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      this.onMenu("back");
      return;
    }
    if (event.key === "m" || event.key === "M") {
      event.preventDefault();
      this.onMenu("mute");
      return;
    }
    if (event.key === "p" || event.key === "P") {
      event.preventDefault();
      this.onPause();
      return;
    }

    const direction = KEY_DIRECTIONS[event.key];
    if (!direction) return;

    event.preventDefault();
    this.onDirection(direction);
  }

  /** Block 180° turns using the queued direction. */
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
