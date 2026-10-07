/* ============================================================
   Setlista — piosenki w wybranej kolejności, każda w swojej tonacji
   (albo przeniesiona), a między nimi przejście akordami.
   Sama logika, bez rysowania. Korzysta z theory.js, loop.js (transposeChord),
   lyrics.js i z mostów z zakładki Przejścia (bridgeSmooth, bridgeFast).
   Testy: test/unit/setlista.test.js.
   ============================================================ */

const SETLISTY_KLUCZ = 'setlisty';

/* ---------- tonacje ---------- */
const tonicPcOf = key => PC[String(key||'').replace(/m$/,'')];

/* Tonacja przesunięta o n półtonów, z tej samej listy co w Piosenkach (dur zostaje dur, moll — moll). */
function transposeKey(key, n){
  if(!n) return key;
  const pc = tonicPcOf(key);
  if(pc === undefined) return key;
  const cel = ((pc + n) % 12 + 12) % 12;
  const moll = isMinorKeyName(key);
  const hit = SONG_KEYS.find(k => isMinorKeyName(k.v) === moll && tonicPcOf(k.v) === cel);
  return hit ? hit.v : key;
}
/* O ile półtonów przesunąć piosenkę, żeby zagrać ją w tonacji „do" (najkrótsza droga: −5…+6). */
function shiftBetween(fromKey, toKey){
  const a = tonicPcOf(fromKey), b = tonicPcOf(toKey);
  if(a === undefined || b === undefined) return 0;
  let d = ((b - a) % 12 + 12) % 12;
  if(d > 6) d -= 12;
  return d;
}
/* Przesunięcie, które stawia piosenkę na tych samych akordach co tonacja „obok"
   (dur po dur → ta sama tonacja; moll po dur → równoległa molowa, np. C → a-moll). */
function shiftToMatch(songKey, neighbourKey){
  return shiftBetween(majorOfKey(songKey), majorOfKey(neighbourKey));
}

/* ---------- akordy piosenki ---------- */
/* Akordy piosenki po kolei: z tekstu, a jeśli w tekście ich nie ma — z pola akordów. */
function songChordTexts(song){
  if(!song) return [];
  const zTekstu = lyricsChords(song.lyrics).map(c => c.text);
  if(zTekstu.length) return zTekstu;
  return parseSongText(song.chords).flatMap(l => l.tokens.filter(t => t.chord).map(t => t.chord.text));
}
function songChordsIn(song, shift){ return songChordTexts(song).map(t => transposeChord(t, shift || 0)); }

/* ---------- przejście między piosenkami ----------
   fromKey/toKey — tonacje, w których naprawdę grasz; last/first — ostatni akord
   poprzedniej i pierwszy następnej (już przeniesione). Zwraca warianty do wyboru. */
function setlistTransition(fromKey, toKey, last, first){
  const cel = first || toKey;                       // bez akordów: tonika nowej tonacji
  const bez = arr => {                              // bez powtórzeń i bez ostatniego/pierwszego akordu
    const out = dedupe(arr.filter(Boolean));
    while(out.length && last && sameChord(out[0], last)) out.shift();
    while(out.length && sameChord(out[out.length-1], cel)) out.pop();
    return out;
  };
  // te same akordy (ta sama gama albo równoległa moll/dur, np. C → a-moll) — przejście niepotrzebne
  const ta = majorOfKey(fromKey) === majorOfKey(toKey);
  const V = dominantOf(toKey), ii = chordsFor(majorOfKey(toKey))[1].name;
  const opcje = [];
  if(ta){
    opcje.push({id:'od-razu', name:'Od razu', opis:'Te same akordy — grasz następną bez przejścia.', chords:[]});
    opcje.push({id:'dominanta', name:'Przez dominantę', opis:'Jeden akord napięcia, który ciągnie do początku następnej.', chords:bez([V])});
  }else{
    const wspolny = pivotChord(fromKey, toKey);
    if(wspolny) opcje.push({id:'gladko', name:'Gładko', opis:`${fmt(wspolny)} pasuje do obu tonacji — po nim dominanta nowej.`,
      chords:bez([wspolny, V + '7'])});
    opcje.push({id:'ii-v', name:'ii – V', opis:'Klasyczne wejście do nowej tonacji: akord ruchu i dominanta z septymą.',
      chords:bez([ii, V + '7'])});
    const krok = bez(bridgeSmooth(fromKey, toKey, cel));
    if(fifthsDist(fromKey, toKey) >= 2 && krok.length <= 6)
      opcje.push({id:'po-kole', name:'Po kole kwintowym', opis:'Przez tonację pośrednią — dłużej, ale bardzo płynnie.', chords:krok});
    opcje.push({id:'szybko', name:'Szybko', opis:'Sama dominanta nowej tonacji — krótko i wyraźnie.',
      chords:bez(bridgeFast(fromKey, toKey, cel))});
  }
  // takie same warianty pokazujemy raz
  const widziane = new Set();
  return {ta, opcje: opcje.filter(o => {
    const k = o.chords.join(' ');
    if(o.chords.length && widziane.has(k)) return false;
    widziane.add(k); return true;
  })};
}
/* Wariant zapisany w setliście albo pierwszy z listy. */
function wybraneOpcja(przejscie, id){
  return przejscie.opcje.find(o => o.id === id) || przejscie.opcje[0];
}

/* ---------- zapis ---------- */
function setlistaNowa(name){
  return {id:'sl-' + Date.now().toString(36) + Math.random().toString(36).slice(2,6), name: name || 'Nowa setlista', items:[]};
}
/* Co leży w localStorage, bywa stare albo zepsute — bierzemy tylko to, co ma sens. */
function sanitizeSetlisty(raw){
  if(!Array.isArray(raw)) return [];
  const str = (v, max) => typeof v === 'string' ? v.slice(0, max) : '';
  return raw.filter(s => s && typeof s === 'object' && typeof s.id === 'string' && s.id).map(s => ({
    id: str(s.id, 60),
    name: str(s.name, 120) || 'Setlista',
    items: (Array.isArray(s.items) ? s.items : [])
      .filter(it => it && typeof it.songId === 'string' && it.songId)
      .slice(0, 100)
      .map(it => ({
        songId: str(it.songId, 80),
        shift: Number.isInteger(it.shift) && Math.abs(it.shift) <= 11 ? it.shift : 0,
        przejscie: str(it.przejscie, 20),
      })),
  }));
}
/* Przesuń element listy (do zmiany kolejności). */
function przesun(arr, i, o){
  const j = i + o;
  if(i < 0 || j < 0 || i >= arr.length || j >= arr.length) return arr;
  const out = arr.slice(); [out[i], out[j]] = [out[j], out[i]];
  return out;
}
