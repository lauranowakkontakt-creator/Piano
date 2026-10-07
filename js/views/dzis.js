/* ============================================================
   Zakładka „Dziś" — ekran startowy. Zamiast od razu wrzucać w teorię,
   mówi, co zrobić teraz: seria dni, trening dnia, lekcja, do której
   wracasz, ostatnia piosenka i szybkie wejścia do grania.
   ============================================================ */
const DNI_TYG = ['P','W','Ś','C','P','S','N'];

/* Bieżący tydzień (pon–niedz) z zaznaczeniem dni, które należą do serii.
   Seria liczy się, dopóki ostatni dzień ćwiczeń to dziś albo wczoraj. */
function tydzienSerii(streak, now=Date.now()){
  const dzis = dayKey(now);
  const wczoraj = prevDayKey(dzis);
  const zywa = streak && streak.last && (streak.last === dzis || streak.last === wczoraj);
  const wSerii = new Set();
  if(zywa){ let k = streak.last; for(let i=0; i<(streak.days||0) && k; i++){ wSerii.add(k); k = prevDayKey(k); } }
  const d = new Date(now), dow = (d.getDay()+6)%7;               // 0 = poniedziałek
  const pon = new Date(d.getFullYear(), d.getMonth(), d.getDate()-dow, 12);
  return DNI_TYG.map((lit, i)=>{
    const key = dayKey(new Date(pon.getFullYear(), pon.getMonth(), pon.getDate()+i, 12).getTime());
    return {lit, key, on:wSerii.has(key), dzis:key===dzis};
  });
}
/* Ile dni serii pokazać: zerwana seria (przerwa > 1 dzień) to 0. */
function seriaTeraz(streak, now=Date.now()){
  const dzis = dayKey(now);
  if(!streak || !streak.last) return 0;
  return streak.last === dzis || streak.last === prevDayKey(dzis) ? (streak.days||0) : 0;
}
/* Następna lekcja teorii: ostatnio otwarta, jeśli niezaliczona; inaczej pierwsza niezaliczona. */
function nastepnaLekcja(lessons, done, last){
  done = done || {};
  const l = lessons.find(x => x.id === last);
  if(l && !done[l.id]) return l;
  return lessons.find(x => !done[x.id]) || null;
}

const ViewDzis = {
  title:'Dziś',
  async render(root){
    const now = new Date();
    const g = now.getHours();
    const powitanie = g < 5 ? 'Dobranoc' : g < 18 ? 'Dzień dobry' : 'Dobry wieczór';
    const data = now.toLocaleDateString('pl-PL',{weekday:'long', day:'numeric', month:'long'});

    const state = srsSanitize(prefs.get(TRENING_STATE_KEY, null));
    const dni = seriaTeraz(state.streak);
    const dzisDzien = state.day.date === dayKey() ? state.day : {answered:0, ok:0};
    const pct = Math.min(100, Math.round(dzisDzien.answered*100/SRS_CEL));
    const zaliczone = dzisDzien.answered >= SRS_CEL;

    root.append(h('header',{class:'dz-head'},
      h('p',{class:'kicker'}, powitanie+' · '+data),
      h('h1',null,'Dziś 10 minut ', h('em',null,'przy pianinie'))));

    /* seria + trening dnia */
    const tydz = h('div',{class:'dz-tydz','aria-label':'Ten tydzień'},
      ...tydzienSerii(state.streak).map(d=>h('i',{class:(d.on?'on':'')+(d.dzis?' dzis':''),title:d.key}, d.lit)));
    root.append(h('section',{class:'card dz-seria'},
      h('div',{class:'dz-row'},
        h('span',{class:'dz-label'},'Seria'),
        h('span',{class:'dz-dni'}, dni ? dni+' '+(dni===1?'dzień':'dni')+' z rzędu' : 'zacznij serię dziś')),
      tydz,
      h('div',{class:'dz-cel'},
        h('div',{class:'dz-row'}, h('span',{class:'muted'},'Dzisiejszy cel'), h('b',null, dzisDzien.answered+' / '+SRS_CEL)),
        h('div',{class:'dz-bar'}, h('i',{style:'width:'+pct+'%'}))),
      h('a',{class:'btn primary dz-start',href:'#trening'}, h('span',{class:'dz-play','aria-hidden':'true'}),
        zaliczone ? 'Jeszcze jedna runda' : dzisDzien.answered ? 'Dokończ trening dnia' : 'Zacznij trening dnia'),
      h('p',{class:'hint',style:'margin:0'}, 'Krótka runda ze słuchu — appka wraca do tego, co sprawiało kłopot.')));

    /* lekcja, do której wracasz */
    if(typeof LESSONS !== 'undefined'){
      const done = prefs.get('teoria.done',{}) || {};
      const ile = LESSONS.filter(l=>done[l.id]).length;
      const l = nastepnaLekcja(LESSONS, done, prefs.get('teoria.last',null));
      root.append(h('section',null,
        h('div',{class:'sechead'}, h('h2',null, l ? 'Kontynuuj teorię' : 'Teoria zrobiona'), h('span',{class:'hint'}, ile+' z '+LESSONS.length+' lekcji')),
        l ? h('a',{class:'dz-lekcja',href:'#teoria/'+l.id},
              h('span',{class:'n'}, String(LESSONS.indexOf(l)+1)),
              h('span',{class:'tx'}, h('b',null,l.title),
                h('span',{class:'dz-bar'}, h('i',{style:'width:'+Math.round(ile*100/LESSONS.length)+'%'}))),
              h('span',{class:'dz-strz','aria-hidden':'true'},'→'))
          : h('a',{class:'dz-lekcja',href:'#teoria'}, h('span',{class:'n'},'✓'), h('span',{class:'tx'}, h('b',null,'Wszystkie lekcje zaliczone'), h('span',{class:'muted'},'Wróć do dowolnej albo ćwicz w Treningu.')))));
    }

    /* ostatnia piosenka */
    let songs = [];
    try{ songs = await DB.allSongs(); }catch(e){ songs = []; }
    if(songs.length){
      const s = songs[0];
      root.append(h('section',null,
        h('div',{class:'sechead'}, h('h2',null,'Ostatnio grane'), h('a',{class:'hint',href:'#piosenki'},'wszystkie piosenki')),
        h('a',{class:'dz-piosenka card',href:'#piosenki/'+encodeURIComponent(s.id)},
          h('span',null, h('b',null, s.title || '(bez tytułu)'),
            h('span',{class:'muted'}, [s.artist, keyNameLabel(s.key)].filter(Boolean).join(' · '))),
          h('span',{class:'dz-strz','aria-hidden':'true'},'→'))));
    }

    /* szybkie wejścia */
    const skroty = ['klawisze','petla','nuty','gamy'].map(navById).filter(Boolean);
    root.append(h('section',null,
      h('div',{class:'sechead'}, h('h2',null,'Pograj')),
      h('div',{class:'dz-skroty'}, ...skroty.map(it=>h('a',{class:'dz-skrot',href:'#'+it.id}, h('b',null,it.name), h('span',null,it.opis))))));
  }
};
