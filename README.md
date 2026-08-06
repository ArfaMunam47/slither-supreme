# SlitherSupreme

SlitherSupreme is a polished browser-based Snake game built with HTML, CSS, and vanilla JavaScript, featuring smooth gameplay, responsive controls, power-ups, achievements, XP progression, and persistent local storage.

## Repository Overview

This repository contains the complete implementation of the game, including the HTML entry point, CSS styling, and JavaScript modules that manage rendering, input, game logic, persistence, audio, and UI.

The project is designed to be lightweight and framework-free while demonstrating clean separation of concerns, maintainable code structure, and browser-friendly performance.

## Core Functionality

- Responsive keyboard and touch controls
- Canvas-based board rendering
- Food spawning and score-driven growth
- Collision detection for walls and self-intersection
- Power-up system with temporary gameplay modifiers
- Achievement tracking and XP progression
- High score and settings persistence via local storage
- Adaptive difficulty and theme selection

## Project Structure

```text
neon-snake-game/
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

## Gameplay Summary

Players control a snake on a grid-based board, collecting items to increase score and length while avoiding collisions. The game introduces power-ups and score-based progression to enhance replayability.

## Controls

- Arrow keys or WASD: move the snake
- Space: pause or resume
- Enter: confirm actions
- M: mute sound
- Touch controls: directional movement on supported devices

## Technology

- HTML5 for structure
- CSS3 for layout and styling
- JavaScript (ES6+) for game logic and interaction
- Web Audio API for sound effects and music
- Local Storage for persistence

## Setup

### Open locally

Open `index.html` directly in a browser.

### Run with Node

From the project root:

```bash
node server.js
```

Then open the displayed local URL in a browser.

## Architecture

- `config.js`: game constants, definitions, and UI content
- `game.js`: application state, game rules, and loop management
- `input.js`: keyboard and touch input handling
- `renderer.js`: canvas drawing and visual animation
- `ui.js`: HUD, overlay screens, menus, and panel logic
- `storage.js`: persistence for scores, settings, unlocks, and achievements
- `sound.js`: audio generation, playback, and toggles
- `achievements.js`: achievement detection and reward handling
- `powerups.js`: power-up spawning and lifecycle management
- `effects.js`: visual effects and particle behavior
- `utils.js`: general utility functions

## License

This project is licensed under the MIT License.

