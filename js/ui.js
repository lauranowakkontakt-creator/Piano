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
  const from = opts.from ?? 60, to = opts.to ?? 83;
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

// pozycja zasadnicza akordu na klawiaturze C4–B5, zwraca {midi: fn}
function chordMarks(pcs, fn, base=60){
  const out={};
  let root = base + pcs[0];
  pcs.forEach(p=>{ out[root + ((p-pcs[0]+12)%12)] = fn; });
  return out;
}
// nazwy z pisownią gamy (np. E♯ zamiast F)
function chordNames(notes, pcs, base=60){
  const out={}; const root=base+pcs[0];
  notes.forEach((n,i)=>{ out[root+((pcs[i]-pcs[0]+12)%12)] = fmt(n); });
  return out;
}

/* ---------- odtwarzanie sekwencji z podświetleniem ---------- */
let seqTimers=[];
let seqStopHook=null;
function stopSeq(){
  seqTimers.forEach(clearTimeout); seqTimers=[];
  document.querySelectorAll('.lit').forEach(b=>b.classList.remove('lit'));
  if(seqStopHook){ const f=seqStopHook; seqStopHook=null; f(); }
}
/* items: [{pcs, bassPc, el, fn}], step w sekundach */
function playChordSeq(items, step=0.78, onEnd){
  stopSeq(); audio();
  items.forEach((it,i)=>{
    strike(it.pcs, Math.max(step*1.2, .95), i*step, it.bassPc);
    seqTimers.push(setTimeout(()=>{
      document.querySelectorAll('.lit').forEach(b=>b.classList.remove('lit'));
      if(it.el){ it.el.classList.add('lit'); if(it.el.scrollIntoView && items.length>12) it.el.scrollIntoView({block:'nearest',behavior:'smooth'}); }
      if(it.onStart) it.onStart();
    }, i*step*1000));
  });
  seqStopHook = onEnd || null;
  seqTimers.push(setTimeout(stopSeq, (items.length*step+0.3)*1000));
}
function playBtn(label, getItems, step){
  const btn = h('button',{class:'play','aria-label':'Zagraj: '+label},'▶');
  btn.onclick=()=>{
    if(btn.classList.contains('on')){ stopSeq(); return; }
    stopSeq();
    btn.classList.add('on'); btn.textContent='■';
    const s = typeof step==='function'?step():step;
    playChordSeq(getItems(), s, ()=>{ btn.classList.remove('on'); btn.textContent='▶'; });
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
