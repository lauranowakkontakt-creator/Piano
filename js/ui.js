/* ============================================================
   Wspólne klocki interfejsu: tworzenie elementów, klawiatura SVG,
   podświetlenia, odtwarzanie sekwencji akordów.
   ============================================================ */
function h(tag, attrs, ...kids){
  const e = document.createElement(tag);
  if(attrs) for(const [k,v] of Object.entries(attrs)){
    if(v==null || v===false) continue;
    if(k==='class') e.className=v;
    else if(k==='html') e.innerHTML=v;
    else if(k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v===true?'':v);
  }
  for(const k of kids.flat()){
    if(k==null || k===false) continue;
    e.appendChild(typeof k==='string'||typeof k==='number' ? document.createTextNode(k) : k);
  }
  return e;
}
function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function ring(el, cls='ring'){
  el.classList.add(cls);
  setTimeout(()=>el.classList.remove(cls), 620);
}

/* ---------- klawiatura ----------
   opts: {from, to, marks:{midi:'t'|'s'|'d'|'o'|'x'}, labels:'marked'|'all'|'c'|false, onKey(midi), names}
*/
const WHITE_PCS = [0,2,4,5,7,9,11];
function isBlack(m){ return !WHITE_PCS.includes(((m%12)+12)%12); }
function kbdSVG(opts){
  let from = opts.from ?? 60, to = opts.to ?? 83;
  // klawiatura musi pokazać wszystko, o co ją poprosiliśmy: akordy z dodaną kwartą
  // albo noną (np. Gadd4) wychodzą ponad domyślne C4–B5, a bez tego dźwięk znikał z obrazka
  const zaznaczone = Object.keys(opts.marks || {}).map(Number).filter(Number.isFinite);
  if(zaznaczone.length){
    from = Math.min(from, ...zaznaczone);
    to = Math.max(to, ...zaznaczone);
    while(isBlack(from)) from--;        // skrajne klawisze muszą być białe, inaczej czarny nie ma się o co oprzeć
    while(isBlack(to)) to++;
  }
  const W=22, H=92, BW=13, BH=56;
  const whites=[]; for(let m=from;m<=to;m++) if(!isBlack(m)) whites.push(m);
  const width = whites.length*W+1;
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox',`0 0 ${width} ${H+1}`);
  svg.setAttribute('class','kbd');
  svg.setAttribute('role','img');
  svg.setAttribute('aria-label', opts.aria || 'Klawiatura');
  const marks = opts.marks||{};
  const names = opts.names||{};
  const labels = opts.labels ?? 'marked';
  const xOf = {};
  whites.forEach((m,i)=>xOf[m]=i*W);
  const mk=(tag,a)=>{const e=document.createElementNS(ns,tag);for(const k in a)e.setAttribute(k,a[k]);return e;};
  const addKey=(m,x,y,w,hh,black)=>{
    const r = mk('rect',{x,y,width:w,height:hh,rx:black?2:3,class:(black?'b':'w')+(marks[m]?' on-'+marks[m]:'')});
    r.dataset.midi=m;
    if(opts.onKey){ r.addEventListener('pointerdown',ev=>{ev.preventDefault();opts.onKey(m, r);}); }
    svg.appendChild(r);
    const show = labels==='all' || (labels==='marked' && marks[m]) || (labels==='c' && m%12===0);
    if(show){
      const nm = names[m] || fmt(PC_NAME_SHARP[m%12]) + (labels==='c'?(Math.floor(m/12)-1):'');
      const t = mk('text',{x:x+w/2,y:y+hh-(black?6:8),'text-anchor':'middle',class:black?'lb':'lw'});
      if(black) t.setAttribute('font-size','7');
      t.textContent = nm; svg.appendChild(t);
    }
  };
  whites.forEach(m=>addKey(m,xOf[m]+.5,.5,W-1,H,false));
  for(let m=from;m<=to;m++) if(isBlack(m)){
    const left = xOf[m-1]; if(left==null) continue;
    addKey(m,left+W-BW/2,.5,BW,BH,true);
  }
  return svg;
}
function flashKey(svg, midi, cls='x'){
  const r = svg.querySelector(`rect[data-midi="${midi}"]`);
  if(!r) return;
  const c='on-'+cls; const had=r.classList.contains(c);
  r.classList.add(c); setTimeout(()=>{ if(!had) r.classList.remove(c); }, 350);
}

