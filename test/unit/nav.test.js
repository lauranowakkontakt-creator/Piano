const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {load, plain, ROOT} = require('../helpers/load');

const N = load('js/nav.js');
const {NAV_GROUPS, NAV_ITEMS, navById} = N;

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
// zakładki z paska i z routera — menu musi się z nimi zgadzać co do jednej
const wPasku = [...html.matchAll(/<a href="#([a-z]+)">/g)].map(m => m[1]);
const wRouterze = [...app.matchAll(/^\s{2}([a-z]+):\s*View/gm)].map(m => m[1]);

test('menu zna dokładnie te zakładki, które są w routerze; pasek pokazuje część z nich', () => {
  const wMenu = plain(NAV_ITEMS.map(i => i.id));
  assert.deepEqual([...wMenu].sort(), [...wRouterze].sort(), 'menu ≠ router');
  for(const id of wPasku) assert.ok(wMenu.includes(id), id + ' jest w pasku, a nie ma go w menu');
  // rzadziej używane zakładki są tylko w menu ☰, żeby pasek się nie przepełniał
  for(const id of ['druk', 'zrodla']) assert.ok(!wPasku.includes(id), id + ' ma być tylko w menu');
  assert.equal(new Set(wMenu).size, wMenu.length, 'powtórzona zakładka w menu');
});

test('każda pozycja ma nazwę i jedno zdanie, po co tam wchodzić', () => {
  for(const it of NAV_ITEMS){
    assert.ok(it.name && it.name.length >= 3, it.id);
    assert.ok(it.opis && it.opis.length > 15, `${it.id}: opis za krótki`);
    assert.ok(it.opis.length < 110, `${it.id}: opis za długi na telefon (${it.opis.length})`);
    assert.ok(/[.!?…]$/.test(it.opis), `${it.id}: opis bez kropki`);
  }
});

test('grupy są sensowne: każda ma nazwę i co najmniej trzy pozycje', () => {
  assert.ok(NAV_GROUPS.length >= 2 && NAV_GROUPS.length <= 4, 'grup: ' + NAV_GROUPS.length);
  for(const g of NAV_GROUPS){
    assert.ok(g.name && g.name.length > 2);
    assert.ok(g.items.length >= 3, `${g.name}: ${g.items.length} pozycji`);
  }
  // najważniejsze rzeczy do grania są w grupie „Granie"
  const granie = NAV_GROUPS.find(g => g.name === 'Granie');
  for(const id of ['petla', 'klawisze', 'gamy']) assert.ok(granie.items.some(i => i.id === id), id);
});

test('navById znajduje zakładkę po id, a na śmieci oddaje null', () => {
  assert.equal(navById('petla').name, 'Pętla');
  assert.equal(navById('nie-ma'), null);
  assert.equal(navById(''), null);
  assert.equal(navById(null), null);
});

test('dolny pasek: każda zakładka świeci się w jednym miejscu', () => {
  const {navDolAktywny, NAV_DOL} = N;
  assert.equal(NAV_DOL.length, 4, '4 miejsca + „Więcej"');
  for(const it of NAV_DOL) assert.ok(navById(it.id), it.id + ' nie jest zakładką');
  assert.equal(navDolAktywny('dzis'), 'dzis');
  for(const id of ['teoria', 'nuty', 'trening']) assert.equal(navDolAktywny(id), 'teoria', id);
  assert.equal(navDolAktywny('klawisze'), 'klawisze');
  assert.equal(navDolAktywny('piosenki'), 'piosenki');
  assert.equal(navDolAktywny('setlista'), 'piosenki', 'setlista mieszka przy piosenkach');
  for(const id of ['petla', 'gamy', 'glos', 'druk', 'zrodla', 'wizualizacja', 'przejscia', 'nie-ma'])
    assert.equal(navDolAktywny(id), 'wiecej', id);
});
