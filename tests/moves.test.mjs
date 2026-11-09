import { FightEngine } from '../js/game/FightEngine.js';
import { ROSTER } from '../js/data/roster.js';

// controlador que reproduce un guion: array de frames {r,l,u,d,p:[botones]}
class Script { constructor(frames){ this.f=frames; this.i=0; }
  poll(){ const s=this.f[this.i++]||{}; const pressed={}; (s.p||[]).forEach(b=>pressed[b]=true);
    return { left:!!s.l, right:!!s.r, up:!!s.u, down:!!s.d, pressed, held:{} }; } }
const wait=(n)=>Array(n).fill({});
const def = ROSTER.find(f=>f.specials.includes('fireball')&&f.specials.includes('uppercut')&&f.specials.includes('dashKick'));
const dummy = ROSTER[5];

function run(name, frames, setup, check, opts={}) {
  const log=[];
  const eng = new FightEngine({ defs:[def,dummy], variants:[0,1], controllers:[new Script(frames), opts.c2||new Script([])],
    settings:{roundTime:0,roundsToWin:2}, mode:'training', emit:(n,d)=>log.push([n,d]) });
  setup?.(eng);
  const trace=[];
  for (let i=0;i<frames.length+60;i++){ eng.step(); trace.push(eng.fighters[0].state+':'+(eng.fighters[0].move?.id||'')); }
  const ok = check(eng, log, trace);
  console.log((ok?'OK   ':'FALLO'), name);
  if(!ok) console.log('   ', [...new Set(trace)].join(' > '), JSON.stringify(log.slice(0,6)));
}
// P1 mira a la derecha (rival a la derecha). adelante = r
run('fireball ↓↘→+A', [...wait(3), {d:1},{d:1,r:1},{r:1,p:['lp']}, ...wait(40)], null, (e,l,t)=>t.some(x=>x.endsWith(':fireball')) && l.some(x=>x[1]==='fireball'));
run('fireball con ↓ → + A (sin diagonal)', [...wait(3), {d:1},{r:1,p:['hp']}, ...wait(40)], null, (e,l,t)=>t.some(x=>x.endsWith(':fireball')));
run('uppercut →↓↘+A', [...wait(3), {r:1},{d:1},{d:1,r:1,p:['mp']}, ...wait(60)], null, (e,l,t)=>t.some(x=>x.endsWith(':uppercut')));
run('NO uppercut al andar adelante y hacer ↓↘→+A (debe salir fireball)', [...wait(3), {r:1},{r:1},{d:1},{d:1,r:1},{r:1,p:['lp']}, ...wait(40)], null, (e,l,t)=>t.some(x=>x.endsWith(':fireball')) && !t.some(x=>x.endsWith(':uppercut')));
run('dashKick ↓↙←+Z', [...wait(3), {d:1},{d:1,l:1},{l:1,p:['lk']}, ...wait(50)], null, (e,l,t)=>t.some(x=>x.endsWith(':dashKick')));
run('super ↓↘→↓↘→+A con barra (gasta 1 barra)', [...wait(3), {d:1},{d:1,r:1},{r:1},{d:1},{d:1,r:1},{r:1,p:['hp']}, ...wait(60)], (e)=>{e.mode='versus'; e.phase='fight'; e.fighters[0].meter=300;}, (e,l,t)=>t.some(x=>x.endsWith(':super')) && e.fighters[0].meter<=260);
run('super sin barra → no sale', [...wait(3), {d:1},{d:1,r:1},{r:1},{d:1},{d:1,r:1},{r:1,p:['hp']}, ...wait(60)], (e)=>{e.mode='versus'; e.phase='fight'; e.fighters[0].meter=0;}, (e,l,t)=>!t.some(x=>x.endsWith(':super')));
// combo: A (ligero) conecta, luego S (medio) cancela, luego D (fuerte)
run('cadena A→S→D', [...wait(3), {p:['lp']}, ...wait(8), {p:['mp']}, ...wait(14), {p:['hp']}, ...wait(40)],
  (e)=>{ e.fighters[1].x = e.fighters[0].x+70; },
  (e,l,t)=>{ const ids=[...new Set(t.filter(x=>x.startsWith('attack')))]; return ids.includes('attack:stand.lp') && ids.includes('attack:stand.mp') && ids.includes('attack:stand.hp'); });
run('salto + ataque aéreo', [...wait(3), {u:1}, ...wait(8), {p:['mk']}, ...wait(50)], null, (e,l,t)=>t.some(x=>x==='attack:air.mk'));
run('agachado: patada baja', [...wait(3), {d:1}, {d:1}, {d:1,p:['lk']}, ...wait(30)], null, (e,l,t)=>t.some(x=>x==='attack:crouch.lk'));
// bloqueo: el rival (P2) pega, P1 mantiene atrás
const mk2 = (frames)=>new Script(frames);
{
  const log=[]; const eng = new FightEngine({ defs:[def,dummy], variants:[0,1],
    controllers:[ new Script(Array(120).fill({l:1})), new Script([...wait(3),{p:['mp']},...wait(60)]) ],
    settings:{roundTime:0,roundsToWin:2}, mode:'training', emit:(n,d)=>log.push([n,d]) });
  eng.fighters[1].x = eng.fighters[0].x+80;
  for(let i=0;i<80;i++) eng.step();
  const blocked = log.some(x=>x[1]==='block'); const hp=eng.fighters[0].hp===eng.fighters[0].maxHp;
  console.log((blocked&&hp?'OK   ':'FALLO'),'bloqueo de pie manteniendo atrás', {blocked,hp});
}
{ // golpe bajo no se bloquea de pie
  const log=[]; const eng = new FightEngine({ defs:[def,dummy], variants:[0,1],
    controllers:[ new Script(Array(120).fill({l:1})), new Script([...wait(3),{d:1},{d:1,p:['lk']},...wait(60)]) ],
    settings:{roundTime:0,roundsToWin:2}, mode:'training', emit:(n,d)=>log.push([n,d]) });
  eng.fighters[1].x = eng.fighters[0].x+95;
  for(let i=0;i<80;i++) eng.step();
  const hit = log.some(x=>String(x[1]).startsWith('hit')); 
  console.log((hit?'OK   ':'FALLO'),'golpe bajo atraviesa bloqueo de pie', {hit, hp:eng.fighters[0].hp});
}
