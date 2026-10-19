"""Rebuild grounded, uniformly anchored sprite strips from repository source strips.
Run with: python tools/rebuild_sprites.py
Requires Pillow. Original source sheets remain untouched for repeatable builds.
"""
from pathlib import Path
from PIL import Image

SOURCE = Path("coliseum_approved_art_integration/assets/characters")
DEST = Path("assets/characters")
SOURCE_SIZE = (104, 76)
FRAME_SIZE = (160, 100)
COUNT = 4

def rebuild(path: Path):
    original = Image.open(path).convert("RGBA")
    if original.size != (SOURCE_SIZE[0] * COUNT, SOURCE_SIZE[1]):
        raise ValueError(f"Unexpected source dimensions: {path}: {original.size}")
    output = Image.new("RGBA", (FRAME_SIZE[0] * COUNT, FRAME_SIZE[1]))
    # The approved 416x76 strips contain poses at approximately x=20,
    # x=140, x=260 and x=380, NOT four evenly spaced 104px cells.
    # A pose's shield, gun, or effects can be disconnected from the body;
    # alpha-connected-component extraction would incorrectly discard them.
    # Boundaries below enclose entire poses INCLUDING detached equipment.
    # The fourth pose extends beyond the right edge of the damaged source,
    # so reuse the last complete pose rather than render a partial body.
    boundaries = (0, 112, 224, 370)
    frames = [original.crop((boundaries[i], 0, boundaries[i+1], original.height))
              for i in range(3)]
    frames.append(frames[2].copy())
    for i in range(COUNT):
        frame = frames[i]
        bounds = frame.getchannel("A").getbbox()
        if bounds is None:
            continue
        artwork = frame.crop(bounds)
        # Center each visible silhouette horizontally; lock lowest visible pixel to ground.
        x = i * FRAME_SIZE[0] + (FRAME_SIZE[0] - artwork.width) // 2
        y = FRAME_SIZE[1] - 6 - artwork.height
        output.alpha_composite(artwork, (x, y))
    target = DEST / path.relative_to(SOURCE)
    target.parent.mkdir(parents=True, exist_ok=True)
    output.save(target, optimize=True)
    print(f"Built {target}")

def main():
    files = sorted(SOURCE.glob("*/*.png"))
    if len(files) != 12:
        raise RuntimeError(f"Expected 12 source sheets, found {len(files)}")
    for path in files:
        rebuild(path)

if __name__ == "__main__":
    main()
