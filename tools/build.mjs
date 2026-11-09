// Empaqueta TODO el juego en un único archivo `jugar.html` (JS + CSS + imágenes incrustadas).
// Se abre con doble clic, sin servidor y sin riesgo de mezclar versiones. Uso: npm run build
import { build } from 'esbuild';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (...p) => path.join(root, ...p);

const out = await build({ entryPoints: [r('js/main.js')], bundle: true, format: 'iife', target: 'es2020', write: false, legalComments: 'none' });
let js = out.outputFiles[0].text;

// imágenes de assets/characters -> data URI (se sustituye la ruta por el contenido)
const dir = r('assets/characters');
if (existsSync(dir)) {
  for (const f of readdirSync(dir)) {
    const ext = path.extname(f).slice(1).toLowerCase();
    if (!['png', 'webp', 'jpg', 'jpeg', 'gif'].includes(ext)) continue;
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    const uri = `data:image/${mime};base64,${readFileSync(path.join(dir, f)).toString('base64')}`;
    js = js.split(`assets/characters/${f}`).join(uri);
  }
}

const css = ['theme', 'components', 'screens', 'fight'].map((n) => readFileSync(r('css', `${n}.css`), 'utf8')).join('\n');
const html = readFileSync(r('index.html'), 'utf8')
  .replace(/<link rel="stylesheet" href="css\/[^"]+">\s*/g, '')
  .replace('</head>', () => `<style>\n${css}\n</style>\n</head>`)
  .replace(/<script type="module" src="js\/main.js"><\/script>/, () => `<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`);

writeFileSync(r('jugar.html'), html);
console.log(`jugar.html generado (${(html.length / 1024).toFixed(0)} KB)`);
