/* ============================================================
   Dźwięk — prawdziwy fortepian na Web Audio (działa offline).
   Grają nagrania fortepianu koncertowego (vendor/piano-samples.js, co trzy
   półtony); dźwięki pomiędzy to najbliższa próbka lekko podciągnięta.
   Ciszej = ciemniej, jak przy lżejszym uderzeniu. Puszczenie klawisza
   tłumi strunę. Zanim próbki się wczytają (ułamek sekundy), gra zapasowy
   syntezator: trzy rozstrojone „struny", filtr, stuk młoteczka i pogłos.
   ============================================================ */
let ctx, master, dryBus, wetBus;
function audio(){
  if(ctx){ if(ctx.state==='suspended') ctx.resume(); return; }
  ctx = new (window.AudioContext||window.webkitAudioContext)();
  const comp = ctx.createDynamicsCompressor();          // chroni przed przesterem przy akordach
  comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 3.5;
  comp.attack.value = 0.004; comp.release.value = 0.25;
  comp.connect(ctx.destination);
  master = ctx.createGain(); master.gain.value = .9;
  dryBus = ctx.createGain(); dryBus.gain.value = 1;
  wetBus = ctx.createGain(); wetBus.gain.value = .16;
  const verb = ctx.createConvolver(); verb.buffer = roomImpulse(2.2);
  master.connect(dryBus); dryBus.connect(comp);
  master.connect(verb); verb.connect(wetBus); wetBus.connect(comp);
  if(!samplesLoading) loadSamples(ctx);
}

/* próbki: base64 → AudioBuffer, raz, w tle. Dekodujemy od razu po wczytaniu strony
   (w kontekście offline, który nie potrzebuje kliknięcia), żeby już pierwszy
   dźwięk był z nagrania. AudioBuffer da się potem grać w zwykłym kontekście. */
const sampleBufs = {};
let sampleKeys = [], samplesLoading = false;
function loadSamples(dec){
  if(typeof PIANO_SAMPLES === 'undefined' || !dec) return;
  samplesLoading = true;
  const ctx = dec;
  Object.keys(PIANO_SAMPLES).forEach(k=>{
    const bin = atob(PIANO_SAMPLES[k]), bytes = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
    const done = buf=>{ sampleBufs[k] = buf; sampleKeys = Object.keys(sampleBufs).map(Number).sort((a,b)=>a-b); };
    const fail = ()=>{ samplesLoading = false; };   // spróbuj jeszcze raz w zwykłym kontekście
    try{ const p = ctx.decodeAudioData(bytes.buffer, done, fail); if(p && p.catch) p.catch(fail); }catch(e){ fail(); }
  });
}
// najbliższa wczytana próbka
function nearestSample(midi){
  let best = null;
  for(const k of sampleKeys) if(best==null || Math.abs(k-midi) < Math.abs(best-midi)) best = k;
  return best;
}
/* dźwięk z nagrania: nagranie ma już naturalne wybrzmiewanie, my dokładamy
   siłę uderzenia (głośność + barwa) i tłumik po puszczeniu klawisza */
function sampleNote(midi, dur, t, vel){
  const k = nearestSample(midi);
  const src = ctx.createBufferSource(); src.buffer = sampleBufs[k];
  src.playbackRate.value = Math.pow(2, (midi-k)/12);
  const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.Q.value=.5;
  lp.frequency.value = Math.min(18000, 1800 + 16000*vel*vel);   // lżej = ciemniej
  const env = ctx.createGain();
  const g = .5*Math.pow(vel, 1.3);
  env.gain.setValueAtTime(g, t);
  const off = t + Math.max(.08, dur);
  const f = midiToFreq(midi);
  const damp = Math.min(.35, Math.max(.06, .12*Math.pow(261.6/f, .5)));  // basy gasną wolniej
  env.gain.setTargetAtTime(0, off, damp);
  src.connect(lp); lp.connect(env); env.connect(master);
  src.start(t);
  src.stop(Math.min(off + damp*8, t + src.buffer.duration/src.playbackRate.value));
}
const midiToFreq = m => 440*Math.pow(2,(m-69)/12);

