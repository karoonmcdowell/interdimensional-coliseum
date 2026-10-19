"""Build one validated 4x12 atlas directly from the APPROVED original design sheet.
No reprocessing previously cropped sprites. Requires Pillow and numpy.
Source: assets/source/approved-design-sheet.png
Output: assets/characters/coliseum-atlas.png and atlas-manifest.json
"""
from pathlib import Path
from PIL import Image
import numpy as np
import json
SRC=Path('assets/source/approved-design-sheet.png')
OUT=Path('assets/characters/coliseum-atlas.png')
MANIFEST=Path('assets/characters/atlas-manifest.json')
FRAME_W,FRAME_H=144,100
ANIMATIONS=['idle','walk','dash','attack','loss','win']
ROWS=[(212,296),(303,388),(395,480),(488,575),(582,671),(675,768)]
X={
 'BASTION':[(156,282),(299,429),(440,573),(585,730)],
 'VESPER':[(930,1059),(1070,1200),(1212,1345),(1351,1503)]
}
COLORS={'BASTION':(250,146,88,255),'VESPER':(83,205,240,255)}
def make():
    if not SRC.exists():raise FileNotFoundError(f'Original approved art is required: {SRC}')
    source=np.asarray(Image.open(SRC).convert('RGB'))
    if source.shape[:2]!=(1024,1536):raise ValueError('Wrong original design sheet dimensions')
    atlas=Image.new('RGBA',(FRAME_W*4,FRAME_H*12))
    manifest={'version':1,'frameWidth':FRAME_W,'frameHeight':FRAME_H,'columns':4,'rows':12,'characters':{}}
    for ci,key in enumerate(('BASTION','VESPER')):
        animations={}
        for ri,animation in enumerate(ANIMATIONS):
            signatures=[]
            for fi,(x0,x1) in enumerate(X[key]):
                y0,y1=ROWS[ri]
                # Attack's third swing extends beyond the usual pose boundary.
                if key=='BASTION' and ri==3 and fi==2:x1=612
                if key=='BASTION' and ri==3 and fi==3:x0=612
                pix=source[y0:y1,x0:x1].astype(np.int16)
                r,g,b=pix[:,:,0],pix[:,:,1],pix[:,:,2]
                if key=='BASTION':
                    mask=(r>115)&(r>g*1.20)&(r>b*1.22)&(g>52)
                else:
                    mask=(b>118)&(g>100)&(b>r*1.30)&(g>r*1.30)
                ys,xs=np.where(mask)
                if len(xs)<120:raise ValueError(f'Missing pose: {key}/{animation}/{fi}')
                left,right,top,bottom=xs.min(),xs.max()+1,ys.min(),ys.max()+1
                art=mask[top:bottom,left:right]
                if art.shape[1]>FRAME_W-12 or art.shape[0]>FRAME_H-12:
                    raise ValueError(f'Pose too large: {key}/{animation}/{fi}: {art.shape}')
                rgba=np.zeros((*art.shape,4),dtype=np.uint8)
                rgba[art]=COLORS[key]
                piece=Image.fromarray(rgba,'RGBA')
                x=fi*FRAME_W+(FRAME_W-piece.width)//2
                y=(ci*6+ri)*FRAME_H+FRAME_H-7-piece.height
                if x<fi*FRAME_W+5 or y<(ci*6+ri)*FRAME_H+5:
                    raise ValueError(f'Pose too close to atlas edge: {key}/{animation}/{fi}')
                atlas.alpha_composite(piece,(x,y))
                signatures.append(hash(art.tobytes()))
            if len(set(signatures))<2:
                raise ValueError(f'Animation has no distinct poses: {key}/{animation}')
            animations[animation]={'row':ci*6+ri,'frames':4}
        manifest['characters'][key]=animations
    OUT.parent.mkdir(parents=True,exist_ok=True)
    atlas.save(OUT,optimize=True)
    MANIFEST.write_text(json.dumps(manifest,indent=2)+'\n')
    print('Wrote one atlas with 48 original distinct poses:',OUT)
if __name__=='__main__':make()
