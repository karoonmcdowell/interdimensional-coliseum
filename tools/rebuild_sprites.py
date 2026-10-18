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
    # Source sprites drift horizontally: the 104px grid is NOT a reliable
    # crop boundary. Locate the four foreground clusters from alpha coverage.
    alpha = original.getchannel("A")
    column_counts = []
    for x in range(original.width):
        column_counts.append(sum(1 for y in range(original.height) if alpha.getpixel((x,y)) > 100))
    # Treat short gaps inside a pose as part of that pose, but preserve the
    # larger spaces between the four characters.
    active = [v >= 2 for v in column_counts]
    for x in range(1, len(active)-3):
        if active[x-1] and not active[x] and any(active[x+1:x+4]):
            active[x] = True
    runs = []
    begin = None
    for x, yes in enumerate(active + [False]):
        if yes and begin is None:
            begin = x
        if not yes and begin is not None:
            if x-begin >= 12:
                runs.append((begin,x))
            begin = None
    # Four approximate cells are expected, but unlike fixed 104px slicing,
    # each pose may cross the old cell boundary. Extract by actual alpha.
    frames = []
    for left,right in runs:
        piece = original.crop((left,0,right,original.height))
        if piece.getchannel("A").getbbox():
            frames.append(piece)
    # Use only genuinely complete poses. A run touching the sheet edge is
    # not a full pose unless it is naturally smaller than the others.
    if len(frames) < 2:
        raise RuntimeError(f"Could not separate source poses: {path}, runs={runs}")
    if runs[-1][1] >= original.width-1 and len(frames) > 2:
        frames.pop()
    frames = [frames[i % len(frames)] for i in range(COUNT)]
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
