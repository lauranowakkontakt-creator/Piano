const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {ROOT} = require('../helpers/load');

/* Kopia appki w katalogu tymczasowym — tak samo robi workflow publikujący stronę. */
function kopia(){
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'harmonia-'));
  for(const co of ['index.html', 'css', 'js', 'vendor', 'scripts'])
    fs.cpSync(path.join(ROOT, co), path.join(dir, co), {recursive: true});
  return dir;
}
const stempluj = dir => require('node:child_process')
  .execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'wersja.js'), dir], {encoding: 'utf8'});
const czytaj = dir => fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const wersje = html => [...html.matchAll(/(?:src|href)="(?:js|css|vendor)\/[^"?#]+\?v=([^"#]+)"/g)].map(m => m[1]);

test('każdy skrypt i styl dostaje ten sam znacznik wersji', () => {
  const dir = kopia();
  stempluj(dir);
  const html = czytaj(dir);
  const v = wersje(html);
  assert.ok(v.length >= 25, 'ostemplowanych plików: ' + v.length);
  assert.equal(new Set(v).size, 1, 'różne wersje w jednym pliku: ' + [...new Set(v)].join(', '));
  assert.match(v[0], /^[0-9a-f]{8}$/);
  // nic lokalnego nie zostaje bez znacznika
  const bez = [...html.matchAll(/(?:src|href)="((?:js|css|vendor)\/[^"]+)"/g)].map(m => m[1]).filter(x => !x.includes('?v='));
  assert.deepEqual(bez, [], 'bez znacznika: ' + bez.join(', '));
  // wersja jest też w <meta>, żeby dało się ją pokazać w stopce
  assert.match(html, new RegExp(`<meta name="harmonia-wersja" content="${v[0]}">`));
  fs.rmSync(dir, {recursive: true, force: true});
});

test('ta sama appka = ta sama wersja, zmiana pliku = nowa wersja', () => {
  const a = kopia(), b = kopia();
  stempluj(a); stempluj(b);
  assert.deepEqual(wersje(czytaj(a))[0], wersje(czytaj(b))[0], 'ten sam kod ma dawać ten sam znacznik');

  fs.appendFileSync(path.join(b, 'js', 'theory.js'), '\n// drobna zmiana\n');
  stempluj(b);
  assert.notEqual(wersje(czytaj(a))[0], wersje(czytaj(b))[0], 'po zmianie pliku znacznik musi się zmienić');
  fs.rmSync(a, {recursive: true, force: true});
  fs.rmSync(b, {recursive: true, force: true});
});

test('stemplowanie dwa razy nie psuje pliku', () => {
  const dir = kopia();
  stempluj(dir);
  const raz = czytaj(dir);
  stempluj(dir);
  const dwa = czytaj(dir);
  assert.equal(raz, dwa, 'drugie uruchomienie ma nic nie zmienić');
  assert.equal(new Set(wersje(dwa)).size, 1);
  assert.equal((dwa.match(/harmonia-wersja/g) || []).length, 1, 'jeden <meta>, nie dwa');
  fs.rmSync(dir, {recursive: true, force: true});
});

test('repo trzyma index.html bez znacznika — stempluje dopiero publikacja', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.equal(wersje(html).length, 0, 'w repo nie powinno być ?v=');
  // ale krok stemplujący musi być w workflow, inaczej cała sztuczka nic nie daje
  const wf = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'pages.yml'), 'utf8');
  assert.match(wf, /scripts\/wersja\.js _site/);
});
