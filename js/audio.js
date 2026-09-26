/* ============================================================
   Dźwięk — syntezator fortepianu na Web Audio (zero zależności, działa offline).
   Każdy dźwięk to trzy lekko rozstrojone „struny" z widmem jak w pianinie,
   filtr, który ciemnieje w czasie (jak wybrzmiewający młoteczek), krótki stuk
   młoteczka i pogłos. Niskie dźwięki wybrzmiewają dłużej niż wysokie.
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
  wetBus = ctx.createGain(); wetBus.gain.value = .22;
  const verb = ctx.createConvolver(); verb.buffer = roomImpulse(2.2);
  master.connect(dryBus); dryBus.connect(comp);
  master.connect(verb); verb.connect(wetBus); wetBus.connect(comp);
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
