/* Unified character atlas renderer. Each animation occupies one row in a
single PNG; each row has four unique frames. Works for new characters by
adding rows to the atlas manifest, never by hand-editing draw offsets. */
(function(root){'use strict';
const URL='assets/characters/coliseum-atlas.png';
const W=144,H=100,FRAMES=4;
const rows={BASTION:{idle:0,walk:1,ability_dash:2,ability_teleport:2,attack:3,loss:4,win:5},VESPER:{idle:6,walk:7,ability_shoot:8,ability_roll:9,loss:10,win:11}};
const fps={idle:3,walk:9,ability_dash:12,ability_teleport:12,attack:10,ability_shoot:13,ability_roll:12,loss:5,win:5};
const img=new Image();let ready=false,error=false;
img.onload=()=>{ready=img.naturalWidth===W*FRAMES&&img.naturalHeight===H*12;if(!ready)console.error('Invalid unified atlas dimensions',img.naturalWidth,img.naturalHeight)};
img.onerror=()=>{error=true;console.error('Missing unified character atlas',URL)};
img.src=URL+'?v=unified-atlas-1';
function choose(f){if(!f.alive)return 'loss';if(f.key==='BASTION'){if(f.teleFx>0)return 'ability_teleport';if(f.dashLeft>0)return 'ability_dash'}else if(f.shotFx>0)return 'ability_shoot';return Math.hypot(f.vx||0,f.vy||0)>15?'walk':'idle'}
function render(ctx,f,t,opts={}){const key=f.key||'BASTION',animation=opts.animation||choose(f),row=rows[key]?.[animation]??rows[key]?.idle;if(row===undefined)return;
 const elapsed=opts.elapsed??t,frame=Math.floor(elapsed*(fps[animation]||3))%FRAMES,scale=opts.scale??.64;
 ctx.save();ctx.translate(f.x,f.y);
 const moving=Math.hypot(f.vx||0,f.vy||0)>15;
 const dash=key==='BASTION'&&f.dashLeft>0,shooting=key==='VESPER'&&f.shotFx>0;
 const walking=animation==='walk'&&moving,hitStrength=f.flash>0?Math.min(1,f.flash/.14):0;
 const hop=walking?Math.abs(Math.sin(t*12))*8:Math.max(0,Math.sin(t*2.8))*3;
 const lean=!f.alive?.30:hitStrength?-.20:dash?.24:shooting?-.14:walking?Math.sin(t*12)*.11:Math.sin(t*2.8)*.035;
 ctx.translate(-hitStrength*5*scale,(-hop+hitStrength*4)*scale);
 if((opts.facing??f.facing??1)<0)ctx.scale(-1,1);
 ctx.rotate(lean);
 ctx.scale(scale*(hitStrength?.90:dash?1.25:shooting?.90:1),scale*(hitStrength?1.12:dash?.80:walking?1+Math.sin(t*24)*.055:1));
 ctx.imageSmoothingEnabled=false;
 if(ready)ctx.drawImage(img,frame*W,row*H,W,H,-W/2,-H+7,W,H);
 else{ctx.fillStyle=f.color||'#fff';ctx.fillRect(-9,-23,18,23)}
 ctx.restore();return {animation,frame,source:ready?'unified atlas':error?'missing atlas':'loading'}}
function readiness(){return {ready:ready?1:0,total:1,missing:ready?[]:[URL]}}
function exportSheet(){return ready?img.src:null}
const definitions=Object.fromEntries(Object.entries(rows).map(([key,animations])=>[key,{animations:Object.fromEntries(Object.keys(animations).map(a=>[a,{frames:4,fps:fps[a]||3}]))}]));
root.ColiseumSprites={render,choose,readiness,exportSheet,definitions,FRAME:W,FRAME_HEIGHT:H};
})(window);
