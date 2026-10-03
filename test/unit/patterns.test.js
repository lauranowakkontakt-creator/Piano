const test = require('node:test');
const assert = require('node:assert/strict');
const {load, plain} = require('../helpers/load');

const P = load('js/theory.js', 'js/audio.js', 'js/ui.js', 'js/views/piosenki.js', 'js/loop.js', 'js/patterns.js');
const {PLAY_STYLES, PLAY_STYLE_BY_ID, stylePattern, parseChord, smoothVoicing, bassMidi} = P;

const chwyt = (txt) => {
  const c = parseChord(txt);
  return {right: plain(smoothVoicing(c, null)), bass: bassMidi(c), pcs: plain(c.pcs)};
};
const C = chwyt('C');
const STYLE_IDS = plain(PLAY_STYLES.map(s => s.id));
const UDERZENIA = [1, 2, 3, 4, 6, 8];

test('każdy styl ma komplet opisów dla Laury', () => {
  assert.ok(PLAY_STYLES.length >= 8, 'stylów: ' + PLAY_STYLES.length);
  assert.equal(new Set(STYLE_IDS).size, STYLE_IDS.length, 'powtórzone id');
  for(const st of PLAY_STYLES){
    assert.ok(st.name && st.name.length > 2, st.id);
    assert.ok(st.krotko && st.krotko.length > 4, `${st.id}: brak krótkiego podpisu`);
    assert.ok(st.opis && st.opis.length > 25, `${st.id}: brak opisu`);
    assert.ok(/Lewa|Prawa/.test(st.reka), `${st.id}: nie wiadomo, co robi która ręka`);
    assert.equal(typeof st.make, 'function');
  }
});

test('każdy styl gra tylko dźwięki akordu i mieści się w takcie', () => {
  for(const txt of ['C', 'Am', 'G7', 'F#m7', 'Dsus4', 'Bb', 'Cmaj9']){
    const {right, bass, pcs} = chwyt(txt);
    for(const id of STYLE_IDS){
      for(const beats of UDERZENIA){
        const ev = plain(stylePattern(id, {right, bass, beats}));
        assert.ok(ev.length, `${id} ${txt} ${beats}: pusto`);
        for(const e of ev){
          assert.ok(e.at >= 0 && e.at < beats, `${id} ${txt} ${beats}: zdarzenie poza taktem (${e.at})`);
          assert.ok(e.dur > 0, `${id}: nuta o zerowej długości`);
          assert.ok(e.vel > 0 && e.vel <= 1, `${id}: dziwna siła uderzenia ${e.vel}`);
          for(const m of e.midis){
            assert.ok(Number.isFinite(m) && m >= 21 && m <= 108, `${id} ${txt}: dźwięk ${m} poza pianinem`);
            assert.ok(pcs.includes(((m % 12) + 12) % 12), `${id} ${txt}: ${m} nie należy do akordu`);
          }
        }
      }
    }
  }
});

test('zdarzenia idą po kolei w czasie', () => {
  for(const id of STYLE_IDS){
    const ev = plain(stylePattern(id, {...C, beats: 4}));
    for(let i = 1; i < ev.length; i++) assert.ok(ev[i].at >= ev[i-1].at, `${id}: ${ev[i-1].at} → ${ev[i].at}`);
  }
});

test('każdy styl zaczyna takt od basu w lewej ręce', () => {
  for(const id of STYLE_IDS){
    const ev = plain(stylePattern(id, {...C, beats: 4}));
    const naRaz = ev.filter(e => e.at === 0);
    assert.ok(naRaz.length, `${id}: nic nie gra na „raz"`);
    assert.ok(naRaz.some(e => e.midis.includes(C.bass)), `${id}: brak basu na „raz"`);
  }
});

test('„akordy na raz" to dosłownie wszystko razem i trzymane', () => {
  const ev = plain(stylePattern('blok', {...C, beats: 4}));
  assert.ok(ev.every(e => e.at === 0), 'wszystko na raz');
  assert.ok(ev.every(e => e.dur === 4), 'trzymane do końca taktu');
  const dzwieki = ev.flatMap(e => e.midis).sort((a, b) => a - b);
  assert.deepEqual(dzwieki, [C.bass, ...C.right].sort((a, b) => a - b));
});

test('pompa: bas i akord na przemian', () => {
  const ev = plain(stylePattern('pompa', {...C, beats: 4}));
  const naBeat = n => ev.filter(e => e.at === n).flatMap(e => e.midis);
  assert.deepEqual(naBeat(0), [C.bass], 'raz: sam bas');
  assert.deepEqual(naBeat(1), C.right, 'dwa: akord');
  assert.deepEqual(naBeat(2), [C.bass + 7], 'trzy: kwinta w basie');
  assert.deepEqual(naBeat(3), C.right, 'cztery: akord');
});

test('arpeggio rozkłada akord dźwięk po dźwięku w górę', () => {
  const ev = plain(stylePattern('arpeggio', {...C, beats: 4}));
  const melodia = ev.filter(e => e.at >= 0 && e.midis.length === 1 && e.midis[0] !== C.bass).map(e => e.midis[0]);
  assert.equal(melodia.length, 4, 'po jednym dźwięku na uderzenie');
  for(let i = 1; i < melodia.length; i++) assert.ok(melodia[i] > melodia[i-1], 'idzie w górę: ' + melodia);
});

test('synkopa gra między uderzeniami, nie na nich', () => {
  const ev = plain(stylePattern('synkopa', {...C, beats: 4}));
  const akordy = ev.filter(e => e.midis.length > 1);
  assert.equal(akordy.length, 4);
  for(const e of akordy) assert.equal(e.at % 1, 0.5, 'akord wchodzi w połowie uderzenia');
});

test('ballada 6/8 dzieli takt na sześć', () => {
  const ev = plain(stylePattern('ballada', {...C, beats: 2}));
  const melodia = ev.filter(e => e.midis.length === 1 && !e.midis.includes(C.bass));
  assert.equal(melodia.length, 6, 'sześć trójkowych nut na takt');
  const basy = ev.filter(e => e.midis.includes(C.bass));
  assert.equal(basy.length, 2, 'bas dwa razy: na początku każdej połowy');
});

test('oktawy dokładają bas oktawę wyżej', () => {
  const ev = plain(stylePattern('oktawy', {...C, beats: 4}));
  const basowe = ev.filter(e => e.midis.includes(C.bass));
  assert.equal(basowe.length, 4);
  for(const e of basowe) assert.ok(e.midis.includes(C.bass + 12), 'oktawa w lewej ręce');
});

test('dziwne dane nie wysypują stylu', () => {
  assert.ok(stylePattern('nie-ma-takiego', {...C, beats: 4}).length, 'nieznany styl gra jak „na raz"');
  assert.deepEqual(plain(stylePattern('blok', {...C, beats: 4})), plain(stylePattern('nie-ma-takiego', {...C, beats: 4})));
  assert.ok(stylePattern('arpeggio', {right: [], bass: 48, beats: 4}).length, 'pusty chwyt: zostaje sam bas');
  assert.ok(stylePattern('pompa', {right: C.right, beats: 4}).length, 'brak basu: liczymy go z chwytu');
  for(const beats of [0, -3, null, undefined, 1.4]){
    const ev = plain(stylePattern('pompa', {...C, beats}));
    assert.ok(ev.length && ev.every(e => e.at >= 0), 'uderzenia: ' + beats);
  }
  assert.ok(stylePattern('alberti', {right: [60], bass: 48, beats: 4}).length, 'jeden dźwięk w prawej');
});
