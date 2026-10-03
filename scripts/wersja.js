#!/usr/bin/env node
/* Dopisuje do każdego <script> i <link> w index.html znacznik ?v=<skrót>,
   policzony z treści tych plików. Dzięki temu po wdrożeniu przeglądarka nie
   może pomieszać nowego index.html ze starym skryptem z pamięci podręcznej
   (a to wygląda dokładnie jak „appka przestała działać").

   Uruchamia się przed publikacją — robi to workflow .github/workflows/pages.yml.
   Lokalnie: node scripts/wersja.js [katalog]
*/
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');

function main(){
  let html = fs.readFileSync(INDEX, 'utf8');
  const pliki = [...html.matchAll(/(?:src|href)="((?:js|css|vendor)\/[^"?#]+)/g)].map(m => m[1]);
  if(!pliki.length){ console.error('Nie znalazłem lokalnych skryptów w index.html'); process.exit(1); }

  const hash = crypto.createHash('sha1');
  for(const f of [...new Set(pliki)].sort()){
    const p = path.join(ROOT, f);
    if(!fs.existsSync(p)){ console.error('Brakuje pliku:', f); process.exit(1); }
    hash.update(f).update(fs.readFileSync(p));
  }
  const v = hash.digest('hex').slice(0, 8);

  // dopisz albo podmień ?v=… przy każdym lokalnym pliku
  html = html.replace(/((?:src|href)="(?:js|css|vendor)\/[^"?#]+)(\?v=[^"#]*)?"/g, `$1?v=${v}"`);
  // znacznik wersji do stopki i do sprawdzenia, co naprawdę siedzi w przeglądarce
  const meta = `<meta name="harmonia-wersja" content="${v}">`;
  html = /<meta name="harmonia-wersja"[^>]*>/.test(html)
    ? html.replace(/<meta name="harmonia-wersja"[^>]*>/, meta)
    : html.replace('</title>', '</title>\n' + meta);

  fs.writeFileSync(INDEX, html);
  console.log('wersja', v, '·', new Set(pliki).size, 'plików');
  return v;
}
if(require.main === module) main();
module.exports = {main};
