/* Approved concept-sheet sprite atlas. Source artwork is loaded unchanged from PNG files. */
(function(root){'use strict';
const FRAME_W=160,FRAME_H=100,FRAMES=4;
const animations={
 BASTION:{idle:[4,3],walk:[4,8],ability_dash:[4,12,'dash'],ability_teleport:[4,12,'dash'],loss:[4,5],win:[4,5],attack:[4,10]},
 VESPER:{idle:[4,3],walk:[4,9],ability_shoot:[4,13,'shoot'],ability_roll:[4,12,'roll'],loss:[4,5],win:[4,5]}
};
const atlas={};
for(const [key,anims] of Object.entries(animations)){atlas[key]={};for(const [name,[frames,fps,alias]] of Object.entries(anims)){const img=new Image(),file=alias||name;const item={img,frames,fps,ready:false,error:false,safeFrames:[0,1,2,3]};atlas[key][name]=item;img.onload=()=>{item.ready=img.naturalWidth===FRAME_W*FRAMES&&img.naturalHeight===FRAME_H;if(item.ready){const probe=document.createElement('canvas');probe.width=img.naturalWidth;probe.height=img.naturalHeight;const pc=probe.getContext('2d',{willReadFrequently:true});pc.drawImage(img,0,0);const pixels=pc.getImageData(0,0,probe.width,probe.height).data;const valid=[];for(let n=0;n<FRAMES;n++){let edge=0,occupied=0;for(let y=5;y<FRAME_H-5;y++)for(let x=0;x<FRAME_W;x++){const a=pixels[(y*probe.width+n*FRAME_W+x)*4+3];if(a>100){occupied++;if(x<3||x>FRAME_W-4)edge++}}if(occupied>60&&edge<3)valid.push(n)}item.safeFrames=valid.length?valid:[0];}else console.warn('Invalid spritesheet size:',img.src)};img.onerror=()=>{item.error=true;console.warn('Missing approved sprite asset:',img.src)};img.src='assets/characters/'+key.toLowerCase()+'/'+file+'.png'}}
function choose(f){if(!f.alive)return 'loss';if(f.key==='BASTION'){if(f.teleFx>0)return 'ability_teleport';if(f.dashLeft>0)return 'ability_dash'}else if(f.shotFx>0)return 'ability_shoot';return Math.hypot(f.vx||0,f.vy||0)>15?'walk':'idle'}
function render(ctx,f,t,opts={}){const key=f.key||'BASTION',anim=opts.animation||choose(f),item=atlas[key]?.[anim]||atlas[key]?.idle;if(!item)return;const elapsed=opts.elapsed??(anim==='ability_shoot'&&f.shotFx>0?f.shotAge||0:t),phase=Math.floor(elapsed*item.fps)%item.frames,frame=item.safeFrames[phase%item.safeFrames.length],scale=opts.scale??.64;
 ctx.save();ctx.translate(f.x,f.y);
 // Subtle, state-aware motion supplements the intact source poses.
 // All transforms happen about the fighter's feet, not the sheet origin.
 const moving=Math.hypot(f.vx||0,f.vy||0)>15;
 const dash=key==='BASTION'&&f.dashLeft>0;
 const shooting=key==='VESPER'&&f.shotFx>0;
 const roll=anim==='ability_roll';
 const walking=anim==='walk'&&moving;
 const pulse=walking?Math.sin(t*13):Math.sin(t*2.8);
 const hop=walking?Math.abs(Math.sin(t*13))*2.3:Math.max(0,pulse)*.55;
 const lean=dash?.14:roll?.20:shooting?-.065:walking?Math.sin(t*13)*.045:Math.sin(t*2.8)*.009;
 ctx.translate(0,-hop*scale);
 if((opts.facing??f.facing??1)<0)ctx.scale(-1,1);
 ctx.rotate(lean);
 const stretch=dash?1.13:shooting?.96:1;
 const squash=dash?.88:walking?1+Math.sin(t*26)*.018:1;
 ctx.scale(scale*stretch,scale*squash);
 ctx.imageSmoothingEnabled=false;
 if(item.ready)ctx.drawImage(item.img,frame*FRAME_W,0,FRAME_W,FRAME_H,-FRAME_W/2,-FRAME_H+6,FRAME_W,FRAME_H);
 else{ctx.fillStyle=f.color||'#fff';ctx.fillRect(-9,-23,18,23);ctx.strokeStyle='#fff';ctx.strokeRect(-10,-24,20,24)}
 ctx.restore();return {animation:anim,frame,source:item.ready?'approved PNG':item.error?'missing asset':'loading'}}
function exportSheet(key,anim){const item=atlas[key]?.[anim];return item?.ready?item.img.src:null}
function readiness(){const missing=[];let ready=0;for(const [key,anims] of Object.entries(atlas))for(const [name,item] of Object.entries(anims)){if(item.ready)ready++;else missing.push(key+'/'+name)}return {ready,total:ready+missing.length,missing}}
root.ColiseumSprites={readiness,definitions:Object.fromEntries(Object.entries(animations).map(([k,v])=>[k,{animations:Object.fromEntries(Object.entries(v).map(([a,[frames,fps]])=>[a,{frames,fps}]))}])),render,choose,exportSheet,FRAME:FRAME_W,FRAME_HEIGHT:FRAME_H};
})(window);
