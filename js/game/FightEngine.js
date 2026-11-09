import { WORLD } from '../data/config.js';
import { Fighter } from './Fighter.js';

const NEUTRAL = Object.freeze({ left: false, right: false, up: false, down: false, pressed: Object.freeze({}), held: Object.freeze({}) });
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const clampX = (x) => Math.min(WORLD.wallR, Math.max(WORLD.wallL, x));

/**
 * Motor de combate sin DOM ni canvas: recibe controladores, simula a 60 fps fijos
 * y avisa de eventos con emit(nombre, datos) (banner, sfx, shake, matchEnd).
 */
export class FightEngine {
  constructor({ defs, variants = [0, 1], controllers, settings, mode = 'versus', emit = () => {} }) {
    this.controllers = controllers;
    this.settings = settings; // { roundTime, roundsToWin }
    this.mode = mode;
    this.emit = emit;
    this.frame = 0;
    this.sim = 0; // frames realmente simulados (no avanza durante el hitstop)
    this.round = 1;
    this.fighters = defs.map((d, i) => new Fighter(d, variants[i] ?? 0, i, this));
    this.projectiles = [];
    this.effects = [];
    this.combo = [{ hits: 0, damage: 0, t: 0 }, { hits: 0, damage: 0, t: 0 }];
    this.hitstop = 0;
    this.flash = null;
    this.phase = 'intro';
    this.phaseT = 0;
    this.timer = Infinity;
    this.roundWinner = -1;
    this.startRound();
  }

  get timeScale() { return this.phase === 'ko' ? 0.4 : 1; }
  get training() { return this.mode === 'training'; }

  startRound() {
    const [a, b] = this.fighters;
    a.reset(WORLD.width / 2 - 170, 1);
    b.reset(WORLD.width / 2 + 170, -1);
    this.projectiles = [];
    this.effects = [];
    this.combo.forEach((c) => { c.hits = 0; c.t = 0; });
    this.firstAttackDone = false;
    this.pending = null;
    const unlimited = this.training || !this.settings.roundTime;
    this.timer = unlimited ? Infinity : this.settings.roundTime * 60;
    this.phaseT = 0;
    if (this.training) { this.phase = 'fight'; return; }
    this.phase = 'intro';
    const need = this.settings.roundsToWin;
    const final = a.wins === need - 1 && b.wins === need - 1 && need > 1;
    this.emit('banner', { key: final ? 'banner.finalRound' : 'banner.round', params: { n: this.round }, kind: 'round' });
  }

  step() {
    this.frame++;
    const inputs = this.fighters.map((f, i) => {
      const inp = this.controllers[i].poll({ self: f, opp: this.fighters[1 - i], engine: this });
      return this.phase === 'fight' ? inp : NEUTRAL;
    });
    this.fighters.forEach((f, i) => f.record(inputs[i]));

    if (this.hitstop > 0) { this.hitstop--; if (this.flash && --this.flash.t <= 0) this.flash = null; return; }
    if (this.flash) this.flash = null;
    this.sim++;

    this.fighters.forEach((f, i) => f.step(inputs[i], this.fighters[1 - i]));
    this.resolvePush();
    this.updateProjectiles();
    this.resolveHits();
    this.updateCombos();
    this.ageEffects();
    this.updateFlow();
  }

  // ---------- física entre luchadores
  resolvePush() {
    const [a, b] = this.fighters;
    if (a.y > 100 || b.y > 100) return;
    const min = 58;
    const dx = b.x - a.x;
    const ad = Math.abs(dx);
    if (ad >= min) return;
    const dir = dx === 0 ? -a.facing : Math.sign(dx);
    const push = min - ad;
    a.x = clampX(a.x - dir * push / 2);
    b.x = clampX(b.x + dir * push / 2);
    if (min - Math.abs(b.x - a.x) > 0.01) {
      if (a.x <= WORLD.wallL + 0.01 || a.x >= WORLD.wallR - 0.01) b.x = clampX(a.x + dir * min);
      else a.x = clampX(b.x - dir * min);
    }
  }

