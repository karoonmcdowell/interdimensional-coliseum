/* Coliseum v0.4 — deterministic headless/browser duel engine */
(function(root){'use strict';
const CX=270,CY=300,R=218,TAU=Math.PI*2,DT=1/60;
const BASE={
 BASTION:{name:'BASTION',color:'#ff816f',label:'Dash tank / teleporter',hp:460,armor:.24,walk:30,dashDamage:25,dashCD:2.9,teleCD:10.8,dashSpeed:520,dashDuration:.28},
 VESPER:{name:'VESPER',color:'#6bd5ff',label:'Mobile ranged gunner',hp:250,armor:.03,walk:132,shotDamage:11.5,shotCD:.72,bulletSpeed:350,preferred:165}
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rng(seed){let s=seed>>>0;return ()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function create(seed=1,settings={}){const mode=settings.mode==='hill'?'hill':'duel';const random=rng(seed),angle=random()*TAU,offset=125,swap=random()<.5?1:-1;
 const cfg={BASTION:{...BASE.BASTION,...(settings.BASTION||{})},VESPER:{...BASE.VESPER,...(settings.VESPER||{})}};
 const agents=['BASTION','VESPER'].map((key,i)=>{const t=cfg[key],a=angle+(i?Math.PI:0);return {...t,key,id:i,x:CX+Math.cos(a)*offset,y:CY+Math.sin(a)*offset,vx:0,vy:0,hp:t.hp,maxHp:t.hp,alive:true,heading:a+(i?Math.PI:0),dashCd:i===0?random()*.6:0,teleCd:i===0?2+random()*1.4:0,shotCd:i===1?random()*.45:0,dashLeft:0,dashHit:false,shieldCd:3+random()*2,teleFx:0,shotFx:0,facing:i===0?1:-1,flash:0,aim:0,strafe:swap,decision:0,stun:0,dealt:0,shots:0,hits:0,abilities:0}});
 return {seed,random,cfg,agents,time:0,ended:false,winner:null,reason:'',events:[],projectiles:[],effects:[],lastDamage:0,damageRamp:0,hazards:[],hazardCycle:-1,mode,hill:mode==='hill'?{x:CX,y:CY,r:65,scores:[0,0],target:14,owner:-1,round:0,interval:10,nextMove:10}:null};}
function event(s,msg){s.events.push({time:s.time,msg});if(s.events.length>25)s.events.shift()}
function effect(s,x,y,color,type='spark'){if(s.effects.length<100)s.effects.push({x,y,color,type,life:.35})}
function bound(a){const dx=a.x-CX,dy=a.y-CY,d=Math.hypot(dx,dy),lim=R-14;if(d>lim){const nx=dx/d,ny=dy/d;a.x=CX+nx*lim;a.y=CY+ny*lim;const v=a.vx*nx+a.vy*ny;if(v>0){a.vx-=v*nx;a.vy-=v*ny}}}
function hit(s,attacker,victim,raw,kind){if(!victim.alive)return;const dmg=Math.max(1,raw*(1-victim.armor));victim.hp=Math.max(0,victim.hp-dmg);victim.flash=.14;attacker.dealt+=dmg;attacker.hits++;s.lastDamage=s.time;effect(s,victim.x,victim.y,victim.color);if(victim.hp<=0){victim.alive=false;event(s,`${attacker.name} eliminates ${victim.name} (${kind})`);}}
function move(a,dx,dy,dt,speed,accel=550){const mag=Math.hypot(dx,dy)||1;const tx=dx/mag*speed,ty=dy/mag*speed;const k=Math.min(1,accel*dt/Math.max(1,Math.hypot(tx-a.vx,ty-a.vy)));a.vx+=(tx-a.vx)*k;a.vy+=(ty-a.vy)*k;a.x+=a.vx*dt;a.y+=a.vy*dt;bound(a)}
function objectiveSteer(s,f,dx,dy){if(!s.hill)return [dx,dy];const h=s.hill,dist=Math.hypot(h.x-f.x,h.y-f.y);if(dist<h.r*.52)return [0,0];return [(h.x-f.x)/(dist||1),(h.y-f.y)/(dist||1)]}
function hazardAvoid(s,f,dx,dy){const z=s.hazards[0];if(!z||s.time>=z.end)return [dx,dy];const dist=Math.hypot(f.x-z.x,f.y-z.y),danger=z.r+25;if(dist>=danger)return [dx,dy];const urgency=s.time>=z.activeAt?2.8:1.5;const awayX=(f.x-z.x)/(dist||1),awayY=(f.y-z.y)/(dist||1);return [dx+awayX*urgency,dy+awayY*urgency]}
function teleport(s,a,b){const r=s.random();let best=null,bestScore=-1e9;for(let i=0;i<12;i++){const theta=s.random()*TAU,rr=45+Math.sqrt(s.random())*(R-67),x=CX+Math.cos(theta)*rr,y=CY+Math.sin(theta)*rr,d=Math.hypot(x-b.x,y-b.y);const score=-Math.abs(d-105)+s.random()*40;if(score>bestScore){bestScore=score;best={x,y}}}
 effect(s,a.x,a.y,a.color,'warp');a.x=best.x;a.y=best.y;a.vx=0;a.vy=0;a.teleCd=a.teleCD;a.teleFx=.4;a.abilities++;effect(s,a.x,a.y,a.color,'warp');event(s,'BASTION teleports');}
function step(s,dt=DT){if(s.ended)return;s.time+=dt;const a=s.agents[0],b=s.agents[1];
 for(const p of s.effects)p.life-=dt;s.effects=s.effects.filter(p=>p.life>0);
 for(const p of s.projectiles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}
 for(const f of s.agents){f.flash=Math.max(0,f.flash-dt);f.shotFx=Math.max(0,(f.shotFx||0)-dt);f.teleFx=Math.max(0,f.teleFx-dt);f.stun=Math.max(0,f.stun-dt)}
 a.shieldCd=Math.max(0,a.shieldCd-dt);a.dashCd=Math.max(0,a.dashCd-dt);a.teleCd=Math.max(0,a.teleCd-dt);b.shotCd=Math.max(0,b.shotCd-dt);
 a.facing=b.x>=a.x?1:-1;b.facing=a.x>=b.x?1:-1;const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),nx=dx/d,ny=dy/d;
 // Bastion: slow approach, burst commitment, rare teleport to break stalemates.
 if(a.dashLeft>0){const ox=a.x,oy=a.y;a.x+=a.vx*dt;a.y+=a.vy*dt;bound(a);a.dashLeft-=dt;
  const segx=a.x-ox,segy=a.y-oy,seglen=segx*segx+segy*segy;let t=seglen?clamp(((b.x-ox)*segx+(b.y-oy)*segy)/seglen,0,1):0;
  if(!a.dashHit&&Math.hypot(ox+segx*t-b.x,oy+segy*t-b.y)<26){a.dashHit=true;hit(s,a,b,a.dashDamage,'dash');b.vx+=a.vx*.20;b.vy+=a.vy*.20;effect(s,b.x,b.y,'#fff5b2','impact')}
  if(a.dashLeft<=0){a.vx*=.18;a.vy*=.18;}
 }else{
  const lateral=(a.strafe||1)*.16;
  {const [ox,oy]=objectiveSteer(s,a,nx-ny*lateral,ny+nx*lateral);const [ax,ay]=hazardAvoid(s,a,ox,oy);move(a,ax,ay,dt,s.hill?82:a.walk,350)}
  if(!s.hill&&a.teleCd<=0&&(d>155||a.hp/a.maxHp<.45)&&s.random()<dt*.95)teleport(s,a,b);
  const nd=distance(a,b);
  if((!s.hill||distance(a,s.hill)<s.hill.r*.65)&&a.dashCd<=0&&nd<250){const lead=.12;let tx=b.x+b.vx*lead-a.x,ty=b.y+b.vy*lead-a.y;const m=Math.hypot(tx,ty)||1;
   const err=(s.random()-.5)*.20,cs=Math.cos(err),sn=Math.sin(err);a.vx=(tx/m*cs-ty/m*sn)*a.dashSpeed;a.vy=(tx/m*sn+ty/m*cs)*a.dashSpeed;a.heading=Math.atan2(a.vy,a.vx);a.dashLeft=a.dashDuration;a.dashCd=a.dashCD*(.9+s.random()*.2);a.dashHit=false;a.abilities++;event(s,'BASTION dashes');}
 }
 // Vesper: standoff distance, tangential strafing, wall-aware repositioning, aimed projectiles.
 if(b.alive){const xx=a.x-b.x,yy=a.y-b.y,dd=Math.max(1,Math.hypot(xx,yy)),ux=xx/dd,uy=yy/dd;
 b.decision-=dt;if(b.decision<=0){b.decision=1.1+s.random()*1.6;if(s.random()<.52)b.strafe*=-1;}
 let forward=dd<b.preferred-22?-1:dd>b.preferred+30?.70:0;
 let mx=ux*forward-uy*b.strafe*.85,my=uy*forward+ux*b.strafe*.85;
 const edge=Math.hypot(b.x-CX,b.y-CY);if(edge>R-65){mx+=(CX-b.x)/edge*2.2;my+=(CY-b.y)/edge*2.2;}
 if(a.dashLeft>0&&dd<110){mx-=ux*1.2;my-=uy*1.2;}
 [mx,my]=objectiveSteer(s,b,mx,my);[mx,my]=hazardAvoid(s,b,mx,my);move(b,mx,my,dt,s.hill?100:b.walk,780);
 if(b.shotCd<=0){const dd2=distance(a,b);if(dd2<340){const flight=dd2/b.bulletSpeed,tx=a.x+a.vx*flight*.65-b.x,ty=a.y+a.vy*flight*.65-b.y,m=Math.hypot(tx,ty)||1;
 const spread=(s.random()-.5)*.12,cs=Math.cos(spread),sn=Math.sin(spread);s.projectiles.push({x:b.x,y:b.y,vx:(tx/m*cs-ty/m*sn)*b.bulletSpeed,vy:(tx/m*sn+ty/m*cs)*b.bulletSpeed,life:1.7,owner:1});b.shotCd=b.shotCD*(.90+s.random()*.2);b.shots++;b.shotFx=.22;effect(s,b.x+12*b.facing,b.y-11,b.color,'muzzle');}}
 }
 // Arena pulses: telegraphed, seeded and shared by both fighters.
 // Fighters react to immediate danger without tactical personality switching.
 const cycle=Math.floor(Math.max(0,s.time-7)/8);
 if(s.time>=7&&cycle!==s.hazardCycle){
  s.hazardCycle=cycle;
  const theta=s.random()*TAU,rad=35+s.random()*115;
  const zone={x:CX+Math.cos(theta)*rad,y:CY+Math.sin(theta)*rad,r:50+Math.floor(s.random()*16),start:s.time,activeAt:s.time+1.8,end:s.time+4.6,lastTick:-1};
  s.hazards=[zone];event(s,'Arena hazard charging');}
 s.hazards=s.hazards.filter(z=>s.time<z.end);
 for(const z of s.hazards)if(s.time>=z.activeAt){
  const tick=Math.floor((s.time-z.activeAt)/.5);
  if(tick!==z.lastTick){z.lastTick=tick;
   for(const f of s.agents)if(f.alive&&Math.hypot(f.x-z.x,f.y-z.y)<z.r){
    const dmg=6;f.hp=Math.max(0,f.hp-dmg);f.flash=.12;
    effect(s,f.x,f.y,'#ffcb72','impact');
    if(f.hp===0){f.alive=false;event(s,`${f.name} falls to arena hazard`);}
   }
  }
 }
 // Relocate the sole hill on a fixed clock; occupancy never delays relocation.
 if(s.hill&&s.time+1e-8>=s.hill.nextMove){
  const h=s.hill;h.round++;h.nextMove+=h.interval;
  const theta=s.random()*TAU,rad=85+Math.sqrt(s.random())*85;
  h.x=CX+Math.cos(theta)*rad;h.y=CY+Math.sin(theta)*rad;
  h.owner=-1;event(s,'HILL RELOCATED — MOVE TO NEW ZONE');
 }
 // Bastion shield shove: disrupts a nearby opponent and awards a capture burst.
 if(s.hill&&a.alive&&b.alive&&a.shieldCd<=0&&distance(a,s.hill)<s.hill.r+16&&distance(a,b)<105){
  const dist=distance(a,b)||1,ux=(b.x-a.x)/dist,uy=(b.y-a.y)/dist;
  b.x+=ux*95;b.y+=uy*95;bound(b);b.vx=ux*175;b.vy=uy*175;
  a.shieldCd=6;a.abilities++;effect(s,b.x,b.y,'#ffb96c','impact');event(s,'BASTION shield shoves VESPER');
  s.hill.scores[0]+=3;
 }
 // King of the Hill: uncontested occupancy accumulates capture time.
 // A contested hill awards neither side points; combat continues normally.
 if(s.hill){const h=s.hill,inside=s.agents.map(f=>f.alive&&distance(f,h)<h.r);
  const owner=inside[0]&&!inside[1]?0:inside[1]&&!inside[0]?1:-1;
  if(owner!==h.owner){h.owner=owner;event(s,owner<0?'Hill contested or vacant':s.agents[owner].name+' controls the hill')}
  if(owner>=0)h.scores[owner]+=dt;
 }
 // Bullet collision, including dash vulnerability.
 const keep=[];for(const p of s.projectiles){if(p.life<=0||Math.hypot(p.x-CX,p.y-CY)>R-5)continue;if(Math.hypot(p.x-a.x,p.y-a.y)<17){hit(s,b,a,b.shotDamage,'shot');continue}keep.push(p)}s.projectiles=keep;
 // Anti-stall: progressively stronger global damage after 43 seconds, identical raw damage per second.
 // Because armor is ignored here, this is not a hidden advantage for either fighter.
 if(s.time>43){const fatigue=(s.time-43)*.065*dt;for(const f of s.agents)if(f.alive){f.hp=Math.max(0,f.hp-fatigue);if(f.hp===0){f.alive=false;event(s,`${f.name} falls in overtime`)}}}
 const hillVictory=s.hill&&Math.max(...s.hill.scores)>=s.hill.target;
 if(!a.alive||!b.alive||hillVictory||s.time>=(s.hill?75:65)){s.ended=true;if(a.alive&&!b.alive)s.winner=a;else if(b.alive&&!a.alive)s.winner=b;else if(s.hill&&s.hill.scores[0]!==s.hill.scores[1]){s.winner=s.agents[s.hill.scores[0]>s.hill.scores[1]?0:1];s.reason='hill control'}else {const ah=a.hp/a.maxHp,bh=b.hp/b.maxHp;s.winner=ah>bh?a:bh>ah?b:(a.dealt>=b.dealt?a:b);s.reason='decision';}event(s,`${s.winner.name} wins${s.reason?' by decision':''}`)}
}
if(typeof module!=='undefined'&&module.exports)module.exports={create,step,BASE,CX,CY,R,DT};else root.ColiseumEngine={create,step,BASE,CX,CY,R,DT};
})(typeof window!=='undefined'?window:null);
