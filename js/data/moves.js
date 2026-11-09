// Datos de movimientos (en frames a 60 fps). Cambiar números aquí = reequilibrar el juego.
export const BUTTONS = ['lp', 'mp', 'hp', 'lk', 'mk', 'hk'];
export const BUTTON_GROUPS = { punch: ['lp', 'mp', 'hp'], kick: ['lk', 'mk', 'hk'] };
export const BTN_TIER = { lp: 1, lk: 1, mp: 2, mk: 2, hp: 3, hk: 3 };
export const BTN_KIND = { lp: 'punch', mp: 'punch', hp: 'punch', lk: 'kick', mk: 'kick', hk: 'kick' };

const base = { level: 'mid', pushHit: 6, pushBlock: 5, knock: false };

function N(btn, set, o) {
  return {
    ...base, ...o, btn, set,
    tier: BTN_TIER[btn], kind: BTN_KIND[btn],
    id: `${set}.${btn}`, crouch: set === 'crouch', air: set === 'air',
  };
}

// box: x = distancia hacia delante desde el centro, y = altura sobre los pies (negativa = arriba)
export const NORMALS = {
  stand: {
    lp: N('lp', 'stand', { startup: 4, active: 3, recover: 6, damage: 30, hitstun: 14, blockstun: 9, box: { x: 25, y: -152, w: 75, h: 28 } }),
    mp: N('mp', 'stand', { startup: 6, active: 4, recover: 10, damage: 55, hitstun: 18, blockstun: 11, pushHit: 8, box: { x: 25, y: -142, w: 90, h: 34 } }),
    hp: N('hp', 'stand', { startup: 10, active: 5, recover: 16, damage: 90, hitstun: 24, blockstun: 14, pushHit: 10, pushBlock: 8, knock: true, box: { x: 20, y: -158, w: 105, h: 42 } }),
    lk: N('lk', 'stand', { startup: 5, active: 3, recover: 8, damage: 35, hitstun: 15, blockstun: 9, box: { x: 20, y: -92, w: 90, h: 30 } }),
    mk: N('mk', 'stand', { startup: 8, active: 4, recover: 12, damage: 60, hitstun: 19, blockstun: 12, pushHit: 8, box: { x: 20, y: -104, w: 110, h: 36 } }),
    hk: N('hk', 'stand', { startup: 12, active: 5, recover: 18, damage: 100, hitstun: 26, blockstun: 15, pushHit: 11, pushBlock: 9, knock: true, box: { x: 20, y: -128, w: 130, h: 44 } }),
  },
  crouch: {
    lp: N('lp', 'crouch', { startup: 4, active: 3, recover: 6, damage: 25, hitstun: 14, blockstun: 9, box: { x: 25, y: -96, w: 75, h: 26 } }),
    mp: N('mp', 'crouch', { startup: 6, active: 4, recover: 10, damage: 50, hitstun: 18, blockstun: 11, box: { x: 25, y: -100, w: 90, h: 32 } }),
    hp: N('hp', 'crouch', { startup: 8, active: 6, recover: 18, damage: 85, hitstun: 24, blockstun: 14, knock: true, box: { x: 15, y: -170, w: 75, h: 120 } }),
    lk: N('lk', 'crouch', { startup: 5, active: 3, recover: 8, damage: 28, hitstun: 15, blockstun: 9, level: 'low', box: { x: 20, y: -28, w: 95, h: 26 } }),
    mk: N('mk', 'crouch', { startup: 8, active: 4, recover: 12, damage: 50, hitstun: 19, blockstun: 12, level: 'low', box: { x: 20, y: -30, w: 115, h: 28 } }),
    hk: N('hk', 'crouch', { startup: 11, active: 5, recover: 22, damage: 80, hitstun: 26, blockstun: 15, level: 'low', knock: true, box: { x: 15, y: -28, w: 145, h: 30 } }),
  },
  air: {
    lp: N('lp', 'air', { startup: 4, active: 8, recover: 4, damage: 30, hitstun: 16, blockstun: 10, box: { x: 20, y: -105, w: 70, h: 40 } }),
    mp: N('mp', 'air', { startup: 6, active: 8, recover: 4, damage: 50, hitstun: 18, blockstun: 11, box: { x: 20, y: -115, w: 85, h: 42 } }),
    hp: N('hp', 'air', { startup: 8, active: 8, recover: 4, damage: 75, hitstun: 22, blockstun: 13, knock: true, box: { x: 15, y: -125, w: 95, h: 48 } }),
    lk: N('lk', 'air', { startup: 4, active: 9, recover: 4, damage: 32, hitstun: 16, blockstun: 10, box: { x: 15, y: -70, w: 85, h: 40 } }),
    mk: N('mk', 'air', { startup: 6, active: 9, recover: 4, damage: 52, hitstun: 18, blockstun: 11, box: { x: 15, y: -78, w: 100, h: 44 } }),
    hk: N('hk', 'air', { startup: 8, active: 9, recover: 4, damage: 80, hitstun: 22, blockstun: 13, knock: true, box: { x: 15, y: -85, w: 110, h: 50 } }),
  },
};

const by = (btn, a, b, c) => ({ lp: a, lk: a, mp: b, mk: b, hp: c, hk: c })[btn];

// motions en notación numérica (6 = adelante, 2 = abajo, 3 = abajo-adelante...)
export const SPECIALS = {
  super: {
    id: 'super', input: 'punch', cost: 100, window: 48, motions: [[2, 3, 6, 2, 3, 6]],
    build: () => ({ startup: 20, active: 1, recover: 34, damage: 230, hitstun: 40, blockstun: 22, knock: true, super: true,
      spawn: { frame: 20, y: 120, speed: 12, size: 1.9 }, box: null }),
  },
  uppercut: {
    id: 'uppercut', input: 'punch', window: 20, strictEnd: true, motions: [[6, 2, 3]],
    build: (btn) => ({ startup: 3, active: 9, recover: 14, damage: by(btn, 80, 100, 120), hitstun: 30, blockstun: 16, knock: true,
      air: true, lock: true, vy: by(btn, 15, 17, 19), vx: by(btn, 1, 2, 3), invuln: 6, landLag: 16,
      box: { x: 8, y: -195, w: 62, h: 160 } }),
  },
  dashKick: {
    id: 'dashKick', input: 'kick', window: 20, motions: [[2, 1, 4], [2, 4]],
    build: (btn) => ({ startup: 9, active: 12, recover: 18, damage: by(btn, 65, 80, 95), hitstun: 24, blockstun: 14, knock: true,
      vx: by(btn, 6, 8, 10), moveFrom: 8, box: { x: 15, y: -98, w: 110, h: 42 } }),
  },
  fireball: {
    id: 'fireball', input: 'punch', window: 20, motions: [[2, 3, 6], [2, 6]],
    build: (btn) => ({ startup: 12, active: 1, recover: 26, damage: by(btn, 55, 65, 80), hitstun: 22, blockstun: 12, knock: false,
      spawn: { frame: 12, y: 115, speed: by(btn, 7, 9, 11), size: 1 }, box: null }),
  },
};

export const SPECIAL_PRIORITY = ['super', 'uppercut', 'dashKick', 'fireball'];

export function makeSpecial(sp, btn) {
  const m = sp.build(btn);
  return { ...base, pushHit: 8, pushBlock: 7, ...m, id: sp.id, btn, tier: m.super ? 3 : BTN_TIER[btn],
    kind: BTN_KIND[btn], special: true, cost: sp.cost || 0 };
}