// pogłos małej sali: szum stereo z wykładniczym wygaszaniem
function roomImpulse(sec){
  const n = Math.floor(ctx.sampleRate*sec), buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for(let ch=0; ch<2; ch++){
    const d = buf.getChannelData(ch);
    for(let i=0;i<n;i++){ const x=i/n; d[i] = (Math.random()*2-1) * Math.pow(1-x, 3.2) * (i<ctx.sampleRate*.012 ? i/(ctx.sampleRate*.012) : 1); }
  }
  return buf;
}

// widmo struny: niskie dźwięki mają więcej wyższych składowych, wysokie są czystsze
const waveCache = {};
function pianoWave(midi){
  const band = midi<48 ? 'low' : midi<72 ? 'mid' : 'high';
  if(waveCache[band]) return waveCache[band];
  const amps = {
    low: [0,1,.8,.62,.5,.36,.3,.22,.17,.13,.1,.08,.06,.05,.04,.03],
    mid: [0,1,.55,.36,.25,.14,.11,.07,.05,.035,.025,.015],
    high:[0,1,.32,.14,.07,.035,.02],
  }[band];
  const real = new Float32Array(amps.length), imag = Float32Array.from(amps);
  return waveCache[band] = ctx.createPeriodicWave(real, imag);
}
let noiseBuf = null;
function hammerNoise(){
  if(noiseBuf) return noiseBuf;
  const n = Math.floor(ctx.sampleRate*.05); noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); for(let i=0;i<n;i++) d[i] = Math.random()*2-1;
  return noiseBuf;
}

/* jeden dźwięk fortepianu. when = za ile sekund od teraz, dur = kiedy puszczasz klawisz, vel 0..1 */
function pianoNote(midi, dur, when=0, vel=.7){
  const t = ctx.currentTime + Math.max(0, when);
  if(sampleKeys.length) return sampleNote(midi, dur, t, vel);
  const f = midiToFreq(midi);
  const sustain = Math.min(7, Math.max(.7, 3.2*Math.pow(261.6/f, .55)));  // ile brzmi, gdy trzymasz klawisz
  const peak = .19*vel*Math.min(1.25, Math.pow(261.6/f, .12));
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak, t+.004);
  env.gain.setTargetAtTime(peak*.42, t+.004, .09);           // szybki spadek po uderzeniu
  env.gain.setTargetAtTime(0, t+.3, sustain/3.2);             // długie wybrzmiewanie
  const off = t + Math.max(.08, dur);
  env.gain.setTargetAtTime(0, off, .07);                      // tłumik po puszczeniu klawisza
  const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.Q.value=.35;
  const bright = Math.min(16000, f*(5+9*vel));
  lp.frequency.setValueAtTime(bright, t);
  lp.frequency.setTargetAtTime(Math.max(f*1.6, 380), t+.01, .35+sustain*.12);
  lp.connect(env); env.connect(master);
  const stopAt = off + .6;
  [-2.4, .3, 2.7].forEach((cents,k)=>{
    const o = ctx.createOscillator(); o.setPeriodicWave(pianoWave(midi));
    o.frequency.value = f; o.detune.value = cents;
    const g = ctx.createGain(); g.gain.value = k===1 ? .5 : .28;
    o.connect(g); g.connect(lp); o.start(t); o.stop(stopAt);
  });
  // stuk młoteczka
  const nz = ctx.createBufferSource(); nz.buffer = hammerNoise();
  const bp = ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value = Math.min(9000, f*3.5); bp.Q.value = .9;
  const ng = ctx.createGain(); ng.gain.setValueAtTime(peak*.35*vel, t); ng.gain.exponentialRampToValueAtTime(.0001, t+.035);
  nz.connect(bp); bp.connect(ng); ng.connect(master); nz.start(t); nz.stop(t+.05);
}
// zgodność ze starszym kodem: tone(midi, dur, when, amp)
function tone(midi, dur, when, amp=1){ pianoNote(midi, dur, when, Math.min(1, .55*amp)); }
// długi, równy dźwięk do śpiewania (fortepian by wygasł)
function padTone(midi, dur, when=0, amp=1){
  const t = ctx.currentTime + when, f = midiToFreq(midi);
  [['triangle',.09],['sine',.07]].forEach(([type,a])=>{
    const o=ctx.createOscillator(); o.type=type; o.frequency.value=f;
    const g=ctx.createGain();
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(a*amp,t+.08);
    g.gain.setValueAtTime(a*amp,t+dur-.3); g.gain.linearRampToValueAtTime(0,t+dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+.05);
  });
}

