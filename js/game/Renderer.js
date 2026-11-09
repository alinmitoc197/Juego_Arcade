import { WORLD } from '../data/config.js';
import { drawFighter } from './FighterDraw.js';
import { buildStage } from './StageBg.js';
import { palette } from '../data/roster.js';

export class Renderer {
  constructor(canvas, stageId) {
    this.cv = canvas;
    this.c = canvas.getContext('2d');
    this.bg = buildStage(stageId);
  }

  draw(engine, { showBoxes = false } = {}) {
    const c = this.c;
    c.clearRect(0, 0, WORLD.width, WORLD.height);
    c.drawImage(this.bg, 0, 0);
    const tick = engine.frame;

    // el que ataca se dibuja encima
    const order = [...engine.fighters].sort((a, b) => (a.state === 'attack') - (b.state === 'attack'));
    for (const f of order) drawFighter(c, f, tick);
    for (const p of engine.projectiles) this.drawProjectile(c, p, tick);
    for (const e of engine.effects) this.drawEffect(c, e);

    if (engine.flash) {
      const k = engine.flash.t / 26;
      c.fillStyle = `rgba(10,10,30,${0.55 * k})`; c.fillRect(0, 0, WORLD.width, WORLD.height);
      c.fillStyle = `rgba(255,255,255,${0.25 * k * k})`; c.fillRect(0, 0, WORLD.width, WORLD.height);
    }
    if (showBoxes) this.drawBoxes(c, engine);
  }

  drawProjectile(c, p, tick) {
    const owner = p.owner;
    const pal = palette(owner.def, owner.variant);
    const y = WORLD.groundY - p.y;
    const r = p.w / 2;
    c.save();
    c.translate(p.x, y);
    const trail = c.createLinearGradient(-Math.sign(p.vx) * r * 3, 0, 0, 0);
    trail.addColorStop(0, 'transparent'); trail.addColorStop(1, pal.accent);
    c.globalAlpha = 0.5; c.fillStyle = trail;
    c.beginPath(); c.ellipse(-Math.sign(p.vx) * r * 1.4, 0, r * 1.7, r * 0.55, 0, 0, 7); c.fill();
    c.globalAlpha = 1;
    const g = c.createRadialGradient(0, 0, 2, 0, 0, r);
    g.addColorStop(0, '#fff'); g.addColorStop(0.35, pal.accent); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * (1 + Math.sin(tick * 0.5) * 0.06), 0, 7); c.fill();
    c.restore();
  }

  drawEffect(c, e) {
    const k = e.t / e.life;
    c.save();
    c.translate(e.x, e.y);
    if (e.type === 'spark') {
      const size = (e.kind === 'big' ? 70 : 46) * (0.5 + Math.sin(Math.min(1, k * 1.6) * Math.PI / 2) * 0.7);
      c.globalAlpha = 1 - k * k;
      c.rotate(e.t * 0.35);
      if (e.kind === 'block') {
        c.strokeStyle = '#bfe6ff'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, size * 0.7, 0, 7); c.stroke();
      } else {
        const pts = 8; c.beginPath();
        for (let i = 0; i < pts * 2; i++) { const rad = i % 2 ? size * 0.35 : size; const a = (i / (pts * 2)) * Math.PI * 2; c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
        c.closePath(); c.fillStyle = '#ffe14a'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#fff'; c.stroke();
      }
    } else if (e.type === 'dust') {
      c.globalAlpha = 0.5 * (1 - k); c.fillStyle = '#d8d0c0';
      c.beginPath(); c.arc(0, 0, 6 + k * 14, 0, 7); c.fill();
    }
    c.restore();
  }

  drawBoxes(c, engine) {
    const rect = (r, col) => { c.strokeStyle = col; c.lineWidth = 2; c.strokeRect(r.x, r.y, r.w, r.h); };
    for (const f of engine.fighters) {
      rect(f.hurtbox(), '#35ff7a');
      const hb = f.hitbox(); if (hb) rect(hb, '#ff3a3a');
      c.fillStyle = '#fff'; c.fillRect(f.x - 2, WORLD.groundY - f.y - 2, 4, 4);
    }
    for (const p of engine.projectiles) rect({ x: p.x - p.w / 2, y: WORLD.groundY - p.y - p.h / 2, w: p.w, h: p.h }, '#ff3a3a');
  }
}
