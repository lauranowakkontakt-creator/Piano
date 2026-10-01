const test = require('node:test');
const assert = require('node:assert/strict');
const {load, loadWith, plain} = require('../helpers/load');

const M = load('js/midi.js');
const {parseMidiMessage, HeldNotes, MidiIn, keyToMidi, KEY_ROWS} = M;

const on = (n, v=100, ch=0) => [0x90|ch, n, v];
const off = (n, ch=0) => [0x80|ch, n, 0];
const pedal = (v, ch=0) => [0xb0|ch, 64, v];

test('komunikaty: wciśnięcie, puszczenie i pedał', () => {
  assert.deepEqual(plain(parseMidiMessage(on(60, 90))), {type:'on', note:60, velocity:90, channel:0});
  assert.deepEqual(plain(parseMidiMessage(off(60))), {type:'off', note:60, velocity:0, channel:0});
  // „note on" z siłą 0 to w MIDI puszczenie klawisza — tak robi wiele pianin
  assert.equal(parseMidiMessage(on(60, 0)).type, 'off');
  assert.equal(parseMidiMessage(pedal(127)).type, 'sustain');
  assert.equal(parseMidiMessage(pedal(127)).on, true);
  assert.equal(parseMidiMessage(pedal(0)).on, false);
  assert.equal(parseMidiMessage(pedal(64)).on, true, 'połowa to już wciśnięty pedał');
  assert.equal(parseMidiMessage(pedal(63)).on, false);
});

test('komunikaty: kanał, panika i śmieci', () => {
  assert.equal(parseMidiMessage(on(60, 100, 9)).channel, 9, 'pianino może grać na innym kanale');
  assert.equal(parseMidiMessage(on(60, 100, 9)).type, 'on');
  assert.equal(parseMidiMessage([0xb0, 123, 0]).type, 'panic', 'all notes off');
  assert.equal(parseMidiMessage([0xb0, 120, 0]).type, 'panic');
  assert.equal(parseMidiMessage([0xb0, 7, 100]).type, 'other', 'głośność to nie dźwięk');
  assert.equal(parseMidiMessage([0xf8]).type, 'other', 'zegar MIDI');
  assert.equal(parseMidiMessage([]).type, 'other');
  assert.equal(parseMidiMessage(null).type, 'other');
  assert.equal(parseMidiMessage(Uint8Array.from(on(60))).type, 'on', 'przeglądarka podaje Uint8Array');
});

test('trzymane klawisze: wciskanie i puszczanie', () => {
  const held = new HeldNotes();
  assert.deepEqual(plain(held.notes()), []);
  assert.equal(held.apply(parseMidiMessage(on(64))), true, 'zmiana zestawu');
  held.apply(parseMidiMessage(on(60)));
  held.apply(parseMidiMessage(on(67)));
  assert.deepEqual(plain(held.notes()), [60, 64, 67], 'zawsze po kolei od najniższego');
  assert.equal(held.apply(parseMidiMessage(on(64))), false, 'ten sam dźwięk drugi raz nic nie zmienia');
  held.apply(parseMidiMessage(off(64)));
  assert.deepEqual(plain(held.notes()), [60, 67]);
  held.apply(parseMidiMessage([0xb0, 7, 100]));
  assert.deepEqual(plain(held.notes()), [60, 67], 'obce komunikaty nie ruszają klawiszy');
});

test('pedał trzyma dźwięki po puszczeniu palców', () => {
  const held = new HeldNotes();
  held.apply(parseMidiMessage(pedal(127)));
  held.apply(parseMidiMessage(on(60)));
  held.apply(parseMidiMessage(off(60)));
  assert.deepEqual(plain(held.notes()), [60], 'pedał trzyma');
  assert.deepEqual(plain(held.fingered()), [], 'ale palce już nie trzymają');
  held.apply(parseMidiMessage(on(64)));
  held.apply(parseMidiMessage(off(64)));
  assert.deepEqual(plain(held.notes()), [60, 64]);
  assert.equal(held.apply(parseMidiMessage(pedal(0))), true, 'podniesienie pedału zmienia zestaw');
  assert.deepEqual(plain(held.notes()), [], 'pedał w górę — cisza');
});

test('pedał nie gubi klawiszy, które wciąż trzymasz palcami', () => {
  const held = new HeldNotes();
  held.apply(parseMidiMessage(on(60)));
  held.apply(parseMidiMessage(pedal(127)));
  held.apply(parseMidiMessage(pedal(0)));
  assert.deepEqual(plain(held.notes()), [60], 'palec dalej na klawiszu');
  assert.deepEqual(plain(held.fingered()), [60]);
});

test('panika i czyszczenie zdejmują wszystko', () => {
  const held = new HeldNotes();
  held.apply(parseMidiMessage(pedal(127)));
  [60, 64, 67].forEach(n => held.apply(parseMidiMessage(on(n))));
  held.apply(parseMidiMessage([0xb0, 123, 0]));
  assert.deepEqual(plain(held.notes()), []);
  held.apply(parseMidiMessage(on(60)));
  held.clear();
  assert.deepEqual(plain(held.notes()), []);
  assert.equal(held.sustain, false);
});

