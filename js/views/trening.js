/* Zakładka „Trening" — codzienna runda ćwiczeń ze słuchu i z harmonii.
   Zadania pochodzą z js/drills.js, a to, co wraca i jak często, liczy
   system powtórek z js/srs.js. Stan siedzi w localStorage (prefs). */

const TRENING_STATE_KEY = 'trening.srs';
const TRENING_OPTS_KEY = 'trening.opts';

const ViewTrening = {
  title:'Trening',
  render(root){
    let state = srsSanitize(prefs.get(TRENING_STATE_KEY, null));
    const opts = Object.assign({kinds: DRILL_DEFAULT.slice(), key:'los', dlugosc: SRS_SESJA},
      prefs.get(TRENING_OPTS_KEY, {}) || {});
    if(!Array.isArray(opts.kinds) || !opts.kinds.length) opts.kinds = DRILL_DEFAULT.slice();
    opts.kinds = opts.kinds.filter(k=>DRILL_BY_ID[k]);
    if(!opts.kinds.length) opts.kinds = DRILL_DEFAULT.slice();

    const saveState = ()=> prefs.set(TRENING_STATE_KEY, state);
    const saveOpts = ()=> prefs.set(TRENING_OPTS_KEY, opts);

    /* ---------- stan rundy ---------- */
    let sesja = null;   // {n, ile, ok, start, bledy:[]}
    let task = null;
    let answered = false;
    let picked = [];    // klawisze wciśnięte w ćwiczeniu „zagraj akord"
    let hintShown = false;

    /* ---------- kawałki widoku ---------- */
    const pasekDnia = h('div',{class:'tr-top'});
    const kinds = h('div',{class:'tr-kinds'});
    const keyRow = h('div',{class:'row',style:'gap:8px;flex-wrap:wrap'});
    const scena = h('div',{class:'tr-scena card'});
    const statsBox = h('section',{class:'tr-stats'});

    root.append(
      h('header',{style:'margin-bottom:18px'},
        h('p',{class:'kicker'},'codzienne 5 minut'),
        h('h1',null,'Trening ', h('em',null,'słuchu')),
        h('p',{class:'lead'},'Krótka runda mieszanych zadań: akordy i interwały ze słuchu, stopnie, role, przewroty i chwyty na klawiaturze. Appka pamięta, co Ci nie wyszło, i wraca do tego częściej — aż wejdzie w palce.')),
      pasekDnia,
      scena,
      h('section',null,
        h('div',{class:'sechead'}, h('h2',null,'Co ćwiczymy'), h('span',{class:'hint'},'wyłącz to, co dziś Cię nie interesuje')),
        kinds, keyRow),
      statsBox,
      h('div',{class:'box tip',style:'margin-top:26px'},
        h('p',null,'Klawiatura: ',h('b',null,'1–4'),' wybiera odpowiedź, ',h('b',null,'spacja'),' powtarza dźwięk, ',h('b',null,'Enter'),' przechodzi dalej. Najlepiej ćwiczyć przy pianinie — zagraj sobie to, co słyszysz.')));

    /* ---------- pasek: seria dni + dzisiejszy cel ---------- */
    function drawTop(){
      const pool = drillPool(opts.kinds, opts);
      const p = srsProgress(state, pool);
      const dzis = state.day.date === dayKey() ? state.day : {answered:0, ok:0};
      const pct = Math.min(100, Math.round(dzis.answered*100/SRS_CEL));
      pasekDnia.innerHTML='';
      pasekDnia.append(
        kafel('🔥', state.streak.days || 0, state.streak.days===1?'dzień z rzędu':'dni z rzędu',
          state.streak.best ? 'rekord: '+state.streak.best : ''),
        kafel('🎯', dzis.answered+'/'+SRS_CEL, 'dziś',
          dzis.answered ? Math.round(dzis.ok*100/dzis.answered)+'% trafień' : 'zacznij rundę'),
        kafel('🌱', p.pct+'%', 'opanowane', `${p.known} z ${p.total} rzeczy`),
        h('div',{class:'tr-bar','aria-hidden':'true'}, h('i',{style:`width:${pct}%`})));
    }
    function kafel(ikona, duze, podpis, male){
      return h('div',{class:'tr-kafel'},
        h('span',{class:'ic'},ikona),
        h('div',null, h('b',null,String(duze)), h('span',{class:'lbl'},podpis),
          male ? h('span',{class:'sub'},male) : null));
    }

    /* ---------- wybór rodzajów ćwiczeń i tonacji ---------- */
    function drawKinds(){
      kinds.innerHTML='';
      DRILL_KINDS.forEach(k=>{
        const on = opts.kinds.includes(k.id);
        const b = h('button',{type:'button',class:'tr-kind','aria-pressed':String(on),title:k.opis},
          h('b',null,k.name), h('span',null,k.opis));
        b.onclick=()=>{
          const i = opts.kinds.indexOf(k.id);
          if(i<0) opts.kinds.push(k.id);
          else if(opts.kinds.length>1) opts.kinds.splice(i,1);
          else return;
          saveOpts(); drawKinds(); drawTop(); drawStats();
        };
        kinds.append(b);
      });
      keyRow.innerHTML='';
      keyRow.append(h('span',{class:'muted'},'Tonacja zadań:'),
        seg(['los',...DRILL_KEYS], opts.key, v=>{ opts.key=v; saveOpts(); },
          v=> v==='los' ? 'losowa' : fmt(v)));
    }
    function seg(values, current, onPick, label=String){
      const box = h('div',{class:'seg'});
      values.forEach(v=>{
        const b = h('button',{type:'button','aria-pressed':String(v===current)}, label(v));
        b.onclick=()=>{ box.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed','false'));
          b.setAttribute('aria-pressed','true'); onPick(v); };
        box.append(b);
      });
      return box;
    }

    /* ---------- dźwięk zadania ---------- */
    function playSound(s){
      if(!s) return;
      audio();
      if(s.chords){
        const items = s.chords.map(t=>parseChord(t)).filter(Boolean).map(c=>({pcs:c.pcs, bassPc:c.bassPc}));
        playChordSeq(items, s.step || 0.95);
      }else if(s.notes){
        playSeq(s.notes, s.step || 0.6, s.dur || 0.9);
      }else if(s.stack){
        s.stack.forEach(m=>playMidi(m, 1.5, 0));
      }
    }

    /* ---------- runda ---------- */
    function startSesja(){
      sesja = {n:0, ile:opts.dlugosc, ok:0, start:Date.now(), bledy:[]};
      nextTask();
    }
    function nextTask(){
      stopSeq();
      answered = false; picked = []; hintShown = false;
      const pool = drillPool(opts.kinds, opts);
      const id = srsPick(state, pool, Date.now(), Math.random, task && task.id);
      task = id ? makeTask(id, Math.random, opts) : null;
      sesja.n += 1;
      drawScena();
      if(task && task.sound) setTimeout(()=>{ if(task) playSound(task.sound); }, 220);
    }
    function odpowiedz(given, btn){
      if(answered || !task) return;
      const ok = checkAnswer(task, given);
      answered = true;
      srsAnswer(state, task.id, ok, Date.now());
      saveState();
      if(ok) sesja.ok += 1; else sesja.bledy.push(task.id);
      drawTop(); drawStats();
      drawFeedback(ok, btn);
    }

    /* ---------- rysowanie sceny ---------- */
    function drawScena(){
      scena.innerHTML='';
      if(!sesja){ drawStart(); return; }
      if(sesja.n > sesja.ile){ drawKoniec(); return; }
      if(!task){ scena.append(h('p',{class:'hint'},'Włącz choć jeden rodzaj ćwiczeń.')); return; }

      scena.classList.add('trainer');
      scena.append(h('div',{class:'tr-pasek'},
        h('span',{class:'mono'},`${sesja.n} / ${sesja.ile}`),
        h('span',{class:'tr-dots'}, ...Array.from({length:sesja.ile},(_,i)=>
          h('i',{class: i<sesja.n-1 ? 'done' : i===sesja.n-1 ? 'now' : ''}))),
        h('span',{class:'mono'},`✓ ${sesja.ok}`),
        h('button',{class:'btn small ghost',onclick:()=>{ sesja=null; task=null; stopSeq(); drawScena(); }},'przerwij')));

      scena.append(h('p',{class:'tr-kind-tag'}, DRILL_BY_ID[task.kind].name));
      scena.append(h('h2',{class:'tr-prompt',html:task.prompt}));

      const podp = h('p',{class:'tr-hint',hidden:!hintShown}, task.hint || '');
      scena.append(h('div',{class:'row',style:'gap:8px'},
        task.sound ? h('button',{class:'btn primary',onclick:()=>playSound(task.sound)},'🔊 posłuchaj') : null,
        task.hint && !hintShown ? h('button',{class:'btn ghost small',onclick:e=>{ hintShown=true; podp.hidden=false; e.target.remove(); }},'💡 podpowiedź') : null,
        task.sound ? h('span',{class:'hint'},'spacja powtarza') : null), podp);

      if(task.keys && task.keys.show){
        const marks={}; task.keys.show.forEach(m=>marks[m]='t');
        scena.append(h('div',{class:'kbd-panel'},
          kbdSVG({from:task.keys.from, to:task.keys.to, marks, labels:false,
            aria:'Akord na klawiaturze', onKey:(m,r)=>{ playMidi(m); flashKey(r.ownerSVGElement,m); }})));
      }

      if(task.type==='klawisze') drawKlawisze();
      else{
        const box = h('div',{class:'answers tr-answers'});
        task.options.forEach((o,i)=>{
          const b = h('button',{type:'button','data-i':i}, o);
          b.onclick=()=>odpowiedz(i, b);
          box.append(b);
        });
        scena.append(box);
      }
      scena.append(h('div',{class:'tr-fb'}));
    }

    function drawKlawisze(){
      const marks = {};
      picked.forEach(m=>marks[m]='t');
      const panel = h('div',{class:'kbd-panel'});
      const svg = kbdSVG({from:task.keys.from, to:task.keys.to, marks, labels:'all',
        aria:'Klawiatura — ułóż akord',
        onKey:(m)=>{
          if(answered) return;
          const i = picked.indexOf(m);
          if(i<0){ picked.push(m); playMidi(m); } else picked.splice(i,1);
          drawScena();
        }});
      svg.classList.add('wide');
      panel.append(svg);
      scena.append(panel, midiInfo,
        h('div',{class:'row',style:'gap:8px;margin-top:10px'},
          h('button',{class:'btn primary',onclick:()=>odpowiedz(picked.slice())},'sprawdzam'),
          h('button',{class:'btn ghost small',onclick:()=>{ picked=[]; drawScena(); }},'wyczyść'),
          h('span',{class:'hint'}, picked.length ? picked.length+' klawiszy' : 'kliknij klawisze')));
    }

    function drawFeedback(ok, btn){
      const fb = scena.querySelector('.tr-fb');
      if(btn){
        btn.classList.add(ok?'good':'wrong');
        if(!ok){ const good = scena.querySelector(`.tr-answers button[data-i="${task.answer}"]`); if(good) good.classList.add('good'); }
      }
      scena.querySelectorAll('.tr-answers button').forEach(b=>b.disabled=true);
      if(task.type==='klawisze'){
        // pokaż właściwy chwyt na klawiaturze
        const svg = scena.querySelector('svg.kbd');
        if(svg) task.keys.pcs.forEach(pc=>{
          for(let m=task.keys.from; m<=task.keys.to; m++) if(m%12===pc){ const r=svg.querySelector(`rect[data-midi="${m}"]`); if(r) r.classList.add('hold'); }
        });
      }
      if(task.answerSound) playSound(task.answerSound);
      fb.innerHTML='';
      fb.className = 'tr-fb ' + (ok?'good':'bad');
      fb.append(
        h('p',{class:'tr-verdict'}, ok ? '✓ Dobrze' : '✗ To było: '+task.reveal),
        h('p',{class:'tr-why'}, task.why),
        h('div',{class:'row',style:'gap:8px;margin-top:10px'},
          h('button',{class:'btn primary',onclick:nextTask}, sesja.n>=sesja.ile ? 'podsumowanie →' : 'dalej →'),
          task.sound ? h('button',{class:'btn ghost small',onclick:()=>playSound(task.sound)},'🔊 jeszcze raz') : null));
      const nx = fb.querySelector('button'); if(nx) nx.focus();
    }

    function drawStart(){
      scena.classList.remove('trainer');
      const pool = drillPool(opts.kinds, opts);
      const p = srsProgress(state, pool);
      const slabe = srsWeakest(state, 3);
      const czeka = p.due + p.fresh;        // nowe rzeczy też czekają na pierwsze spotkanie
      scena.append(h('div',null,
        h('h2',{style:'margin-top:0'}, p.fresh===p.total ? 'Zaczynamy?' : 'Wracamy do ćwiczeń'),
        h('p',{class:'muted'}, czeka
          ? `${czeka} ${czeka===1?'rzecz czeka':'rzeczy czeka'} na powtórkę. Runda to ${opts.dlugosc} pytań, jakieś 3–5 minut.`
          : `Wszystko na dziś powtórzone — ale możesz ćwiczyć dalej. Runda to ${opts.dlugosc} pytań.`),
        slabe.length ? h('p',{class:'hint'},'Ostatnio kulało: '+slabe.map(s=>drillLabel(s.id)).join(' · ')) : null,
        h('div',{class:'row',style:'gap:10px;margin-top:12px'},
          h('button',{class:'btn primary big',onclick:startSesja},'▶ Zaczynam rundę'),
          seg([8,12,20], opts.dlugosc, v=>{ opts.dlugosc=v; saveOpts(); }, v=>v+' pytań'))));
    }

    function drawKoniec(){
      scena.classList.remove('trainer');
      const ile = sesja.ile, dobre = sesja.ok;
      const pct = Math.round(dobre*100/ile);
      const sek = Math.round((Date.now()-sesja.start)/1000);
      const bledy = [...new Set(sesja.bledy)];
      const slowo = pct===100 ? 'Komplet!' : pct>=80 ? 'Bardzo dobrze' : pct>=55 ? 'Jest postęp' : 'Jeszcze pokrążymy';
      scena.append(
        h('h2',{style:'margin-top:0'}, slowo),
        h('p',{class:'lead'},`${dobre} z ${ile} (${pct}%) w ${Math.floor(sek/60)} min ${sek%60} s.`),
        bledy.length
          ? h('div',null, h('p',{class:'muted',style:'margin-bottom:6px'},'Do powtórki wrócą:'),
              h('ul',{class:'tr-lista'}, ...bledy.map(id=>h('li',null, drillLabel(id)))))
          : h('p',{class:'muted'},'Bez pomyłki — te zadania wrócą dopiero za kilka dni.'),
        h('div',{class:'row',style:'gap:10px;margin-top:14px'},
          h('button',{class:'btn primary',onclick:startSesja},'▶ Jeszcze runda'),
          h('a',{class:'btn ghost',href:'#petla'},'Pograj pętlę →')));
    }

    /* ---------- statystyki ---------- */
    function drawStats(){
      statsBox.innerHTML='';
      const pool = drillPool(opts.kinds, opts);
      const t = state.totals;
      statsBox.append(h('div',{class:'sechead'}, h('h2',null,'Jak Ci idzie'),
        h('span',{class:'hint'}, t.asked ? `${t.asked} odpowiedzi, ${Math.round(t.ok*100/Math.max(1,t.asked))}% trafień` : 'jeszcze nic')));
      const rows = h('div',{class:'tr-rows'});
      DRILL_KINDS.filter(k=>opts.kinds.includes(k.id)).forEach(k=>{
        const ids = k.items(opts);
        const p = srsProgress(state, ids);
        let ok=0, bad=0;
        ids.forEach(id=>{ const it=state.items[id]; if(it){ ok+=it.ok; bad+=it.bad; } });
        const trafnosc = ok+bad ? Math.round(ok*100/(ok+bad)) : null;
        rows.append(h('div',{class:'tr-row'},
          h('span',{class:'nm'},k.name),
          h('span',{class:'ba'}, h('i',{style:`width:${p.pct}%`})),
          h('span',{class:'mono num'}, `${p.known}/${p.total}`),
          h('span',{class:'mono num muted'}, trafnosc===null ? '—' : trafnosc+'%')));
      });
      statsBox.append(rows);
      const slabe = srsWeakest(state, 6);
      if(slabe.length) statsBox.append(h('p',{class:'hint',style:'margin-top:10px'},
        'Nad tym popracuj: '+slabe.map(s=>`${drillLabel(s.id)} (${s.ok}/${s.ok+s.bad})`).join(' · ')));
      statsBox.append(h('div',{class:'row',style:'margin-top:12px;gap:8px'},
        h('button',{class:'btn small ghost danger',onclick:()=>{
          if(!confirm('Skasować całą historię treningu (serię dni też)?')) return;
          state = srsNew(); saveState(); drawTop(); drawStats(); if(!sesja) drawScena();
        }},'wyczyść postępy'),
        h('span',{class:'hint'}, `${srsProgress(state, pool).total} rzeczy w puli`)));
    }

    /* ---------- pianino przez MIDI ----------
       Jeśli jest podłączone (zakładka „Klawisze"), zagrany akord sam odpowiada
       na ćwiczenie „zagraj akord" — nie trzeba klikać myszką. */
    const midiInfo = h('p',{class:'hint',hidden:true});
    const odepnijMidi = midiSubscribe((msg, held)=>{
      if(!root.isConnected){ odepnijMidi(); return; }
      if(!task || task.type !== 'klawisze' || answered) return;
      picked = held.notes();
      drawScena();
      if(picked.length >= task.keys.pcs.length && checkAnswer(task, picked)) odpowiedz(picked.slice());
    }, st=>{
      midiInfo.hidden = !(st && st.ok && st.devices.length);
      if(!midiInfo.hidden) midiInfo.textContent = 'Pianino podłączone (' + st.devices.join(', ') + ') — akordy możesz po prostu zagrać.';
    });

    /* ---------- skróty klawiszowe ---------- */
    const onKey = e=>{
      if(!root.isConnected){ document.removeEventListener('keydown', onKey); odepnijMidi(); return; }
      if(e.target.matches('input,textarea,select')) return;
      if(e.key===' ' && task && task.sound){ e.preventDefault(); playSound(task.sound); return; }
      if(!sesja) return;
      if(e.key==='Enter' && answered){ e.preventDefault(); nextTask(); return; }
      if(!answered && task && task.type==='wybor' && /^[1-9]$/.test(e.key)){
        const i = +e.key-1;
        const b = scena.querySelector(`.tr-answers button[data-i="${i}"]`);
        if(b){ e.preventDefault(); b.click(); }
      }
    };
    document.addEventListener('keydown', onKey);

    drawTop(); drawKinds(); drawStats(); drawScena();
  }
};
