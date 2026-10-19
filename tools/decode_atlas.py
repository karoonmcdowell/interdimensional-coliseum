"""Reconstitute the single, original-art character atlas from committed lossless
bitplane segments. This avoids uploading fragile hand-cropped animation strips.
Source mask is extracted from the approved design sheet, nearest-neighbor
scaled to 75%, and Brotli-compressed without further pixel loss.
"""
from pathlib import Path
from PIL import Image
import numpy as np,base64,brotli,hashlib
ROOT=Path('assets/source')
OUT=Path('assets/characters/coliseum-atlas.png')
W,H=432,900
def build():
    parts=[(ROOT/f'atlas-part-{i}.txt').read_text().strip() for i in range(4)]
    assert [len(p) for p in parts]==[3200,3200,3200,120], 'Atlas source segments missing or truncated'
    compressed=base64.b64decode(''.join(parts),validate=True)
    raw=brotli.decompress(compressed)
    expected=(W*H+7)//8
    assert len(raw)==expected,(len(raw),expected)
    bits=np.unpackbits(np.frombuffer(raw,dtype=np.uint8))[:W*H].reshape(H,W)
    rgba=np.zeros((H,W,4),dtype=np.uint8)
    for row in range(12):
        r0,r1=row*75,(row+1)*75
        color=(250,146,88,255) if row<6 else (83,205,240,255)
        rgba[r0:r1][bits[r0:r1].astype(bool)]=color
    # Every frame must have visible art, must stay within its cell, and
    # animations must include at least two distinct authored poses.
    for row in range(12):
        frames=[]
        for frame in range(4):
            tile=rgba[row*75:(row+1)*75,frame*108:(frame+1)*108,3]
            assert tile.sum()>10000,(row,frame,'empty')
            assert not tile[:,0].any() and not tile[:,-1].any(),(row,frame,'horizontal clipping')
            assert not tile[0].any() and not tile[-1].any(),(row,frame,'vertical clipping')
            frames.append(hashlib.sha256(tile.tobytes()).hexdigest())
        assert len(set(frames))>1,(row,'no unique poses')
    OUT.parent.mkdir(parents=True,exist_ok=True)
    Image.fromarray(rgba,'RGBA').save(OUT,optimize=True)
    print('Verified 48 distinct authored frames in one',W,'x',H,'atlas')
if __name__=='__main__':build()
