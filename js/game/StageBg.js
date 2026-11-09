import { WORLD } from '../data/config.js';

export const STAGES = ['orbital', 'dojo', 'neon'];

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function floorPerspective(c, { top, base, line, vanish = [640, 480], rows = 9, cols = 22 }) {
  const W = WORLD.width, H = WORLD.height;
  const g = c.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, base[0]); g.addColorStop(1, base[1]);
  c.fillStyle = g; c.fillRect(0, top, W, H - top);
  c.strokeStyle = line; c.lineWidth = 1.5;
  for (let i = 1; i <= rows; i++) {
    const y = top + (H - top) * Math.pow(i / rows, 1.8);
    c.globalAlpha = 0.15 + 0.35 * (i / rows);
    c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
  }
  for (let i = -cols; i <= cols; i++) {
    c.globalAlpha = 0.18;
    c.beginPath(); c.moveTo(vanish[0] + i * 26, top); c.lineTo(vanish[0] + i * 130, H); c.stroke();
  }
  c.globalAlpha = 1;
}

const painters = {
  orbital(c) {
    const W = WORLD.width, H = WORLD.height, r = rng(7);
    let g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#03041a'); g.addColorStop(0.6, '#0e1040'); g.addColorStop(1, '#261050');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (const [x, y, rad, col] of [[200, 200, 380, 'rgba(140,60,200,.35)'], [1050, 420, 420, 'rgba(40,120,220,.3)']]) {
      const n = c.createRadialGradient(x, y, 0, x, y, rad); n.addColorStop(0, col); n.addColorStop(1, 'transparent');
      c.fillStyle = n; c.fillRect(0, 0, W, H);
    }
    for (let i = 0; i < 260; i++) {
      c.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`;
      const s = r() < 0.1 ? 2.2 : 1.2; c.fillRect(r() * W, r() * 520, s, s);
    }
    // planeta
    const px = 980, py = 360, pr = 300;
    c.save(); c.beginPath(); c.arc(px, py, pr, 0, 7); c.clip();
    g = c.createRadialGradient(px - 90, py - 90, 20, px, py, pr);
    g.addColorStop(0, '#7fd0ff'); g.addColorStop(0.6, '#2a6fc0'); g.addColorStop(1, '#0a1a50');
    c.fillStyle = g; c.fillRect(px - pr, py - pr, pr * 2, pr * 2);
    c.fillStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i < 18; i++) { c.beginPath(); c.ellipse(px - 200 + r() * 400, py - 250 + r() * 500, 60 + r() * 110, 12 + r() * 20, -0.3, 0, 7); c.fill(); }
    g = c.createRadialGradient(px + 120, py + 120, pr * 0.6, px + 120, py + 120, pr * 1.2);
    g.addColorStop(0, 'transparent'); g.addColorStop(1, 'rgba(0,0,20,.85)'); c.fillStyle = g; c.fillRect(px - pr, py - pr, pr * 2, pr * 2);
    c.restore();
    floorPerspective(c, { top: WORLD.groundY - 40, base: ['#1b3a7a', '#06102c'], line: '#7fb8ff' });
    g = c.createLinearGradient(0, WORLD.groundY - 40, 0, WORLD.groundY + 10); g.addColorStop(0, 'rgba(160,210,255,.5)'); g.addColorStop(1, 'transparent');
    c.fillStyle = g; c.fillRect(0, WORLD.groundY - 40, W, 50);
  },
  dojo(c) {
    const W = WORLD.width, H = WORLD.height, r = rng(11);
    let g = c.createLinearGradient(0, 0, 0, 560);
    g.addColorStop(0, '#2a1448'); g.addColorStop(0.55, '#c0405a'); g.addColorStop(1, '#ffb066');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    g = c.createRadialGradient(640, 380, 10, 640, 380, 300); g.addColorStop(0, 'rgba(255,230,150,.9)'); g.addColorStop(1, 'transparent');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#ffe9a8'; c.beginPath(); c.arc(640, 380, 120, 0, 7); c.fill();
    for (const [col, base, amp] of [['#4a2050', 470, 80], ['#2a1038', 520, 60]]) {
      c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += 40) c.lineTo(x, base - Math.abs(Math.sin(x * 0.011 + base)) * amp - r() * 18);
      c.lineTo(W, H); c.fill();
    }
    // torii
    c.fillStyle = '#9a1c26';
    c.fillRect(250, 320, 26, 240); c.fillRect(1004, 320, 26, 240);
    c.fillRect(215, 300, 850, 26); c.fillRect(240, 350, 800, 16);
    c.fillStyle = '#1a0a14'; c.fillRect(205, 292, 870, 10);
    floorPerspective(c, { top: WORLD.groundY - 50, base: ['#7a4a28', '#2c180c'], line: '#2a1408', rows: 7, cols: 30 });
  },
  neon(c) {
    const W = WORLD.width, H = WORLD.height, r = rng(23);
    let g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a0020'); g.addColorStop(0.7, '#3a0f5a'); g.addColorStop(1, '#ff5a9a');
    c.fillStyle = g; c.fillRect(0, 0, W, 600);
    for (let layer = 0; layer < 2; layer++) {
      let x = -20;
      while (x < W) {
        const w = 70 + r() * 90, h = (layer ? 140 : 260) + r() * (layer ? 160 : 220);
        c.fillStyle = layer ? '#190a30' : '#0d0420';
        c.fillRect(x, 600 - h, w, h);
        for (let wy = 600 - h + 14; wy < 590; wy += 22) for (let wx = x + 8; wx < x + w - 10; wx += 16) {
          if (r() < 0.38) { c.fillStyle = r() < 0.5 ? 'rgba(255,230,120,.85)' : 'rgba(80,230,255,.8)'; c.fillRect(wx, wy, 7, 11); }
        }
        x += w + 6;
      }
    }
    for (const [x, y, w, col] of [[160, 250, 120, '#ff3ea0'], [540, 200, 150, '#35e0ff'], [940, 280, 130, '#ffe23e']]) {
      c.shadowColor = col; c.shadowBlur = 30; c.fillStyle = col; c.fillRect(x, y, w, 22); c.shadowBlur = 0;
    }
    floorPerspective(c, { top: WORLD.groundY - 40, base: ['#1c1b30', '#07060f'], line: '#35e0ff', rows: 8, cols: 18 });
    c.strokeStyle = '#ff3ea0'; c.lineWidth = 4; c.shadowColor = '#ff3ea0'; c.shadowBlur = 20;
    c.beginPath(); c.moveTo(0, WORLD.groundY - 40); c.lineTo(W, WORLD.groundY - 40); c.stroke(); c.shadowBlur = 0;
  },
};

export function buildStage(id) {
  const cv = document.createElement('canvas');
  cv.width = WORLD.width; cv.height = WORLD.height;
  const c = cv.getContext('2d');
  (painters[id] || painters.orbital)(c);
  const v = c.createRadialGradient(640, 380, 300, 640, 380, 800);
  v.addColorStop(0, 'transparent'); v.addColorStop(1, 'rgba(0,0,0,.55)');
  c.fillStyle = v; c.fillRect(0, 0, WORLD.width, WORLD.height);
  return cv;
}
