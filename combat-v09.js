/* Coliseum v0.9 — readable swipe attacks, hitstun combos, guard breaks, wall splats. */
(function(root){'use strict';
const CX=270,CY=300,R=218,DT=1/60,TAU=Math.PI*2;
function rng(seed){let x=seed>>>0;return()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const MOVES={light:{startup:.11,active:.13,recovery:.16,range:74,damage:12,guard:12,push:105,stun:.44,color:'#f6e8ac',arc:1.5},heavy:{startup:.31,active:.17,recovery:.42,range:84,damage:29,guard:28,push:370,stun:.52,color:'#ffac75',arc:2.0},breaker:{startup:.43,active:.19,recovery:.52,range:82,damage:20,guard:100,push:240,stun:.58,color:'#dd94ff',arc:2.4}};
const PILLARS=[{x:CX-67,y:CY-67,r:23},{x:CX+67,y:CY-67,r:23},{x:CX-67,y:CY+67,r:23},{x:CX+67,y:CY+67,r:23}];
const BEHAVIORS=['pressure','defensive','flank','bait','reset'];
const STATS=[{name:'BASTION',color:'#ff816f',hp:290,speed:110},{name:'VESPER',color:'#6bd5ff',hp:290,speed:110}];
function create(seed=1){const random=rng(seed),angle=random()*TAU;const agents=STATS.map((t,i)=>({...t,id:i,maxHp:t.hp,x:CX+Math.cos(angle+i*Math.PI)*115,y:CY+Math.sin(angle+i*Math.PI)*115,vx:0,vy:0,facing:0,state:'neutral',phase:'',timer:0,elapsed:0,move:'',hitDone:false,cooldown:.3+random()*.2,guard:100,flash:0,alive:true,combo:0,comboTimer:0,maxCombo:0,hitstun:0,wallStun:0,hits:0,blocks:0,guardBreaks:0,wallSplats:0,damageDealt:0,behavior:i?'flank':'pressure',behaviorTimer:2+random()*2,behaviorChanges:0,strafe:i?1:-1,retreatTimer:0,behaviorBias:random(),dashes:0,sidesteps:0}));return{mode:'duel',seed,random,agents,time:0,ended:false,winner:null,reason:'',events:[],effects:[],projectiles:[],hill:null}}
function event(s,msg){s.events.push({time:s.time,msg});if(s.events.length>16)s.events.shift()}
function fx(s,f,color,type='hit'){s.effects.push({x:f.x,y:f.y,color,type,life:.42})}
function begin(f,move){f.state=move;f.move=move;f.phase='startup';f.timer=MOVES[move].startup;f.elapsed=0;f.hitDone=false}
function dodge(f,kind){f.state=kind;f.phase='movement';f.timer=kind==='dash'?.23:.32;f.elapsed=0;f.side=f.strafe;f.strafe*=-1;if(kind==='dash')f.dashes++;else f.sidesteps++}
function selectBehavior(s,f,o){const hp=f.hp/f.maxHp,guardLow=f.guard<35,opponentStunned=['hitstun','wallsplat','guardbreak'].includes(o.state);let options=guardLow||hp<.30?['defensive','reset','flank']:opponentStunned?['pressure','pressure','flank']:['pressure','defensive','flank','bait','reset'];const next=options[Math.floor(s.random()*options.length)];if(next!==f.behavior){f.behavior=next;f.behaviorChanges++;event(s,f.name+' switches to '+next.toUpperCase())}f.behaviorTimer=2.4+s.random()*3.5}
function pillarCollision(s,f){for(const p of PILLARS){const dx=f.x-p.x,dy=f.y-p.y,d=Math.hypot(dx,dy),min=p.r+20;if(d>=min)continue;const nx=d>.001?dx/d:1,ny=d>.001?dy/d:0,impact=-(f.vx*nx+f.vy*ny);f.x=p.x+nx*min;f.y=p.y+ny*min;if(impact>185&&f.state==='hitstun'&&f.alive){f.state='wallsplat';f.phase='stun';f.timer=.78;f.wallSplats++;f.vx=0;f.vy=0;f.hp=Math.max(0,f.hp-8);fx(s,f,'#ffedb3','wall');event(s,f.name+' SLAMS INTO PILLAR!');if(f.hp<=0)f.alive=false}else{const inward=f.vx*nx+f.vy*ny;if(inward<0){f.vx-=inward*nx;f.vy-=inward*ny}}}}
function steer(s,f,o){const d=dist(f,o),ux=(o.x-f.x)/(d||1),uy=(o.y-f.y)/(d||1),mode=f.behavior;let desired=mode==='pressure'?62:mode==='defensive'?128:mode==='flank'?83:mode==='bait'?98:148;let forward=d>desired+12?1:d<desired-12?-.85:0;let tangent=mode==='flank'?.85:mode==='bait'?.44:mode==='defensive'?.28:.16;let mx=ux*forward-uy*tangent*f.strafe,my=uy*forward+ux*tangent*f.strafe;
 for(const p of PILLARS){const dx=f.x-p.x,dy=f.y-p.y,dd=Math.hypot(dx,dy)||1;if(dd<110){const force=Math.pow((110-dd)/110,2)*4;mx+=dx/dd*force;my+=dy/dd*force;const projected=(p.x-f.x)*mx+(p.y-f.y)*my;if(projected>0&&dd<85){mx+=-dy/dd*f.strafe*1.5;my+=dx/dd*f.strafe*1.5}}}
 const edge=Math.hypot(f.x-CX,f.y-CY)||1;if(edge>R-65){mx+=(CX-f.x)/edge*2.3;my+=(CY-f.y)/edge*2.3}const mag=Math.hypot(mx,my)||1;f.vx+=(mx/mag*f.speed-f.vx)*Math.min(1,dtForSteer);f.vy+=(my/mag*f.speed-f.vy)*Math.min(1,dtForSteer)}
const dtForSteer=DT*9;
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
function choose(s,f,o){const d=dist(f,o),r=s.random(),mode=f.behavior;const threatened=!!MOVES[o.state]&&o.phase==='startup'&&d<105;
 if(threatened){if(mode==='flank'&&r<.45){dodge(f,'sidestep');return}if(r<(mode==='defensive'?.88:.60)){guard(f);return}if(r<.78){dodge(f,'dash');return}}
 if(d>115){if(mode==='pressure'&&d<155&&r<.16)dodge(f,'dash');else if(mode==='flank'&&r<.10)dodge(f,'sidestep');return}
 if(mode==='reset'){if(r<.48){dodge(f,'dash');return}if(r<.65){guard(f);return}}
 if(mode==='defensive'){if(r<.42){guard(f);return}if(r<.66){dodge(f,'sidestep');return}}
 if(mode==='flank'&&r<.32){dodge(f,'sidestep');return}
 if(mode==='bait'&&r<.35){guard(f);return}
 if(d>90)return;
 if(o.state==='block'&&r<.70){begin(f,'breaker');return}
 if(['hitstun','wallsplat','guardbreak'].includes(o.state)){if(d<90)begin(f,'light');return}
 if(r<(mode==='pressure'?.65:.48))begin(f,'light');else if(r<.83)begin(f,'heavy');else if(r<.94)begin(f,'breaker');else guard(f)}
function step(s,dt=DT){if(s.ended)return;s.time+=dt;for(const e of s.effects)e.life-=dt;s.effects=s.effects.filter(e=>e.life>0);
 for(const f of s.agents){const o=s.agents[1-f.id];f.facing=Math.atan2(o.y-f.y,o.x-f.x);f.flash=Math.max(0,f.flash-dt);f.cooldown=Math.max(0,f.cooldown-dt);f.comboTimer=Math.max(0,f.comboTimer-dt);if(f.comboTimer<=0)f.combo=0;if(f.state!=='block')f.guard=Math.min(100,f.guard+11*dt);f.behaviorTimer-=dt;if(f.behaviorTimer<=0)selectBehavior(s,f,o);
 if(f.state==='neutral'){if(f.cooldown<=0)choose(s,f,o);if(f.state==='neutral')steer(s,f,o)}
 if(f.state==='hitstun'){f.vx*=Math.max(0,1-dt*1.2);f.vy*=Math.max(0,1-dt*1.2)}else if(f.state==='wallsplat'){f.vx=0;f.vy=0}else if(f.state==='sidestep'){f.vx=-Math.sin(f.facing)*f.side*235;f.vy=Math.cos(f.facing)*f.side*235}else if(f.state==='dash'){const sign=f.behavior==='reset'||f.behavior==='defensive'?-1:1;f.vx=Math.cos(f.facing)*310*sign;f.vy=Math.sin(f.facing)*310*sign}else if(f.state!=='neutral'){f.vx*=Math.max(0,1-dt*17);f.vy*=Math.max(0,1-dt*17)}
 f.x+=f.vx*dt;f.y+=f.vy*dt;pillarCollision(s,f);bound(s,f)}
 separate(s.agents[0],s.agents[1]);for(const f of s.agents){pillarCollision(s,f);bound(s,f)}
 for(const f of s.agents){if(!f.alive||f.state==='neutral')continue;f.timer-=dt;f.elapsed+=dt;
 if(MOVES[f.state]){const m=MOVES[f.state];if(f.phase==='startup'&&f.timer<=0){f.phase='active';f.timer+=m.active}if(f.phase==='active'){hit(s,f,s.agents[1-f.id],m);if(f.timer<=0){f.phase='recovery';f.timer+=m.recovery}}else if(f.phase==='recovery'&&f.timer<=0){f.state='neutral';f.phase='';f.cooldown=.015+s.random()*.045}}
 else if(f.timer<=0){f.state='neutral';f.phase='';f.cooldown=f.state==='block'?.08:.08+s.random()*.08}}
 if(s.time>=55||s.agents.some(f=>!f.alive)){s.ended=true;const [a,b]=s.agents;s.winner=a.hp>=b.hp?a:b;s.reason=s.agents.some(f=>!f.alive)?'knockout':'decision';event(s,s.winner.name+' WINS BY '+s.reason.toUpperCase())}
}
if(typeof module!=='undefined'&&module.exports)module.exports={create,step,CX,CY,R,DT,MOVES,PILLARS};else root.ColiseumFightingV09={create,step,CX,CY,R,DT,MOVES,PILLARS};
})(typeof window!=='undefined'?window:null);