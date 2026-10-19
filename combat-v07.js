/* Coliseum v0.7 — autonomous arena-fighter fundamentals; deterministic */
(function(root){'use strict';
const CX=270,CY=300,R=218,DT=1/60,TAU=Math.PI*2;
function rng(seed){let x=seed>>>0;return()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const STATS=[{name:'BASTION',color:'#ff816f',hp:300,speed:95,damage:21,reach:61},{name:'VESPER',color:'#6bd5ff',hp:265,speed:114,damage:17,reach:65}];
const MOVES={jab:{startup:.15,active:.12,recovery:.27,range:65,damage:1,guard:17,push:85},heavy:{startup:.37,active:.17,recovery:.46,range:79,damage:1.75,guard:43,push:150}};
function create(seed=1){const random=rng(seed),angle=random()*TAU;const agents=STATS.map((t,i)=>({...t,id:i,maxHp:t.hp,x:CX+Math.cos(angle+i*Math.PI)*108,y:CY+Math.sin(angle+i*Math.PI)*108,vx:0,vy:0,facing:0,state:'neutral',phase:'',timer:0,elapsed:0,action:'',cooldown:.2+random()*.3,guard:100,guardHeld:0,flash:0,hitDone:false,strafe:i?1:-1,choice:0,alive:true,hits:0,blocks:0,whiffs:0,punishes:0,guardBreaks:0,damageDealt:0}));return{mode:'duel',seed,random,agents,time:0,ended:false,winner:null,reason:'',events:[],effects:[],projectiles:[],hill:null,exchanges:0}}
function event(s,msg){s.events.push({time:s.time,msg});if(s.events.length>18)s.events.shift()}
function fx(s,f,color,type='hit'){s.effects.push({x:f.x,y:f.y,color,type,life:.32})}
function bound(f){const x=f.x-CX,y=f.y-CY,d=Math.hypot(x,y);if(d>R-20){f.x=CX+x/d*(R-20);f.y=CY+y/d*(R-20);f.vx*=.3;f.vy*=.3}}
function separate(a,b){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>=43)return;const nx=d>.001?dx/d:1,ny=d>.001?dy/d:0,p=(43-d)/2;a.x-=nx*p;b.x+=nx*p;bound(a);bound(b)}
function start(f,action){f.state=action;f.action=action;f.elapsed=0;f.hitDone=false;if(MOVES[action]){f.phase='startup';f.timer=MOVES[action].startup}else if(action==='block'){f.phase='guard';f.timer=.45;f.guardHeld=.45}else if(action==='sidestep'){f.phase='evade';f.timer=.26;f.side=f.strafe;f.strafe*=-1}else if(action==='dash'){f.phase='movement';f.timer=.21}f.cooldown=.13}
function strike(s,f,o){const m=MOVES[f.action];if(f.hitDone)return;const d=dist(f,o);if(d>m.range+20)return;const ux=(o.x-f.x)/(d||1),uy=(o.y-f.y)/(d||1),dot=ux*Math.cos(f.facing)+uy*Math.sin(f.facing);if(dot<.58)return;f.hitDone=true;s.exchanges++;
 const guard=o.state==='block'&&o.guard>0;const dmg=f.damage*m.damage;
 if(guard){o.blocks++;o.guard=Math.max(0,o.guard-m.guard);o.hp=Math.max(0,o.hp-dmg*.10);fx(s,o,'#f0cc85','block');event(s,o.name+' BLOCKS '+f.name+"'s "+f.action.toUpperCase());o.vx+=ux*m.push*.6;o.vy+=uy*m.push*.6;if(o.guard<=0){o.state='stun';o.phase='broken';o.timer=.9;o.guardBreaks++;event(s,o.name+' GUARD BREAK!');fx(s,o,'#ffad6b','break')}}
 else if(o.state==='sidestep'&&o.phase==='evade'){f.whiffs++;event(s,o.name+' SIDESTEPS '+f.name);return}
 else{o.hp=Math.max(0,o.hp-dmg);o.flash=.20;o.state='stun';o.phase='hit';o.timer=f.action==='heavy'?.43:.26;o.vx+=ux*m.push;o.vy+=uy*m.push;f.hits++;f.damageDealt+=dmg;fx(s,o,'#ffffff');if(f.action==='heavy')event(s,f.name+' LANDS HEAVY!');if(o.hp===0){o.alive=false;event(s,f.name+' KNOCKS OUT '+o.name)}}
}
function decide(s,f,o){const d=dist(f,o),r=s.random(),threat=o.state==='jab'||o.state==='heavy',startup=threat&&o.phase==='startup',recover=threat&&o.phase==='recovery',facing=dist(f,o)<100;
 if(startup&&facing){if(r<.58&&f.guard>10)return start(f,'block');if(r<.81)return start(f,'sidestep')}
 if(recover&&d<100){f.punishes++;return start(f,d<69?'jab':'dash')}
 if(d<75){if(f.guard<22&&r<.28)return start(f,'sidestep');if(r<.50)return start(f,'jab');if(r<.80)return start(f,'heavy');if(r<.94)return start(f,'block');return start(f,'sidestep')}
 if(d<125&&r<.12)return start(f,'dash');
 if(d<110&&r<.07)return start(f,'sidestep');
}
function step(s,dt=DT){if(s.ended)return;s.time+=dt;for(const e of s.effects)e.life-=dt;s.effects=s.effects.filter(e=>e.life>0);const [a,b]=s.agents;
 // Snapshot facing/intent before processing either actor; attacks are resolved after movement.
 for(const f of s.agents){const o=s.agents[1-f.id];f.facing=Math.atan2(o.y-f.y,o.x-f.x);f.flash=Math.max(0,f.flash-dt);f.cooldown=Math.max(0,f.cooldown-dt);if(f.state!=='block')f.guard=Math.min(100,f.guard+17*dt);
 if(f.state==='neutral'&&f.cooldown<=0)decide(s,f,o);
 if(f.state==='neutral'){const d=dist(f,o),ux=(o.x-f.x)/(d||1),uy=(o.y-f.y)/(d||1);const toward=d>70?1:d<45?-.6:0;let mx=ux*toward-uy*f.strafe*.16,my=uy*toward+ux*f.strafe*.16;const edge=Math.hypot(f.x-CX,f.y-CY);if(edge>R-65){mx+=(CX-f.x)/edge*2;my+=(CY-f.y)/edge*2}const m=Math.hypot(mx,my)||1;f.vx+=(mx/m*f.speed-f.vx)*Math.min(1,dt*10);f.vy+=(my/m*f.speed-f.vy)*Math.min(1,dt*10)}
 else if(f.state==='sidestep'){f.vx=-Math.sin(f.facing)*f.side*245;f.vy=Math.cos(f.facing)*f.side*245}
 else if(f.state==='dash'){f.vx=Math.cos(f.facing)*300;f.vy=Math.sin(f.facing)*300}
 else{f.vx*=Math.max(0,1-dt*17);f.vy*=Math.max(0,1-dt*17)}
 f.x+=f.vx*dt;f.y+=f.vy*dt;bound(f)}
 separate(a,b);
 for(const f of s.agents){if(!f.alive)continue;if(f.state==='neutral')continue;f.timer-=dt;f.elapsed+=dt;
 if(MOVES[f.state]){const m=MOVES[f.state];if(f.phase==='startup'&&f.timer<=0){f.phase='active';f.timer+=m.active}if(f.phase==='active'){strike(s,f,s.agents[1-f.id]);if(f.timer<=0){if(!f.hitDone)f.whiffs++;f.phase='recovery';f.timer+=m.recovery}}else if(f.phase==='recovery'&&f.timer<=0){f.state='neutral';f.phase='';f.cooldown=.08+s.random()*.12}}
 else if(f.timer<=0){f.state='neutral';f.phase='';f.cooldown=.08+s.random()*.16}}
 if(!a.alive||!b.alive||s.time>=55){s.ended=true;s.winner=a.hp>b.hp?a:b;s.reason=!a.alive||!b.alive?'knockout':'decision';event(s,s.winner.name+' wins by '+s.reason)}
}
if(typeof module!=='undefined'&&module.exports)module.exports={create,step,CX,CY,R,DT};else root.ColiseumFightingV07={create,step,CX,CY,R,DT};
})(typeof window!=='undefined'?window:null);