// akord na klawiaturze C4–B5 — dokładnie te dźwięki, które gra syntezator (voicing), zwraca {midi: fn}
function chordMarks(pcs, fn, base=60){
  const out={};
  voicing(pcs).slice(1).forEach(m=>{ out[m + base - 60] = fn; });
  return out;
}
// nazwy z pisownią gamy (np. E♯ zamiast F)
function chordNames(notes, pcs, base=60){
  const out={}; const root=base+pcs[0];
  notes.forEach((n,i)=>{ out[root+((pcs[i]-pcs[0]+12)%12)] = fmt(n); });
  return out;
}

/* ---------- odtwarzanie sekwencji z podświetleniem ----------
   Planowanie „z wyprzedzeniem": co 25 ms dokładamy do kolejki audio akordy na najbliższe
   0,15 s, więc tempo jest równe także po wielu rundach pętli. */
let seqTimers=new Set();
let seqStopHook=null;
let seqRun=null;
function stopSeq(){
  if(seqRun){ seqRun.stopped=true; clearInterval(seqRun.timer); seqRun=null; }
  seqTimers.forEach(clearTimeout); seqTimers.clear();
  document.querySelectorAll('.lit').forEach(b=>b.classList.remove('lit'));
  if(seqStopHook){ const f=seqStopHook; seqStopHook=null; f(); }
}
function isPlaying(){ return !!seqRun; }
/* items: [{pcs, bassPc, voiced?, el?, onStart?(i, runda)}], step = sekundy na akord
   opts: {loop, beats (uderzeń na akord), click (metronom), countIn (ile uderzeń odliczenia),
          onBeat(i, uderzenie), onCount(ile zostało)} */
function playChordSeq(items, step=0.78, onEnd, opts={}){
  stopSeq(); audio();
  if(!items || !items.length){ if(onEnd) onEnd(); return; }
  const {loop=false, beats=1, click=false, countIn=0, onBeat=null, onCount=null} = opts;
  const beat = step/beats;
  const run = {stopped:false, timer:null};
  seqRun = run;
  seqStopHook = onEnd || null;
  const later = (at, fn)=>{
    const id = setTimeout(()=>{ seqTimers.delete(id); if(!run.stopped) fn(); }, Math.max(0,(at-ctx.currentTime)*1000));
    seqTimers.add(id);
  };
  let t = ctx.currentTime + 0.08, i = 0, cycle = 0;
  for(let k=0;k<countIn;k++){
    playClick(t-ctx.currentTime, k%beats===0);
    const left = countIn-k; later(t, ()=>onCount && onCount(left));
    t += beat;
  }
  function tick(){
    while(!run.stopped && t < ctx.currentTime + 0.15){
      if(i>=items.length){
        if(!loop){ clearInterval(run.timer); later(t+0.25, stopSeq); return; }
        i=0; cycle++;
      }
      const it=items[i], at=t, idx=i, cyc=cycle;
      if(it.events && it.events.length){
        // styl akompaniamentu z js/patterns.js: czasy zdarzeń liczone w uderzeniach
        it.events.forEach(e=>e.midis.forEach(m=>
          pianoNote(m, Math.max(.12, (e.dur ?? 1)*beat), at - ctx.currentTime + e.at*beat, e.vel ?? .55)));
      }else{
        strike(it.pcs, it.dur ?? Math.max(step*1.04, .95), at-ctx.currentTime, it.bassPc, it.voiced);
      }
      if(click) for(let b=0;b<beats;b++) playClick(at+b*beat-ctx.currentTime, b===0);
      later(at, ()=>{
        document.querySelectorAll('.lit').forEach(b=>b.classList.remove('lit'));
        if(it.el){ it.el.classList.add('lit'); if(it.el.scrollIntoView && items.length>12) it.el.scrollIntoView({block:'nearest',behavior:'smooth'}); }
        if(it.onStart) it.onStart(idx, cyc);
      });
      if(onBeat) for(let b=0;b<beats;b++) later(at+b*beat, ()=>onBeat(idx,b));
      t += step; i++;
    }
  }
  run.timer = setInterval(tick, 25); tick();
}
/* przełącznik „w kółko" — wspólny dla wszystkich przycisków ▶ w appce */
const loopPref = ()=>prefs.get('play.loop', false);
function loopToggle(){
  const b = h('button',{type:'button',class:'btn small ghost looptg','aria-pressed':String(loopPref()),title:'Graj w kółko, aż klikniesz stop'},'🔁 w kółko');
  b.onclick=()=>{ const v=!loopPref(); prefs.set('play.loop',v); document.querySelectorAll('.looptg').forEach(x=>x.setAttribute('aria-pressed',String(v))); };
  return b;
}
const clickPref = ()=>prefs.get('play.click', false);
function clickToggle(){
  const b = h('button',{type:'button',class:'btn small ghost clicktg','aria-pressed':String(clickPref()),title:'Metronom: stuka każde uderzenie, akcent na początku akordu'},'♩ metronom');
  b.onclick=()=>{ const v=!clickPref(); prefs.set('play.click',v); document.querySelectorAll('.clicktg').forEach(x=>x.setAttribute('aria-pressed',String(v))); };
  return b;
}
function playBtn(label, getItems, step){
  const btn = h('button',{class:'play','aria-label':'Zagraj: '+label},'▶');
  btn.onclick=()=>{
    if(btn.classList.contains('on')){ stopSeq(); return; }
    stopSeq();
    btn.classList.add('on'); btn.textContent='■';
    const s = typeof step==='function'?step():step;
    playChordSeq(getItems(), s, ()=>{ btn.classList.remove('on'); btn.textContent='▶'; }, {loop:loopPref()});
  };
  return btn;
}

