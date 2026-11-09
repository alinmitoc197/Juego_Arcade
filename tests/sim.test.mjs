import { FightEngine } from '../js/game/FightEngine.js';
import { AIController } from '../js/game/AI.js';
import { ROSTER } from '../js/data/roster.js';

let stats = { matches:0, rounds:0, kos:0, timeouts:0, hits:0, blocks:0, supers:0, fireballs:0, combos:0, maxCombo:0, stuck:0 };
const seen = new Set();
for (let m = 0; m < 40; m++) {
  const d1 = ROSTER[(m*5)%ROSTER.length], d2 = ROSTER[(m*11+3)%ROSTER.length];
  let ended = null;
  const eng = new FightEngine({
    defs:[d1,d2], variants:[0,1], controllers:[new AIController(1+(m%8)), new AIController(1+((m*3)%8))],
    settings:{ roundTime: 30, roundsToWin: 2 }, mode:'versus',
    emit:(n,d)=>{ if(n==='matchEnd') ended=d; if(n==='sfx'){ if(d==='super') stats.supers++; if(d==='fireball') stats.fireballs++; if(d==='block') stats.blocks++; if(d.startsWith('hit')) stats.hits++; } if(n==='banner') seen.add(d.key); }
  });
  let frames = 0;
  while (!ended && frames < 60*60*5) {
    eng.step(); frames++;
    for (const f of eng.fighters) {
      if (!isFinite(f.x) || !isFinite(f.y) || f.hp<0 || f.hp>f.maxHp) throw new Error('estado inválido '+JSON.stringify({x:f.x,y:f.y,hp:f.hp}));
      if (f.x<70-0.01||f.x>1210+0.01) throw new Error('fuera de límites '+f.x);
    }
    stats.maxCombo = Math.max(stats.maxCombo, ...eng.fighters.map(f=>f.comboHits));
  }
  if (!ended) { stats.stuck++; console.log('combate no terminó', m, eng.phase, eng.fighters.map(f=>f.state)); }
  stats.matches++; stats.rounds += eng.round;
}
console.log(stats);
console.log('banners vistos:', [...seen].join(', '));
