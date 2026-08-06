# Task: Make the Snake game work in browser, Live Server, and node server

## Root Cause
The game used ES6 modules (`import`/`export`). Browsers block ES modules when opening
`index.html` directly via the `file://` protocol (CORS security), so only the static
layout renders and the game never initializes.

## Solution
Converted all ES modules to classic global scripts and load them in the correct
dependency order in `index.html`.

## Steps
- [x] 1. Convert `js/config.js` (remove `export`)
- [x] 2. Convert `js/utils.js` (remove `export`)
- [x] 3. Convert `js/storage.js` (remove `import`/`export`)
- [x] 4. Convert `js/effects.js` (remove `import`/`export`)
- [x] 5. Convert `js/sound.js` (remove `import`/`export`)
- [x] 6. Convert `js/input.js` (remove `import`/`export`)
- [x] 7. Convert `js/renderer.js` (remove `import`/`export`)
- [x] 8. Convert `js/powerups.js` (remove `import`/`export`)
- [x] 9. Convert `js/achievements.js` (remove `import`/`export`)
- [x] 10. Convert `js/ui.js` (remove `import`/`export`)
- [x] 11. Convert `js/game.js` (remove `import`/`export`)
- [x] 12. Convert `js/main.js` (remove `import`)
- [x] 13. Update `index.html` to load scripts as classic `<script>` tags in order
- [x] 14. Verify no remaining `import`/`export` + all JS files pass syntax check

## Verification
- Confirmed no `import`/`export` statements remain in any JS file.
- All 12 JS files pass `node --check` syntax validation.
