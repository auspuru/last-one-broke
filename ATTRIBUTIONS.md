# Emerald Quest — Attributions

This file records every third-party dependency, asset, sound, font, and design resource used by **Emerald Quest**.

## Runtime dependency

### Phaser

- Project: Phaser HTML5 Game Framework
- Version used: 3.90.0
- Website: https://phaser.io/
- Repository: https://github.com/phaserjs/phaser
- Licence: MIT
- Use in Emerald Quest: Game runtime, rendering, input, animation, particles, scenes, and scaling.

## Original project content

The following content currently included in the game was created specifically for Emerald Quest and is not copied from another game repository:

- Temple level layouts
- Puzzle rules and progression
- Procedurally drawn explorer, walls, floor, earth, rocks, crystals, key, door, particles, shadows, and interface graphics
- Web Audio sound effects generated at runtime
- Menu, HUD, scoring, lives, best-move tracking, and completion interface

## Resource catalogues consulted

These repositories are used for research and discovery only. No code, images, or audio from them has been copied into Emerald Quest unless a future entry below explicitly identifies the individual asset and its licence.

### Games on GitHub

- Repository: https://github.com/leereilly/games
- Use: Discovery of open-source browser games and gameplay references.

### Open Source Games

- Repository: https://github.com/bobeff/open-source-games
- Use: Discovery of open-source games and engines.

### GameDev Resources

- Repository: https://github.com/Kavex/GameDev-Resources
- Use: Discovery of asset libraries, audio resources, tools, and development references.

## Licensed implementation references

### GDQuest Godot 3 demos

- Repository: https://github.com/gdquest-demos/godot-3-demos
- Creator: Nathan Lovato / GDQuest contributors
- Licence: MIT
- Attribution required: Yes; preserve the MIT copyright and permission notice when copying substantial portions.
- Relevant references: Grid-based movement, title-screen input, game UI, finite-state machines, 2D camera rigs, character scene setup, pathfinding, and screen-size handling.
- Use in Emerald Quest: Architecture and interaction reference while implementing original Phaser-compatible JavaScript systems. No Godot project files or media assets have been copied at this stage.
- Destination path: Not applicable; reference only.

## Restricted gameplay references

The following repositories may be studied at a high level for genre conventions and gameplay analysis, but their code, maps, extracted resources, names, artwork, audio, and other game content must not be copied into Emerald Quest.

### diamondRush recreation and extraction repository

- Repository: https://github.com/kubikaugustyn/diamondRush
- Repository licence: MIT for material owned by the repository author.
- Important restriction: The repository includes decompiled, extracted, and decoded material associated with the commercial game Diamond Rush. The repository licence cannot be assumed to relicense third-party Gameloft content.
- Permitted use in Emerald Quest: High-level research into puzzle pacing, obstacle categories, mobile controls, and level-progression concepts only.
- Prohibited use: Copying source code, decompiled logic, maps, level data, sprites, textures, sound effects, music, trademarks, character designs, or extracted files.
- Destination path: Not applicable; reference only.

### DiamondRushSource decompilation repository

- Repository: https://github.com/kubikaugustyn/DiamondRushSource
- Description: Decompilation of Gameloft's Diamond Rush (2006) for Nokia mobile devices.
- Licence status: No repository licence was visible when reviewed.
- Permitted use in Emerald Quest: High-level gameplay research only.
- Prohibited use: Copying or adapting its source, decompiled logic, assets, maps, names, audio, or other protected game content.
- Destination path: Not applicable; reference only.

## Asset acceptance rules

Before an external asset is committed, this file must record:

1. The asset name and exact source.
2. The creator or project.
3. The applicable licence.
4. Whether attribution is required.
5. Any modifications made for Emerald Quest.
6. The destination path inside this repository.

Preferred licences are CC0, public domain, MIT, BSD, Apache-2.0, and attribution-friendly Creative Commons licences. Assets without a clear reuse licence will not be redistributed in this repository.

## Imported media assets

No third-party image or audio files have been imported yet.
