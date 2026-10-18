/* 24px single-ink character sprites, authored as pixel clusters. Art and mechanics are independent. */
(function(root){'use strict';
const SIZE=24,INK={BASTION:'#ff816f',VESPER:'#6bd5ff'};
const specs={
 BASTION:{idle:[2,2],walk:[4,7],ability_dash:[4,12],ability_teleport:[4,12],loss:[3,5],win:[3,5]},
 VESPER:{idle:[2,2],walk:[4,9],ability_shoot:[3,13],ability_roll:[4,12],loss:[3,5],win:[3,5]}
};
const atlas={};
function pixel(ctx,x,y,w,h){ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function pose(ctx,key,anim,frame){ctx.fillStyle=INK[key];const walking=anim==='walk',stride=walking?[-2,1,2,-1][frame%4]:0,breath=anim==='idle'?frame%2:0;
 if(key==='BASTION'){
  let lean=anim==='ability_dash'?[0,1,3,4][frame%4]:0,low=anim==='ability_dash'?2:0;
  if(anim==='loss'){ctx.save();ctx.translate(12,20);ctx.rotate([0,.6,1.35][frame%3]);ctx.translate(-12,-20)}
  pixel(ctx,7+lean,4+low,10,3);pixel(ctx,6+lean,7+low,12,4);pixel(ctx,8+lean,9+low,8,2);
  pixel(ctx,5+lean,11+low,14,7-breath);
  pixel(ctx,6+lean,18+low,5,3);pixel(ctx,13+lean,18+low,5,3);
  pixel(ctx,4+lean+stride,20+low,7,2);pixel(ctx,13+lean-stride,20+low,7,2);
  // Shield forward is the defining silhouette. Charge lowers and extends it.
  if(anim==='ability_dash'){pixel(ctx,17+lean,10+low,6,9);pixel(ctx,19+lean,8+low,3,2)}
  else if(anim==='win'){pixel(ctx,17,2,5,13);pixel(ctx,18,0,3,2)}
  else{pixel(ctx,17,11+low,6,10);pixel(ctx,19,9+low,3,2)}
  pixel(ctx,3+lean,12+low,3,7);
  if(anim==='ability_teleport'&&frame%4===2){ctx.clearRect(0,0,24,24);pixel(ctx,4,5,2,3);pixel(ctx,17,10,3,2);pixel(ctx,8,19,3,2)}
  if(anim==='loss')ctx.restore();
 }else{
  const recoil=anim==='ability_shoot'&&frame===1?1:0,roll=anim==='ability_roll';
  if(roll){pixel(ctx,4+frame*2,12+(frame%2)*2,13,5);pixel(ctx,6+frame*2,10,7,3);pixel(ctx,2+frame*2,17,9,3);return}
  if(anim==='loss'){ctx.save();ctx.translate(12,19);ctx.rotate([0,.7,1.4][frame%3]);ctx.translate(-12,-19)}
  // Hat brim and crown; narrow torso and asymmetric hip/ponytail.
  pixel(ctx,5,5+breath,15,2);pixel(ctx,8,2+breath,9,4);pixel(ctx,9,7+breath,7,5);
  pixel(ctx,7,10+breath,2,5);pixel(ctx,10,12+breath,6,5);pixel(ctx,9,17,9,3);
  pixel(ctx,9+stride,20,3,2);pixel(ctx,15-stride,20,3,2);
  pixel(ctx,6,13,3,3);pixel(ctx,5,16,2,2);
  // Shooting arm and pistol are a continuous silhouette.
  if(anim==='ability_shoot'){pixel(ctx,16,12+recoil,5,2);pixel(ctx,20,11+recoil,4,2)}
  else if(anim==='win'){pixel(ctx,16,4,3,11);pixel(ctx,17,1,4,4)}
  else{pixel(ctx,16,14,4,2);pixel(ctx,19,13,4,2)}
  if(anim==='loss')ctx.restore();
 }
}
function build(){for(const key of Object.keys(specs)){atlas[key]={};for(const [anim,[count,fps]] of Object.entries(specs[key])){const c=document.createElement('canvas');c.width=SIZE*count;c.height=SIZE;const x=c.getContext('2d');for(let f=0;f<count;f++){x.save();x.translate(f*SIZE,0);pose(x,key,anim,f);x.restore()}atlas[key][anim]={canvas:c,count,fps}}}}
function choose(f){if(!f.alive)return 'loss';if(f.key==='BASTION'){if(f.teleFx>0)return 'ability_teleport';if(f.dashLeft>0)return 'ability_dash'}else if(f.shotFx>0)return 'ability_shoot';return Math.hypot(f.vx||0,f.vy||0)>15?'walk':'idle'}
function draw(ctx,f,t,opts={}){const key=f.key||'BASTION',anim=opts.animation||choose(f),data=atlas[key]?.[anim]||atlas[key].idle,elapsed=opts.elapsed??t,frame=Math.floor(elapsed*data.fps)%data.count,scale=opts.scale||1.4;
 ctx.save();ctx.translate(f.x,f.y);const facing=opts.facing??f.facing??1;if(facing<0)ctx.scale(-1,1);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=false;ctx.drawImage(data.canvas,frame*SIZE,0,SIZE,SIZE,-12,-22,SIZE,SIZE);ctx.restore();return {animation:anim,frame,source:'24px sprite sheet'}}
function exportSheet(key,anim){return atlas[key][anim].canvas.toDataURL('image/png')}
build();root.ColiseumSprites={definitions:Object.fromEntries(Object.entries(specs).map(([k,v])=>[k,{animations:Object.fromEntries(Object.entries(v).map(([a,[frames,fps]])=>[a,{frames,fps}]))}])),render:draw,choose,exportSheet,FRAME:SIZE,INK};
})(window);
