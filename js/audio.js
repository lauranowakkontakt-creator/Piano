/* ============================================================
   Dźwięk — syntezator z prototypu (Web Audio, zero zależności),
   rozszerzony o pojedyncze nuty i akordy o dowolnej liczbie dźwięków.
   ============================================================ */
let ctx, master;
function audio(){
  if(ctx){ if(ctx.state==='suspended') ctx.resume(); return; }
  ctx = new (window.AudioContext||window.webkitAudioContext)();
  const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=3400; lp.Q.value=.4;
  master = ctx.createGain(); master.gain.value=.9;
  master.connect(lp); lp.connect(ctx.destination);
}
const midiToFreq = m => 440*Math.pow(2,(m-69)/12);

// układ akordu: bas + dźwięki w górę od podstawy, w średniej oktawie
function voicing(pcs, bassPc){
  let root = 60 + pcs[0];
  if(pcs[0] > 6) root -= 12;               // trzymaj podstawy w wąskim paśmie
  const rel = pcs.map(p=>(p-pcs[0]+12)%12);
  // nona (add9, 9) i kwarta dodana (add4) idą nad oktawę — obok tercji brzmiałyby jak zgrzyt;
  // w sus2/sus4 (bez tercji) zostają na miejscu
  const hasThird = rel.includes(3) || rel.includes(4);
  const up = rel.map(r=> root + r + (hasThird && (r===2 || r===5) ? 12 : 0));
  const bass = (bassPc!=null ? (48 + bassPc - (bassPc>6?12:0)) : root-12);
  return [bass, ...up];
}
function tone(midi, dur, when, amp=1){
  const t = ctx.currentTime + when;
  const freq = midiToFreq(midi);
  [['triangle',.15],['sine',.11]].forEach(([type,a])=>{
    const o=ctx.createOscillator(); o.type=type; o.frequency.value=freq;
    const g=ctx.createGain();
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(a*amp,t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t+dur+0.05);
  });
}
function strike(pcs, dur=1.0, when=0, bassPc=null){
  audio();
  const v = voicing(pcs, bassPc);
  const scale = 3/Math.max(3,pcs.length); // więcej dźwięków = każdy ciszej
  v.forEach((m,idx)=> tone(m, dur, when, (idx===0?.9:1)*scale));
}
function playMidi(midi, dur=0.9, when=0){ audio(); tone(midi, dur, when, 1.3); }
// melodia: tablica midi, co step sekund
function playSeq(midis, step=0.35, dur=0.5){
  audio();
  midis.forEach((m,i)=>{ if(m!=null) tone(m, dur, i*step, 1.3); });
}
// rytm: tablica długości w ćwierćnutach; stukanie jednym dźwiękiem
function playRhythm(beats, bpm=90, midi=72){
  audio();
  const q = 60/bpm; let t=0;
  beats.forEach(b=>{
    if(b>0) tone(midi, Math.min(b*q*0.9, 1.6), t, 1.2);
    t += Math.abs(b)*q;
  });
  return t;
}
function playClick(when, accent){
  const t = ctx.currentTime + when;
  const o=ctx.createOscillator(); o.type='square'; o.frequency.value = accent?1600:1100;
  const g=ctx.createGain(); g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(accent?.08:.05,t+0.002);
  g.gain.exponentialRampToValueAtTime(0.0001,t+0.05);
  o.connect(g); g.connect(master); o.start(t); o.stop(t+0.06);
}
