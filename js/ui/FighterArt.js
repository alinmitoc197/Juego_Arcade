import { palette } from '../data/roster.js';

let uid = 0;

/** Ilustración vectorial provisional de un luchador. view: 'full' | 'head' */
export function artSVG(def, variant = 0, view = 'full') {
  const p = palette(def, variant);
  const n = ++uid;
  const O = '#0b0b12';
  const hairBack = def.hairStyle === 2
    ? `<path d="M84 60 Q58 140 92 164 L100 84Z" fill="${p.hair}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>` : '';
  const hairFront = [
    `<path d="M82 62 L72 18 L98 44 L110 2 L126 42 L150 6 L156 46 L172 22 L160 66 Q120 40 82 62Z" fill="${p.hair}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>`,
    `<path d="M102 44 L110 -4 L130 -4 L138 44 Q120 32 102 44Z" fill="${p.hair}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>`,
    `<path d="M82 66 Q78 22 120 22 Q162 22 158 66 Q150 44 120 44 Q92 44 82 66Z" fill="${p.hair}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>`,
    `<path d="M84 58 Q84 26 120 26 Q156 26 156 58 Q120 44 84 58Z" fill="${p.hair}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/><rect x="82" y="52" width="76" height="11" fill="${p.accent}" stroke="${O}" stroke-width="3"/><path d="M82 56 L62 70 L66 78 L84 64Z" fill="${p.accent}" stroke="${O}" stroke-width="3"/>`,
  ][def.hairStyle];
  const vb = view === 'head' ? '62 0 116 116' : '0 0 240 360';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid ${view === 'head' ? 'slice' : 'meet'}" class="art art-${view}">
<defs>
 <radialGradient id="a${n}" cx="50%" cy="42%" r="55%"><stop offset="0" stop-color="${p.accent}" stop-opacity=".55"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient>
 <linearGradient id="b${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.primaryLight}"/><stop offset="1" stop-color="${p.primaryDark}"/></linearGradient>
</defs>
${view === 'full' ? `<circle cx="120" cy="160" r="150" fill="url(#a${n})"/>` : `<rect x="0" y="0" width="240" height="360" fill="${p.primaryDark}" opacity=".55"/>`}
<path d="M80 250 L160 250 L170 354 L128 354 L120 284 L112 354 L70 354Z" fill="${p.secondary}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>
<path d="M54 120 Q120 96 186 120 L172 262 L68 262Z" fill="url(#b${n})" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>
<rect x="68" y="244" width="104" height="18" fill="${p.accent}" stroke="${O}" stroke-width="3"/>
<circle cx="56" cy="128" r="26" fill="${p.secondary}" stroke="${O}" stroke-width="4"/>
<circle cx="184" cy="128" r="26" fill="${p.secondary}" stroke="${O}" stroke-width="4"/>
<rect x="58" y="184" width="124" height="30" rx="15" fill="${p.skin}" stroke="${O}" stroke-width="4" transform="rotate(-12 120 199)"/>
<rect x="58" y="206" width="124" height="30" rx="15" fill="${p.skin}" stroke="${O}" stroke-width="4" transform="rotate(10 120 221)"/>
<circle cx="62" cy="194" r="19" fill="${p.accent}" stroke="${O}" stroke-width="4"/>
<circle cx="178" cy="226" r="19" fill="${p.accent}" stroke="${O}" stroke-width="4"/>
<rect x="106" y="90" width="28" height="32" fill="${p.skin}" stroke="${O}" stroke-width="4"/>
${hairBack}
<ellipse cx="120" cy="68" rx="36" ry="40" fill="${p.skin}" stroke="${O}" stroke-width="4"/>
${hairFront}
<path d="M95 70 L114 74 L112 81 L95 77Z" fill="#fff" stroke="${O}" stroke-width="2"/>
<path d="M145 70 L126 74 L128 81 L145 77Z" fill="#fff" stroke="${O}" stroke-width="2"/>
<circle cx="106" cy="77" r="3.2" fill="${O}"/><circle cx="134" cy="77" r="3.2" fill="${O}"/>
<path d="M91 63 L117 71" stroke="${O}" stroke-width="4.5" stroke-linecap="round"/>
<path d="M149 63 L123 71" stroke="${O}" stroke-width="4.5" stroke-linecap="round"/>
<path d="M108 98 Q120 104 132 98" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
</svg>`;
}

export function artEl(def, variant = 0, view = 'full', cls = '') {
  const d = document.createElement('div');
  d.className = `art-wrap ${cls}`;
  d.innerHTML = artSVG(def, variant, view);
  return d;
}
