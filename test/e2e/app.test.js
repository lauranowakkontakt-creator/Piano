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

test('Trening: runda do końca, licznik serii i zapis postępów', async () => {
  const {page, errors, close} = await open('#trening');
  await page.waitForSelector('.tr-scena');
  // krótka runda, żeby test nie trwał wiecznie
  await page.click('.tr-scena .seg button:has-text("8 pytań")');
  await page.click('button:has-text("Zaczynam rundę")');

  let dobre = 0;
  for(let n=1; n<=8; n++){
    await page.waitForSelector('.tr-prompt');
    assert.match(await page.textContent('.tr-pasek'), new RegExp(`^\\s*${n} / 8`));
    if(await page.locator('.tr-answers button').count()){
      await page.click('.tr-answers button');                       // pierwsza z brzegu
    }else{
      await page.click('.kbd rect[data-midi="60"]');                // ćwiczenie „zagraj akord"
      await page.click('button:has-text("sprawdzam")');
    }
    const fb = await page.textContent('.tr-fb');
    assert.ok(/Dobrze|To było/.test(fb), 'brak oceny odpowiedzi: '+fb);
    if(/Dobrze/.test(fb)) dobre++;
    await page.click('.tr-fb button');                              // dalej / podsumowanie
  }
  const koniec = await page.textContent('.tr-scena');
  assert.match(koniec, new RegExp(`${dobre} z 8`));
  // seria dni i dzisiejszy licznik policzyły 8 odpowiedzi
  assert.match(await page.textContent('.tr-top'), /8\/20/);
  assert.match(await page.textContent('.tr-top'), /1\s*dzień z rzędu/);

  // postępy przeżywają przeładowanie appki
  await page.reload();
  await page.waitForSelector('.tr-top');
  assert.match(await page.textContent('.tr-top'), /8\/20/);
  assert.equal(await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('harmonia.trening.srs'));
    return s.totals.asked;
  }), 8);
  assert.deepEqual(errors, []);
  await close();
});

test('Trening: zły stan w pamięci przeglądarki nie wywraca zakładki', async () => {
  const {page, errors, close} = await open('#gamy');
  await page.evaluate(() => {
    localStorage.setItem('harmonia.trening.srs', '{"items":"bzdura","streak":7}');
    localStorage.setItem('harmonia.trening.opts', '{"kinds":["nie-ma-takiego"],"key":"Xyz","dlugosc":"dużo"}');
  });
  await page.reload();
  await go(page, '#trening');
  await page.waitForSelector('.tr-scena');
  await page.click('button:has-text("Zaczynam rundę")');
  await page.waitForSelector('.tr-prompt');
  assert.ok(await page.locator('.tr-answers button, .kbd').count());
  assert.deepEqual(errors, []);
  await close();
});

test('Trening: wyłączone rodzaje znikają z puli, a statystyki można wyczyścić', async () => {
  const {page, errors, close} = await open('#trening');
  await page.waitForSelector('.tr-kind');
  const ile = await page.locator('.tr-kind').count();
  // zostaw tylko interwały
  for(let i=0; i<ile; i++){
    const b = page.locator('.tr-kind').nth(i);
    if(!/Interwał/.test(await b.textContent()) && await b.getAttribute('aria-pressed')==='true') await b.click();
  }
  assert.equal(await page.locator('.tr-kind[aria-pressed="true"]').count(), 1);
  assert.equal(await page.locator('.tr-row').count(), 1, 'statystyki pokazują tylko włączone rodzaje');
  await page.click('button:has-text("Zaczynam rundę")');
  await page.waitForSelector('.tr-prompt');
  assert.match(await page.textContent('.tr-kind-tag'), /Interwał/);
  await page.click('.tr-answers button');
  await page.click('button:has-text("wyczyść postępy")');
  assert.match(await page.textContent('.tr-top'), /0\/20/);
  assert.deepEqual(errors, []);
  await close();
});

