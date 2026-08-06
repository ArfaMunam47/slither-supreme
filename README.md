# SlitherSupreme

A polished browser-based Snake game built with HTML, CSS, and vanilla JavaScript. The project combines classic arcade gameplay with modern UI elements, responsive controls, dynamic visuals, power-ups, achievements, XP progression, and persistent local storage.

## About This Repository

This repository contains a complete front-end game experience for a premium-style Snake game. It is structured as a modular JavaScript application with separate concerns for game logic, rendering, input handling, UI, persistence, sound, and effects.

The project is intended as both a playable game and a clean example of lightweight browser game development without external frameworks or dependencies.

## Features

- Smooth snake movement and collision handling
- Responsive keyboard and touch controls
- Animated visual effects and premium UI styling
- Food variety with scoring differences
- Power-ups such as speed boost, slow motion, shield, magnet, and ghost mode
- Achievement system and XP-based progression
- Persistent high score and settings using local storage
- Adaptive difficulty presets and customizable themes

## Project Structure

```text
snake-game/
├── css/
│   └── style.css
├── js/
│   ├── achievements.js
│   ├── config.js
│   ├── effects.js
│   ├── game.js
│   ├── input.js
│   ├── main.js
│   ├── powerups.js
│   ├── renderer.js
│   ├── sound.js
│   ├── storage.js
│   ├── ui.js
│   └── utils.js
├── index.html
├── server.js
├── TODO.md
└── README.md
```

## Gameplay Overview

The objective is to guide the snake across the board, collect food, grow in length, and avoid collisions with walls or the snake itself. As the game progresses, power-ups and score multipliers increase the level of challenge and reward.

## Controls

- Arrow keys or WASD: move the snake
- Space: pause or resume
- Enter: confirm actions
- M: mute sound
- Touch buttons on mobile: directional movement

## Technology Stack

- HTML5
- CSS3
- JavaScript (ES6+)
- Web Audio API
- Local Storage

## Getting Started

### Option 1: Open directly

Open the project folder in a browser and launch index.html.

### Option 2: Run a local server

From the project root, run:

```bash
node server.js
```

Then open the local address shown in the terminal in your browser.

## Architecture Notes

The game is organized into modular JavaScript files:

- config.js: constants, difficulty settings, food definitions, and UI content
- game.js: game state, rules, progression, and main loop
- input.js: keyboard and touch control handling
- renderer.js: canvas-based rendering for the board and snake
- ui.js: HUD, overlays, menus, and panels
- storage.js: local persistence for scores, XP, settings, and unlocks
- sound.js: procedural sound effects and music
- achievements.js: achievement tracking and unlock logic
- powerups.js: power-up spawning and lifecycle management

## License

This project is licensed under the MIT License.

