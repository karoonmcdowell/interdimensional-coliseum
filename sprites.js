/* 36px single-ink character sprites, authored as pixel clusters. Art and mechanics are independent. */
(function(root){'use strict';
const SIZE=36,INK={BASTION:'#ff816f',VESPER:'#6bd5ff'};
const specs={
 BASTION:{idle:[2,2],walk:[4,7],ability_dash:[4,12],ability_teleport:[4,12],loss:[3,5],win:[3,5]},
 VESPER:{idle:[2,2],walk:[4,9],ability_shoot:[3,13],ability_roll:[4,12],loss:[3,5],win:[3,5]}
};
const atlas={};
function pixel(ctx,x,y,w,h){ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function pose(ctx,key,anim,frame){
 ctx.fillStyle=INK[key];
 const p=(x,y,w,h)=>pixel(ctx,x,y,w,h),walk=anim==='walk',step=walk?[-2,1,2,-1][frame%4]:0,breath=anim==='idle'?frame%2:0;
 if(key==='BASTION'){
  const dash=anim==='ability_dash',win=anim==='win',loss=anim==='loss',warp=anim==='ability_teleport';
  if(loss){ctx.save();ctx.translate(17,30);ctx.rotate([0,.65,1.35][frame%3]);ctx.translate(-17,-30)}
  const lean=dash?[0,2,4,5][frame%4]:0,drop=dash?[0,2,3,2][frame%4]:0;
  // Helmet crest, brow and deep neck; heavy broad shoulders.
  p(12+lean,2+drop+breath,9,3);p(10+lean,5+drop+breath,14,3);p(11+lean,8+drop+breath,12,5);
  p(14+lean,9+drop+breath,8,2);
  p(8+lean,14+drop,17,4);p(6+lean,18+drop,21,8);p(9+lean,26+drop,16,3);
  // Thick planted legs with gait shift and weight.
  p(9+lean+step,28+drop,7,5);p(19+lean-step,28+drop,7,5);
  p(7+lean+step,32+drop,10,3);p(18+lean-step,32+drop,11,3);
  // Rear gauntlet and unmistakable forward shield.
  p(4+lean,18+drop,5,10);p(2+lean,26+drop,7,4);
  if(win){p(27,4,6,19);p(29,2,4,3)}
  else if(dash){p(27+Math.min(lean,3),12+drop,7,17);p(29+Math.min(lean,3),9+drop,5,4)}
  else{p(27,15+drop,7,16);p(29,12+drop,5,4)}
  if(warp&&frame%4===2){ctx.clearRect(0,0,36,36);p(7,8,3,4);p(26,17,4,5);p(14,29,4,3)}
  if(loss)ctx.restore();
 }else{
  const shoot=anim==='ability_shoot',roll=anim==='ability_roll',win=anim==='win',loss=anim==='loss';
  if(roll){const k=frame%4;p(6+k*2,22-(k%2)*3,16,5);p(10+k*2,18-(k%2)*3,11,5);p(4+k*2,27,11,4);p(21+k,26,7,3);return}
  if(loss){ctx.save();ctx.translate(16,28);ctx.rotate([0,.7,1.4][frame%3]);ctx.translate(-16,-28)}
  // Distinctive wide hat with turned brim and high crown.
  p(7,8+breath,22,3);p(11,3+breath,13,6);p(13,1+breath,9,3);
  p(13,11+breath,10,6);p(23,12+breath,4,3);
  // Hair/scarf streaming behind; narrow waist and angled hip.
  p(8,12+breath,5,5);p(5,15+breath,6,3);p(3,18+breath,5,2);
  p(13,17+breath,10,5);p(15,22,7,3);p(12,25,13,4);
  p(11+step,28,6,4);p(21-step,28,5,4);
  p(8+step,32,9,3);p(20-step,32,9,3);
  p(10,20,4,6);p(8,25,4,4);
  if(shoot){const recoil=frame===1?1:0;p(23,19+recoil,7,3);p(29,18+recoil,7,3)}
  else if(win){p(24,8,4,13);p(26,5,5,4)}
  else{p(23,22,6,3);p(27,20,6,3)}
  if(loss)ctx.restore();
 }
}
function build(){for(const key of Object.keys(specs)){atlas[key]={};for(const [anim,[count,fps]] of Object.entries(specs[key])){const c=document.createElement('canvas');c.width=SIZE*count;c.height=SIZE;const x=c.getContext('2d');for(let f=0;f<count;f++){x.save();x.translate(f*SIZE,0);pose(x,key,anim,f);x.restore()}atlas[key][anim]={canvas:c,count,fps}}}}
function choose(f){if(!f.alive)return 'loss';if(f.key==='BASTION'){if(f.teleFx>0)return 'ability_teleport';if(f.dashLeft>0)return 'ability_dash'}else if(f.shotFx>0)return 'ability_shoot';return Math.hypot(f.vx||0,f.vy||0)>15?'walk':'idle'}
function draw(ctx,f,t,opts={}){const key=f.key||'BASTION',anim=opts.animation||choose(f),data=atlas[key]?.[anim]||atlas[key].idle,elapsed=opts.elapsed??t,frame=Math.floor(elapsed*data.fps)%data.count,scale=opts.scale||1.1;
 ctx.save();ctx.translate(f.x,f.y);const facing=opts.facing??f.facing??1;if(facing<0)ctx.scale(-1,1);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=false;ctx.drawImage(data.canvas,frame*SIZE,0,SIZE,SIZE,-18,-34,SIZE,SIZE);ctx.restore();return {animation:anim,frame,source:'36px sprite sheet'}}
function exportSheet(key,anim){return atlas[key][anim].canvas.toDataURL('image/png')}
build();root.ColiseumSprites={definitions:Object.fromEntries(Object.entries(specs).map(([k,v])=>[k,{animations:Object.fromEntries(Object.entries(v).map(([a,[frames,fps]])=>[a,{frames,fps}]))}])),render:draw,choose,exportSheet,FRAME:SIZE,INK};
})(window);
