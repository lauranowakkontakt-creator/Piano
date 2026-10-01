const test = require('node:test');
const assert = require('node:assert/strict');
const {load, plain} = require('../helpers/load');

const D = load('js/theory.js', 'js/audio.js', 'js/ui.js', 'js/loop.js', 'js/views/piosenki.js', 'js/detect.js');
const {detectChord, detectNoteNames, intervalName, matchingKeys, CHORD_SHAPES,
  parseChord, voicing, chordLabel} = D;

const nazwa = (...midis) => { const d = detectChord(midis); return d && d.name; };

test('trójdźwięki i czterodźwięki w pozycji zasadniczej', () => {
  assert.equal(nazwa(60,64,67), 'C');
  assert.equal(nazwa(60,63,67), 'Cm');
  assert.equal(nazwa(60,63,66), 'Cdim');
  assert.equal(nazwa(60,64,68), 'Caug');
  assert.equal(nazwa(60,65,67), 'Csus4');
  assert.equal(nazwa(60,62,67), 'Csus2');
  assert.equal(nazwa(60,64,67,70), 'C7');
  assert.equal(nazwa(60,64,67,71), 'Cmaj7');
  assert.equal(nazwa(60,63,67,70), 'Cm7');
  assert.equal(nazwa(60,63,66,69), 'Cdim7');
  assert.equal(nazwa(60,63,66,70), 'Cm7b5');
  assert.equal(nazwa(62,66,69,73), 'Dmaj7');
});

test('oktawy i powtórzone dźwięki niczego nie zmieniają', () => {
  assert.equal(nazwa(60,64,67), 'C');
  assert.equal(nazwa(60,64,67,72,76), 'C');
  assert.equal(nazwa(60,60,64,64,67), 'C');
  assert.equal(nazwa(36,48,64,67), 'C', 'bas dwie oktawy niżej to wciąż C');
  assert.equal(nazwa(67,64,60), 'C', 'kolejność podania nie ma znaczenia');
});

test('przewroty: bas decyduje o zapisie z ukośnikiem', () => {
  assert.equal(nazwa(64,67,72), 'C/E');
  assert.equal(nazwa(67,72,76), 'C/G');
  assert.equal(nazwa(59,62,65,67), 'G7/B');
  assert.equal(nazwa(65,69,72,74), 'F6', 'F A C D z basem F to F6, nie Dm7/F');
  const d = detectChord([64,67,72]);
  assert.equal(d.inversion, 1);
  assert.equal(d.invName, '1. przewrót');
  assert.equal(d.slash, true);
  assert.equal(detectChord([60,64,67]).inversion, 0);
  assert.equal(detectChord([60,64,67]).slash, false);
});

test('bas rozstrzyga akordy o tych samych dźwiękach (C6 kontra Am7)', () => {
  assert.equal(nazwa(60,64,67,69), 'C6', 'bas C → seksta');
  assert.equal(nazwa(57,60,64,67), 'Am7', 'bas A → moll z septymą');
  assert.equal(nazwa(50,57,60,65), 'Dm7', 'F6 z basem D to Dm7');
});

test('pianistyczne skróty: akord bez kwinty wciąż się rozpoznaje', () => {
  const d = detectChord([60,64,70]);
  assert.equal(d.name, 'C7');
  assert.equal(d.exact, false);
  assert.deepEqual(plain(d.missing), [7], 'brakuje kwinty');
  assert.equal(detectChord([60,64,67]).exact, true);
  // bez tercji nie zgadujemy dur/moll — to sus albo kwinta
  assert.equal(nazwa(60,67), 'C5');
});

test('dwa dźwięki: kwinta i kwarta to power chord, reszta to nie akord', () => {
  assert.equal(nazwa(60,67), 'C5');
  assert.equal(nazwa(60,65), 'F5/C', 'kwarta to przewrót kwinty');
  assert.equal(nazwa(60,64), null, 'sama tercja to jeszcze nie akord');
  assert.equal(nazwa(60,61), null);
});

