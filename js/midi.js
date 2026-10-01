/* ============================================================
   Pianino przez kabel — Web MIDI.
   Dwie warstwy, żeby dało się to testować bez sprzętu:
   1. czysta logika: parseMidiMessage (co znaczy komunikat) i HeldNotes
      (które klawisze są teraz wciśnięte, z pedałem przedłużającym),
   2. cienka otoczka MidiIn na przeglądarkowe navigator.requestMIDIAccess.
   Bez pianina appka działa dokładnie tak jak wcześniej — MIDI tylko dokłada
   możliwość grania na prawdziwej klawiaturze.
   Testy: test/unit/midi.test.js.
   ============================================================ */

/* Komunikat MIDI → {type, note, velocity, channel, control, value}.
   type: 'on' | 'off' | 'sustain' | 'panic' | 'other'
   Uwaga: „note on" z siłą 0 to w MIDI tak naprawdę puszczenie klawisza. */
function parseMidiMessage(data){
  const d = data && data.length !== undefined ? Array.from(data) : [];
  if(d.length < 2) return {type:'other'};
  const status = d[0] & 0xf0, channel = d[0] & 0x0f;
  const a = d[1] & 0x7f, b = (d[2] ?? 0) & 0x7f;
  if(status === 0x90) return {type: b>0 ? 'on' : 'off', note:a, velocity:b, channel};
  if(status === 0x80) return {type:'off', note:a, velocity:b, channel};
  if(status === 0xb0){
    if(a === 64) return {type:'sustain', value:b, on:b >= 64, channel};
    if(a === 120 || a === 123) return {type:'panic', control:a, channel};
    return {type:'other', control:a, value:b, channel};
  }
  return {type:'other', channel};
}

/* Które klawisze są teraz wciśnięte. Pedał (sustain) trzyma dźwięki,
   które puściłaś palcami, aż do podniesienia pedału — tak jak w pianinie. */
class HeldNotes {
  constructor(){ this.palce = new Set(); this.pedal = new Set(); this.sustain = false; }
  /* Zwraca true, gdy zestaw brzmiących dźwięków się zmienił. */
  apply(msg){
    if(!msg) return false;
    const przed = this.key();
    if(msg.type === 'on') this.palce.add(msg.note);
    else if(msg.type === 'off'){
      this.palce.delete(msg.note);
      if(this.sustain) this.pedal.add(msg.note);
    }
    else if(msg.type === 'sustain'){
      this.sustain = msg.on;
      if(!msg.on) this.pedal.clear();
    }
    else if(msg.type === 'panic'){ this.palce.clear(); this.pedal.clear(); }
    else return false;
    return this.key() !== przed;
  }
  /* Dźwięki, które teraz brzmią — palce plus to, co trzyma pedał. */
  notes(){ return [...new Set([...this.palce, ...this.pedal])].sort((a,b)=>a-b); }
  /* Tylko to, co faktycznie trzymają palce (pedał pomijamy). */
  fingered(){ return [...this.palce].sort((a,b)=>a-b); }
  key(){ return this.notes().join(','); }
  clear(){ this.palce.clear(); this.pedal.clear(); this.sustain = false; }
}

/* Otoczka na Web MIDI. Używa się jej tak:
     const midi = new MidiIn();
     midi.onNote = (msg, held) => { ... };
     midi.onStatus = (stan) => { ... };     // {supported, ok, devices:[], error}
     midi.start();
   Nic nie robi, dopóki jej nie wywołasz — i nigdy nie rzuca wyjątkiem w górę. */
class MidiIn {
  constructor(){
    this.held = new HeldNotes();
    this.access = null;
    this.onNote = null;
    this.onStatus = null;
    this.devices = [];
  }
  get supported(){ return typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function'; }
  status(extra={}){
    return {supported:this.supported, ok:!!this.access, devices:this.devices.slice(), ...extra};
  }
  emit(extra){ if(this.onStatus) this.onStatus(this.status(extra)); }
  async start(){
    if(!this.supported){ this.emit({error:'brak'}); return false; }
    try{
      this.access = await navigator.requestMIDIAccess({sysex:false});
    }catch(e){
      this.access = null;
      this.emit({error: e && e.name === 'SecurityError' ? 'odmowa' : 'blad'});
      return false;
    }
    this.access.onstatechange = () => this.wire();
    this.wire();
    return true;
  }
  wire(){
    if(!this.access) return;
    this.devices = [];
    for(const input of this.access.inputs.values()){
      this.devices.push(input.name || 'pianino');
      input.onmidimessage = ev => this.handle(ev.data);
    }
    if(!this.devices.length) this.held.clear();
    this.emit({});
  }
  handle(data){
    const msg = parseMidiMessage(data);
    if(msg.type === 'other') return;
    const zmiana = this.held.apply(msg);
    if(this.onNote) this.onNote(msg, this.held, zmiana);
  }
  stop(){
    if(this.access){
      for(const input of this.access.inputs.values()) input.onmidimessage = null;
      this.access.onstatechange = null;
    }
    this.access = null;
    this.held.clear();
    this.devices = [];
  }
}

/* ---------- klawiatura komputera jako zastępcze pianino ----------
   Dwa rzędy jak w programach muzycznych: dolny to oktawa od C, górny oktawę wyżej.
   Litery są w układzie QWERTY (u Laury taki jest). */
const KEY_ROWS = {
  z:0, s:1, x:2, d:3, c:4, v:5, g:6, b:7, h:8, n:9, j:10, m:11, ',':12,
  q:12, 2:13, w:14, 3:15, e:16, r:17, 5:18, t:19, 6:20, y:21, 7:22, u:23, i:24,
};
/* Litera z klawiatury → dźwięk MIDI (albo null). octave = przesunięcie w oktawach. */
function keyToMidi(key, octave=0){
  const k = String(key||'').toLowerCase();
  if(!Object.hasOwn(KEY_ROWS, k)) return null;
  const m = 48 + KEY_ROWS[k] + octave*12;
  return m >= 0 && m <= 127 ? m : null;
}

/* ---------- jedno połączenie z pianinem na całą appkę ----------
   Zakładki nie tworzą własnych połączeń — dopisują się do słuchania i odpisują,
   gdy znikają z ekranu. Dzięki temu przejście między zakładkami nie zrywa MIDI
   i nie trzeba go podłączać drugi raz. */
let _pianino = null;
function midiPiano(){
  if(_pianino) return _pianino;
  _pianino = new MidiIn();
  _pianino.sluchacze = new Set();
  _pianino.statusy = new Set();
  _pianino.onNote = (msg, held, zmiana) => _pianino.sluchacze.forEach(f => f(msg, held, zmiana));
  _pianino.onStatus = st => _pianino.statusy.forEach(f => f(st));
  return _pianino;
}
/* Zwraca funkcję odpinającą. onStatus dostaje od razu obecny stan. */
function midiSubscribe(onNote, onStatus){
  const m = midiPiano();
  if(onNote) m.sluchacze.add(onNote);
  if(onStatus){ m.statusy.add(onStatus); onStatus(m.status()); }
  return () => { m.sluchacze.delete(onNote); m.statusy.delete(onStatus); };
}