test('MidiIn bez przeglądarkowego MIDI mówi o tym i nie rzuca wyjątkiem', async () => {
  const midi = new MidiIn();
  assert.equal(midi.supported, false, 'w node nie ma navigatora z MIDI');
  const stany = [];
  midi.onStatus = st => stany.push(plain(st));
  assert.equal(await midi.start(), false);
  assert.deepEqual(stany, [{supported:false, ok:false, devices:[], error:'brak'}]);
  midi.stop();
});

test('MidiIn z udawanym pianinem: podpina wejścia i przekazuje dźwięki', async () => {
  const wejscie = {name:'Yamaha P-45', onmidimessage:null};
  const access = {inputs:new Map([['a', wejscie]]), onstatechange:null};
  // podstawiamy przeglądarkowe API — tylko tyle, ile MidiIn naprawdę używa
  const M2 = loadWith({navigator:{requestMIDIAccess: async () => access}}, 'js/midi.js');
  const midi = new M2.MidiIn();
  assert.equal(midi.supported, true);

  const stany = [];
  midi.onStatus = st => stany.push(plain(st));
  assert.equal(await midi.start(), true);
  assert.deepEqual(stany.at(-1), {supported:true, ok:true, devices:['Yamaha P-45']});
  assert.equal(typeof wejscie.onmidimessage, 'function');

  const zdarzenia = [];
  midi.onNote = (msg, held, zmiana) => zdarzenia.push([msg.type, plain(held.notes()), zmiana]);
  wejscie.onmidimessage({data: on(60)});
  wejscie.onmidimessage({data: on(64)});
  wejscie.onmidimessage({data: [0xb0, 7, 10]});     // głośność — ma być pominięta
  wejscie.onmidimessage({data: off(60)});
  assert.deepEqual(zdarzenia, [
    ['on', [60], true],
    ['on', [60, 64], true],
    ['off', [64], true],
  ]);

  midi.stop();
  assert.equal(wejscie.onmidimessage, null, 'po wyjściu z zakładki odpinamy się od pianina');
  assert.deepEqual(plain(midi.held.notes()), []);
});

test('MidiIn: odmowa dostępu kończy się komunikatem, nie wyjątkiem', async () => {
  const odmowa = loadWith({navigator:{requestMIDIAccess: async () => {
    const e = new Error('nie'); e.name = 'SecurityError'; throw e;
  }}}, 'js/midi.js');
  const midi = new odmowa.MidiIn();
  const stany = [];
  midi.onStatus = st => stany.push(plain(st));
  assert.equal(await midi.start(), false);
  assert.equal(stany.at(-1).error, 'odmowa');
  assert.equal(stany.at(-1).ok, false);

  // inny błąd (np. brak urządzeń w systemie) też nie wywraca appki
  const awaria = loadWith({navigator:{requestMIDIAccess: async () => { throw new Error('coś'); }}}, 'js/midi.js');
  const m2 = new awaria.MidiIn();
  m2.onStatus = st => stany.push(plain(st));
  assert.equal(await m2.start(), false);
  assert.equal(stany.at(-1).error, 'blad');
});

test('klawiatura komputera jako zastępcze pianino', () => {
  assert.equal(keyToMidi('z', 1), 60, 'z to C4 przy domyślnej oktawie');
  assert.equal(keyToMidi('Z', 1), 60, 'wielkie litery też');
  assert.equal(keyToMidi('s', 1), 61);
  assert.equal(keyToMidi('m', 1), 71);
  assert.equal(keyToMidi('q', 1), 72, 'górny rząd to następna oktawa');
  assert.equal(keyToMidi('z', 0), 48);
  assert.equal(keyToMidi('z', 2), 72);
  assert.equal(keyToMidi('ł'), null);
  assert.equal(keyToMidi('Enter'), null);
  assert.equal(keyToMidi(''), null);
  assert.equal(keyToMidi(null), null);
  assert.equal(keyToMidi('z', -10), null, 'poza zakresem MIDI nic nie gramy');
  // dolny rząd to kolejne półtony bez dziur
  const dolny = 'zsxdcvgbhnjm'.split('').map(k => keyToMidi(k, 1));
  assert.deepEqual(dolny, [60,61,62,63,64,65,66,67,68,69,70,71]);
  const gorny = 'q2w3er5t6y7u'.split('').map(k => keyToMidi(k, 1));
  assert.deepEqual(gorny, [72,73,74,75,76,77,78,79,80,81,82,83]);
  // jedyne dwa klawisze o tym samym dźwięku to szew między rzędami: „," domyka dolną oktawę tam, gdzie zaczyna się „q"
  const ile = {};
  Object.values(KEY_ROWS).forEach(v => { ile[v] = (ile[v]||0) + 1; });
  assert.deepEqual(Object.entries(ile).filter(([,n]) => n > 1), [['12', 2]]);
  assert.equal(keyToMidi(',', 1), keyToMidi('q', 1));
});
