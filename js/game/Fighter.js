import { WORLD } from '../data/config.js';
import { NORMALS, BTN_TIER, BUTTONS, BUTTON_GROUPS, makeSpecial } from '../data/moves.js';

const ACT = new Set(['idle', 'walkF', 'walkB', 'crouch']);
const NO_HIT = new Set(['knock', 'down', 'getup', 'ko']);

function matchDir(n, target) {
  if (target === 6) return n === 6 || n === 3 || n === 9;
  if (target === 4) return n === 4 || n === 1 || n === 7;
  if (target === 2) return n === 2 || n === 1 || n === 3;
  return n === target;
}

export class Fighter {
  constructor(def, variant, index, engine) {
    this.def = def;
    this.variant = variant;
    this.index = index;
    this.engine = engine;
    this.maxHp = Math.round(1000 * def.stats.vitality);
    this.speedMul = def.stats.speed;
    this.powerMul = def.stats.power;
    this.meter = 0; // 0..300 (100 = una barra)
    this.wins = 0;
    this.buffer = [];
    this.reset(0, 1);
  }

  reset(x, facing) {
    this.x = x; this.y = 0; this.vx = 0; this.vy = 0; this.facing = facing;
    this.hp = this.maxHp;
    this.state = 'idle'; this.t = 0; this.stun = 0; this.invuln = 0;
    this.move = null; this.mf = 0; this.connected = false; this.hasHit = false; this.attackId = 0;
    this.comboHits = 0; this.comboDamage = 0; this.airUsed = false; this.crouchBlock = false;
    this.holdBack = this.holdFwd = this.holdDown = this.holdUp = false;
    this.buffer.length = 0; this.btnBuf = {};
  }

  get airborne() { return this.y > 0; }
  get crouching() {
    return this.state === 'crouch' || (this.state === 'attack' && !!this.move?.crouch) || (this.state === 'block' && this.crouchBlock);
  }
  get actionable() { return ACT.has(this.state); }
  hittable() { return !NO_HIT.has(this.state) && this.invuln <= 0; }

  hurtbox() {
    const gy = WORLD.groundY - this.y;
    let w = 62, h = 185;
    if (this.crouching) h = 112;
    if (this.airborne) h = 150;
    if (this.state === 'down' || this.state === 'ko') { w = 190; h = 44; }
    return { x: this.x - w / 2, y: gy - h, w, h };
  }

  hitbox() {
    const m = this.move;
    if (this.state !== 'attack' || !m || !m.box || this.hasHit) return null;
    if (!(this.mf > m.startup && this.mf <= m.startup + m.active)) return null;
    const b = m.box;
    const gy = WORLD.groundY - this.y;
    const x = this.facing > 0 ? this.x + b.x : this.x - b.x - b.w;
    return { x, y: gy + b.y, w: b.w, h: b.h };
  }

  setState(s) { if (this.state !== s) { this.state = s; this.t = 0; } }

  // ---- entrada: se llama SIEMPRE (incluso en hitstop) para no perder comandos
  record(input) {
    const frame = this.engine.frame;
    const R = input.right && !input.left, L = input.left && !input.right;
    const f = this.facing > 0 ? R : L, bk = this.facing > 0 ? L : R;
    const n = input.up ? (f ? 9 : bk ? 7 : 8) : input.down ? (f ? 3 : bk ? 1 : 2) : (f ? 6 : bk ? 4 : 5);
    this.holdBack = bk; this.holdFwd = f; this.holdDown = !!input.down; this.holdUp = !!input.up;
    const last = this.buffer[this.buffer.length - 1];
    if (!last || last.n !== n) {
      this.buffer.push({ n, f: frame });
      if (this.buffer.length > 40) this.buffer.shift();
    }
    for (const b of BUTTONS) if (input.pressed[b]) this.btnBuf[b] = this.engine.sim; // en frames de simulación: el hitstop no gasta el búfer
  }

