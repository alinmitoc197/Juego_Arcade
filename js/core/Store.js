import { DEFAULT_SETTINGS } from '../data/config.js';

const KEY = 'arena-clash:settings:v1';
const listeners = new Set();
let values = { ...DEFAULT_SETTINGS };

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) values = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* sin almacenamiento: seguimos con los valores por defecto */ }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(values)); } catch { /* ignorar */ }
}

export const Settings = {
  load,
  get: (k) => values[k],
  set(k, v) { values[k] = v; save(); listeners.forEach((fn) => fn(k, v)); },
  reset() { values = { ...DEFAULT_SETTINGS }; save(); listeners.forEach((fn) => fn(null, null)); },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};