/* listen-button w tekście: <button class="listen" data-chords="C F G C"> albo data-notes="60 62 64" */
function wireListens(root){
  root.querySelectorAll('button.listen').forEach(b=>{
    b.addEventListener('click',()=>{
      audio();
      if(b.dataset.chords){
        const items = b.dataset.chords.split(/\s+/).map(t=>parseChord(t)).filter(Boolean).map(c=>({pcs:c.pcs,bassPc:c.bassPc}));
        playChordSeq(items, +(b.dataset.step||0.8));
      }else if(b.dataset.notes){
        const ms = b.dataset.notes.split(/\s+/).map(x=>x==='-'?null:+x);
        playSeq(ms, +(b.dataset.step||0.35), +(b.dataset.dur||0.5));
      }else if(b.dataset.stack){
        const ms = b.dataset.stack.split(/\s+/).map(Number);
        ms.forEach(m=>playMidi(m, 1.4, 0));
      }
    });
  });
}

/* quiz: [{q, opts:[...], a:index, why}] */
function quizBox(title, items, onDone){
  const box = h('div',{class:'quiz'}, h('h3',null,title||'Sprawdź się'));
  let solved=0;
  items.forEach(it=>{
    const fb = h('div',{class:'fb'});
    const opts = h('div',{class:'opts'});
    let done=false;
    it.opts.forEach((o,i)=>{
      const b = h('button',{type:'button'}, o);
      b.onclick=()=>{
        if(done) return;
        if(it.play) it.play();
        if(i===it.a){
          b.classList.add('good'); done=true; solved++;
          fb.innerHTML = '✓ ' + (it.why||'Dobrze!');
          if(solved===items.length && onDone) onDone();
        }else{
          b.classList.add('wrong');
          fb.textContent = 'Jeszcze raz — ' + (it.hint||'spróbuj innej odpowiedzi.');
        }
      };
      opts.appendChild(b);
    });
    const q = h('div',{class:'q', html:it.q});
    if(it.listen){
      const lb = h('button',{class:'listen',type:'button'},'posłuchaj'); lb.onclick=it.listen; q.append(' ', lb);
    }
    box.append(q, opts, fb);
  });
  return box;
}

/* ---------- pamięć drobnych ustawień (localStorage, bezpiecznie) ---------- */
const prefs = {
  get(k, d){ try{ const v=localStorage.getItem('harmonia.'+k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem('harmonia.'+k, JSON.stringify(v)); }catch(e){} },
};

function keyBar(current, onPick, keys=ORDER, label='gama'){
  const bar = h('div',{class:'keybar',role:'group','aria-label':'Wybór gamy'}, h('span',{class:'lbl'},label));
  keys.forEach(k=>{
    const b = h('button',{class:'key','aria-pressed':String(k===current),'data-k':k}, fmt(k));
    b.onclick=()=>{ bar.querySelectorAll('.key').forEach(x=>x.setAttribute('aria-pressed', String(x.dataset.k===k))); onPick(k); };
    bar.appendChild(b);
  });
  return bar;
}
