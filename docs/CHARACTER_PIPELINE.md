# Character Sprite Pipeline — 24px Monochrome v2

## Art contract
- Native canvas: **24 x 24 pixels** per frame, transparent background.
- Each fighter has **one opaque foreground color** plus transparent pixels; no outlines, highlights, gradients, or antialiasing.
- Silhouette must read at native resolution. Use clusters of pixels, not thin decorative detail.
- On-screen draw scale target: **1.5–2x**, subject to arena review; do not enlarge to 48x/64x artwork.
- Ground anchor: pixel coordinate (12, 22). All frames align their feet to that anchor. No auto-centering by frame bounds.
- The art may deliberately exaggerate proportions and action poses. Readability is more important than realistic anatomy.
- Export PNG with nearest-neighbor scaling and exact alpha (0 or 255).

## Character identity
**Bastion**: broad, heavy armored paladin, shield projects ahead of torso. Distinct shield-forward charge silhouette, low braced windup, forward lean and extended shield on dash, staggered recovery.

**Vesper**: space cowgirl, unmistakable hat brim/crown, narrower waist, angled hip, expressive stance and hair/ponytail or scarf in silhouette. Gun arm projects clearly away from body. Shooting animation must show a distinct arm extension and recoil. Avoid relying on stereotyped proportions alone; prioritize gesture and attitude.

## Sprite files
Use one PNG spritesheet per animation, arranged horizontally. Each frame is 24x24 pixels. A 4-frame animation is a 96x24 PNG. Filenames are not semantic to the engine; the manifest maps states to paths.

```
assets/characters/bastion/manifest.json
assets/characters/bastion/idle.png
assets/characters/bastion/walk.png
assets/characters/bastion/dash_windup.png
assets/characters/bastion/dash.png
assets/characters/bastion/dash_recovery.png
assets/characters/bastion/teleport.png
assets/characters/bastion/loss.png
assets/characters/bastion/win.png
assets/characters/vesper/manifest.json
assets/characters/vesper/idle.png
assets/characters/vesper/walk.png
assets/characters/vesper/shoot.png
assets/characters/vesper/roll.png
assets/characters/vesper/loss.png
assets/characters/vesper/win.png
```

## Manifest example
```json
{
  "id": "vesper",
  "frameSize": [24, 24],
  "anchor": [12, 22],
  "color": "#6bd5ff",
  "animations": {
    "idle": { "src": "idle.png", "frames": 2, "fps": 3, "loop": true },
    "walk": { "src": "walk.png", "frames": 4, "fps": 8, "loop": true },
    "shoot": { "src": "shoot.png", "frames": 3, "fps": 12, "loop": false, "events": [{ "frame": 1, "name": "muzzle" }] },
    "roll": { "src": "roll.png", "frames": 4, "fps": 12, "loop": false }
  }
}
```

## Engine vs art
- Engine controls actual attacks, projectile spawn positions, invulnerability, collision, damage and cooldowns.
- Animation controller receives **timed combat events** (e.g. shoot_start, projectile_release, dash_windup, dash_start, dash_end, roll_start, death, victory).
- Animation controller must not infer gunfire from shot cooldown alone. Event sequences must be observable in replay.
- Weapon muzzle offset is **authored in local sprite pixels per attack frame**, mirrored when facing left, transformed to world position using draw scale, and used by the engine for projectile origin. The art preview draws a visible muzzle marker. Validate muzzle offsets against sprite poses.
- Visual frame selection is deterministic for a given simulation timestamp and event log. Do not restart one-shot animations on every render tick.
- Facing direction is explicit in engine state; flipping only based on velocity is insufficient for strafing/shooting.
- During a dash, Bastion must display the dash pose. During a shot, Vesper must display the shooting pose. Win/loss persist after combat ends.
- Roll invulnerability is an engine-owned interval (startup/active/recovery) and is not implied by the sprite image.

## Editor and preview acceptance
1. Grid-based frame editor with pencil/erase, onion skin, frame navigation and preview playback (or use Aseprite/LibreSprite and import exported PNGs).
2. Preview character at **1x, 2x, and actual arena size**, on contrasting arena backgrounds.
3. Preview every animation state without running a duel.
4. Display ground anchor, collision radius and weapon muzzle anchor overlays.
5. Changing PNG artwork never requires changes to combat math.
6. Missing or invalid sprite assets fall back visibly and log warnings; never silently substitute old art as though approved.
7. Test with seeded duels and confirm art-only revisions do not alter outcomes.

## Implementation order
1. **Freeze gameplay on main** while replacing the v0.5A placeholder renderer on develop.
2. Build native 24px sprites and manifest loader; implement preview at native and arena scales.
3. Add explicit timed animation events and weapon origin anchors to the engine.
4. Connect Bastion dash and Vesper shooting to unique poses and events.
5. Implement Vesper dodge roll with actual engine-owned invulnerability and rebalance using seeded batches.
6. Promote after visual review and regression tests.

**Status:** specification only. v0.5A currently uses 48px multi-color fallback figures; the new art contract is not yet implemented.
