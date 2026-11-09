import { WORLD } from '../data/config.js';
import { palette } from '../data/roster.js';

const OUT = '#0b0b12';
const lerp = (a, b, t) => a + (b - a) * t;
const lerpP = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });

/** Cinemática inversa de 2 huesos: devuelve el codo/rodilla. */
function ik(a, b, l1, l2, bend) {
  let dx = b.x - a.x, dy = b.y - a.y;
  let d = Math.hypot(dx, dy);
  const maxd = l1 + l2 - 0.5;
  let end = b;
  if (d > maxd) { end = { x: a.x + dx / d * maxd, y: a.y + dy / d * maxd }; dx = end.x - a.x; dy = end.y - a.y; d = maxd; }
  if (d < 1) d = 1;
  const k = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const hh = Math.sqrt(Math.max(0, l1 * l1 - k * k));
  const mx = a.x + dx * k / d, my = a.y + dy * k / d;
  return { mid: { x: mx + bend * (-dy / d) * hh, y: my + bend * (dx / d) * hh }, end };
}

function limb(c, a, b, l1, l2, bend, width, color) {
  const { mid, end } = ik(a, b, l1, l2, bend);
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [w, col] of [[width + 6, OUT], [width, color]]) {
    c.strokeStyle = col; c.lineWidth = w;
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(mid.x, mid.y); c.lineTo(end.x, end.y); c.stroke();
  }
  return end;
}

function guardPose(f, t) {
  const bob = Math.sin(t * 0.12 + f.index) * 1.8;
  return { hipY: 92 + bob * 0.4, lean: 0, hF: { x: 36, y: -146 + bob }, hB: { x: 14, y: -138 + bob }, fF: { x: 28, y: 0 }, fB: { x: -26, y: 0 } };
}

function computePose(f, t) {
  const p = guardPose(f, t);
  switch (f.state) {
    case 'walkF': case 'walkB': {
      const dir = f.state === 'walkF' ? 1 : -1;
      const s = Math.sin(f.t * 0.35 * dir) * 24;
      p.fF = { x: 24 + s, y: -Math.max(0, Math.cos(f.t * 0.35)) * 12 };
      p.fB = { x: -24 - s, y: -Math.max(0, -Math.cos(f.t * 0.35)) * 12 };
      break;
    }
    case 'crouch': case 'land':
      p.hipY = 52; p.hF = { x: 36, y: -100 }; p.hB = { x: 12, y: -92 }; p.fF = { x: 36, y: 0 }; p.fB = { x: -32, y: 0 }; break;
    case 'jump':
      p.hipY = 104; p.fF = { x: 26, y: -52 }; p.fB = { x: -8, y: -38 }; p.hF = { x: 36, y: -178 }; p.hB = { x: 8, y: -160 }; break;
    case 'attack': attackPose(f, p); break;
    case 'hit':
      p.lean = -14; p.hF = { x: 20, y: -110 }; p.hB = { x: -8, y: -102 }; p.fF = { x: 22, y: 0 }; p.fB = { x: -32, y: 0 }; p.headBack = 8; break;
    case 'block':
      if (f.crouchBlock) { p.hipY = 52; p.hF = { x: 34, y: -118 }; p.hB = { x: 28, y: -104 }; p.fF = { x: 36, y: 0 }; p.fB = { x: -30, y: 0 }; }
      else { p.hF = { x: 36, y: -176 }; p.hB = { x: 30, y: -158 }; p.lean = -4; }
      break;
    case 'knock':
      p.rot = -Math.min(Math.PI / 2, f.t * 0.13); p.hipY = 90; p.hF = { x: 30, y: -150 }; p.hB = { x: -20, y: -150 }; p.fF = { x: 20, y: -4 }; p.fB = { x: -20, y: -4 }; break;
    case 'down': case 'ko':
      p.rot = -Math.PI / 2; p.liftY = 22; p.hipY = 90; p.hF = { x: 10, y: -110 }; p.hB = { x: -10, y: -110 }; p.fF = { x: 20, y: 0 }; p.fB = { x: -20, y: 0 }; break;
    case 'getup': {
      const k = Math.max(0, f.stun / 20);
      p.rot = -Math.PI / 2 * k; p.liftY = 22 * k; break;
    }
    case 'taunt': {
      const w = Math.sin(f.t * 0.4) * 10;
      p.hF = { x: 50, y: -180 + w }; p.hB = { x: -30, y: -180 - w }; p.lean = -4; break;
    }
    case 'win':
      p.hF = { x: 24, y: -228 + Math.sin(f.t * 0.2) * 5 }; p.hB = { x: -6, y: -120 }; break;
    default: break;
  }
  return p;
}

function attackPose(f, p) {
  const m = f.move; if (!m) return;
  const mf = f.mf;
  let ext;
  if (mf <= m.startup) ext = (mf / Math.max(1, m.startup)) * 0.55;
  else if (mf <= m.startup + m.active) ext = 1;
  else ext = Math.max(0, 1 - (mf - m.startup - m.active) / Math.max(1, m.recover));
  if (m.crouch) { p.hipY = 52; p.fF = { x: 36, y: 0 }; p.fB = { x: -32, y: 0 }; p.hF = { x: 36, y: -100 }; p.hB = { x: 12, y: -92 }; }
  if (m.air) { p.hipY = 104; p.fF = { x: 24, y: -50 }; p.fB = { x: -8, y: -36 }; }
  if (m.box) {
    const target = { x: m.box.x + m.box.w * 0.88, y: m.box.y + m.box.h / 2 };
    if (m.kind === 'kick') {
      const rest = p.fF; p.fF = lerpP(rest, target, ext); p.lean = -9 * ext;
      if (!m.air) p.hipY -= 6 * ext;
    } else {
      p.hF = lerpP(p.hF, target, ext); p.lean = 9 * ext;
    }
  } else {
    const t = { x: 78, y: -132 };
    p.hF = lerpP(p.hF, t, ext); p.hB = lerpP(p.hB, { x: 60, y: -126 }, ext); p.lean = 6 * ext;
  }
}

