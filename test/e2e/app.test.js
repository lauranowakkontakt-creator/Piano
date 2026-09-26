/* Testy w prawdziwej przeglądarce (Chromium przez Playwright).
   Appka jest otwierana z pliku, tak jak u Laury (dwuklik w index.html). */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const fs = require('node:fs');
const {chromium} = require('playwright');
const {ROOT} = require('../helpers/load');

const APP = pathToFileURL(path.join(ROOT, 'index.html')).href;

function launchOpts(){
  // w środowiskach z gotowym Chromium (np. /opt/pw-browsers) nie ściągamy przeglądarki
  const pre = process.env.PLAYWRIGHT_BROWSERS_PATH && path.join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium');
  return pre && fs.existsSync(pre) ? {executablePath: fs.realpathSync(pre)} : {};
}

let browser;
test.before(async () => { browser = await chromium.launch(launchOpts()); });
test.after(async () => { await browser?.close(); });

// nowa, czysta przeglądarka (bez zapisanych piosenek) + zbieranie błędów JS
async function open(hash = ''){
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if(m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.on('dialog', d => d.accept());
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());   // bez internetu w testach
  await page.goto(APP + hash);
  return {page, errors, close: () => context.close()};
}
const go = (page, hash) => page.evaluate(h => { location.hash = h; }, hash);

test('każda zakładka i podstrona otwiera się bez błędów', async () => {
  const {page, errors, close} = await open('#gamy');
  const hashes = await page.evaluate(() => [
    ...Object.keys(ROUTES),
    ...LESSONS.map(l => 'teoria/' + l.id),
    ...NUTY_LESSONS.map(l => 'nuty/' + l.id), 'nuty/trener',
    ...GLOS_PAGES.map(p => 'glos/' + p.id),
    'piosenki/seed-widze-dom', 'druk/song/seed-blizej', 'nieznana-zakladka',
  ]);
  for(const hsh of hashes){
    await go(page, '#' + hsh);
    await page.waitForFunction(() => document.getElementById('view').children.length > 0);
    await page.waitForTimeout(80);
    const txt = await page.textContent('#view');
    assert.ok(!/Coś poszło nie tak/.test(txt), `#${hsh}: ${txt.slice(0, 200)}`);
  }
  // pięciolinie VexFlow się narysowały
  await go(page, '#nuty/wiolinowy');
  await page.waitForSelector('.staff-box svg');
  assert.deepEqual(errors, []);
  await close();
});

test('Gamy: zmiana gamy przelicza akordy i zapamiętuje wybór', async () => {
  const {page, errors, close} = await open('#gamy');
  await page.click('.keybar .key[data-k="G"]');
  const names = await page.$$eval('.group .node .name', els => els.map(e => e.textContent));
  assert.deepEqual(names.sort(), ['Am', 'Bm', 'C', 'D', 'Em', 'F♯°', 'G'].sort());
  await page.reload();
  assert.equal(await page.getAttribute('.keybar .key[aria-pressed="true"]', 'data-k'), 'G');
  assert.deepEqual(errors, []);
  await close();
});

test('Piosenki: startowe piosenki, wpisywanie akordów, role i zgadywanie tonacji', async () => {
  const {page, errors, close} = await open('#piosenki');
  await page.waitForSelector('.song-list .item');
  const titles = await page.$$eval('.song-list .item', els => els.map(e => e.firstChild.textContent));
  assert.ok(titles.includes('Widzę dom') && titles.includes('Bliżej (Closer)'), titles.join(', '));
  // piosenki startowe nie mają nierozpoznanych akordów
  for(const id of ['seed-widze-dom', 'seed-blizej']){
    await go(page, '#piosenki/' + id);
    await page.waitForSelector('.song-sheet .chord-chip');
    assert.equal(await page.locator('.song-sheet .faint.mono').count(), 0, id);
  }
  await page.click('text=+ Nowa piosenka');
  await page.waitForFunction(() => document.querySelector('input[aria-label="Tytuł"]')?.value === 'Nowa piosenka');
  const ta = page.locator('textarea.mono');
  await ta.fill('[Zwrotka] Am Dm E Am | Every');
  await page.waitForTimeout(50);
  const chips = await page.$$eval('.song-sheet .chord-chip', els => els.map(e => [e.dataset.c, e.className.split(' ').pop()]));
  assert.deepEqual(chips.map(c => c[0]), ['Am', 'Dm', 'E', 'Am']);
  assert.match(await page.textContent('.song-sheet'), /Every/);   // słowo zostaje jako nierozpoznane
  assert.match(await page.textContent('.song-sheet + .hint, .card .hint'), /a-moll/);   // podpowiedź tonacji
  await page.click('text=ustaw a-moll');
  const roles = await page.$$eval('.song-sheet .chord-chip', els => els.map(e => e.className.split(' ').pop()));
  assert.deepEqual(roles, ['t', 's', 'd', 't']);
  assert.deepEqual(errors, []);
  await close();
});

