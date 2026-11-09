// Plantel de luchadores. De momento son marcadores propios (personajes originales y básicos);
// se sustituirán por arte definitivo más adelante sin tocar el resto del código.
import { SPECIALS, SPECIAL_PRIORITY } from './moves.js';

export const GROUPS = [
  { id: 'vanguard', color: '#3b82f6' },
  { id: 'arcane', color: '#ef4444' },
  { id: 'street', color: '#fbbf24' },
];

const NAMES = {
  vanguard: ['Aldric', 'Brakka', 'Corvus', 'Dalia', 'Eskor', 'Fenrir', 'Galen', 'Hakon', 'Isolde', 'Joren', 'Kaelis', 'Lorcan'],
  arcane: ['Morgana', 'Nyx', 'Orion', 'Pyra', 'Quillon', 'Raven', 'Sylas', 'Talia', 'Umbra', 'Vexa', 'Wraith', 'Xanthe'],
  street: ['Axel', 'Blitz', 'Cruz', 'Dante', 'Echo', 'Fuego', 'Gato', 'Hex', 'Iris', 'Jax', 'Kira', 'Lobo'],
};

const ARCHETYPES = {
  shoto:   { vitality: 1.0,  power: 1.0,  speed: 1.0,  specials: ['fireball', 'uppercut', 'dashKick', 'super'] },
  rush:    { vitality: 0.95, power: 1.05, speed: 1.15, specials: ['dashKick', 'uppercut', 'super'] },
  zoner:   { vitality: 0.9,  power: 0.95, speed: 0.95, specials: ['fireball', 'dashKick', 'super'] },
  bruiser: { vitality: 1.15, power: 1.15, speed: 0.85, specials: ['uppercut', 'fireball', 'super'] },
};
const ARCH_KEYS = Object.keys(ARCHETYPES);
const SKINS = ['#f2c9a0', '#e0a577', '#c68642', '#8d5524', '#ffdbac'];

export const ROSTER = [];
GROUPS.forEach((g, gi) => {
  NAMES[g.id].forEach((name, i) => {
    const idx = gi * 12 + i;
    const arch = ARCH_KEYS[(idx * 7 + gi) % ARCH_KEYS.length];
    const a = ARCHETYPES[arch];
    const specials = [...a.specials].sort((x, y) => SPECIAL_PRIORITY.indexOf(x) - SPECIAL_PRIORITY.indexOf(y));
    ROSTER.push({
      id: name.toLowerCase(), name: name.toUpperCase(), group: g.id, idx, archetype: arch,
      hue: (idx * 29 + gi * 40) % 360, skin: SKINS[idx % SKINS.length], hair: (idx * 53) % 360, hairStyle: idx % 4,
      stats: { vitality: a.vitality, power: a.power, speed: a.speed },
      specials, specialMoves: specials.map((s) => SPECIALS[s]),
    });
  });
});

export const getFighter = (id) => ROSTER.find((f) => f.id === id) || ROSTER[0];
export const groupOf = (def) => GROUPS.find((g) => g.id === def.group);
export function randomFighter(excludeId = null) {
  const pool = ROSTER.filter((f) => f.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function palette(def, variant = 0) {
  const h = (def.hue + variant * 70) % 360;
  return {
    primary: `hsl(${h} 62% 46%)`, primaryLight: `hsl(${h} 70% 58%)`, primaryDark: `hsl(${h} 60% 26%)`,
    secondary: `hsl(${(h + 200) % 360} 45% 30%)`, accent: `hsl(${(h + 45) % 360} 90% 58%)`,
    skin: def.skin, hair: `hsl(${def.hair} 55% 30%)`,
  };
}

export function getMoveList(def) {
  return def.specials.map((id) => ({ id, motion: SPECIALS[id].motions[0], input: SPECIALS[id].input, cost: SPECIALS[id].cost || 0 }));
}
