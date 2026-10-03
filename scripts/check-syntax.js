/* Szybka kontrola: każdy plik JS appki musi się sparsować, a każdy <script> z index.html musi istnieć. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
// ?v=… dokleja skrypt scripts/wersja.js przy publikacji — przy sprawdzaniu je pomijamy
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1].split('?')[0]);
let bad = 0;
for(const src of scripts){
  const file = path.join(ROOT, src);
  if(!fs.existsSync(file)){ console.error('brak pliku: ' + src); bad++; continue; }
  try{ new vm.Script(fs.readFileSync(file, 'utf8'), {filename: src}); }
  catch(e){ console.error(src + ': ' + e.message); bad++; }
}
const views = fs.readdirSync(path.join(ROOT, 'js', 'views')).map(f => 'js/views/' + f);
for(const v of views) if(!scripts.includes(v)){ console.error('widok nie jest załadowany w index.html: ' + v); bad++; }
console.log(bad ? `błędy: ${bad}` : `OK — ${scripts.length} skryptów`);
process.exit(bad ? 1 : 0);