test('za mało albo nic: nie zmyślamy akordu', () => {
  assert.equal(detectChord([]), null);
  assert.equal(detectChord(null), null);
  assert.equal(detectChord([60]), null);
  assert.equal(detectChord([60,72]), null, 'oktawa to jeden dźwięk');
  assert.equal(detectChord([60,61,62,63,64,65]), null, 'klaster to nie akord');
  assert.equal(detectChord([NaN, undefined]), null);
});

test('każdy rozpoznany akord da się odczytać z powrotem przez parseChord', () => {
  // przez wszystkie wzory, wszystkie podstawy i wszystkie przewroty
  for(const shape of CHORD_SHAPES){
    for(let root=0; root<12; root++){
      const pcs = shape.iv.map(i=>(root+i)%12);
      for(let inv=0; inv<pcs.length; inv++){
        const kolejnosc = [...pcs.slice(inv), ...pcs.slice(0,inv)];
        const midis = [];
        let m = 60 + kolejnosc[0];
        midis.push(m);
        for(let k=1;k<kolejnosc.length;k++){ let x = midis[k-1]+1; while(x%12 !== kolejnosc[k]) x++; midis.push(x); }
        const d = detectChord(midis);
        assert.ok(d, `${shape.suf} od ${root}, przewrót ${inv}: nic nie rozpoznano`);
        const back = parseChord(d.name);
        assert.ok(back, `${d.name} nie przechodzi przez parseChord`);
        assert.deepEqual(plain([...back.pcs].sort((a,b)=>a-b)), plain([...pcs].sort((a,b)=>a-b)),
          `${d.name} ma inne dźwięki niż zagrane`);
        assert.equal(back.bassPc ?? back.rootPc, midis[0]%12, `${d.name}: zły bas`);
      }
    }
  }
});

test('to, co gra syntezator, rozpoznaje się jako ten sam akord', () => {
  for(const txt of ['C','Am','G7','Dm7','Fmaj7','Bdim','E','Bb','F#m','Caug','Gsus4','Eb6']){
    const c = parseChord(txt);
    const midis = voicing(c.pcs, c.bassPc);
    const d = detectChord(midis);
    assert.ok(d, txt);
    assert.equal(d.label.replace('/'+chordLabel(c.root), ''), chordLabel(txt),
      `${txt} zagrane przez appkę rozpoznaje się jako ${d.label}`);
  }
});

test('pisownia: w tonacjach krzyżykowych pokazujemy ♯, inaczej ♭', () => {
  assert.equal(detectChord([61,65,68], {preferSharp:true}).label, 'C♯');
  assert.equal(detectChord([61,65,68]).label, 'D♭');
  // nazwy dźwięków idą pisownią akordu: w A7 jest C♯, nie D♭
  const d = detectChord([57,61,64,67]);
  assert.equal(d.name, 'A7');
  assert.deepEqual(plain(detectNoteNames([57,61,64,67], d).map(n=>n.name)), ['A','C♯','E','G']);
  assert.deepEqual(plain(detectNoteNames([60,64,67], null).map(n=>n.oktawa)), [4,4,4]);
});

test('interwały po polsku, także ponad oktawę', () => {
  assert.equal(intervalName(60,60), 'pryma');
  assert.equal(intervalName(60,63), 'tercja mała');
  assert.equal(intervalName(60,67), 'kwinta czysta');
  assert.equal(intervalName(67,60), 'kwinta czysta', 'kolejność bez znaczenia');
  assert.equal(intervalName(60,72), 'oktawa');
  assert.equal(intervalName(60,76), 'tercja wielka + 1 oktawa');
});

test('do jakich gam pasuje to, co gram', () => {
  const g = matchingKeys([60,64,67]).map(k=>k.v);
  assert.ok(g.includes('C') && g.includes('G') && g.includes('F'));
  assert.deepEqual(plain(matchingKeys([60,62,64,65,67,69,71]).map(k=>k.v)), ['C','Am'],
    'cała gama C pasuje tylko do C-dur i a-moll');
  assert.deepEqual(plain(matchingKeys([60,61,62,63,64,65,66,67,68,69,70,71])), [], 'wszystkie 12 dźwięków do żadnej gamy');
  assert.deepEqual(plain(matchingKeys([])), []);
});
