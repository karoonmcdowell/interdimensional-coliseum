/* Coliseum v0.8 — readable swipe attacks, hitstun combos, guard breaks, wall splats. */
(function(root){'use strict';
const CX=270,CY=300,R=218,DT=1/60,TAU=Math.PI*2;
function rng(seed){let x=seed>>>0;return()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const MOVES={light:{startup:.11,active:.13,recovery:.16,range:74,damage:12,guard:12,push:105,stun:.44,color:'#f6e8ac',arc:1.5},heavy:{startup:.31,active:.17,recovery:.42,range:84,damage:29,guard:28,push:370,stun:.52,color:'#ffac75',arc:2.0},breaker:{startup:.43,active:.19,recovery:.52,range:82,damage:20,guard:100,push:240,stun:.58,color:'#dd94ff',arc:2.4}};
const STATS=[{name:'BASTION',color:'#ff816f',hp:290,speed:110},{name:'VESPER',color:'#6bd5ff',hp:290,speed:110}];
function create(seed=1){const random=rng(seed),angle=random()*TAU;const agents=STATS.map((t,i)=>({...t,id:i,maxHp:t.hp,x:CX+Math.cos(angle+i*Math.PI)*115,y:CY+Math.sin(angle+i*Math.PI)*115,vx:0,vy:0,facing:0,state:'neutral',phase:'',timer:0,elapsed:0,move:'',hitDone:false,cooldown:.3+random()*.2,guard:100,flash:0,alive:true,combo:0,comboTimer:0,maxCombo:0,hitstun:0,wallStun:0,hits:0,blocks:0,guardBreaks:0,wallSplats:0,damageDealt:0}));return{mode:'duel',seed,random,agents,time:0,ended:false,winner:null,reason:'',events:[],effects:[],projectiles:[],hill:null}}
function event(s,msg){s.events.push({time:s.time,msg});if(s.events.length>16)s.events.shift()}
function fx(s,f,color,type='hit'){s.effects.push({x:f.x,y:f.y,color,type,life:.42})}
function begin(f,move){f.state=move;f.move=move;f.phase='startup';f.timer=MOVES[move].startup;f.elapsed=0;f.hitDone=false}
function guard(f){f.state='block';f.phase='guard';f.timer=.38;f.vx*=.2;f.vy*=.2}
function hit(s,a,b,m){if(!b.alive||a.hitDone)return;const d=dist(a,b);if(d>m.range)return;const dx=(b.x-a.x)/(d||1),dy=(b.y-a.y)/(d||1);if(dx*Math.cos(a.facing)+dy*Math.sin(a.facing)<.42)return;
 a.hitDone=true;const blocked=b.state==='block'&&b.guard>0;
 if(blocked){b.blocks++;b.guard=Math.max(0,b.guard-m.guard);b.hp=Math.max(0,b.hp-m.damage*.08);fx(s,b,'#f4d28b','block');event(s,b.name+' BLOCKS '+a.move.toUpperCase());b.vx=dx*65;b.vy=dy*65;if(b.guard<=0){b.state='guardbreak';b.phase='stun';b.timer=.85;b.guardBreaks++;fx(s,b,'#d68cff','break');event(s,b.name+' GUARD BROKEN!')}return}
 b.hp=Math.max(0,b.hp-m.damage);a.hits++;a.damageDealt+=m.damage;b.flash=.17;
 if(b.comboTimer>0){a.combo++;}else{a.combo=1}a.comboTimer=2.1;a.maxCombo=Math.max(a.maxCombo,a.combo);
 const bonus=a.combo>1?Math.min(.12,(a.combo-1)*.04):0;
 b.state='hitstun';b.phase='stun';b.timer=m.stun+bonus;b.hitstun=b.timer;b.vx=dx*m.push;b.vy=dy*m.push;fx(s,b,m.color);event(s,a.name+' '+a.move.toUpperCase()+(a.combo>1?' · '+a.combo+' HIT COMBO':''));
 if(b.hp<=0){b.alive=false;event(s,a.name+' KNOCKOUT!')}
}
function bound(s,f){const dx=f.x-CX,dy=f.y-CY,d=Math.hypot(dx,dy),limit=R-20;if(d<=limit)return;const nx=dx/d,ny=dy/d;const speed=f.vx*nx+f.vy*ny;f.x=CX+nx*limit;f.y=CY+ny*limit;if(speed>185&&f.state==='hitstun'&&f.alive){f.state='wallsplat';f.phase='stun';f.timer=.85;f.wallStun=.85;f.vx=0;f.vy=0;f.hp=Math.max(0,f.hp-10);f.wallSplats++;fx(s,f,'#ffedb3','wall');event(s,f.name+' WALL SPLAT!');if(f.hp<=0)f.alive=false}else{f.vx-=nx*Math.max(0,speed);f.vy-=ny*Math.max(0,speed)}}
function separate(a,b){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>=42)return;const nx=d>.001?dx/d:1,ny=d>.001?dy/d:0,p=(42-d)/2;a.x-=nx*p;b.x+=nx*p}
function choose(s,f,o){const d=dist(f,o),r=s.random();if(o.state==='startup'&&d<95&&r<.7){guard(f);return}if((o.state==='heavy'||o.state==='breaker')&&o.phase==='startup'&&d<95&&r<.76){guard(f);return}
 if(d>91)return;
 if(o.state==='block'&&r<.62){begin(f,'breaker');return}
 if(o.state==='hitstun'||o.state==='wallsplat'||o.state==='guardbreak'){if(d<90)begin(f,'light');return}
 if(r<.52)begin(f,'light');else if(r<.82)begin(f,'heavy');else if(r<.92)begin(f,'breaker');else guard(f)}
function step(s,dt=DT){if(s.ended)return;s.time+=dt;for(const e of s.effects)e.life-=dt;s.effects=s.effects.filter(e=>e.life>0);
 for(const f of s.agents){const o=s.agents[1-f.id];f.facing=Math.atan2(o.y-f.y,o.x-f.x);f.flash=Math.max(0,f.flash-dt);f.cooldown=Math.max(0,f.cooldown-dt);f.comboTimer=Math.max(0,f.comboTimer-dt);if(f.comboTimer<=0)f.combo=0;if(f.state!=='block')f.guard=Math.min(100,f.guard+11*dt);
 if(f.state==='neutral'){const d=dist(f,o);if(f.cooldown<=0)choose(s,f,o);if(f.state==='neutral'){const ux=(o.x-f.x)/(d||1),uy=(o.y-f.y)/(d||1),dir=d>65?1:d<48?-.45:0;const tangent=(f.id?1:-1)*.12;f.vx+=(ux*dir*f.speed-uy*tangent*f.speed-f.vx)*Math.min(1,dt*9);f.vy+=(uy*dir*f.speed+ux*tangent*f.speed-f.vy)*Math.min(1,dt*9)}}
 if(f.state==='hitstun'){f.vx*=Math.max(0,1-dt*1.2);f.vy*=Math.max(0,1-dt*1.2)}else if(f.state==='wallsplat'){f.vx=0;f.vy=0}else if(f.state!=='neutral'){f.vx*=Math.max(0,1-dt*17);f.vy*=Math.max(0,1-dt*17)}
 f.x+=f.vx*dt;f.y+=f.vy*dt;bound(s,f)}
 separate(s.agents[0],s.agents[1]);for(const f of s.agents)bound(s,f);
 for(const f of s.agents){if(!f.alive||f.state==='neutral')continue;f.timer-=dt;f.elapsed+=dt;
 if(MOVES[f.state]){const m=MOVES[f.state];if(f.phase==='startup'&&f.timer<=0){f.phase='active';f.timer+=m.active}if(f.phase==='active'){hit(s,f,s.agents[1-f.id],m);if(f.timer<=0){f.phase='recovery';f.timer+=m.recovery}}else if(f.phase==='recovery'&&f.timer<=0){f.state='neutral';f.phase='';f.cooldown=.015+s.random()*.045}}
 else if(f.timer<=0){f.state='neutral';f.phase='';f.cooldown=f.state==='block'?.08:.08+s.random()*.08}}
 if(s.time>=55||s.agents.some(f=>!f.alive)){s.ended=true;const [a,b]=s.agents;s.winner=a.hp>=b.hp?a:b;s.reason=s.agents.some(f=>!f.alive)?'knockout':'decision';event(s,s.winner.name+' WINS BY '+s.reason.toUpperCase())}
}
if(typeof module!=='undefined'&&module.exports)module.exports={create,step,CX,CY,R,DT,MOVES};else root.ColiseumFightingV08={create,step,CX,CY,R,DT,MOVES};
})(typeof window!=='undefined'?window:null);