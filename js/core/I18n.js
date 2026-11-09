import es from '../data/i18n/es.js';
import en from '../data/i18n/en.js';

const dicts = { es, en };
let lang = 'es';
const listeners = new Set();

export const I18n = {
  get lang() { return lang; },
  setLang(l) {
    if (!dicts[l] || l === lang) return;
    lang = l;
    document.documentElement.lang = l;
    listeners.forEach((fn) => fn(l));
  },
  t(key, params) {
    let s = dicts[lang][key] ?? dicts.es[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, v);
    return s;
  },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};
export const t = (k, p) => I18n.t(k, p);