  // ---------- proyectiles
  spawnProjectile(owner, move) {
    const s = move.spawn;
    const size = s.size || 1;
    this.projectiles.push({
      owner, x: owner.x + owner.facing * 50, y: s.y, vx: owner.facing * s.speed,
      w: 60 * size, h: 50 * size, age: 0, dead: false, super: !!move.super,
      mv: { damage: move.damage, hitstun: move.hitstun, blockstun: move.blockstun, pushHit: 8, pushBlock: 7,
        tier: move.tier || 2, level: 'mid', knock: !!move.knock },
    });
    this.emit('sfx', move.super ? 'super' : 'fireball');
  }

  updateProjectiles() {
    for (const p of this.projectiles) { p.x += p.vx; p.age++; }
    for (let i = 0; i < this.projectiles.length; i++) {
      for (let j = i + 1; j < this.projectiles.length; j++) {
        const p = this.projectiles[i], q = this.projectiles[j];
        if (p.dead || q.dead || p.owner === q.owner) continue;
        if (Math.abs(p.x - q.x) < (p.w + q.w) / 3 && Math.abs(p.y - q.y) < 40) {
          if (!p.super) p.dead = true;
          if (!q.super) q.dead = true;
          this.spark(p.x, WORLD.groundY - p.y, 'block');
        }
      }
    }
  }

  // ---------- golpes
  resolveHits() {
    const hits = [];
    for (let i = 0; i < 2; i++) {
      const a = this.fighters[i], d = this.fighters[1 - i];
      const hb = a.hitbox();
      if (hb && d.hittable() && overlap(hb, d.hurtbox())) hits.push({ a, d, mv: a.move, rect: hb, proj: null });
    }
    for (const p of this.projectiles) {
      if (p.dead) continue;
      const d = this.fighters[1 - p.owner.index];
      if (!d.hittable()) continue;
      const rect = { x: p.x - p.w / 2, y: WORLD.groundY - p.y - p.h / 2, w: p.w, h: p.h };
      if (overlap(rect, d.hurtbox())) hits.push({ a: p.owner, d, mv: p.mv, rect, proj: p });
    }
    for (const h of hits) this.applyHit(h);
    this.projectiles = this.projectiles.filter((p) => !p.dead && p.x > -120 && p.x < WORLD.width + 120);
  }

  applyHit({ a, d, mv, rect, proj }) {
    const hurt = d.hurtbox();
    const sx = (Math.max(rect.x, hurt.x) + Math.min(rect.x + rect.w, hurt.x + hurt.w)) / 2;
    const sy = (Math.max(rect.y, hurt.y) + Math.min(rect.y + rect.h, hurt.y + hurt.h)) / 2;
    const dir = d.x >= a.x ? 1 : -1;
    const atWall = d.x <= WORLD.wallL + 1 || d.x >= WORLD.wallR - 1;
    const gain = (f, v) => { f.meter = Math.min(300, f.meter + v); };

    if (proj) proj.dead = true; else { a.hasHit = true; a.connected = true; }

    if (d.canBlock(mv)) {
      d.block(mv, a);
      this.hitstop = Math.max(this.hitstop, 6);
      gain(a, mv.damage * 0.1); gain(d, mv.damage * 0.12);
      if (atWall && !proj) a.vx = -dir * mv.pushBlock;
      this.spark(sx, sy, 'block');
      this.emit('sfx', 'block');
      return;
    }

    a.comboHits++;
    const scale = Math.max(0.35, 1 - (a.comboHits - 1) * 0.12);
    let dmg = Math.max(1, Math.round(mv.damage * a.powerMul * scale));
    if (this.training) dmg = Math.min(dmg, Math.max(0, d.hp - 1));
    a.comboDamage += dmg;
    d.getHit(mv, a, dmg);
    this.hitstop = Math.max(this.hitstop, mv.tier >= 3 ? 11 : mv.tier === 2 ? 9 : 7);
    gain(a, mv.damage * 0.18); gain(d, mv.damage * 0.1);
    if (atWall && !proj) a.vx = -dir * mv.pushHit;
    this.spark(sx, sy, mv.tier >= 3 || mv.knock ? 'big' : 'hit');
    this.emit('sfx', mv.tier >= 3 ? 'hit3' : mv.tier === 2 ? 'hit2' : 'hit1');
    this.emit('shake', mv.tier >= 3 ? 9 : 4);
    if (a.comboHits >= 2) this.combo[a.index] = { hits: a.comboHits, damage: a.comboDamage, t: 100 };
    if (!this.firstAttackDone && this.phase === 'fight' && !this.training) {
      this.firstAttackDone = true;
      this.emit('banner', { key: 'banner.firstAttack', kind: 'first', side: a.index });
    }
  }

