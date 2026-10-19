/* Coliseum Royale — deterministic four-fighter free-for-all, shared sprite archetypes */
(function(root){'use strict';
const CX=270,CY=300,R=218,DT=1/60,TAU=Math.PI*2;
const templates=[
 {key:'BASTION',name:'BASTION',color:'#ff816f',label:'Tank · shield & charge',hp:260,armor:.20,speed:74,range:36,damage:26,cooldown:2.5},
 {key:'VESPER',name:'VESPER',color:'#6bd5ff',label:'Gunner · ranged',hp:165,armor:.04,speed:105,range:195,damage:12,cooldown:.88},
 {key:'BASTION',name:'BASTION II',color:'#ffb76b',label:'Tank · shield & charge',hp:260,armor:.20,speed:74,range:36,damage:26,cooldown:2.5},
 {key:'VESPER',name:'VESPER II',color:'#9ae8e4',label:'Gunner · ranged',hp:165,armor:.04,speed:105,range:195,damage:12,cooldown:.88}
];
function rng(seed){let s=seed>>>0;return ()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function bound(f){const dx=f.x-CX,dy=f.y-CY,d=Math.hypot(dx,dy);if(d>R-16){f.x=CX+dx/d*(R-16);f.y=CY+dy/d*(R-16)}}
function create(seed=1){const random=rng(seed),angle=random()*TAU;
 const agents=templates.map((t,i)=>{const theta=angle+i*TAU/4,rad=145;return {...t,id:i,x:CX+Math.cos(theta)*rad,y:CY+Math.sin(theta)*rad,vx:0,vy:0,hp:t.hp,maxHp:t.hp,alive:true,facing:1,flash:0,dashLeft:0,teleFx:0,shotFx:0,shotCd:random()*.6,dashCd:random()*1.5,teleCd:0,stun:0,dealt:0,hits:0,shots:0,abilities:0,strafe:random()<.5?-1:1,decision:random()*2,target:-1,kills:0}});return {seed,random,agents,mode:'royale',time:0,ended:false,winner:null,reason:'',events:[],projectiles:[],effects:[],hazards:[],hill:null,eliminations:[],round:0};}
function event(s,msg){s.events.push({time:s.time,msg});if(s.events.length>30)s.events.shift()}
function effect(s,x,y,color,type='spark'){if(s.effects.length<100)s.effects.push({x,y,color,type,life:.35})}
function damage(s,attacker,victim,amount,kind){if(!victim.alive)return;const dealt=Math.max(1,amount*(1-victim.armor));victim.hp=Math.max(0,victim.hp-dealt);victim.flash=.15;attacker.dealt+=dealt;attacker.hits++;effect(s,victim.x,victim.y,victim.color);if(victim.hp===0){victim.alive=false;attacker.kills++;s.eliminations.push({time:s.time,killer:attacker.id,victim:victim.id});event(s,attacker.name+' eliminates '+victim.name+' ('+kind+')')}}
function step(s,dt=DT){if(s.ended)return;s.time+=dt;const alive=s.agents.filter(f=>f.alive);
 for(const fx of s.effects)fx.life-=dt;s.effects=s.effects.filter(fx=>fx.life>0);
 for(const f of alive){f.flash=Math.max(0,f.flash-dt);f.shotFx=Math.max(0,f.shotFx-dt);f.teleFx=Math.max(0,f.teleFx-dt);f.shotCd-=dt;f.dashCd-=dt;f.decision-=dt;
  const opponents=alive.filter(o=>o.id!==f.id);if(!opponents.length)continue;
  // Nearest live opponent, with target persistence to avoid jitter.
  const current=opponents.find(o=>o.id===f.target),nearest=opponents.reduce((best,o)=>!best||dist(f,o)<dist(f,best)?o:best,null);
  const target=current&&dist(f,current)<dist(f,nearest)+55?current:nearest;f.target=target.id;
  const dx=target.x-f.x,dy=target.y-f.y,d=Math.max(1,Math.hypot(dx,dy)),ux=dx/d,uy=dy/d;f.facing=dx>=0?1:-1;
  if(f.decision<=0){f.decision=1+s.random()*2;if(s.random()<.4)f.strafe*=-1}
  let mx,my;
  if(f.key==='BASTION'){mx=ux-uy*f.strafe*.17;my=uy+ux*f.strafe*.17}
  else{const approach=d>f.range+28?.8:d<f.range-30?-1.1:0;mx=ux*approach-uy*f.strafe*.75;my=uy*approach+ux*f.strafe*.75}
  // Move inward as the safe ring shrinks during overtime.
  const safeRadius=Math.max(88,R-16-Math.max(0,s.time-18)*2.3),fromCenter=Math.hypot(f.x-CX,f.y-CY);
  if(fromCenter>safeRadius-25){mx+=(CX-f.x)/fromCenter*2.5;my+=(CY-f.y)/fromCenter*2.5}
  const mag=Math.hypot(mx,my)||1,speed=f.speed,tx=mx/mag*speed,ty=my/mag*speed;
  const k=Math.min(1,dt*9);f.vx+=(tx-f.vx)*k;f.vy+=(ty-f.vy)*k;
  f.x+=f.vx*dt;f.y+=f.vy*dt;bound(f);
  if(f.key==='BASTION'&&f.dashCd<=0&&d<120){f.dashCd=f.cooldown*(.8+s.random()*.4);f.dashLeft=.24;f.abilities++;f.x+=ux*45;f.y+=uy*45;bound(f);if(dist(f,target)<56){damage(s,f,target,f.damage,'charge');target.x+=ux*30;target.y+=uy*30;bound(target)}effect(s,f.x,f.y,'#ffb76b','impact');event(s,f.name+' charges')}
  if(f.key==='VESPER'&&f.shotCd<=0&&d<320){f.shotCd=f.cooldown*(.85+s.random()*.3);const lead=d/320,ax=target.x+target.vx*lead*.55-f.x,ay=target.y+target.vy*lead*.55-f.y,ang=Math.atan2(ay,ax)+(s.random()-.5)*.11;s.projectiles.push({x:f.x,y:f.y,vx:Math.cos(ang)*340,vy:Math.sin(ang)*340,life:1.5,owner:f.id});f.shots++;f.shotFx=.2}
 }
 for(const p of s.projectiles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;for(const victim of s.agents){if(p.life<=0||!victim.alive||victim.id===p.owner)continue;if(Math.hypot(p.x-victim.x,p.y-victim.y)<18){damage(s,s.agents[p.owner],victim,s.agents[p.owner].damage,'shot');p.life=0;break}}}
 s.projectiles=s.projectiles.filter(p=>p.life>0&&Math.hypot(p.x-CX,p.y-CY)<R-6);
 const safeRadius=Math.max(88,R-16-Math.max(0,s.time-18)*2.3);s.safeRadius=safeRadius;
 if(s.time>18){for(const f of s.agents)if(f.alive&&Math.hypot(f.x-CX,f.y-CY)>safeRadius){f.hp=Math.max(0,f.hp-13*dt);if(!f.hp){f.alive=false;s.eliminations.push({time:s.time,killer:null,victim:f.id});event(s,f.name+' falls outside the safe zone')}}}
 const remaining=s.agents.filter(f=>f.alive);
 if(remaining.length<=1||s.time>=85){s.ended=true;s.winner=remaining.length===1?remaining[0]:[...s.agents].sort((a,b)=>(b.alive-a.alive)||(b.hp/b.maxHp-a.hp/a.maxHp)||(b.dealt-a.dealt))[0];s.reason=remaining.length===1?'last standing':'decision';event(s,s.winner.name+' wins the battle royale')}
}
if(typeof module!=='undefined'&&module.exports)module.exports={create,step,CX,CY,R,DT};else root.ColiseumRoyale={create,step,CX,CY,R,DT};
})(typeof window!=='undefined'?window:null);
