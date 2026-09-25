/* ============================================================
   Rysowanie nut — VexFlow (vendor/vexflow-bravura.js, działa offline).
   note: {keys:['c/4'], d:'q', acc:['#',null], dot:true, color:'#...'}
   ============================================================ */
function vfNotes(notes, clef){
  const VF = Vex.Flow;
  return notes.map(n=>{
    if(n.bar) return new VF.BarNote();
    const s = new VF.StaveNote({keys:n.keys, duration:n.d||'q', clef, auto_stem:true});
    (n.acc||[]).forEach((a,i)=>{ if(a) s.addModifier(new VF.Accidental(a), i); });
    if(n.dot) VF.Dot.buildAndAttach([s],{all:true});
    if(n.color) s.setStyle({fillStyle:n.color, strokeStyle:n.color});
    return s;
  });
}
function fitSvg(el, w, hgt){
  const svg = el.querySelector('svg');
  if(svg){ svg.setAttribute('viewBox',`0 0 ${w} ${hgt}`); svg.removeAttribute('height'); svg.style.width=w+'px'; svg.style.maxWidth='100%'; svg.style.height='auto'; }
}
function drawStaff(el, opts){
  const VF = Vex.Flow;
  const {clef='treble', notes=[], time=null, keySig=null, beam=false, scale=1} = opts;
  el.innerHTML='';
  const w = opts.width || Math.max(170, 70 + notes.length*44 + (keySig?50:0) + (time?30:0));
  const hgt = opts.height || 130;
  const r = new VF.Renderer(el, VF.Renderer.Backends.SVG);
  r.resize(w*scale, hgt*scale);
  const ctx = r.getContext(); ctx.scale(scale, scale);
  const st = new VF.Stave(4, opts.top ?? 16, w-8);
  if(clef!=='none') st.addClef(clef);
  if(keySig) st.addKeySignature(keySig);
  if(time) st.addTimeSignature(time);
  st.setContext(ctx).draw();
  if(notes.length){
    const sn = vfNotes(notes, clef==='none'?'treble':clef);
    const beams = beam ? VF.Beam.generateBeams(sn.filter(x=>!(x instanceof VF.BarNote))) : [];
    VF.Formatter.FormatAndDraw(ctx, st, sn);
    beams.forEach(b=>b.setContext(ctx).draw());
  }
  fitSvg(el, w*scale, hgt*scale);
}
// system fortepianowy: dwie pięciolinie z klamrą
function drawGrand(el, opts){
  const VF = Vex.Flow;
  const {treble=[], bass=[], keySig=null, time=null} = opts;
  el.innerHTML='';
  const n = Math.max(treble.length, bass.length);
  const w = opts.width || Math.max(220, 90 + n*56 + (keySig?50:0));
  const hgt = 230;
  const r = new VF.Renderer(el, VF.Renderer.Backends.SVG);
  r.resize(w, hgt);
  const ctx = r.getContext();
  const s1 = new VF.Stave(26, 10, w-32).addClef('treble');
  const s2 = new VF.Stave(26, 110, w-32).addClef('bass');
  if(keySig){ s1.addKeySignature(keySig); s2.addKeySignature(keySig); }
  if(time){ s1.addTimeSignature(time); s2.addTimeSignature(time); }
  if(VF.Stave.formatBegModifiers) VF.Stave.formatBegModifiers([s1,s2]);
  s1.setContext(ctx).draw(); s2.setContext(ctx).draw();
  new VF.StaveConnector(s1,s2).setType('brace').setContext(ctx).draw();
  new VF.StaveConnector(s1,s2).setType('singleLeft').setContext(ctx).draw();
  new VF.StaveConnector(s1,s2).setType('singleRight').setContext(ctx).draw();
  const mkVoice = (notes, clef)=>{
    const v = new VF.Voice({num_beats:4, beat_value:4}).setMode(VF.Voice.Mode.SOFT);
    v.addTickables(vfNotes(notes, clef)); return v;
  };
  const v1 = mkVoice(treble,'treble'), v2 = mkVoice(bass,'bass');
  const startX = Math.max(s1.getNoteStartX(), s2.getNoteStartX());
  s1.setNoteStartX(startX); s2.setNoteStartX(startX);
  new VF.Formatter().joinVoices([v1]).joinVoices([v2]).format([v1,v2], w-32-(startX-26)-20);
  v1.draw(ctx, s1); v2.draw(ctx, s2);
  fitSvg(el, w, hgt);
}

/* nazwa + oktawa → klucz VexFlow i MIDI */
const LETTER_PC = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function noteKey(letter, oct, acc){ return letter.toLowerCase()+(acc||'')+'/'+oct; }
function noteMidi(letter, oct, acc){ return (oct+1)*12 + LETTER_PC[letter] + (acc==='#'?1:acc==='b'?-1:0); }
