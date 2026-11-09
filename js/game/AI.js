const GROUND = ['idle', 'walkF', 'walkB', 'crouch'];
const empty = () => ({ left: false, right: false, up: false, down: false, pressed: {}, held: {} });
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * IA sencilla basada en planes cortos. `level` 1..8 controla velocidad de reacción,
 * probabilidad de bloquear y uso de especiales.
 */
export class AIController {
  constructor(level = 4) {
    this.level = Math.max(1, Math.min(8, level));
    this.queue = [];
    this.plan = { type: 'wait', t: 10 };
    this.planT = 10;
    this.seenAttack = -1;
    this.blockUntil = 0;
    this.blockLow = false;
  }

  poll({ self, opp, engine }) {
    const out = empty();
    if (engine.phase !== 'fight') { this.queue.length = 0; return out; }
    const L = this.level / 8;
    const dist = Math.abs(opp.x - self.x);
    const fwd = () => { if (self.facing > 0) out.right = true; else out.left = true; };
    const back = () => { if (self.facing > 0) out.left = true; else out.right = true; };

    if (this.queue.length) {
      const s = this.queue.shift();
      if (s.f) fwd();
      if (s.b) back();
      if (s.d) out.down = true;
      if (s.p) out.pressed[s.p] = true;
      return out;
    }

    // defensa: reaccionar a un ataque nuevo del rival
    if (opp.state === 'attack' && opp.attackId !== this.seenAttack && dist < 280) {
      this.seenAttack = opp.attackId;
      if (Math.random() < 0.1 + 0.8 * L * L) {
        this.blockUntil = engine.frame + 16 + Math.floor(Math.random() * 12);
        this.blockLow = opp.move?.level === 'low';
      }
    }
    const threat = engine.projectiles.find((p) => p.owner !== self && Math.abs(p.x - self.x) < 280 && Math.sign(self.x - p.x) === Math.sign(p.vx));
    if (threat && engine.frame > this.blockUntil && Math.random() < 0.04 + 0.4 * L) { this.blockUntil = engine.frame + 22; this.blockLow = false; }
    if (engine.frame < this.blockUntil && !self.airborne) {
      if (GROUND.includes(self.state) || self.state === 'block') { back(); if (this.blockLow) out.down = true; return out; }
    }

    if (!GROUND.includes(self.state)) return out;

    if (this.planT <= 0) { this.plan = this.decide(self, opp, dist, engine, L); this.planT = this.plan.t; }
    this.planT--;
    const p = this.plan;
    switch (p.type) {
      case 'approach': if (dist > p.stop) fwd(); else this.planT = 0; break;
      case 'retreat': back(); break;
      case 'crouch': out.down = true; break;
      case 'jump': out.up = true; if (p.dir > 0) { if (self.facing > 0) out.right = true; else out.left = true; } this.planT = 0; break;
      case 'attack': out.pressed[p.btn] = true; if (p.low) out.down = true; this.planT = 0; break;
      case 'macro': this.queue = p.frames.map((f) => ({ ...f })); this.planT = 0; break;
      case 'taunt': out.pressed.taunt = true; this.planT = 0; break;
      default: break;
    }
    return out;
  }

  decide(self, opp, dist, engine, L) {
    const r = Math.random();
    const t = Math.round(8 + (1 - L) * 22 + Math.random() * 10);
    const has = (id) => self.def.specials.includes(id) && L > 0.3;
    const punch = pick(['lp', 'mp', 'hp']);
    const kick = pick(['lk', 'mk', 'hk']);

    if (dist > 520) {
      if (has('fireball') && r < 0.1 + 0.5 * L) return { type: 'macro', frames: [{ d: 1 }, { d: 1, f: 1 }, { f: 1, p: punch }], t };
      return { type: 'approach', stop: 300, t: 30 };
    }
    if (dist > 260) {
      if (has('fireball') && r < 0.2 + 0.25 * L) return { type: 'macro', frames: [{ d: 1 }, { d: 1, f: 1 }, { f: 1, p: punch }], t };
      if (has('dashKick') && r < 0.35 + 0.15 * L) return { type: 'macro', frames: [{ d: 1 }, { d: 1, b: 1 }, { b: 1, p: kick }], t };
      if (r < 0.7) return { type: 'approach', stop: 150, t: 24 };
      return { type: 'jump', dir: 1, t };
    }
    if (dist > 140) {
      if (r < 0.45) return { type: 'approach', stop: 110, t: 14 };
      if (r < 0.7) return { type: 'attack', btn: pick(['mk', 'hk', 'mp']), t };
      if (r < 0.8) return { type: 'jump', dir: 1, t };
      return { type: 'retreat', t: 10 };
    }
    // cuerpo a cuerpo
    if (opp.airborne && has('uppercut') && r < 0.3 + 0.5 * L) {
      return { type: 'macro', frames: [{ f: 1 }, { d: 1 }, { d: 1, f: 1, p: 'hp' }], t };
    }
    if (has('super') && self.meter >= 100 && r < 0.12) {
      return { type: 'macro', frames: [{ d: 1 }, { d: 1, f: 1 }, { f: 1 }, { d: 1 }, { d: 1, f: 1 }, { f: 1, p: 'hp' }], t };
    }
    if (r < 0.55 + 0.25 * L) return { type: 'attack', btn: pick(['lp', 'lk', 'mp', 'mk', 'hp', 'hk']), low: Math.random() < 0.25, t: Math.round(t * 0.6) };
    if (r < 0.7) return { type: 'retreat', t: 12 };
    if (r < 0.74 && L < 0.5) return { type: 'taunt', t: 20 };
    return { type: 'wait', t: 8 };
  }
}