test('Piosenki: usunięcie zaraz po edycji nie przywraca piosenki', async () => {
  const {page, errors, close} = await open('#piosenki');
  await page.click('text=+ Nowa piosenka');
  await page.waitForFunction(() => document.querySelector('input[aria-label="Tytuł"]')?.value === 'Nowa piosenka');
  await page.fill('input[aria-label="Tytuł"]', 'Do usunięcia');
  await page.click('text=Usuń piosenkę');      // przed upływem opóźnionego zapisu (400 ms)
  await page.waitForTimeout(700);
  await page.reload();
  await page.waitForSelector('.song-list .item');
  const titles = await page.$$eval('.song-list .item', els => els.map(e => e.firstChild.textContent));
  assert.ok(!titles.includes('Do usunięcia'), titles.join(', '));
  assert.deepEqual(errors, []);
  await close();
});

test('Piosenki: kopia zapasowa — złe dane z pliku są oczyszczane', async () => {
  const {page, errors, close} = await open('#piosenki');
  await page.waitForSelector('.song-list .item');
  const backup = {app: 'harmonia', version: 1, songs: [
    {id: 'imp1', title: 'Import', key: '<img src=x onerror="window.__xss=1">', chords: 'C G', bpm: 'x'},
    {title: 'bez id'}, null, 'śmieć',
  ]};
  await page.setInputFiles('input[type=file][accept*="json"]', {name: 'kopia.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup))});
  await page.waitForSelector('.song-list .item >> text=Import');
  await go(page, '#piosenki/imp1');
  await page.waitForSelector('.song-sheet .chord-chip');
  const saved = await page.evaluate(() => DB.getSong('imp1'));
  assert.equal(saved.key, 'C');
  assert.equal(saved.bpm, 90);
  await page.click('text=🌳 Drzewo przejść');   // tonacja piosenki trafia do Przejść (tam do innerHTML)
  await page.waitForSelector('.seqbox .chord-chip');
  assert.match(await page.textContent('#view'), /C-dur/);
  assert.equal(await page.evaluate(() => window.__xss), undefined);
  assert.deepEqual(errors, []);
  await close();
});

test('Przejścia: czerwony akord, podpowiedź i wstawienie mostu', async () => {
  const {page, errors, close} = await open('#przejscia');
  await page.click('text=wyczyść');
  await page.fill('input[aria-label^="Akordy"]', 'C G C Eb');
  await page.press('input[aria-label^="Akordy"]', 'Enter');
  assert.equal(await page.locator('.seqbox .chord-chip.x').count(), 1);
  await page.click('.fix .opt button.primary:has-text("wstaw")');
  assert.equal(await page.locator('.seqbox .chord-chip.x').count(), 0);
  assert.match(await page.textContent('#view'), /wszystkie przejścia płynne/);
  // usuwanie akordu z klawiatury (przycisk ×)
  const before = await page.locator('.seqbox .chord-chip').count();
  await page.focus('.seqbox .chord-chip .rm');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.seqbox .chord-chip').count(), before - 1);
  // widok koła
  await page.click('.seg button:has-text("Koło kwintowe")');
  await page.waitForSelector('svg[aria-label^="Koło kwintowe"]');
  assert.deepEqual(errors, []);
  await close();
});

test('Nuty: trener liczy poprawne odpowiedzi', async () => {
  const {page, errors, close} = await open('#nuty/trener');
  await page.waitForSelector('.answers button');
  // klikaj litery, aż któraś będzie dobra
  for(const L of 'CDEFGAB'){
    await page.click(`.answers button[data-l="${L}"]`);
    if(await page.locator('.answers button.good').count()) break;
  }
  assert.equal(await page.locator('.answers button.good').count(), 1);
  assert.match(await page.textContent('.stats'), /1\/\d/);
  assert.deepEqual(errors, []);
  await close();
});

test('Druk: ściągawki dla zaznaczonych gam', async () => {
  const {page, errors, close} = await open('#druk');
  await page.waitForSelector('.sheet');
  const n0 = await page.locator('.sheet').count();
  await page.click('.print-controls label:has-text("D♭") input');
  assert.equal(await page.locator('.sheet').count(), n0 + 1);
  assert.match(await page.textContent('#view'), /Gama D♭-dur/);
  assert.deepEqual(errors, []);
  await close();
});

test('Pętla: baza akordów, układanie, granie w kółko i stop', async () => {
  const {page, errors, close} = await open('#petla');
  await page.waitForSelector('.dbtbl');
  await page.click('text=wyczyść');
  for(const name of ['G7', 'Dm7', 'Cmaj7']) await page.click(`.dbc[aria-label="dodaj ${name}"]`);
  let chips = await page.$$eval('.seqbox .chord-chip', els => els.map(e => e.firstChild.textContent));
  assert.deepEqual(chips, ['G7', 'Dm7', 'Cmaj7']);
  await page.click('text=✨ Ułóż w pętlę');
  chips = await page.$$eval('.seqbox .chord-chip', els => els.map(e => e.firstChild.textContent));
  assert.deepEqual(chips, ['Cmaj7', 'Dm7', 'G7']);
  assert.match(await page.textContent('.seqbox + .row + p'), /C-dur/);
  // koło: 3 węzły i 3 strzałki (ostatnia wraca na początek)
  assert.equal(await page.locator('svg[aria-label="Twoja pętla akordów"] .vnode').count(), 3);
  // jak grać: tabela z przewrotami
  assert.equal(await page.locator('.howtbl tr[data-i]').count(), 3);
  // granie w kółko: po ok. 1,5 rundy nadal gra i liczy rundy
  await page.selectOption('#petla-beats', '1');
  await page.evaluate(() => { const r = document.getElementById('petla-bpm'); r.value = 160; r.dispatchEvent(new Event('input')); });
  await page.click('button[aria-pressed="true"]:has-text("odliczanie")');   // bez odliczania
  await page.click('text=▶ Graj w kółko');
  await page.waitForFunction(() => /runda 2/.test(document.querySelector('svg[aria-label="Twoja pętla akordów"]').textContent), null, {timeout: 5000});
  await page.click('text=■ Stop');
  assert.equal(await page.evaluate(() => isPlaying()), false);
  // podpowiedzi i gotowe pętle
  await page.click('.nextlist .chord-chip >> nth=0');
  assert.equal(await page.locator('.seqbox .chord-chip').count(), 4);
  await page.click('.preset:has-text("Koło dominant")');
  chips = await page.$$eval('.seqbox .chord-chip', els => els.map(e => e.firstChild.textContent));
  assert.deepEqual(chips, ['C', 'A7', 'D7', 'G7']);
  // transpozycja
  await page.click('text=♯ +½');
  chips = await page.$$eval('.seqbox .chord-chip', els => els.map(e => e.firstChild.textContent));
  assert.deepEqual(chips, ['D♭', 'B♭7', 'E♭7', 'A♭7']);
  assert.deepEqual(errors, []);
  await close();
});

test('Gamy: przełącznik „w kółko" gra progresję dalej po końcu', async () => {
  const {page, errors, close} = await open('#gamy');
  await page.click('.looptg');
  await page.click('.prog .play >> nth=3');          // ii–V–I, 3 akordy × 0,78 s
  await page.waitForTimeout(3000);
  assert.equal(await page.evaluate(() => isPlaying()), true, 'po końcu progresji dalej gra');
  await page.click('.prog .play.on');
  assert.equal(await page.evaluate(() => isPlaying()), false);
  assert.deepEqual(errors, []);
  await close();
});
