# Project Emerald Quest

A mobile-first 2D temple puzzle-adventure built with Phaser and deployed through GitHub Pages.

## Project Charter

### Vision
Create a polished browser game for iPhone and modern browsers that captures the exploration, puzzle-solving, danger, and treasure-hunting feel of classic temple adventure games while using original code, levels, presentation, and legally reusable assets.

### Objectives
- Deliver a responsive mobile game that runs smoothly in Safari.
- Use swipe and tap controls as the primary input method.
- Build reusable systems for movement, collision, tilemaps, rocks, keys, doors, collectibles, enemies, hazards, audio, save data, and level progression.
- Release the game in playable milestones through GitHub Pages.
- Maintain a modular repository that can grow beyond a single HTML file.

### Success Criteria
- Stable gameplay on iPhone Safari and Android Chrome.
- Consistent mobile performance targeting 60 FPS where practical.
- At least one complete world with multiple polished levels before expanding scope.
- Working save progress, sound settings, level selection, lives, checkpoints, and restart flow.
- Clear asset and licence documentation.

## Scope

### Included
- Phaser-based 2D game architecture.
- Mobile swipe and tap controls.
- Animated explorer.
- Tile-based temple environments.
- Crystals, keys, doors, treasure, rocks, switches, traps, checkpoints, lives, and hidden passages.
- Falling and pushable rock mechanics.
- Enemies such as snakes, spiders, and bats.
- Water, lava, lighting, particles, screen shake, sound effects, and background music.
- Level selection, settings, save progress, and PWA support.

### Excluded from Version 1
- Multiplayer.
- Online accounts.
- Cloud saves.
- In-app purchases.
- Competitive leaderboards.

## Technology

- **Engine:** Phaser 3
- **Language:** JavaScript ES6
- **Hosting:** GitHub Pages
- **Primary target:** iPhone Safari
- **Secondary targets:** Android Chrome and desktop browsers
- **Graphics:** Original and permissively licensed assets, customised into one visual style
- **Audio:** Permissively licensed sound effects and music with source and licence records

## Planned Repository Structure

```text
assets/
  audio/
  images/
  tilemaps/
  ui/
  fonts/
src/
  scenes/
  entities/
  systems/
  ui/
  data/
docs/
index.html
README.md
```

## Milestones

### Milestone 1 — Foundation
- Modular Phaser bootstrap.
- Scene management.
- Responsive canvas.
- Swipe and tap input.
- Camera and collision foundation.
- Asset and audio loading.

### Milestone 2 — Core Adventure Loop
- Explorer movement and animation.
- Crystals, keys, doors, and exits.
- Pushable and falling rocks.
- Lives, checkpoints, restart, and completion flow.

### Milestone 3 — Jungle Temple World
- Consistent jungle-temple tileset.
- Multiple designed levels.
- Hidden rooms, switches, traps, and treasure.
- Ambient sound and music.

### Milestone 4 — Enemies and Hazards
- Snake, spider, and bat behaviours.
- Water, lava, spikes, and moving hazards.
- Damage, invulnerability, and respawn systems.

### Milestone 5 — Product Polish
- Main menu, level select, pause, settings, save progress, PWA installation, optimisation, and final testing.

## Delivery Method

Development will proceed one file and one commit at a time. Every commit should have a focused purpose, leave the live build in a usable state where possible, and be tested on the GitHub Pages deployment before the next major feature is added.

## Risks and Controls

- **Mobile performance:** limit oversized textures, particles, and unnecessary redraws.
- **Asset inconsistency:** document sources and customise assets into a unified art direction.
- **Scope growth:** complete one world and its core systems before adding additional worlds.
- **Browser caching:** use versioned assets and clear deployment checks.
- **Licensing:** record source repository, author, licence, and modifications for every external asset.

## Current Status

- Project charter approved.
- GitHub Pages deployment active.
- Existing prototype available on the live site.
- Modular rebuild beginning with one-file commits.
