/* Zakładka „Klawisze" — żywe pianino.
   Grasz myszką, klawiaturą komputera albo prawdziwym pianinem przez MIDI,
   a appka na bieżąco mówi, co właśnie zagrałaś: dźwięki, akord, przewrót,
   rolę w tonacji i do jakich gam to pasuje. Druga część to gamy z palcowaniem
   i ćwiczenie „zagraj gamę w górę i w dół".
   Logika siedzi w js/detect.js, js/midi.js i js/fingering.js — tu jest tylko obsługa ekranu. */

const KLAWISZE_FROM = 36, KLAWISZE_TO = 96;      // C2–C7, pięć oktaw
const SHARP_KEYS = ['G','D','A','E','B','F#'];   // w tych tonacjach piszemy ♯, nie ♭

const ViewKlawisze = {
  title:'Klawisze',
  render(root){
    let key = prefs.get('klawisze.key', 'C');
    if(!isKnownKey(key)) key = 'C';
    let scaleKey = prefs.get('klawisze.scale', 'C');
    if(!FINGERING_KEYS.includes(scaleKey)) scaleKey = 'C';
    let hand = prefs.get('klawisze.hand', 'rh');
    let oktawa = prefs.get('klawisze.oct', 1);
    let sustainKbd = false;

    const grane = new Set();        // co brzmi: mysz, klawiatura i MIDI razem
    let run = null;                 // trwające ćwiczenie „zagraj gamę"

    /* ---------- szkielet ---------- */
    const status = h('div',{class:'kl-status'});
    const tablica = h('div',{class:'kl-tablica'});
    const kbdHold = h('div',{class:'kl-kbd scrollx'});
    const scaleHold = h('div',{class:'kl-kbd kl-scale scrollx'});
    const scaleInfo = h('div',{class:'kl-scaleinfo'});
    const runBox = h('div',{class:'kl-run'});
    const keyRowHold = h('div',{class:'row',style:'gap:10px;flex-wrap:wrap;align-items:center'});
    const scaleRowHold = h('div',{class:'row',style:'gap:10px;flex-wrap:wrap;align-items:center'});

    root.append(
      h('header',{style:'margin-bottom:18px'},
        h('p',{class:'kicker'},'graj i patrz, co z tego wychodzi'),
        h('h1',null,'Żywe ', h('em',null,'klawisze')),
        h('p',{class:'lead'},'Graj myszką, klawiaturą komputera (dolny rząd ', h('span',{class:'mono'},'z s x d c…'),
          ') albo podłącz pianino kablem MIDI. Appka nazwie każdy akord, który trzymasz — razem z przewrotem i rolą w tonacji.')),
      status,
      h('div',{class:'card'}, keyRowHold, tablica, kbdHold),
      h('section',null,
        h('div',{class:'sechead'}, h('h2',null,'Gama z palcowaniem'), h('span',{class:'hint'},'który palec na który klawisz')),
        h('div',{class:'card'}, scaleRowHold, scaleInfo, scaleHold, runBox)),
      h('div',{class:'box tip',style:'margin-top:26px'},
        h('p',null,'Pianino cyfrowe podłącz kablem USB do komputera i kliknij ', h('b',null,'Podłącz pianino'),
          '. Przeglądarka zapyta o zgodę. Działa w Chrome i Edge; Safari nie obsługuje MIDI — tam graj myszką albo klawiaturą komputera.'),
        h('p',null,'Klawiatura komputera: ', h('span',{class:'mono'},'z s x d c v g b h n j m'),' to oktawa od C, ',
          h('span',{class:'mono'},'q 2 w 3 e r 5 t 6 y 7 u'),' oktawę wyżej. ', h('b',null,'Shift'),' trzyma dźwięki jak pedał, ',
          h('span',{class:'mono'},'←'),' i ', h('span',{class:'mono'},'→'),' przesuwają o oktawę.')));

    /* ---------- pasek stanu MIDI (wspólne połączenie dla całej appki) ---------- */
    const midi = midiPiano();
    const btnMidi = h('button',{class:'btn small'},'🎹 Podłącz pianino');
    const midiTxt = h('span',{class:'hint'}, midi.supported
      ? 'Masz pianino z MIDI? Podłącz je, a klawisze zaświecą się same.'
      : 'Ta przeglądarka nie obsługuje MIDI — graj myszką albo klawiaturą komputera.');
    btnMidi.disabled = !midi.supported;
    btnMidi.onclick = async ()=>{ btnMidi.disabled = true; btnMidi.textContent = 'łączę…'; await midi.start(); };
    const pokazStatus = st=>{
      btnMidi.disabled = !st.supported || st.ok;
      btnMidi.textContent = st.ok ? '🎹 Podłączone' : '🎹 Podłącz pianino';
      if(st.error === 'odmowa') midiTxt.textContent = 'Przeglądarka nie dała dostępu do MIDI. Możesz to zmienić w jej ustawieniach (kłódka przy adresie).';
      else if(st.error) midiTxt.textContent = 'Nie udało się połączyć z MIDI — graj myszką albo klawiaturą komputera.';
      else if(st.ok) midiTxt.textContent = st.devices.length
        ? 'Gra: ' + st.devices.join(', ')
        : 'Połączono, ale nie widzę żadnego pianina. Sprawdź kabel i włącz instrument.';
    };
    const zGrania = (msg, held)=>{
      if(msg.type === 'on'){ playMidi(msg.note, 1.4); zagrane(msg.note); }
      grane.clear();
      held.notes().forEach(m=>grane.add(m));
      if(run && msg.type === 'on') krokGamy(msg.note);
      odswiezGrane();
    };
    const odepnijMidi = midiSubscribe(zGrania, pokazStatus);
    status.append(h('div',{class:'row',style:'gap:10px;flex-wrap:wrap'}, btnMidi, midiTxt));

    /* ---------- wybór tonacji do analizy ---------- */
    keyRowHold.append(
      h('span',{class:'muted'},'Patrzę na to w tonacji:'),
      segBar(SONG_KEYS.slice(0,12).map(k=>k.v), key, v=>{ key = v; prefs.set('klawisze.key', v); odswiezGrane(); }, fmt),
      h('button',{class:'btn small ghost',onclick:()=>{ grane.clear(); midi.held.clear(); odswiezGrane(); }},'wyczyść'));

    function segBar(values, current, onPick, label=String){
      const box = h('div',{class:'seg'});
      values.forEach(v=>{
        const b = h('button',{type:'button','aria-pressed':String(v===current),'data-v':v}, label(v));
        b.onclick = ()=>{ box.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed', String(x===b))); onPick(v); };
        box.append(b);
      });
      return box;
    }

    /* ---------- klawiatura do grania ---------- */
    function zagrane(m){
      const r = kbdHold.querySelector(`rect[data-midi="${m}"]`);
      if(r) flashKey(r.ownerSVGElement, m, 'x');
    }
    // klik myszką trzyma dźwięk (jak palec na klawiszu) — drugi klik go puszcza,
    // dzięki temu da się wyklikać cały akord i zobaczyć jego nazwę
    function klik(m){
      playMidi(m, 1.3);
      if(grane.has(m)) grane.delete(m); else grane.add(m);
      if(run) krokGamy(m);
      odswiezGrane();
    }
    // klawiaturę rysujemy raz, potem tylko przestawiamy podświetlenia (bez migania przy szybkiej grze)
    const kbdSvg = kbdSVG({from:KLAWISZE_FROM, to:KLAWISZE_TO, marks:{}, labels:'c',
      aria:'Klawiatura — kliknij, żeby zagrać', onKey:m=>klik(m)});
    kbdSvg.classList.add('wide');
    kbdHold.append(kbdSvg);
    function rysujKbd(){
      kbdSvg.querySelectorAll('rect.on-x').forEach(r=>r.classList.remove('on-x'));
      grane.forEach(m=>{
        const r = kbdSvg.querySelector(`rect[data-midi="${m}"]`);
        if(r) r.classList.add('on-x');
      });
    }

    /* ---------- tablica: co właśnie gram ---------- */
    function odswiezGrane(){
      rysujKbd();
      const nuty = [...grane].sort((a,b)=>a-b);
      const sharp = SHARP_KEYS.includes(majorOfKey(key));
      tablica.innerHTML = '';
      if(!nuty.length){
        tablica.append(h('p',{class:'muted',style:'margin:0'},'Zagraj coś — akord pokaże się tutaj z nazwą, przewrotem i rolą w tonacji.'));
        return;
      }
      const det = detectChord(nuty, {preferSharp:sharp});
      const nazwy = detectNoteNames(nuty, det, sharp);
      tablica.append(h('div',{class:'kl-nuty'}, ...nazwy.map(n=>
        h('span',{class:'kl-nuta'}, n.name, h('small',null, String(n.oktawa))))));
      if(det){
        const c = parseChord(det.name);
        const f = c ? functionIn(c, key) : {fn:'o', rn:''};
        const t = c ? chordType(c) : 'su';
        tablica.append(
          h('div',{class:'kl-akord'},
            h('b',{style:`color:${CHORD_TYPES[t].color}`}, det.label),
            h('span',{class:'kl-opis'}, det.opis + (det.exact ? '' : ' · bez kwinty')),
            det.slash || det.inversion ? h('span',{class:'kl-opis'}, det.invName) : null),
          h('p',{class:'kl-rola'},
            f.fn === 'o'
              ? h('span',null, 'W ', h('b',null, keyNameLabel(key)), ' to akord spoza gamy — kolor z zewnątrz.',
                  f.rn ? h('span',null, ' Ale nie przypadkowy: ', h('b',null, f.rn),
                    ' — dominanta prowadząca do ', h('b',null, chordLabel(chordsFor(majorOfKey(key))[4].name)), '.') : null)
              : h('span',null, 'W ', h('b',null, keyNameLabel(key)), ' to stopień ', h('b',{class:f.fn+'-c'}, f.rn),
                  ' — ', h('b',{class:f.fn+'-c'}, FN_NAME[f.fn].toLowerCase()), ' (', FN_SUB[f.fn], ').')));
        const gamy = matchingKeys(nuty, 4);
        if(gamy.length) tablica.append(h('p',{class:'hint'}, 'Pasuje do: ' + gamy.map(g=>g.l).join(' · ')));
      }else if(nuty.length === 2){
        tablica.append(h('div',{class:'kl-akord'}, h('b',null, intervalName(nuty[0], nuty[1]))));
      }else{
        tablica.append(h('p',{class:'hint'},'Nie znam akordu z takim zestawem dźwięków — ale możesz go zagrać.'));
      }
    }

    /* ---------- gama z palcowaniem ---------- */
    function rysujGame(){
      scaleRowHold.innerHTML = '';
      scaleRowHold.append(
        h('span',{class:'muted'},'Gama:'),
        segBar(FINGERING_KEYS, scaleKey, v=>{ scaleKey = v; prefs.set('klawisze.scale', v); run = null; rysujGame(); }, fmt),
        segBar(['rh','lh'], hand, v=>{ hand = v; prefs.set('klawisze.hand', v); run = null; rysujGame(); },
          v=>v==='rh' ? 'prawa' : 'lewa'),
        h('button',{class:'btn small',onclick:zagrajGame},'▶ posłuchaj gamy'),
        h('button',{class:'btn small primary',onclick:startRun},'🎯 zagraj gamę'));

      const kroki = scaleFingering(scaleKey, hand);
      const marks = {}, names = {};
      kroki.forEach(k=>{ marks[k.midi] = k.thumbUnder ? 'd' : 't'; names[k.midi] = String(k.finger); });
      const from = Math.min(...kroki.map(k=>k.midi)) - 4, to = Math.max(...kroki.map(k=>k.midi)) + 4;
      const svg = kbdSVG({from, to, marks, names, labels:'marked',
        aria:`Gama ${keyLabel(scaleKey)} z palcowaniem`, onKey:m=>{ playMidi(m); if(run) krokGamy(m); }});
      svg.classList.add('wide');
      scaleHold.innerHTML = '';
      scaleHold.append(svg);

      scaleInfo.innerHTML = '';
      scaleInfo.append(
        h('p',{class:'kl-palce'}, ...kroki.map(k=>
          h('span',{class:'kl-palec' + (k.thumbUnder ? ' pod' : '')},
            h('b',null, String(k.finger)), h('small',null, fmt(k.note))))),
        h('p',{class:'muted',style:'margin:6px 0 0;font-size:.9rem'}, fingeringTip(scaleKey, hand)),
        h('p',{class:'hint',style:'margin:4px 0 0'},'Żółty klawisz to miejsce, gdzie ręka się przekłada — tam zwolnij i ćwicz najwolniej.'));
      rysujRun();
    }
    function zagrajGame(){
      const seq = scaleRunSequence(scaleKey, hand);
      playSeq(seq, 0.26, 0.4);
    }
    function startRun(){
      run = new ScaleRun(scaleRunSequence(scaleKey, hand));
      rysujRun();
    }
    function krokGamy(m){
      if(!run || run.done) return;
      const w = run.play(m);
      rysujRun(w);
    }
    function rysujRun(ostatni){
      runBox.innerHTML = '';
      if(!run) return;
      const kroki = run.seq.length;
      if(run.done){
        runBox.append(h('p',{class:'kl-verdict ' + (run.bledy ? 'bad' : 'good')},
          run.bledy ? `Gama zagrana — ${run.bledy} ${run.bledy===1?'pomyłka':'pomyłek'} po drodze.` : 'Cała gama bez pomyłki! 🎉'),
          h('button',{class:'btn small',onclick:startRun},'jeszcze raz'));
        return;
      }
      const cel = run.expected;
      const nazwa = detectNoteNames([cel], null, SHARP_KEYS.includes(scaleKey))[0];
      const krok = scaleFingering(scaleKey, hand).find(k=>k.midi === cel);
      runBox.append(
        h('div',{class:'kl-runbar'}, h('i',{style:`width:${Math.round(run.progress*100)}%`})),
        h('p',{class:'kl-next'}, 'Teraz: ', h('b',null, nazwa.name),
          krok ? h('span',null, ' palcem ', h('b',null, String(krok.finger)), ` (${krok.fingerName})`) : null,
          h('span',{class:'hint'}, `  ${run.i + 1} z ${kroki}`),
          ostatni && !ostatni.ok ? h('span',{class:'kl-miss'},' — to był nie ten dźwięk') : null));
      const svg = scaleHold.querySelector('svg');
      if(svg){
        svg.querySelectorAll('rect.cel').forEach(r=>r.classList.remove('cel'));
        const r = svg.querySelector(`rect[data-midi="${cel}"]`);
        if(r) r.classList.add('cel');
      }
    }

    /* ---------- klawiatura komputera ---------- */
    const wcisniete = new Map();   // klawisz komputera → dźwięk, żeby puszczenie zdjęło właściwy
    const onDown = e=>{
      if(!root.isConnected){ sprzataj(); return; }
      if(e.target.matches('input,textarea,select')) return;
      if(e.key === 'Shift'){ sustainKbd = true; return; }
      if(e.key === 'ArrowLeft' || e.key === 'ArrowRight'){
        oktawa = Math.max(-1, Math.min(3, oktawa + (e.key === 'ArrowRight' ? 1 : -1)));
        prefs.set('klawisze.oct', oktawa);
        e.preventDefault();
        return;
      }
      const m = keyToMidi(e.key, oktawa);
      if(m === null || wcisniete.has(e.key)) return;     // autopowtarzanie klawisza nie gra drugi raz
      e.preventDefault();
      wcisniete.set(e.key, m);
      playMidi(m, 1.3);
      zagrane(m);
      grane.add(m);
      if(run) krokGamy(m);
      odswiezGrane();
    };
    // puszczenie klawisza zdejmuje dźwięk — chyba że trzymasz Shift (pedał)
    const onUp = e=>{
      if(e.key === 'Shift'){ sustainKbd = false; return; }
      const m = wcisniete.get(e.key);
      wcisniete.delete(e.key);
      if(m === undefined || sustainKbd) return;
      grane.delete(m);
      odswiezGrane();
    };
    function sprzataj(){
      document.removeEventListener('keydown', onDown);
      document.removeEventListener('keyup', onUp);
      odepnijMidi();          // samo połączenie zostaje — inne zakładki też z niego korzystają
    }
    document.addEventListener('keydown', onDown);
    document.addEventListener('keyup', onUp);

    odswiezGrane();
    rysujGame();
  }
};
