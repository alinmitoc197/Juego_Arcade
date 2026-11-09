import { Settings } from './Store.js';

// Efectos sintetizados con WebAudio (sin archivos): se sustituirán por audio real más adelante.
let ctx = null;
function ac() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function vol() { return Settings.get('sfxVolume') / 10; }

function tone({ f = 440, f2 = null, t = 0.08, type = 'square', v = 0.2, delay = 0 }) {
  const c = ac(); const k = vol();
  if (!c || k <= 0) return;
  const o = c.createOscillator(), g = c.createGain();
  const t0 = c.currentTime + delay;
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + t);
  g.gain.setValueAtTime(v * k, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + t);
  o.connect(g).connect(c.destination);
  o.start(t0); o.stop(t0 + t + 0.02);
}
function noise({ t = 0.12, v = 0.25, delay = 0 }) {
  const c = ac(); const k = vol();
  if (!c || k <= 0) return;
  const len = Math.floor(c.sampleRate * t);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = c.createBufferSource(), g = c.createGain();
  g.gain.value = v * k; s.buffer = buf;
  s.connect(g).connect(c.destination);
  s.start(c.currentTime + delay);
}

const SOUNDS = {
  move: () => tone({ f: 520, t: 0.04, v: 0.1 }),
  confirm: () => { tone({ f: 660, t: 0.07, v: 0.16 }); tone({ f: 990, t: 0.1, v: 0.16, delay: 0.06 }); },
  back: () => tone({ f: 420, f2: 260, t: 0.1, v: 0.14 }),
  deny: () => tone({ f: 160, t: 0.14, type: 'sawtooth', v: 0.16 }),
  hit1: () => { noise({ t: 0.08, v: 0.25 }); tone({ f: 200, f2: 90, t: 0.08, v: 0.2 }); },
  hit2: () => { noise({ t: 0.1, v: 0.32 }); tone({ f: 160, f2: 70, t: 0.1, v: 0.25 }); },
  hit3: () => { noise({ t: 0.16, v: 0.4 }); tone({ f: 120, f2: 50, t: 0.16, v: 0.3 }); },
  block: () => { noise({ t: 0.05, v: 0.15 }); tone({ f: 700, t: 0.05, type: 'triangle', v: 0.14 }); },
  thud: () => tone({ f: 90, f2: 40, t: 0.18, type: 'sine', v: 0.3 }),
  fireball: () => tone({ f: 300, f2: 700, t: 0.25, type: 'sawtooth', v: 0.12 }),
  super: () => { tone({ f: 200, f2: 900, t: 0.5, type: 'sawtooth', v: 0.18 }); noise({ t: 0.3, v: 0.2 }); },
  ko: () => { tone({ f: 400, f2: 60, t: 0.9, type: 'sawtooth', v: 0.25 }); noise({ t: 0.4, v: 0.3 }); },
};

export const Sfx = { play(name) { try { SOUNDS[name]?.(); } catch { /* audio no disponible */ } } };
