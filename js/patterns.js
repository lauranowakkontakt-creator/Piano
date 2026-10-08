/* ============================================================
   Style akompaniamentu — jak rozłożyć akord na takt.
   Z jednego chwytu („trzymaj C–E–G, bas C") robi się pompa, arpeggio,
   walc albo ballada 6/8. Sama logika: funkcja dostaje chwyt i liczbę
   uderzeń, a oddaje listę zdarzeń {midis, at, dur} liczonych w uderzeniach.
   Dźwięk odpala dopiero playChordSeq w js/ui.js.
   Testy: test/unit/patterns.test.js.
   ============================================================ */

/* Pomocnicze: dźwięki prawej ręki od dołu, oraz „n-ty z kolei" z zawijaniem w górę o oktawę. */
function stopien(right, i){
  const n = right.length;
  if(!n) return null;
  return right[i % n] + 12*Math.floor(i / n);
}
const ev = (midis, at, dur, vel=0.6) => ({midis: midis.filter(m=>m!=null), at, dur, vel});

const PLAY_STYLES = [
{
  id:'blok', name:'Akordy na raz', krotko:'cały akord jednym ruchem',
  opis:'Obie ręce uderzają razem na „raz" i trzymają do następnego akordu. Tak najłatwiej zacząć.',
  reka:'Lewa: bas. Prawa: cały chwyt.',
  make({right, bass, beats}){
    return [ev([bass], 0, beats, .68), ev(right, 0, beats, .6)];
  }
},
{
  id:'pompa', name:'Bas – akord (pompa)', krotko:'lewa bas, prawa odpowiada',
  opis:'Lewa ręka gra bas na „raz", prawa dokłada akord na pozostałe uderzenia. Najczęstszy sposób grania piosenek przy ognisku i w kościele.',
  reka:'Lewa: bas na raz (i na trzy, jeśli takt ma cztery). Prawa: akord na pozostałych uderzeniach.',
  make({right, bass, beats}){
    const out = [];
    for(let b = 0; b < beats; b++){
      // bas na nieparzystych uderzeniach (podstawa, potem kwinta), akord na pozostałych
      if(b % 2 === 0) out.push(ev([b % 4 === 0 ? bass : bass + 7], b, 1.1, .7));
      else out.push(ev(right, b, .85, .52));
    }
    if(beats === 1) out.push(ev(right, 0, .9, .55));      // przy jednym uderzeniu gramy razem
    return out;
  }
},
{
  id:'walc', name:'Walc (raz-dwa-trzy)', krotko:'bas, akord, akord',
  opis:'Bas na „raz", akord na „dwa" i „trzy". Ustaw 3 uderzenia na akord, a wyjdzie walc albo kolęda w metrum trójdzielnym.',
  reka:'Lewa: sam bas na raz. Prawa: lekki akord na dwa i trzy.',
  lubiBeats:3,
  make({right, bass, beats}){
    const out = [ev([bass], 0, 1.3, .7)];
    for(let b = 1; b < Math.max(2, beats); b++) out.push(ev(right, b, .8, .45));
    return out;
  }
},
{
  id:'arpeggio', name:'Arpeggio w górę', krotko:'dźwięk po dźwięku, pod pedałem',
  opis:'Prawa ręka rozkłada akord dźwięk po dźwięku w górę, lewa trzyma bas. Brzmi jak intro do ballady — graj z pedałem.',
  reka:'Lewa: bas trzymany przez cały takt. Prawa: po jednym dźwięku na uderzenie, od najniższego.',
  make({right, bass, beats}){
    const out = [ev([bass], 0, beats, .62)];
    for(let i = 0; i < beats; i++) out.push(ev([stopien(right, i)], i, 1.2, .52));
    return out;
  }
},
{
  id:'tamiz', name:'Tam i z powrotem', krotko:'arpeggio w górę i w dół',
  opis:'Jak arpeggio, ale po dojściu na górę wraca w dół. Daje falujący ruch — dobre pod spokojny śpiew.',
  reka:'Lewa: bas. Prawa: w górę i z powrotem po dźwiękach akordu.',
  make({right, bass, beats}){
    const out = [ev([bass], 0, beats, .62)];
    const n = right.length;
    const droga = [];
    for(let i = 0; i < n; i++) droga.push(right[i]);
    for(let i = n - 2; i > 0; i--) droga.push(right[i]);
    for(let i = 0; i < beats; i++) out.push(ev([droga[i % droga.length]], i, 1.1, .5));
    return out;
  }
},
{
  id:'alberti', name:'Bas Albertiego', krotko:'najniższy–najwyższy–środkowy–najwyższy',
  opis:'Stary klasyczny wzór: dolny, górny, środkowy, górny. Mozart grał tak lewą ręką przez pół życia.',
  reka:'Lewa: bas na raz. Prawa (albo lewa, jeśli ćwiczysz klasykę): 1–5–3–5 w kółko.',
  lubiBeats:4,
  make({right, bass, beats}){
    const out = [ev([bass], 0, beats, .6)];
    const [a, b, c] = [stopien(right, 0), stopien(right, 1), stopien(right, 2)];
    const wzor = [a, c ?? b, b, c ?? b];
    for(let i = 0; i < beats; i++) out.push(ev([wzor[i % 4]], i, .9, .5));
    return out;
  }
},
{
  id:'ballada', name:'Ballada 6/8', krotko:'trójki, dwa razy na takt',
  opis:'Każde uderzenie dzieli się na trzy — kołyszący rytm większości wolnych pieśni. Ustaw 2 albo 6 uderzeń na akord.',
  reka:'Lewa: bas na początku każdej połowy taktu. Prawa: trójki po dźwiękach akordu.',
  lubiBeats:2,
  make({right, bass, beats}){
    const out = [];
    const polowa = beats / 2;
    out.push(ev([bass], 0, polowa, .66), ev([bass], polowa, polowa, .55));
    const krok = beats / 6;                       // sześć trójkowych nut na takt
    for(let i = 0; i < 6; i++) out.push(ev([stopien(right, i)], i * krok, krok * 1.6, .46));
    return out;
  }
},
{
  id:'synkopa', name:'Pop z synkopą', krotko:'akord wchodzi „po" uderzeniu',
  opis:'Bas na „raz", a akordy między uderzeniami („i raz, i dwa"). Od razu robi się nowocześnie i rytmicznie.',
  reka:'Lewa: bas na raz. Prawa: krótkie akordy w połowie każdego uderzenia.',
  lubiBeats:4,
  make({right, bass, beats}){
    const out = [ev([bass], 0, 1.5, .7)];
    for(let b = 0; b < beats; b++) out.push(ev(right, b + .5, .45, .48));
    return out;
  }
},
{
  id:'oktawy', name:'Mocne oktawy', krotko:'na refren, głośno',
  opis:'Lewa ręka gra bas w oktawach, prawa uderza pełny akord na każde uderzenie. Do refrenu, kiedy ma być mocno.',
  reka:'Lewa: bas + ten sam dźwięk oktawę wyżej. Prawa: akord na każde uderzenie.',
  make({right, bass, beats}){
    const out = [];
    for(let b = 0; b < beats; b++){
      out.push(ev([bass, bass + 12], b, .9, .66));
      out.push(ev(right, b, .9, .58));
    }
    return out;
  }
},
];
const PLAY_STYLE_BY_ID = Object.fromEntries(PLAY_STYLES.map(s => [s.id, s]));

/* Zbuduj zdarzenia dla jednego akordu.
   right — dźwięki prawej ręki (z płynnego prowadzenia głosów), bass — dźwięk lewej,
   beats — ile uderzeń trwa akord. Zwraca zdarzenia posortowane w czasie,
   zawsze w obrębie taktu (at od 0 do beats). */
function stylePattern(styleId, {right, bass, beats = 4}){
  const style = PLAY_STYLE_BY_ID[styleId] || PLAY_STYLE_BY_ID.blok;
  const r = (right || []).filter(m => Number.isFinite(m)).sort((a, b) => a - b);
  const b = Number.isFinite(bass) ? bass : (r[0] != null ? r[0] - 12 : 48);
  const n = Math.max(1, Math.round(beats) || 1);
  if(!r.length) return [ev([b], 0, n, .6)];
  return style.make({right: r, bass: b, beats: n})
    .filter(e => e.midis.length && e.at >= 0 && e.at < n)
    .sort((x, y) => x.at - y.at);
}
