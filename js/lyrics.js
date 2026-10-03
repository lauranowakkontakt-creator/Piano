/* ============================================================
   Tekst piosenki z akordami w nawiasach kwadratowych:

     [Zwrotka]
     [C]Wlazł kotek na [G7]płotek i mruga

   Akord stoi tam, gdzie ma być zagrany — appka rysuje go nad sylabą.
   „[Zwrotka]" samo w linii to etykieta części, bo to nie jest akord.
   Sam parser, bez rysowania. Testy: test/unit/lyrics.test.js.
   ============================================================ */

/* Tekst → linie. Każda linia to:
   {label} — nagłówek części (Zwrotka, Refren…), albo
   {parts:[{chord, text}]} — kawałki tekstu, każdy z akordem nad nim (albo bez).
   Puste linie zostają jako {empty:true}, bo rozdzielają zwrotki. */
function parseLyrics(text){
  return String(text || '').split('\n').map(raw => {
    const linia = raw.replace(/\s+$/, '');
    if(!linia.trim()) return {empty:true};

    // etykieta części: cała linia to [coś], co nie jest akordem
    const sama = linia.trim().match(/^\[([^\]]+)\]$/);
    if(sama && !parseChord(sama[1])) return {label: sama[1]};

    const parts = [];
    const re = /\[([^\]]*)\]/g;
    let ostatni = 0, m;
    while((m = re.exec(linia))){
      const przed = linia.slice(ostatni, m.index);
      const akord = parseChord(m[1]);
      if(!akord){
        // nierozpoznane [coś] w środku linii zostaje zwykłym tekstem
        dopisz(parts, przed + m[0]);
        ostatni = m.index + m[0].length;
        continue;
      }
      if(przed) dopisz(parts, przed);
      parts.push({chord: akord, text: ''});
      ostatni = m.index + m[0].length;
    }
    dopisz(parts, linia.slice(ostatni));
    return {parts: parts.length ? parts : [{chord:null, text: linia}]};
  });
}
// dokleja tekst do ostatniego kawałka albo zaczyna nowy bez akordu
function dopisz(parts, txt){
  if(!txt) return;
  if(parts.length) parts[parts.length - 1].text += txt;
  else parts.push({chord: null, text: txt});
}

/* Wszystkie akordy tekstu po kolei — do grania i do analizy tonacji. */
function lyricsChords(text){
  return parseLyrics(text).flatMap(l => (l.parts || []).map(p => p.chord).filter(Boolean));
}
/* Czy w tekście w ogóle są akordy (jeśli nie, pokazujemy sam tekst). */
function lyricsHasChords(text){ return lyricsChords(text).length > 0; }
/* Sam tekst, bez akordów — do druku „tylko słowa" i do liczenia zwrotek. */
function lyricsPlain(text){
  return parseLyrics(text).map(l =>
    l.empty ? '' : l.label ? '[' + l.label + ']' : (l.parts || []).map(p => p.text).join('')
  ).join('\n');
}
/* Przepisz tekst o n półtonów — zmienia tylko akordy w nawiasach, słowa zostają. */
function transposeLyrics(text, n){
  return String(text || '').replace(/\[([^\]]*)\]/g, (cale, w) =>
    parseChord(w) ? '[' + transposeChord(w, n) + ']' : cale);
}