  matchMotion(seq, win, strictEnd) {
    const now = this.engine.frame;
    if (strictEnd) {
      const last = this.buffer[this.buffer.length - 1];
      if (!last || last.n !== seq[seq.length - 1]) return false;
    }
    let i = seq.length - 1;
    for (let k = this.buffer.length - 1; k >= 0 && i >= 0; k--) {
      const e = this.buffer[k];
      if (now - e.f > win) break;
      if (matchDir(e.n, seq[i])) i--;
    }
    return i < 0;
  }

  pickMove(air, current = null) {
    const sim = this.engine.sim;
    let best = null;
    for (const b of BUTTONS) {
      if (sim - (this.btnBuf[b] ?? -99) <= 5 && (!best || BTN_TIER[b] >= BTN_TIER[best])) best = b;
    }
    if (!best) return null;
    if (!air && !(current && current.special)) {
      for (const sp of this.def.specialMoves) {
        if (!BUTTON_GROUPS[sp.input].includes(best)) continue;
        if (sp.cost && this.meter < sp.cost) continue;
        if (sp.motions.some((m) => this.matchMotion(m, sp.window, sp.strictEnd))) return makeSpecial(sp, best);
      }
    }
    if (current) {
      if (current.special || BTN_TIER[best] <= current.tier) return null;
    }
    const set = air ? NORMALS.air : this.holdDown ? NORMALS.crouch : NORMALS.stand;
    return set[best];
  }

  // ---- simulación de un frame
  step(input, opp) {
    this.t++;
    if (this.invuln > 0) this.invuln--;
    if ((ACT.has(this.state) || this.state === 'block') && !this.airborne && opp) {
      this.facing = opp.x >= this.x ? 1 : -1;
    }
    switch (this.state) {
      case 'idle': case 'walkF': case 'walkB': case 'crouch': this.stepGround(input); break;
      case 'jump': this.stepAir(); break;
      case 'attack': this.stepAttack(); break;
      case 'hit': case 'block': this.stepStun(); break;
      case 'knock': this.stepKnock(); break;
      case 'down': if (--this.stun <= 0) { this.setState('getup'); this.stun = 20; this.invuln = 20; } break;
      case 'getup': if (--this.stun <= 0) this.setState('idle'); break;
      case 'land': case 'taunt': if (--this.stun <= 0) this.setState('idle'); break;
      default: break; // ko, win, intro
    }
    this.x = Math.min(WORLD.wallR, Math.max(WORLD.wallL, this.x));
  }

  stepGround(input) {
    const mv = this.pickMove(false);
    if (mv) { this.startAttack(mv); return; }
    if (input.pressed.taunt && this.state === 'idle') { this.setState('taunt'); this.stun = 48; this.vx = 0; return; }
    if (input.up) { this.jump(input); return; }
    if (input.down) { this.setState('crouch'); this.vx = 0; return; }
    const fwd = this.facing > 0 ? input.right : input.left;
    const back = this.facing > 0 ? input.left : input.right;
    if (fwd && !back) { this.vx = this.facing * WORLD.walkF * this.speedMul; this.x += this.vx; this.setState('walkF'); }
    else if (back && !fwd) { this.vx = -this.facing * WORLD.walkB * this.speedMul; this.x += this.vx; this.setState('walkB'); }
    else { this.vx = 0; this.setState('idle'); }
  }

  jump(input) {
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    this.vy = WORLD.jumpVy; this.y = 1;
    this.vx = dir * WORLD.walkF * 1.15 * this.speedMul;
    this.airUsed = false;
    this.setState('jump');
  }

  physics() {
    if (this.y > 0) { this.vy -= WORLD.gravity; this.y += this.vy; }
    this.x += this.vx;
  }

  stepAir() {
    this.physics();
    if (!this.airUsed) {
      const mv = this.pickMove(true);
      if (mv) { this.airUsed = true; this.startAttack(mv); return; }
    }
    if (this.y <= 0 && this.vy <= 0) this.land(false);
  }