test('Klawisze: wyklikany akord dostaje nazwę, przewrót i rolę w tonacji', async () => {
  const {page, errors, close} = await open('#klawisze');
  await page.waitForSelector('.kl-kbd svg');
  for(const m of [64, 67, 72]) await page.click(`.kl-kbd svg rect[data-midi="${m}"]`);
  const txt = await page.textContent('.kl-tablica');
  assert.match(txt, /C\/E/);
  assert.match(txt, /1\. przewrót/);
  assert.match(txt, /stopień I/);
  assert.match(txt, /tonika/);
  assert.equal(await page.locator('.kl-kbd svg rect.on-x').count(), 3, 'trzy klawisze podświetlone');

  // drugi klik na ten sam klawisz puszcza dźwięk
  await page.click('.kl-kbd svg rect[data-midi="72"]');
  assert.equal(await page.locator('.kl-kbd svg rect.on-x').count(), 2);
  await page.click('button:has-text("wyczyść")');
  assert.equal(await page.locator('.kl-kbd svg rect.on-x').count(), 0);
  assert.match(await page.textContent('.kl-tablica'), /Zagraj coś/);

  // ta sama rzecz widziana z innej tonacji
  for(const m of [67, 71, 74]) await page.click(`.kl-kbd svg rect[data-midi="${m}"]`);
  assert.match(await page.textContent('.kl-tablica'), /stopień V/, 'G w C-dur to V');
  await page.click('.kl-status ~ .card .seg button[data-v="G"]');
  assert.match(await page.textContent('.kl-tablica'), /stopień I/, 'to samo G w G-dur to I');
  // dominanta wtrącona: spoza gamy, ale z nazwą
  await page.click('button:has-text("wyczyść")');
  await page.click('.kl-status ~ .card .seg button[data-v="C"]');
  for(const m of [62, 66, 69]) await page.click(`.kl-kbd svg rect[data-midi="${m}"]`);
  assert.match(await page.textContent('.kl-tablica'), /spoza gamy.*V\/V|V\/V/, 'D w C-dur to dominanta do dominanty');
  assert.deepEqual(errors, []);
  await close();
});

test('Klawisze: gra się też klawiaturą komputera, a Shift działa jak pedał', async () => {
  const {page, errors, close} = await open('#klawisze');
  await page.waitForSelector('.kl-kbd svg');
  await page.keyboard.down('z');
  assert.equal(await page.locator('.kl-kbd svg rect.on-x').count(), 1);
  await page.keyboard.up('z');
  assert.equal(await page.locator('.kl-kbd svg rect.on-x').count(), 0, 'puszczenie klawisza zdejmuje dźwięk');

  await page.keyboard.down('Shift');
  for(const k of ['z','c','b']){ await page.keyboard.down(k); await page.keyboard.up(k); }
  await page.keyboard.up('Shift');
  assert.match(await page.textContent('.kl-tablica'), /\bC\b/, 'pedał utrzymał cały akord C');
  assert.equal(await page.locator('.kl-kbd svg rect.on-x').count(), 3);
  assert.deepEqual(errors, []);
  await close();
});

test('Klawisze: pianino przez MIDI gra na ekranie', async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  // udawane pianino: podstawiamy samo Web MIDI, reszta appki działa normalnie
  await page.addInitScript(() => {
    const input = {name:'Udawane pianino', onmidimessage:null};
    window.__midi = d => input.onmidimessage && input.onmidimessage({data:d});
    navigator.requestMIDIAccess = async () => ({inputs:new Map([['a', input]]), onstatechange:null});
  });
  await page.goto(APP + '#klawisze');
  await page.waitForSelector('.kl-kbd svg');
  await page.click('button:has-text("Podłącz pianino")');
  await page.waitForSelector('button:has-text("Podłączone")');
  assert.match(await page.textContent('.kl-status'), /Udawane pianino/);

  for(const n of [57, 60, 64, 67]) await page.evaluate(n => window.__midi([0x90, n, 100]), n);
  assert.match(await page.textContent('.kl-tablica'), /Am7/);
  assert.equal(await page.locator('.kl-kbd svg rect.on-x').count(), 4);

  await page.evaluate(() => { [57,60,64,67].forEach(n => window.__midi([0x80, n, 0])); });
  assert.equal(await page.locator('.kl-kbd svg rect.on-x').count(), 0, 'puszczone klawisze gasną');
  assert.deepEqual(errors, []);
  await context.close();
});

test('Klawisze: gama z palcowaniem i ćwiczenie „zagraj gamę"', async () => {
  const {page, errors, close} = await open('#klawisze');
  await page.waitForSelector('.kl-scale svg');
  await page.click('.kl-scale, .kl-scaleinfo');   // nic nie robi, ale upewnia się, że sekcja jest
  assert.match(await page.textContent('.kl-scaleinfo'), /kciuk podkłada się pod dłoń na F/);

  // F-dur: kciuk omija B♭
  await page.click('.card:has(.kl-scale) .seg button[data-v="F"]');
  const info = await page.textContent('.kl-scaleinfo');
  assert.match(info, /start palcem 1/);
  assert.equal((await page.locator('.kl-palec').allTextContents()).join(' '), '1F 2G 3A 4B♭ 1C 2D 3E 4F');

  // ćwiczenie: zagraj całą gamę w górę i w dół bez pomyłki
  await page.click('button:has-text("zagraj gamę")');
  assert.match(await page.textContent('.kl-run'), /Teraz: F/);
  const seq = await page.evaluate(() => scaleRunSequence('F', 'rh'));
  for(const m of seq) await page.click(`.kl-scale svg rect[data-midi="${m}"]`);
  assert.match(await page.textContent('.kl-run'), /bez pomyłki/);
  assert.deepEqual(errors, []);
  await close();
});

