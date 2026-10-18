/* Coliseum v0.4 — deterministic headless/browser duel engine */
(function(root){'use strict';
const CX=270,CY=300,R=218,TAU=Math.PI*2,DT=1/60;
const BASE={
 BASTION:{name:'BASTION',color:'#ff816f',label:'Dash tank / teleporter',hp:230,armor:.24,walk:30,dashDamage:48,dashCD:2.9,teleCD:10.8,dashSpeed:520,dashDuration:.28},
 VESPER:{name:'VESPER',color:'#6bd5ff',label:'Mobile ranged gunner',hp:125,armor:.03,walk:132,shotDamage:23,shotCD:.72,bulletSpeed:350,preferred:165}
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rng(seed){let s=seed>>>0;return ()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function create(seed=1,settings={}){const random=rng(seed),angle=random()*TAU,offset=125,swap=random()<.5?1:-1;
 const cfg={BASTION:{...BASE.BASTION,...(settings.BASTION||{})},VESPER:{...BASE.VESPER,...(settings.VESPER||{})}};
 const agents=['BASTION','VESPER'].map((key,i)=>{const t=cfg[key],a=angle+(i?Math.PI:0);return {...t,key,id:i,x:CX+Math.cos(a)*offset,y:CY+Math.sin(a)*offset,vx:0,vy:0,hp:t.hp,maxHp:t.hp,alive:true,heading:a+(i?Math.PI:0),dashCd:i===0?random()*.6:0,teleCd:i===0?2+random()*1.4:0,shotCd:i===1?random()*.45:0,dashLeft:0,dashHit:false,teleFx:0,flash:0,aim:0,strafe:swap,decision:0,stun:0,dealt:0,shots:0,hits:0,abilities:0}});
 return {seed,random,cfg,agents,time:0,ended:false,winner:null,reason:'',events:[],projectiles:[],effects:[],lastDamage:0,damageRamp:0};}
function event(s,msg){s.events.push({time:s.time,msg});if(s.events.length>25)s.events.shift()}
function effect(s,x,y,color,type='spark'){if(s.effects.length<100)s.effects.push({x,y,color,type,life:.35})}
function bound(a){const dx=a.x-CX,dy=a.y-CY,d=Math.hypot(dx,dy),lim=R-14;if(d>lim){const nx=dx/d,ny=dy/d;a.x=CX+nx*lim;a.y=CY+ny*lim;const v=a.vx*nx+a.vy*ny;if(v>0){a.vx-=v*nx;a.vy-=v*ny}}}
function hit(s,attacker,victim,raw,kind){if(!victim.alive)return;const dmg=Math.max(1,raw*(1-victim.armor));victim.hp=Math.max(0,victim.hp-dmg);victim.flash=.14;attacker.dealt+=dmg;attacker.hits++;s.lastDamage=s.time;effect(s,victim.x,victim.y,victim.color);if(victim.hp<=0){victim.alive=false;event(s,`${attacker.name} eliminates ${victim.name} (${kind})`);}}
function move(a,dx,dy,dt,speed,accel=550){const mag=Math.hypot(dx,dy)||1;const tx=dx/mag*speed,ty=dy/mag*speed;const k=Math.min(1,accel*dt/Math.max(1,Math.hypot(tx-a.vx,ty-a.vy)));a.vx+=(tx-a.vx)*k;a.vy+=(ty-a.vy)*k;a.x+=a.vx*dt;a.y+=a.vy*dt;bound(a)}
function teleport(s,a,b){const r=s.random();let best=null,bestScore=-1e9;for(let i=0;i<12;i++){const theta=s.random()*TAU,rr=45+Math.sqrt(s.random())*(R-67),x=CX+Math.cos(theta)*rr,y=CY+Math.sin(theta)*rr,d=Math.hypot(x-b.x,y-b.y);const score=-Math.abs(d-105)+s.random()*40;if(score>bestScore){bestScore=score;best={x,y}}}
 effect(s,a.x,a.y,a.color,'warp');a.x=best.x;a.y=best.y;a.vx=0;a.vy=0;a.teleCd=a.teleCD;a.teleFx=.4;a.abilities++;effect(s,a.x,a.y,a.color,'warp');event(s,'BASTION teleports');}
function step(s,dt=DT){if(s.ended)return;s.time+=dt;const a=s.agents[0],b=s.agents[1];
 for(const p of s.effects)p.life-=dt;s.effects=s.effects.filter(p=>p.life>0);
 for(const p of s.projectiles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}
 for(const f of s.agents){f.flash=Math.max(0,f.flash-dt);f.teleFx=Math.max(0,f.teleFx-dt);f.stun=Math.max(0,f.stun-dt)}
 a.dashCd=Math.max(0,a.dashCd-dt);a.teleCd=Math.max(0,a.teleCd-dt);b.shotCd=Math.max(0,b.shotCd-dt);
 const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),nx=dx/d,ny=dy/d;
 // Bastion: slow approach, burst commitment, rare teleport to break stalemates.
 if(a.dashLeft>0){const ox=a.x,oy=a.y;a.x+=a.vx*dt;a.y+=a.vy*dt;bound(a);a.dashLeft-=dt;
  const segx=a.x-ox,segy=a.y-oy,seglen=segx*segx+segy*segy;let t=seglen?clamp(((b.x-ox)*segx+(b.y-oy)*segy)/seglen,0,1):0;
  if(!a.dashHit&&Math.hypot(ox+segx*t-b.x,oy+segy*t-b.y)<26){a.dashHit=true;hit(s,a,b,a.dashDamage,'dash');b.vx+=a.vx*.20;b.vy+=a.vy*.20;effect(s,b.x,b.y,'#fff5b2','impact')}
  if(a.dashLeft<=0){a.vx*=.18;a.vy*=.18;}
 }else{
  const lateral=(a.strafe||1)*.16;
  move(a,nx-ny*lateral,ny+nx*lateral,dt,a.walk,350);
  if(a.teleCd<=0&&(d>155||a.hp/a.maxHp<.45)&&s.random()<dt*.95)teleport(s,a,b);
  const nd=distance(a,b);
  if(a.dashCd<=0&&nd<250){const lead=.12;let tx=b.x+b.vx*lead-a.x,ty=b.y+b.vy*lead-a.y;const m=Math.hypot(tx,ty)||1;
   const err=(s.random()-.5)*.20,cs=Math.cos(err),sn=Math.sin(err);a.vx=(tx/m*cs-ty/m*sn)*a.dashSpeed;a.vy=(tx/m*sn+ty/m*cs)*a.dashSpeed;a.heading=Math.atan2(a.vy,a.vx);a.dashLeft=a.dashDuration;a.dashCd=a.dashCD*(.9+s.random()*.2);a.dashHit=false;a.abilities++;event(s,'BASTION dashes');}
 }
 // Vesper: standoff distance, tangential strafing, wall-aware repositioning, aimed projectiles.
 if(b.alive){const xx=a.x-b.x,yy=a.y-b.y,dd=Math.max(1,Math.hypot(xx,yy)),ux=xx/dd,uy=yy/dd;
 b.decision-=dt;if(b.decision<=0){b.decision=1.1+s.random()*1.6;if(s.random()<.52)b.strafe*=-1;}
 let forward=dd<b.preferred-22?-1:dd>b.preferred+30?.70:0;
 let mx=ux*forward-uy*b.strafe*.85,my=uy*forward+ux*b.strafe*.85;
 const edge=Math.hypot(b.x-CX,b.y-CY);if(edge>R-65){mx+=(CX-b.x)/edge*2.2;my+=(CY-b.y)/edge*2.2;}
 if(a.dashLeft>0&&dd<110){mx-=ux*1.2;my-=uy*1.2;}
 move(b,mx,my,dt,b.walk,780);
 if(b.shotCd<=0){const dd2=distance(a,b);if(dd2<340){const flight=dd2/b.bulletSpeed,tx=a.x+a.vx*flight*.65-b.x,ty=a.y+a.vy*flight*.65-b.y,m=Math.hypot(tx,ty)||1;
 const spread=(s.random()-.5)*.12,cs=Math.cos(spread),sn=Math.sin(spread);s.projectiles.push({x:b.x,y:b.y,vx:(tx/m*cs-ty/m*sn)*b.bulletSpeed,vy:(tx/m*sn+ty/m*cs)*b.bulletSpeed,life:1.7,owner:1});b.shotCd=b.shotCD*(.90+s.random()*.2);b.shots++;effect(s,b.x,b.y,b.color,'muzzle');}}
 }
 // Bullet collision, including dash vulnerability.
 const keep=[];for(const p of s.projectiles){if(p.life<=0||Math.hypot(p.x-CX,p.y-CY)>R-5)continue;if(Math.hypot(p.x-a.x,p.y-a.y)<17){hit(s,b,a,b.shotDamage,'shot');continue}keep.push(p)}s.projectiles=keep;
 // Anti-stall: progressively stronger global damage after 45 seconds, identical raw damage per second.
 // Because armor is ignored here, this is not a hidden advantage for either fighter.
 if(s.time>45){const fatigue=(s.time-45)*.065*dt;for(const f of s.agents)if(f.alive){f.hp=Math.max(0,f.hp-fatigue);if(f.hp===0){f.alive=false;event(s,`${f.name} falls in overtime`)}}}
 if(!a.alive||!b.alive||s.time>=110){s.ended=true;if(a.alive&&!b.alive)s.winner=a;else if(b.alive&&!a.alive)s.winner=b;else {const ah=a.hp/a.maxHp,bh=b.hp/b.maxHp;s.winner=ah>bh?a:bh>ah?b:(a.dealt>=b.dealt?a:b);s.reason='decision';}event(s,`${s.winner.name} wins${s.reason?' by decision':''}`)}
}
if(typeof module!=='undefined'&&module.exports)module.exports={create,step,BASE,CX,CY,R,DT};else root.ColiseumEngine={create,step,BASE,CX,CY,R,DT};
})(typeof window!=='undefined'?window:null);
