/* v0.6 Fighting Duel prototype: circles, deterministic autonomous combat. */
(function(root){'use strict';
const CX=270,CY=300,R=218,DT=1/60,TAU=Math.PI*2;
function rng(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
const configs=[
 {name:'BASTION',color:'#ff816f',hp:235,speed:108,reach:45,attack:20,guard:.72,weight:1.25},
 {name:'VESPER',color:'#6bd5ff',hp:220,speed:112,reach:52,attack:16,guard:.68,weight:1}
];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function create(seed=1){const random=rng(seed),angle=random()*TAU;const agents=configs.map((t,i)=>({...t,id:i,x:CX+Math.cos(angle+i*Math.PI)*125,y:CY+Math.sin(angle+i*Math.PI)*125,vx:0,vy:0,facing:0,alive:true,maxHp:t.hp,guardMeter:100,state:'neutral',stateLeft:0,cooldown:.3+random()*.3,decision:0,strafe:i?1:-1,blocking:false,stun:0,flash:0,attackType:'',attackHit:false,dashes:0,hits:0,blocks:0,counters:0,damage:0}));return{mode:'duel',seed,random,agents,time:0,ended:false,winner:null,reason:'',events:[],effects:[],projectiles:[],hill:null,round:1}}
function event(s,msg){s.events.push({time:s.time,msg});if(s.events.length>16)s.events.shift()}
function effect(s,x,y,color,type='impact'){s.effects.push({x,y,color,type,life:.28})}
function bound(f){const dx=f.x-CX,dy=f.y-CY,d=Math.hypot(dx,dy),max=R-19;if(d>max){f.x=CX+dx/d*max;f.y=CY+dy/d*max;f.vx*=.5;f.vy*=.5}}
function separate(a,b){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=39;if(d>=min)return;const nx=d>1e-5?dx/d:1,ny=d>1e-5?dy/d:0,push=(min-d)/2;a.x-=nx*push;b.x+=nx*push;a.vx-=nx*push*3;b.vx+=nx*push*3;bound(a);bound(b)}
function hurt(s,attacker,victim,base,heavy){if(!victim.alive)return;const blocking=victim.state==='block',counter=victim.state==='counter';if(counter){attacker.stun=.55;attacker.state='stun';attacker.stateLeft=.55;victim.counters++;effect(s,victim.x,victim.y,'#c5f8d1','counter');event(s,victim.name+' COUNTERS '+attacker.name);return}
 if(blocking&&victim.guardMeter>0){const chip=base*.12;victim.hp=Math.max(0,victim.hp-chip);victim.guardMeter=Math.max(0,victim.guardMeter-(heavy?36:20));victim.blocks++;effect(s,victim.x,victim.y,'#f5d388','block');if(victim.guardMeter===0){victim.state='stun';victim.stateLeft=.85;event(s,victim.name+' GUARD BROKEN')}return}
 const dmg=base;victim.hp=Math.max(0,victim.hp-dmg);victim.flash=.18;victim.state='stun';victim.stateLeft=heavy?.34:.20;victim.stun=victim.stateLeft;attacker.hits++;attacker.damage+=dmg;const dx=victim.x-attacker.x,dy=victim.y-attacker.y,d=Math.hypot(dx,dy)||1;victim.vx+=dx/d*(heavy?165:80);victim.vy+=dy/d*(heavy?165:80);effect(s,victim.x,victim.y,heavy?'#ffb76b':'#ffffff');if(victim.hp<=0){victim.alive=false;event(s,attacker.name+' WINS BY KNOCKOUT')}}
function act(s,f,other,kind){const specs={jab:[.13,.12,.18,0],heavy:[.30,.16,.42,0],dash:[.09,.23,.25,0],sidestep:[.04,.20,.15,0],block:[0,.46,.10,0],counter:[.06,.24,.22,0]};const [wind,active,recovery]=specs[kind];f.state=kind;f.stateLeft=wind+active+recovery;f.phase=wind;f.active=active;f.recovery=recovery;f.attackHit=false;f.attackType=kind;f.cooldown=.12;f.blocking=kind==='block';if(kind==='dash'){f.dashes++;f.dashX=Math.cos(f.facing);f.dashY=Math.sin(f.facing)}if(kind==='sidestep'){f.sideX=-Math.sin(f.facing)*f.strafe;f.sideY=Math.cos(f.facing)*f.strafe;f.strafe*=-1}if(kind==='heavy')event(s,f.name+' winds up a heavy strike')}
function step(s,dt=DT){if(s.ended)return;s.time+=dt;const [a,b]=s.agents;
 for(const e of s.effects)e.life-=dt;s.effects=s.effects.filter(e=>e.life>0);
 for(const f of s.agents){const other=s.agents[1-f.id];f.flash=Math.max(0,f.flash-dt);f.cooldown=Math.max(0,f.cooldown-dt);f.guardMeter=Math.min(100,f.guardMeter+(f.state==='block'?0:13)*dt);f.facing=Math.atan2(other.y-f.y,other.x-f.x);
  if(f.state!=='neutral'){f.stateLeft-=dt;if(f.state==='dash'){f.vx=f.dashX*340;f.vy=f.dashY*340}else if(f.state==='sidestep'){f.vx=f.sideX*225;f.vy=f.sideY*225}else{f.vx*=Math.max(0,1-dt*12);f.vy*=Math.max(0,1-dt*12)}
   if((f.state==='jab'||f.state==='heavy')&&!f.attackHit){const elapsed=(f.phase+f.active+f.recovery)-f.stateLeft;if(elapsed>=f.phase&&elapsed<f.phase+f.active&&distance(f,other)<(f.state==='heavy'?66:56)){const facingDot=((other.x-f.x)*Math.cos(f.facing)+(other.y-f.y)*Math.sin(f.facing))/Math.max(1,distance(f,other));if(facingDot>.25){f.attackHit=true;hurt(s,f,other,f.attack*(f.state==='heavy'?2.0:1.25),f.state==='heavy')}}}
   if(f.stateLeft<=0){f.state='neutral';f.blocking=false;f.cooldown=.04+s.random()*.12}
  }else{const d=distance(f,other),ux=(other.x-f.x)/(d||1),uy=(other.y-f.y)/(d||1);let forward=d>52?1:d<38?-.45:0;const lateral=f.strafe*.23;let mx=ux*forward-uy*lateral,my=uy*forward+ux*lateral;const edge=Math.hypot(f.x-CX,f.y-CY);if(edge>R-60){mx+=(CX-f.x)/edge*2;my+=(CY-f.y)/edge*2}const m=Math.hypot(mx,my)||1;f.vx+=(mx/m*f.speed-f.vx)*Math.min(1,dt*10);f.vy+=(my/m*f.speed-f.vy)*Math.min(1,dt*10);
   if(f.cooldown<=0&&other.alive){const r=s.random();if(other.state==='heavy'&&d<100&&r<.58)act(s,f,other,r<.25?'counter':'sidestep');else if(other.state==='jab'&&d<72&&r<.7)act(s,f,other,r<.22?'counter':'block');else if(d<75)act(s,f,other,r<.37?'jab':r<.65?'heavy':r<.83?'block':'sidestep');else if(d<140&&r<.14)act(s,f,other,'dash');else if(d<120&&r<.23)act(s,f,other,'sidestep')}
  }
  f.x+=f.vx*dt;f.y+=f.vy*dt;bound(f);
 }
 separate(a,b);
 if(!a.alive||!b.alive||s.time>=45){s.ended=true;s.winner=a.hp>b.hp?a:b;s.reason=(!a.alive||!b.alive)?'knockout':'decision';event(s,s.winner.name+' wins by '+s.reason)}
}
if(typeof module!=='undefined'&&module.exports)module.exports={create,step,CX,CY,R,DT};else root.ColiseumFighting={create,step,CX,CY,R,DT};
})(typeof window!=='undefined'?window:null);