test('Trening: akord zagrany na pianinie MIDI sam odpowiada na zadanie', async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.addInitScript(() => {
    const input = {name:'Udawane pianino', onmidimessage:null};
    window.__midi = d => input.onmidimessage && input.onmidimessage({data:d});
    navigator.requestMIDIAccess = async () => ({inputs:new Map([['a', input]]), onstatechange:null});
  });
  // podłączamy pianino w zakładce Klawisze — połączenie ma przeżyć zmianę zakładki
  await page.goto(APP + '#klawisze');
  await page.click('button:has-text("Podłącz pianino")');
  await page.waitForSelector('button:has-text("Podłączone")');

  await go(page, '#trening');
  await page.waitForSelector('.tr-scena');
  // zostaw tylko ćwiczenie „zagraj akord", żeby na pewno takie wypadło
  for(const b of await page.locator('.tr-kind').all())
    if(!/Zagraj akord/.test(await b.textContent()) && await b.getAttribute('aria-pressed') === 'true') await b.click();
  await page.click('button:has-text("Zaczynam rundę")');
  await page.waitForSelector('.kbd');
  assert.match(await page.textContent('.tr-scena'), /Pianino podłączone/);

  const cel = await page.evaluate(() => {
    const nazwa = document.querySelector('.tr-prompt b').textContent.replace('♯','#').replace('♭','b');
    return parseChord(nazwa).pcs.map(p => 60 + p);
  });
  for(const n of cel) await page.evaluate(n => window.__midi([0x90, n, 100]), n);
  assert.match(await page.textContent('.tr-fb'), /Dobrze/, 'zagrany akord zalicza zadanie');
  assert.deepEqual(errors, []);
  await context.close();
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

test('Klawiatura pokazuje wszystkie dźwięki akordu, także te ponad C6', async () => {
  const {page, errors, close} = await open('#gamy');
  const wynik = await page.evaluate(() => ['Gadd4','C9','Cadd9','Bm7','C','Fmaj7','C6/9'].map(txt => {
    const c = parseChord(txt);
    const marks = chordMarks(c.pcs, 't');
    const svg = kbdSVG({from:60, to:83, marks});
    return {txt, chcemy:Object.keys(marks).length, mamy:svg.querySelectorAll('rect.on-t').length};
  }));
  for(const w of wynik) assert.equal(w.mamy, w.chcemy, `${w.txt}: narysowano ${w.mamy} z ${w.chcemy} dźwięków`);
  assert.deepEqual(errors, []);
  await close();
});

test('Gamy i Druk pokazują palcowanie wybranej gamy', async () => {
  const {page, errors, close} = await open('#gamy');
  await page.waitForSelector('.kl-palce');
  assert.match(await page.textContent('#view'), /kciuk podkłada się pod dłoń na F/);
  await page.click('.keybar button[data-k="Bb"]');
  const txt = await page.textContent('#view');
  assert.match(txt, /start palcem 4/, 'B♭ w prawej zaczyna się palcem 4');
  // B♭ ma dwa przełożenia w prawej (na C i F) i dwa w lewej
  assert.equal(await page.locator('.kl-palec.pod').count(), 4, 'podświetlone przełożenia w obu rękach');

  await go(page, '#druk');
  await page.waitForSelector('.sheet');
  const arkusz = await page.textContent('.sheet:has-text("Gama C-dur")');
  assert.match(arkusz, /Palcowanie gamy/);
  assert.match(arkusz, /kciuk podkłada się pod dłoń na F/);
  assert.equal(await page.locator('.sheet:has-text("Gama C-dur") .fing-k').count(), 16, 'osiem palców na rękę');
  assert.deepEqual(errors, []);
  await close();
});

test('Na telefonie żadna zakładka nie przewija się w bok', async () => {
  const context = await browser.newContext({viewport:{width:390, height:844}});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto(APP);
  for(const hsh of await page.evaluate(() => Object.keys(ROUTES))){
    await go(page, '#' + hsh);
    await page.waitForFunction(() => document.getElementById('view').children.length > 0);
    await page.waitForTimeout(150);
    const w = await page.evaluate(() => ({doc:document.documentElement.scrollWidth, win:window.innerWidth}));
    assert.ok(w.doc <= w.win + 1, `#${hsh}: strona szeroka na ${w.doc} px przy ekranie ${w.win} px`);
  }
  assert.deepEqual(errors, []);
  await context.close();
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
