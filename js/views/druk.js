/* Zakładka „Druk" — ściągawki na A4 do postawienia przy pianinie.
   Jedna strona na gamę + ściąga ogólna + wydruk piosenki. */

function printKbd(ch){
  return kbdSVG({from:60,to:83,marks:chordMarks(ch.pcs,ch.fn),names:chordNames(ch.notes,ch.pcs),labels:'marked'});
}
function sheetForKey(k){
  const chords = chordsFor(k);
  const blacks = KEYS[k].filter(n=>n.length>1);
  const sheet = h('div',{class:'sheet'});
  const staff = h('div',{style:'max-width:420px'});
  sheet.append(
    h('h2',null,'Gama '+keyLabel(k)),
    h('p',{class:'sub'}, `Dźwięki: ${KEYS[k].map(fmt).join(' ')}` + (blacks.length?` · czarne klawisze: ${blacks.map(fmt).join(', ')}`:' · same białe klawisze') + ` · równoległa molowa: ${fmt(REL_MINOR[k]).toLowerCase()}-moll`),
    staff,
    h('p',{class:'rule-line',html:'<b>Zasada:</b> <span style="color:#be185d">Tonika (dom)</span> → <span style="color:#0f766e">Subdominanta (ruch)</span> → <span style="color:#a16207">Dominanta (napięcie)</span> → <span style="color:#be185d">Tonika</span> ↻'}));
  const tb = h('table');
  tb.append(h('tr',null, h('th',null,'stopień'), h('th',null,'akord'), h('th',null,'rola'), h('th',null,'dźwięki'), h('th',null,'na klawiaturze')));
  // kolejność: według ról, jak w appce
  [0,5,2,3,1,4,6].forEach(i=>{
    const c=chords[i];
    const kb=h('td',{class:'kb'}); kb.appendChild(printKbd(c));
    tb.append(h('tr',null,
      h('td',{class:'mono'},c.rn),
      h('td',{class:'cn'},fmt(c.name)),
      h('td',null,h('span',{class:'fnbadge fn-'+c.fn},FN_NAME[c.fn])),
      h('td',{class:'mono'},c.notes.map(fmt).join(' ')),
      kb));
  });
  sheet.append(tb);
  // palcowanie gamy — po to, żeby kartka stojąca na pianinie mówiła też, czym grać
  if(FINGERING[k]){
    const rzad = (hand, label) => h('div',{class:'fing-row'},
      h('b',null, label),
      ...scaleFingering(k, hand).map(x => h('span',{class:'fing-k' + (x.thumbUnder ? ' pod' : '')},
        h('i',null, String(x.finger)), fmt(x.note))));
    sheet.append(
      h('h3',{style:'margin:16px 0 4px;font-family:Fraunces,serif;color:#111'},'Palcowanie gamy'),
      h('div',{class:'fing'}, rzad('rh','Prawa'), rzad('lh','Lewa'),
        h('p',{class:'foot',style:'margin-top:6px'}, fingeringTip(k,'rh') + ' ' + fingeringTip(k,'lh') +
          ' Obramowany palec to miejsce przełożenia ręki.')));
  }
  const progs = h('div',{class:'progs'});
  PROGS.forEach(p=>{
    progs.append(h('div',null, h('span',{class:'pn'},p.name), h('b',null,p.deg.map(d=>fmt(chords[d].name)).join('  →  '))));
  });
  const sc=KEYS[k];
  const bridges = [sc[3],sc[4]].filter(r=>KEYS[r]).map(r=>`do ${fmt(r)}: wspólne ${sharedWith(k,r).map(c=>fmt(c.name)).join('/')} → ${fmt(chordsFor(r)[4].name)} → ${fmt(r)}`);
  sheet.append(h('h3',{style:'margin:16px 0 0;font-family:Fraunces,serif;color:#111'},'Progresje do grania'), progs,
    bridges.length ? h('p',{class:'foot',style:'color:#333;font-size:.85rem'}, h('b',null,'Przejścia: '), bridges.join('  ·  ')) : null,
    h('p',{class:'foot'},'Lewa ręka: podstawa akordu (pierwszy dźwięk) oktawę niżej. Prawa: trzy dźwięki akordu — szukaj przewrotów blisko siebie.'));
  requestAnimationFrame(()=>{ try{
    const notes = KEYS[k].map((n,i)=>{ const base = PC[KEYS[k][0]]; const oct = 4 + ((PC[n]<base || (i>0 && PC[n]===base))?1:0); return {keys:[n.toLowerCase()+'/'+oct]}; });
    notes.push({keys:[KEYS[k][0].toLowerCase()+'/5']});
    drawStaff(staff,{keySig:k,notes,width:420,height:120,top:10});
  }catch(e){ console.error(e); } });
  return sheet;
}
function sheetGeneral(){
  const s = h('div',{class:'sheet'});
  s.innerHTML = `
<h2>Ściąga ogólna</h2>
<p class="sub">Najważniejsze rzeczy z kursu na jednej kartce</p>
<table>
<tr><th style="width:28%">temat</th><th>w skrócie</th></tr>
<tr><td><b>Gama durowa</b></td><td class="mono">cały · cały · pół · cały · cały · cały · pół</td></tr>
<tr><td><b>Akord (trójdźwięk)</b></td><td>co drugi dźwięk: 1–3–5. <b>Dur</b> = 4+3 półtony, <b>moll</b> = 3+4, <b>zmniejszony</b> = 3+3</td></tr>
<tr><td><b>Akordy gamy</b></td><td class="mono">I · ii · iii · IV · V · vi · vii°  (duże = dur, małe = moll)</td></tr>
<tr><td><span class="fnbadge fn-t">Tonika</span></td><td>I, vi, iii — dom, odpoczynek. Tu się kończy.</td></tr>
<tr><td><span class="fnbadge fn-s">Subdominanta</span></td><td>IV, ii — ruch, wyjście z domu.</td></tr>
<tr><td><span class="fnbadge fn-d">Dominanta</span></td><td>V, vii° — napięcie. Zawiera 7. stopień (pół tonu pod domem), więc ciągnie do toniki.</td></tr>
<tr><td><b>Zasada łączenia</b></td><td>T → S → D → T, w kółko. Najmocniej: V → I.</td></tr>
<tr><td><b>Kadencje</b></td><td>V→I doskonała (kropka) · IV→I plagalna („amen") · koniec na V: półkadencja (pytajnik) · V→vi zwodnicza (niespodzianka)</td></tr>
<tr><td><b>Zmiana gamy</b></td><td>akord wspólny (most) → dominanta nowej gamy → nowa tonika</td></tr>
<tr><td><b>Moll</b></td><td>równoległa molowa = vi stopień (C-dur ↔ a-moll). W moll często V durowe (a-moll: E zamiast Em).</td></tr>
<tr><td><b>Klucz wiolinowy</b></td><td>linie <span class="mono">E G B D F</span> „Ewa Gra Bardzo Dobrze Fortepian" · pola <span class="mono">F A C E</span></td></tr>
<tr><td><b>Klucz basowy</b></td><td>linie <span class="mono">G B D F A</span> „Gosia Bardzo Dobrze Fotografuje Auta" · pola <span class="mono">A C E G</span> „Ala Chce Ekstra Gitarę"</td></tr>
<tr><td><b>Rytm</b></td><td>cała = 4 · półnuta = 2 · ćwierćnuta = 1 · ósemka = ½ · kropka dodaje połowę</td></tr>
<tr><td><b>Znaki przykluczowe</b></td><td>krzyżyki: F C G D A E B (gama = pół tonu nad ostatnim) · bemole: B E A D G C F (gama = przedostatni bemol)</td></tr>
</table>
<h3 style="font-family:Fraunces,serif;color:#111;margin:16px 0 4px">Wszystkie gamy w skrócie</h3>
<table>
<tr><th>gama</th><th style="color:#be185d">tonika I · vi · iii</th><th style="color:#0f766e">subdominanta IV · ii</th><th style="color:#a16207">dominanta V · vii°</th></tr>
${ORDER.map(k=>{ const c=chordsFor(k); const g=a=>a.map(i=>fmt(c[i].name)).join(' · '); return `<tr><td class="mono"><b>${fmt(k)}</b></td><td class="mono">${g([0,5,2])}</td><td class="mono">${g([3,1])}</td><td class="mono">${g([4,6])}</td></tr>`; }).join('')}
</table>`;
  return s;
}
async function sheetSong(id){
  const s = await DB.getSong(id);
  const sheet = h('div',{class:'sheet'});
  if(!s){ sheet.append(h('p',null,'Nie znaleziono piosenki.')); return sheet; }
  sheet.append(h('h2',null,s.title||'(bez tytułu)'),
    h('p',{class:'sub'}, [s.artist, 'tonacja: '+keyNameLabel(s.key), s.bpm? s.bpm+' BPM':''].filter(Boolean).join(' · ')));
  parseSongText(s.chords).forEach(l=>{
    const line = h('div',{class:'song-line'});
    if(l.label) line.append(h('span',{class:'ll'},l.label));
    l.tokens.forEach(t=>{
      if(t.bar) line.append(h('span',{style:'color:#aaa'},'|'));
      else if(t.junk) line.append(h('span',{style:'color:#999'},t.junk));
      else { const f=functionIn(t.chord,s.key); line.append(h('span',{class:'fnbadge fn-'+f.fn,style:'font-size:1rem;padding:2px 10px'}, fmt(t.chord.text), f.rn? h('small',{style:'margin-left:5px;opacity:.7;font-size:.7rem'},f.rn):null)); }
    });
    sheet.append(line);
  });
  // chwyty użytych akordów
  const used=[]; const seen=new Set();
  parseSongText(s.chords).forEach(l=>l.tokens.forEach(t=>{ if(t.chord && !seen.has(t.chord.text)){ seen.add(t.chord.text); used.push(t.chord); } }));
  if(used.length){
    sheet.append(h('h3',{style:'font-family:Fraunces,serif;color:#111;margin:16px 0 6px'},'Chwyty'));
    const grid = h('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px 14px'});
    used.slice(0,16).forEach(c=>{
      const f=functionIn(c,s.key);
      const kb = kbdSVG({from:60,to:83,marks:chordMarks(c.pcs,f.fn),labels:'marked'});
      grid.append(h('div',null, h('div',{style:'font-weight:700;font-family:Fraunces,serif'},fmt(c.text), h('span',{class:'fnbadge fn-'+f.fn,style:'margin-left:6px;font-size:.65rem'},FN_NAME[f.fn])), kb));
    });
    sheet.append(grid);
  }
  if(s.notes) sheet.append(h('h3',{style:'font-family:Fraunces,serif;color:#111;margin:16px 0 4px'},'Notatki'), h('p',{style:'white-space:pre-wrap;color:#333;font-size:.9rem'},s.notes));
  return sheet;
}

