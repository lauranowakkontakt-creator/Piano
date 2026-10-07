/* Zakładka „Setlista" — wybierasz piosenki, układasz je w kolejności i grasz jedna
   po drugiej. Każda piosenka gra w swojej tonacji albo w wybranej innej, a między
   piosenkami w różnych tonacjach appka podaje akordy przejścia (js/setlista.js).
   #setlista/<id>          — układanie
   #setlista/<id>/graj/<n> — tryb grania: duży tekst, Dalej/Wstecz (też strzałki i pedał „page down") */

const ViewSetlista = {
  title:'Setlista',
  async render(root, sub){
    const [slId, tryb, nrTxt] = String(sub||'').split('/');

    let songs;
    try{ songs = await DB.allSongs(); await seedSongs(songs); }
    catch(e){
      root.append(h('div',{class:'card'},h('p',null,'Ta przeglądarka nie pozwala zapisywać danych (IndexedDB). Otwórz appkę w Chrome, Edge albo Firefox.')));
      return;
    }
    const byId = id => songs.find(s=>s.id===id) || null;

    let lists = sanitizeSetlisty(prefs.get(SETLISTY_KLUCZ, []));
    const save = ()=>prefs.set(SETLISTY_KLUCZ, lists);
    let cur = lists.find(l=>l.id===slId) || lists.find(l=>l.id===prefs.get('setlista.last',null)) || lists[0];
    if(!cur){ cur = setlistaNowa('Moja setlista'); lists.push(cur); save(); }
    prefs.set('setlista.last', cur.id);
    // piosenka usunięta w Piosenkach znika też z setlisty
    const przed = cur.items.length;
    cur.items = cur.items.filter(it=>byId(it.songId));
    if(cur.items.length !== przed) save();

    /* wyliczone dla pozycji: piosenka, tonacja, w której grasz, akordy */
    const pozycja = it => {
      const song = byId(it.songId);
      const key = transposeKey(song.key, it.shift);
      return {it, song, key, chords: songChordsIn(song, it.shift)};
    };
    /* przejście do pozycji i (z i-1) */
    const przejscieDo = i => {
      if(i <= 0 || i >= cur.items.length) return null;
      const a = pozycja(cur.items[i-1]), b = pozycja(cur.items[i]);
      const tr = setlistTransition(a.key, b.key, a.chords[a.chords.length-1], b.chords[0]);
      return {a, b, tr, wybor: wybraneOpcja(tr, b.it.przejscie)};
    };
    const grajPrzejscie = (p, btn)=>{
      const seq = [p.a.chords[p.a.chords.length-1] || p.a.key, ...p.wybor.chords, p.b.chords[0] || p.b.key]
        .map(t=>parseChord(t)).filter(Boolean).map(c=>({pcs:c.pcs, bassPc:c.bassPc}));
      if(btn){ btn.textContent='■'; }
      playChordSeq(seq, 1.1, ()=>{ if(btn) btn.textContent='▶'; });
    };
    /* akordy przejścia jako kafelki w kolorze ich roli w NOWEJ tonacji */
    const chipy = (chords, key) => h('div',{class:'sl-chipy'}, ...chords.map(t=>{
      const c = parseChord(t), f = functionIn(c, key);
      const b = h('button',{type:'button',class:'chord-chip '+f.fn,title:FN_NAME[f.fn]+(f.rn?' · '+f.rn:'')}, fmt(t), f.rn?h('span',{class:'deg'},f.rn):null);
      b.onclick=()=>{ if(c) strike(c.pcs,1.1,0,c.bassPc); ring(b,'lit'); };
      return b;
    }));
    /* przełącznik wariantów przejścia */
    const warianty = (p, onPick) => h('div',{class:'seg sl-warianty',role:'group','aria-label':'Rodzaj przejścia'},
      ...p.tr.opcje.map(o=>{
        const b = h('button',{type:'button','aria-pressed':String(o.id===p.wybor.id)}, o.name);
        b.onclick=()=>{ p.b.it.przejscie = o.id; save(); onPick(); };
        return b;
      }));

    if(tryb === 'graj') return grajTryb(Math.max(0, parseInt(nrTxt,10) || 0));
    return edytor();

    /* ================= układanie ================= */
    function edytor(){
      root.append(h('header',{style:'margin-bottom:18px'},
        h('p',{class:'kicker'},'na próbę i na występ'),
        h('h1',null,'Twoja ', h('em',null,'setlista')),
        h('p',{class:'lead'},'Wybierz piosenki i ułóż je w kolejności. Każda gra w swojej tonacji albo w tej, którą wybierzesz — a gdy następna jest w innej tonacji, appka podpowie akordy przejścia.')));

      const top = h('div',{class:'card sl-top'});
      const lista = h('ol',{class:'sl-lista'});
      const dodaj = h('div',{class:'sl-dodaj'});
      root.append(top, h('section',null, lista, dodaj));

      function rysujTop(){
        top.innerHTML='';
        const nazwa = h('input',{type:'text',value:cur.name,'aria-label':'Nazwa setlisty',class:'sl-nazwa'});
        nazwa.oninput=()=>{ cur.name = nazwa.value.slice(0,120) || 'Setlista'; save(); };
        const wybor = lists.length > 1 ? h('select',{'aria-label':'Wybierz setlistę',class:'sl-wybor'},
          ...lists.map(l=>h('option',{value:l.id,selected:l.id===cur.id}, l.name))) : null;
        if(wybor) wybor.onchange=()=>{ location.hash = '#setlista/'+wybor.value; };
        const graj = h('a',{class:'btn primary big',href:'#setlista/'+cur.id+'/graj/0'}, '▶ Graj setlistę');
        if(!cur.items.length){ graj.removeAttribute('href'); graj.setAttribute('aria-disabled','true'); graj.classList.add('off'); }
        top.append(
          h('div',{class:'sl-toprow'}, nazwa, wybor),
          h('div',{class:'row'}, graj,
            h('button',{class:'btn small ghost',onclick:()=>{ const n=setlistaNowa('Setlista '+(lists.length+1)); lists.push(n); save(); location.hash='#setlista/'+n.id; }},'+ Nowa setlista'),
            h('button',{class:'btn small ghost danger',onclick:()=>{
              if(!confirm('Usunąć setlistę „'+cur.name+'”? Piosenki zostają.')) return;
              lists = lists.filter(l=>l.id!==cur.id); save(); prefs.set('setlista.last',null);
              location.hash = '#setlista/'+(lists[0]?lists[0].id:'');
            }},'Usuń setlistę')),
          h('p',{class:'hint',style:'margin:0'}, cur.items.length
            ? `${cur.items.length} ${cur.items.length===1?'piosenka':cur.items.length<5?'piosenki':'piosenek'} · przy graniu: strzałki ← → albo pedał do przewracania stron`
            : 'Dodaj pierwszą piosenkę poniżej.'));
      }

      function rysuj(){
        rysujTop();
        lista.innerHTML='';
        cur.items.forEach((it,i)=>{
          if(i>0) lista.append(rysujPrzejscie(i));
          const p = pozycja(it);
          const moll = isMinorKeyName(p.song.key);
          const ton = h('select',{'aria-label':'Tonacja: '+p.song.title},
            ...SONG_KEYS.filter(k=>isMinorKeyName(k.v)===moll).map(k=>
              h('option',{value:k.v,selected:k.v===p.key}, keyNameLabel(k.v)+(k.v===p.song.key?' · oryginalna':''))));
          ton.onchange=()=>{ it.shift = shiftBetween(p.song.key, ton.value); save(); rysuj(); };
          const dopasuj = i>0 && majorOfKey(pozycja(cur.items[i-1]).key)!==majorOfKey(p.key)
            ? h('button',{class:'btn small ghost',title:'Przenieś do tonacji poprzedniej piosenki — wtedy nie trzeba przejścia',
                onclick:()=>{ it.shift = shiftToMatch(p.song.key, pozycja(cur.items[i-1]).key); save(); rysuj(); }},'dopasuj do poprzedniej')
            : null;
          const oryg = it.shift ? h('button',{class:'btn small ghost',onclick:()=>{ it.shift=0; save(); rysuj(); }},'wróć do '+keyNameLabel(p.song.key)) : null;
          lista.append(h('li',{class:'sl-item card'},
            h('span',{class:'sl-nr'}, String(i+1)),
            h('div',{class:'sl-info'},
              h('a',{href:'#piosenki/'+encodeURIComponent(p.song.id),class:'sl-tytul'}, p.song.title || '(bez tytułu)'),
              h('span',{class:'muted'}, [p.song.artist, p.chords.length ? p.chords.length+' akordów' : 'bez akordów'].filter(Boolean).join(' · ')),
              h('div',{class:'row sl-ton'}, h('span',{class:'hint'},'gram w'), ton, oryg, dopasuj)),
            h('div',{class:'sl-ruch'},
              h('button',{class:'btn small ghost','aria-label':'Wyżej',disabled:i===0,onclick:()=>{ cur.items=przesun(cur.items,i,-1); save(); rysuj(); }},'↑'),
              h('button',{class:'btn small ghost','aria-label':'Niżej',disabled:i===cur.items.length-1,onclick:()=>{ cur.items=przesun(cur.items,i,1); save(); rysuj(); }},'↓'),
              h('button',{class:'btn small ghost danger','aria-label':'Usuń z setlisty',onclick:()=>{ cur.items.splice(i,1); save(); rysuj(); }},'✕'))));
        });
        rysujDodaj();
      }

      function rysujPrzejscie(i){
        const box = h('li',{class:'sl-przejscie','aria-label':'Przejście'});
        const p = przejscieDo(i);
        const odtworz = h('button',{class:'play','aria-label':'Zagraj przejście'},'▶');
        odtworz.onclick=()=>{ if(odtworz.textContent==='■'){ stopSeq(); return; } grajPrzejscie(p, odtworz); };
        box.append(
          h('div',{class:'sl-prz-head'},
            h('span',{class:'sl-strzalka','aria-hidden':'true'},'↓'),
            h('span',null, p.tr.ta ? 'ta sama gama: ' : 'zmiana tonacji: ', h('b',null,keyNameLabel(p.a.key)), ' → ', h('b',null,keyNameLabel(p.b.key)))),
          h('div',{class:'sl-prz-body'},
            warianty(p, rysuj),
            h('div',{class:'row'}, odtworz, p.wybor.chords.length ? chipy(p.wybor.chords, p.b.key) : h('span',{class:'muted'},'bez dodatkowych akordów')),
            h('p',{class:'hint',style:'margin:0'}, p.wybor.opis)));
        return box;
      }

      function rysujDodaj(){
        dodaj.innerHTML='';
        if(!songs.length){
          dodaj.append(h('div',{class:'empty'},'Nie masz jeszcze piosenek. ', h('a',{href:'#piosenki'},'Dodaj je w zakładce Piosenki'),'.'));
          return;
        }
        const sel = h('select',{'aria-label':'Piosenka do dodania'},
          ...songs.map(s=>h('option',{value:s.id}, (s.title||'(bez tytułu)')+' — '+keyNameLabel(s.key))));
        const b = h('button',{class:'btn'},'+ Dodaj do setlisty');
        b.onclick=()=>{ cur.items.push({songId:sel.value, shift:0, przejscie:''}); save(); rysuj(); };
        dodaj.append(h('label',{class:'f'},'Dodaj piosenkę'), h('div',{class:'sl-dodaj-row'}, sel, b));
      }

      rysuj();
    }

    /* ================= tryb grania ================= */
    function grajTryb(n){
      if(!cur.items.length){
        root.append(h('div',{class:'empty'},'Ta setlista jest pusta. ', h('a',{href:'#setlista/'+cur.id},'Dodaj piosenki'),'.'));
        return;
      }
      n = Math.min(n, cur.items.length-1);
      const idz = k => { stopSeq(); location.hash = '#setlista/'+cur.id+'/graj/'+k; };
      const p = pozycja(cur.items[n]);
      const ile = cur.items.length;

      const scena = h('article',{class:'sl-scena'});
      scena.append(h('header',{class:'sl-scena-head'},
        h('div',{class:'row',style:'justify-content:space-between'},
          h('p',{class:'kicker',style:'margin:0'}, `${n+1} z ${ile} · ${cur.name}`),
          h('a',{class:'btn small ghost',href:'#setlista/'+cur.id},'✎ Układaj')),
        h('h1',null, p.song.title || '(bez tytułu)'),
        h('div',{class:'row'},
          h('span',{class:'pill '+(p.it.shift?'d':'t')}, 'Gram w '+keyNameLabel(p.key)),
          p.it.shift ? h('span',{class:'muted'}, 'oryginalnie '+keyNameLabel(p.song.key)) : null,
          p.song.artist ? h('span',{class:'muted'}, p.song.artist) : null)));

      // pierwsze przejście (z poprzedniej) przypomniane na górze
      const wejscie = przejscieDo(n);
      if(wejscie && wejscie.wybor.chords.length)
        scena.append(h('div',{class:'sl-wejscie'}, h('span',{class:'hint'},'wejście z poprzedniej: '), chipy(wejscie.wybor.chords, p.key)));

      const tekst = p.song.lyrics && p.song.lyrics.trim() ? transposeLyrics(p.song.lyrics, p.it.shift) : '';
      if(tekst){
        const box = h('div',{class:'lyr sl-tekst'});
        lyricsInto(box, parseLyrics(tekst), p.key);
        scena.append(box);
      }else if(p.chords.length){
        const box = h('div',{class:'song-sheet sl-tekst'}, h('div',{class:'lines'}, ...parseSongText(p.song.chords).map(l=>
          h('div',{class:'line'}, l.label ? h('div',{class:'lbl'}, l.label) : null,
            ...l.tokens.map(t=>{
              if(t.bar) return h('span',{class:'bar-sep'},'|');
              if(!t.chord) return null;
              const txt = transposeChord(t.chord.text, p.it.shift), c = parseChord(txt), f = functionIn(c, p.key);
              const b = h('button',{class:'chord-chip '+f.fn}, fmt(txt), f.rn?h('span',{class:'deg'},f.rn):null);
              b.onclick=()=>{ strike(c.pcs,1.1,0,c.bassPc); ring(b,'lit'); };
              return b;
            })))));
        scena.append(box);
      }else{
        scena.append(h('div',{class:'empty'},'Ta piosenka nie ma jeszcze akordów ani tekstu. ', h('a',{href:'#piosenki/'+encodeURIComponent(p.song.id)},'Uzupełnij ją w Piosenkach'),'.'));
      }
      if(p.song.notes) scena.append(h('div',{class:'box tip'}, h('p',null,p.song.notes)));

      // przejście do następnej
      const dalej = przejscieDo(n+1);
      if(dalej){
        const box = h('section',{class:'card sl-dalej'});
        const rysujDalej = ()=>{
          const q = przejscieDo(n+1);
          const odtworz = h('button',{class:'play','aria-label':'Zagraj przejście'},'▶');
          odtworz.onclick=()=>{ if(odtworz.textContent==='■'){ stopSeq(); return; } grajPrzejscie(q, odtworz); };
          box.innerHTML='';
          box.append(
            h('p',{class:'kicker',style:'margin:0'},'potem'),
            h('h2',null, q.b.song.title || '(bez tytułu)', ' ', h('span',{class:'muted',style:'font-size:1rem;font-weight:400'}, keyNameLabel(q.b.key))),
            h('p',{style:'margin:0 0 8px'}, q.tr.ta ? 'Te same akordy — możesz grać od razu.' : 'Przejście z '+keyNameLabel(q.a.key)+' do '+keyNameLabel(q.b.key)+':'),
            warianty(q, rysujDalej),
            h('div',{class:'row',style:'margin-top:10px'}, odtworz, q.wybor.chords.length ? chipy(q.wybor.chords, q.b.key) : h('span',{class:'muted'},'bez dodatkowych akordów')),
            h('p',{class:'hint',style:'margin:6px 0 0'}, q.wybor.opis));
        };
        rysujDalej();
        scena.append(box);
      }else{
        scena.append(h('div',{class:'card sl-dalej'}, h('p',{style:'margin:0'}, h('b',null,'To ostatnia piosenka.'), ' Brawo!')));
      }

      const pasek = h('nav',{class:'sl-pasek','aria-label':'Przechodzenie między piosenkami'},
        h('button',{class:'btn',disabled:n===0,onclick:()=>idz(n-1)},'← Poprzednia'),
        h('span',{class:'sl-licznik'}, `${n+1} / ${ile}`),
        n < ile-1
          ? h('button',{class:'btn primary',onclick:()=>idz(n+1)},'Następna →')
          : h('a',{class:'btn primary',href:'#setlista/'+cur.id},'Koniec ✓'));
      root.append(scena, pasek);
      window.scrollTo(0,0);

      // strzałki, PageUp/PageDown (tak działa większość pedałów do przewracania nut)
      const klawisze = e=>{
        if(!root.isConnected || !root.contains(scena)){ document.removeEventListener('keydown', klawisze); return; }
        if(e.target.closest && e.target.closest('input,textarea,select')) return;
        if((e.key==='ArrowRight' || e.key==='PageDown') && n < ile-1){ e.preventDefault(); idz(n+1); }
        else if((e.key==='ArrowLeft' || e.key==='PageUp') && n > 0){ e.preventDefault(); idz(n-1); }
      };
      document.addEventListener('keydown', klawisze);
    }
  }
};