function drawBody(c, f, pose, pal, t) {
  const hip = { x: -2, y: -pose.hipY };
  const chest = { x: hip.x + pose.lean, y: hip.y - 58 };
  const head = { x: chest.x + 5 + pose.lean * 0.3 - (pose.headBack || 0), y: chest.y - 32 };
  const shoulder = { x: chest.x + 3, y: chest.y - 6 };
  const fHip = { x: hip.x + 10, y: hip.y }, bHip = { x: hip.x - 10, y: hip.y };

  limb(c, { x: shoulder.x - 8, y: shoulder.y }, { x: pose.hB.x - 6, y: pose.hB.y }, 34, 34, -1, 15, pal.skin);       // brazo trasero
  limb(c, bHip, pose.fB, 46, 46, 1, 19, pal.secondary);                                                               // pierna trasera
  // torso
  c.lineCap = 'round';
  for (const [w, col] of [[50, OUT], [44, pal.primary]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(hip.x, hip.y); c.lineTo(chest.x, chest.y); c.stroke(); }
  c.strokeStyle = pal.accent; c.lineWidth = 12; c.beginPath(); c.moveTo(hip.x - 16, hip.y - 2); c.lineTo(hip.x + 16, hip.y - 2); c.stroke();
  limb(c, fHip, pose.fF, 46, 46, 1, 19, pal.secondary);                                                               // pierna delantera
  c.fillStyle = pal.accent; c.strokeStyle = OUT; c.lineWidth = 3;                                                     // botas
  for (const ft of [pose.fB, pose.fF]) { c.beginPath(); c.ellipse(ft.x + 6, ft.y - 4, 15, 9, 0, 0, 7); c.fill(); c.stroke(); }
  // cabeza
  c.fillStyle = pal.skin; c.strokeStyle = OUT; c.lineWidth = 4;
  c.beginPath(); c.arc(head.x, head.y, 23, 0, 7); c.fill(); c.stroke();
  c.fillStyle = pal.hair; c.beginPath();
  if (f.def.hairStyle === 0) { c.moveTo(head.x - 24, head.y - 4); [[-30, -34], [-14, -24], [-6, -44], [6, -24], [20, -40], [24, -14]].forEach(([x, y]) => c.lineTo(head.x + x, head.y + y)); c.lineTo(head.x + 24, head.y - 4); }
  else if (f.def.hairStyle === 1) { c.moveTo(head.x - 8, head.y - 20); c.lineTo(head.x - 2, head.y - 44); c.lineTo(head.x + 12, head.y - 40); c.lineTo(head.x + 12, head.y - 18); }
  else if (f.def.hairStyle === 2) { c.arc(head.x, head.y, 25, Math.PI, 0); c.lineTo(head.x - 30, head.y + 20); c.lineTo(head.x - 26, head.y - 2); }
  else { c.arc(head.x, head.y, 25, Math.PI * 1.05, Math.PI * 1.95); }
  c.fill(); c.stroke();
  if (f.def.hairStyle === 3) { c.fillStyle = pal.accent; c.fillRect(head.x - 24, head.y - 12, 48, 8); }
  c.fillStyle = '#fff'; c.beginPath(); c.ellipse(head.x + 10, head.y - 2, 7, 5, 0.2, 0, 7); c.fill();
  c.fillStyle = OUT; c.beginPath(); c.arc(head.x + 12, head.y - 1, 2.6, 0, 7); c.fill();
  c.strokeStyle = OUT; c.lineWidth = 3.5; c.beginPath(); c.moveTo(head.x + 3, head.y - 10); c.lineTo(head.x + 16, head.y - 5); c.stroke();
  // brazo delantero + guante
  const hand = limb(c, { x: shoulder.x + 8, y: shoulder.y }, pose.hF, 34, 34, -1, 15, pal.skin);
  c.fillStyle = pal.accent; c.strokeStyle = OUT; c.lineWidth = 3;
  c.beginPath(); c.arc(hand.x, hand.y, 11, 0, 7); c.fill(); c.stroke();
}

export function drawFighter(c, f, tick) {
  const pal = palette(f.def, f.variant);
  const gy = WORLD.groundY - f.y;
  const sh = Math.max(0.35, 1 - f.y / 260);
  c.save();
  c.globalAlpha = 0.38 * sh; c.fillStyle = '#000';
  c.beginPath(); c.ellipse(f.x, WORLD.groundY + 5, (f.state === 'down' || f.state === 'ko' ? 90 : 48) * sh, 12 * sh, 0, 0, 7); c.fill();
  c.restore();

  c.save();
  c.translate(f.x, gy);
  c.scale(f.facing, 1);
  const pose = computePose(f, tick);
  if (pose.liftY) c.translate(0, -pose.liftY);
  if (pose.rot) { c.translate(0, -pose.hipY); c.rotate(pose.rot); c.translate(0, pose.hipY); }
  if (f.invuln > 0 && f.state !== 'attack' && tick % 4 < 2) c.globalAlpha = 0.6;
  drawBody(c, f, pose, pal, tick);
  c.restore();
}