const ViewDruk = {
  title:'Druk',
  async render(root, sub){
    root.append(
      h('header',{class:'no-print',style:'margin-bottom:18px'},
        h('p',{class:'kicker'},'na pulpit pianina'),
        h('h1',null,'Ściągawki ', h('em',null,'do druku')),
        h('p',{class:'lead'},'Zaznacz gamy, sprawdź podgląd i kliknij „Drukuj". Każda gama to osobna kartka A4. W oknie drukowania możesz też wybrać „Zapisz jako PDF".')));
    const out = h('div');
    if(sub && sub.startsWith('song/')){
      root.append(h('div',{class:'row no-print'},
        h('button',{class:'btn primary',onclick:()=>window.print()},'🖨 Drukuj / PDF'),
        h('a',{class:'btn',href:'#piosenki/'+sub.slice(5)},'← wróć do piosenki')), out);
      out.append(await sheetSong(sub.slice(5)));
      return;
    }
    const sel = new Set(prefs.get('druk.keys',['C','G']));
    let general = prefs.get('druk.general',true);
    const ctr = h('div',{class:'print-controls no-print'});
    const g = h('label',null, h('input',{type:'checkbox',checked:general,onchange:e=>{ general=e.target.checked; prefs.set('druk.general',general); draw(); }}), 'ściąga ogólna');
    ctr.append(g);
    ALL_KEYS.forEach(k=>{
      ctr.append(h('label',null, h('input',{type:'checkbox',checked:sel.has(k),onchange:e=>{ e.target.checked?sel.add(k):sel.delete(k); prefs.set('druk.keys',[...sel]); draw(); }}), fmt(k)));
    });
    root.append(ctr,
      h('div',{class:'row no-print',style:'margin-top:12px'},
        h('button',{class:'btn primary',onclick:()=>window.print()},'🖨 Drukuj / PDF'),
        h('span',{class:'hint'},'Wskazówka: w ustawieniach druku włącz „Grafika tła", żeby zostały kolory.')),
      out);
    function draw(){
      out.innerHTML='';
      if(general) out.append(sheetGeneral());
      ALL_KEYS.filter(k=>sel.has(k)).forEach(k=>out.append(sheetForKey(k)));
      if(!out.children.length) out.append(h('div',{class:'empty no-print'},'Zaznacz przynajmniej jedną gamę.'));
    }
    draw();
  }
};