  land(lag) {
    this.y = 0; this.vy = 0; this.vx = 0; this.move = null;
    this.engine.dust(this.x);
    if (lag) { this.setState('land'); this.stun = lag; } else this.setState('idle');
  }

  startAttack(mv) {
    this.move = mv; this.state = 'attack'; this.t = 0; this.mf = 0;
    this.connected = false; this.hasHit = false; this.attackId++; this.btnBuf = {};
    if (mv.cost) { this.meter -= mv.cost; this.engine.superFlash(this); }
    if (mv.vy) { this.vy = mv.vy; this.y = Math.max(this.y, 1); }
    if (mv.invuln) this.invuln = mv.invuln;
    if (this.y <= 0 && !mv.air) this.vx = 0;
    if (mv.vx && mv.air) this.vx = mv.vx * this.facing;
  }

  stepAttack() {
    const m = this.move;
    this.mf++;
    if (m.vx != null && !m.air && this.mf > (m.moveFrom ?? m.startup - 1) && this.mf <= m.startup + m.active) {
      this.vx = m.vx * this.facing; this.x += this.vx;
    } else if (!m.air && this.y <= 0) {
      this.vx *= 0.7;
    }
    this.physics();
    if (m.spawn && this.mf === m.spawn.frame) this.engine.spawnProjectile(this, m);

    if (this.connected && this.mf > m.startup && !m.lock) {
      const next = this.pickMove(this.airborne, m);
      if (next) { this.startAttack(next); return; }
    }
    if (m.air && this.y <= 0 && this.vy <= 0 && this.mf > 2) { this.land(m.landLag || 0); return; }

    const total = m.startup + m.active + m.recover;
    if (this.mf >= total) {
      if (this.y > 0) { if (!m.lock) { this.move = null; this.setState('jump'); } }
      else { this.move = null; this.setState(this.holdDown ? 'crouch' : 'idle'); this.vx = 0; }
    }
  }

  stepStun() {
    this.x += this.vx; this.vx *= 0.8;
    if (--this.stun <= 0) { this.vx = 0; this.setState(this.holdDown ? 'crouch' : 'idle'); }
  }

  stepKnock() {
    this.physics();
    if (this.y <= 0 && this.vy <= 0) {
      this.y = 0; this.vy = 0; this.vx = 0;
      this.engine.dust(this.x); this.engine.emit('shake', 6); this.engine.emit('sfx', 'thud');
      if (this.hp <= 0) { this.setState('ko'); } else { this.setState('down'); this.stun = 44; }
    }
  }

  // ---- reacciones
  canBlock(mv) {
    if (this.airborne || !this.holdBack) return false;
    if (!(ACT.has(this.state) || this.state === 'block')) return false;
    if (mv.level === 'low' && !this.holdDown) return false;
    return true;
  }

  block(mv, attacker) {
    const dir = this.x >= attacker.x ? 1 : -1;
    this.state = 'block'; this.t = 0; this.stun = mv.blockstun; this.vx = dir * mv.pushBlock;
    this.crouchBlock = this.holdDown; this.move = null;
  }

  getHit(mv, attacker, dmg) {
    const dir = this.x >= attacker.x ? 1 : -1;
    this.hp = Math.max(0, this.hp - dmg);
    this.move = null; this.connected = false; this.crouchBlock = false;
    if (this.hp <= 0 || mv.knock || this.airborne) {
      const ko = this.hp <= 0;
      this.state = 'knock'; this.t = 0;
      this.vy = this.airborne ? Math.max(this.vy, 6) : (ko ? 11 : 9);
      this.vx = dir * (ko ? 6 : 4.5);
      this.y = Math.max(this.y, 1);
    } else {
      this.state = 'hit'; this.t = 0; this.stun = mv.hitstun; this.vx = dir * mv.pushHit;
    }
  }
}