  updateCombos() {
    this.fighters.forEach((a, i) => {
      const d = this.fighters[1 - i];
      if (d.state !== 'hit' && d.state !== 'knock') { a.comboHits = 0; a.comboDamage = 0; }
      if (this.combo[i].t > 0) this.combo[i].t--;
    });
    if (this.training) {
      for (const f of this.fighters) {
        f.meter = 300;
        if (f.hp < f.maxHp * 0.3 && !['hit', 'knock', 'down', 'getup'].includes(f.state)) f.hp = f.maxHp;
      }
    }
  }

  // ---------- efectos visuales
  spark(x, y, kind) { this.effects.push({ type: 'spark', kind, x, y, t: 0, life: kind === 'big' ? 16 : 12 }); }
  dust(x) {
    for (let i = 0; i < 6; i++) {
      this.effects.push({ type: 'dust', x: x + (Math.random() - 0.5) * 40, y: WORLD.groundY, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 1.5, t: 0, life: 22 });
    }
  }
  superFlash(f) {
    this.hitstop = 26;
    this.flash = { t: 26, index: f.index };
  }
  ageEffects() {
    for (const e of this.effects) { e.t++; if (e.type === 'dust') { e.x += e.vx; e.y += e.vy; } }
    this.effects = this.effects.filter((e) => e.t < e.life);
  }

  // ---------- flujo de asaltos
  updateFlow() {
    this.phaseT++;
    switch (this.phase) {
      case 'intro':
        if (this.phaseT >= 75) { this.phase = 'fight'; this.phaseT = 0; this.emit('banner', { key: 'banner.fight', kind: 'fight' }); }
        break;
      case 'fight':
        if (this.training) break;
        if (this.timer !== Infinity) this.timer--;
        if (this.fighters.some((f) => f.hp <= 0)) {
          this.phase = 'ko'; this.phaseT = 0;
          this.emit('banner', { key: 'banner.ko', kind: 'ko' });
          this.emit('sfx', 'ko');
        } else if (this.timer <= 0) {
          this.emit('banner', { key: 'banner.timeOver', kind: 'ko' });
          this.enterResult(true);
        }
        break;
      case 'ko':
        if (this.phaseT >= 110) this.enterResult(false);
        break;
      case 'result':
        if (this.pending && this.phaseT === this.pending.at) { this.emit('banner', this.pending.banner); this.pending = null; }
        if (this.phaseT >= 190) this.finishRound();
        break;
      default: break;
    }
  }

  enterResult(timeOver) {
    const [a, b] = this.fighters;
    const w = a.hp > b.hp ? 0 : b.hp > a.hp ? 1 : -1;
    this.roundWinner = w;
    this.phase = 'result'; this.phaseT = 0;
    let banner;
    if (w >= 0) {
      const wf = this.fighters[w];
      wf.wins++;
      if (wf.actionable) wf.setState('win');
      banner = wf.hp === wf.maxHp
        ? { key: 'banner.perfect', kind: 'win' }
        : { key: 'banner.wins', params: { name: wf.def.name }, kind: 'win' };
    } else {
      a.wins++; b.wins++;
      banner = { key: 'banner.draw', kind: 'win' };
    }
    this.pending = { at: timeOver ? 70 : 1, banner };
  }

  finishRound() {
    const need = this.settings.roundsToWin;
    const [a, b] = this.fighters;
    if (a.wins >= need || b.wins >= need) {
      this.phase = 'over'; this.phaseT = 0;
      const winner = a.wins === b.wins ? -1 : a.wins > b.wins ? 0 : 1;
      this.emit('matchEnd', { winner });
    } else {
      this.round++;
      this.startRound();
    }
  }
}