/* układ akordu tak, jak pokazuje go klawiatura: podstawa w oktawie C4–B4,
   pozostałe dźwięki w górę od niej, bas oktawę niżej (albo dźwięk po ukośniku). */
function voicing(pcs, bassPc){
  const root = 60 + pcs[0];
  const rel = pcs.map(p=>(p-pcs[0]+12)%12);
  // nona (add9, 9) i kwarta dodana (add4) idą nad oktawę — obok tercji brzmiałyby jak zgrzyt;
  // w sus2/sus4 (bez tercji) zostają na miejscu
  const hasThird = rel.includes(3) || rel.includes(4);
  const up = rel.map(r=> root + r + (hasThird && (r===2 || r===5) ? 12 : 0));
  const bp = bassPc!=null ? bassPc : pcs[0];
  const bass = 48 + bp - (bp>7 ? 12 : 0);     // lewa ręka: E2–G3
  return [bass, ...up];
}
/* akord: bas + prawa ręka. voiced = gotowe dźwięki prawej ręki (np. z płynnego prowadzenia głosów) */
function strike(pcs, dur=1.0, when=0, bassPc=null, voiced=null){
  audio();
  const v = voicing(pcs, bassPc);
  const right = voiced && voiced.length ? voiced : v.slice(1);
  const vel = .62 - Math.min(.14, Math.max(0, right.length-3)*.05);
  pianoNote(v[0], dur, when, vel+.08);
  right.forEach((m,i)=> pianoNote(m, dur, when + .006*(i+1), vel));   // lekkie rozłożenie jak palcami
}
function playMidi(midi, dur=0.9, when=0){ audio(); pianoNote(midi, Math.max(dur,.6), when, .72); }
// melodia: tablica midi, co step sekund
function playSeq(midis, step=0.35, dur=0.5){
  audio();
  midis.forEach((m,i)=>{ if(m!=null) pianoNote(m, dur, i*step, .7); });
}
// rytm: tablica długości w ćwierćnutach; stukanie jednym dźwiękiem
function playRhythm(beats, bpm=90, midi=72){
  audio();
  const q = 60/bpm; let t=0;
  beats.forEach(b=>{
    if(b>0) pianoNote(midi, Math.min(b*q*0.9, 1.6), t, .7);
    t += Math.abs(b)*q;
  });
  return t;
}
function playClick(when, accent){
  audio();
  const t = ctx.currentTime + Math.max(0, when);
  const o=ctx.createOscillator(); o.type='square'; o.frequency.value = accent?1600:1100;
  const g=ctx.createGain(); g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(accent?.08:.05,t+0.002);
  g.gain.exponentialRampToValueAtTime(0.0001,t+0.05);
  o.connect(g); g.connect(dryBus); o.start(t); o.stop(t+0.06);
}

if(typeof window !== 'undefined'){
  try{
    const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if(Off) loadSamples(new Off(2, 1, 44100));
  }catch(e){}
}
