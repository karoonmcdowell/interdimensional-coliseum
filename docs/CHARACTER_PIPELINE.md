# Character art and animation pipeline (v0.5)

## Goals
- Keep combat logic independent from art.
- Support authored pixel-art characters and cheap frame-by-frame animation.
- Allow designers to replace art files without editing engine logic.
- Preserve reproducible seeded matches and the approved v0.4 game on `main`.

## Art direction
- Low-resolution pixel art inspired by early console western games, but more expressive than stick figures.
- Distinct readable silhouettes at small sizes; no dependence on fine detail.
- Use nearest-neighbor rendering (no image smoothing), transparent backgrounds, consistent feet anchor.
- Character base frame canvas: 48 x 48 px; character can be scaled 2x or 3x in the game. Consistent ground-contact origin at x=24, y=42.
- Character faces screen-left or screen-right using horizontal flip; avoid rotating the full sprite arbitrarily.

## Character briefs
**Bastion**: massive armored space paladin with broad shield, heavy boots, short squat silhouette. Shield is recognizable even at thumbnail scale. Walk is slow with strong planted footfalls. Dash includes visible wind-up, a committed forward burst, and recovery. Teleport gets a distinct vanish/reappear effect.

**Vesper**: agile space cowgirl with hat/helmet hybrid, compact pistol, slim asymmetrical silhouette, expressive poncho/scarf. Walk is a smooth side-step. Shot has a sharp muzzle-flash pose. Dodge roll is visually distinctive, with explicit invulnerable frames governed by the combat engine (not the artwork).

## Folder convention
```
assets/characters/
  bastion/
    manifest.json
    idle.png
    walk.png
    ability_dash.png
    ability_teleport.png
    loss.png
    win.png
  vesper/
    manifest.json
    idle.png
    walk.png
    ability_shoot.png
    ability_roll.png
    loss.png
    win.png
```

Each PNG is a horizontal spritesheet of 48x48 transparent frames. The manifest describes each sheet's frame count, fps, whether it loops, and the gameplay animation key. Never encode collision boxes or invulnerability in the sprite manifest.

## Animation priorities
1. loss / win (terminal)
2. ability (dash, teleport, shoot, roll)
3. walk (moving)
4. idle

One-shot animations should not restart every tick; use a transition timestamp or animation instance counter. Engine events trigger ability animations. Render the sprite centered horizontally with its feet anchored to the entity's ground position. Use a fallback placeholder if an image fails to load.

## Mechanics requirements for Vesper roll
- Separate roll cooldown and roll duration.
- Direction chosen by evasive AI using the current threat and arena boundaries.
- Invulnerability window begins *after* roll startup and ends *before* roll recovery; collision and damage logic consults engine-owned invulnerability state.
- Roll must not make Vesper uncatchable: test usage rate, effective avoided damage, win rates, and arena edge behavior across seeded batches.

## Acceptance criteria
1. Both characters have authored idle, walk, ability, loss, and win animations.
2. Sprite changes require no edits to engine.js.
3. Missing or malformed art does not crash matches.
4. Battle simulation results remain unchanged when only art files are replaced.
5. Roll invulnerability is mechanically testable in headless simulations.
6. UI can preview individual animation states without running a duel.

## Release plan
- Stage A: import the animation manifest schema and sprite renderer, with fallback silhouettes.
- Stage B: author and import character spritesheets.
- Stage C: add Vesper roll to the simulation, tune in batches, and review visually.
- Stage D: merge to `main` only after user approves visuals and balance.
