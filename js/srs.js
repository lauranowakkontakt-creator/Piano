/* ============================================================
   Powtórki z odstępami (Leitner) — pamięć treningu, bez rysowania.
   Każda „rzecz do opanowania" (np. „moll ze słuchu", „stopień V")
   siedzi w pudełku 0–5. Dobra odpowiedź przesuwa ją o pudełko wyżej
   i odkłada na później, zła — wraca do pudełka 0 i wraca szybko.
   Stan to zwykły obiekt JSON, więc wchodzi prosto do localStorage.
   Testowane w test/unit/srs.test.js.
   ============================================================ */

const DZIEN = 24*60*60*1000;
// po ilu milisekundach rzecz z danego pudełka wraca do pytania
const SRS_ODSTEPY = [0, 2*60*1000, 20*60*1000, DZIEN, 3*DZIEN, 7*DZIEN];
const SRS_MAX_BOX = SRS_ODSTEPY.length - 1;
const SRS_CEL = 20;            // ile odpowiedzi dziennie = dzień zaliczony
const SRS_SESJA = 12;          // ile pytań w jednej rundzie

function srsNew(){
  return {items:{}, streak:{days:0, best:0, last:null}, day:{date:null, answered:0, ok:0}, totals:{asked:0, ok:0}};
}
/* Stan z localStorage bywa stary albo uszkodzony — bierzemy tylko to, co ma sens. */
function srsSanitize(raw){
  const s = srsNew();
  if(!raw || typeof raw!=='object' || Array.isArray(raw)) return s;
  const num = (v, d=0) => Number.isFinite(v) && v>=0 ? v : d;
  const it = raw.items;
  if(it && typeof it==='object' && !Array.isArray(it)){
    for(const [id, v] of Object.entries(it)){
      if(!v || typeof v!=='object') continue;
      s.items[id] = {
        box: Math.min(SRS_MAX_BOX, Math.max(0, Math.round(num(v.box)))),
        due: num(v.due),
        ok: Math.round(num(v.ok)),
        bad: Math.round(num(v.bad)),
        seen: num(v.seen),
      };
    }
  }
  if(raw.streak && typeof raw.streak==='object'){
    s.streak = {days: Math.round(num(raw.streak.days)), best: Math.round(num(raw.streak.best)),
      last: typeof raw.streak.last==='string' ? raw.streak.last : null};
    s.streak.best = Math.max(s.streak.best, s.streak.days);
  }
  if(raw.day && typeof raw.day==='object'){
    s.day = {date: typeof raw.day.date==='string' ? raw.day.date : null,
      answered: Math.round(num(raw.day.answered)), ok: Math.round(num(raw.day.ok))};
  }
  if(raw.totals && typeof raw.totals==='object'){
    s.totals = {asked: Math.round(num(raw.totals.asked)), ok: Math.round(num(raw.totals.ok))};
  }
  return s;
}
function srsItem(state, id){
  return state.items[id] || (state.items[id] = {box:0, due:0, ok:0, bad:0, seen:0});
}
/* data w strefie użytkownika jako 'RRRR-MM-DD' (do serii dni) */
function dayKey(now=Date.now()){
  const d = new Date(now);
  const p = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}
function prevDayKey(key){
  const [y,m,d] = String(key).split('-').map(Number);
  if(!y || !m || !d) return null;
  return dayKey(new Date(y, m-1, d).getTime() - DZIEN + 3*60*60*1000);  // +3 h: omija zmianę czasu
}
/* Zalicz dzień: seria rośnie, gdy ćwiczysz dzień po dniu. Ten sam dzień drugi raz nic nie zmienia. */
function srsTouchDay(state, now=Date.now()){
  const today = dayKey(now);
  if(state.day.date !== today) state.day = {date:today, answered:0, ok:0};
  const st = state.streak;
  if(st.last !== today){
    st.days = st.last && prevDayKey(today)===st.last ? st.days+1 : 1;
    st.last = today;
    st.best = Math.max(st.best||0, st.days);
  }
  return state;
}
/* Zapisz odpowiedź. ok = czy dobrze. Zwraca zaktualizowany stan (ten sam obiekt). */
function srsAnswer(state, id, ok, now=Date.now()){
  srsTouchDay(state, now);
  const it = srsItem(state, id);
  it.box = ok ? Math.min(SRS_MAX_BOX, it.box+1) : 0;
  it.due = now + SRS_ODSTEPY[it.box];
  it[ok ? 'ok' : 'bad'] += 1;
  it.seen = now;
  state.day.answered += 1; if(ok) state.day.ok += 1;
  state.totals.asked += 1; if(ok) state.totals.ok += 1;
  return state;
}
function srsIsDue(state, id, now=Date.now()){
  const it = state.items[id];
  return !it || it.due <= now;
}
/* Waga przy losowaniu: nowe i zaległe rzeczy są częściej, świeżo zrobione prawie wcale.
   Pomyłki podbijają wagę, żeby słabe miejsca wracały. */
function srsWeight(state, id, now=Date.now()){
  const it = state.items[id];
  if(!it) return 6;                                   // nowe — pokaż chętnie
  const late = now - it.due;
  const base = late >= 0 ? 2 + Math.min(4, late/DZIEN) : 0.25;
  const trudne = 1 + it.bad*1.5/(1 + it.ok*0.6);
  return Math.max(0.05, base*trudne);
}
/* Wylosuj rzecz do przećwiczenia. pool = lista id, avoid = czego nie powtarzać od razu. */
function srsPick(state, pool, now=Date.now(), rng=Math.random, avoid=null){
  const list = pool.filter(id => id!==avoid);
  const use = list.length ? list : pool;
  if(!use.length) return null;
  const w = use.map(id => srsWeight(state, id, now));
  let total = w.reduce((a,b)=>a+b, 0);
  if(!(total>0)) return use[Math.floor(rng()*use.length) % use.length];
  let r = rng()*total;
  for(let i=0;i<use.length;i++){ r -= w[i]; if(r<=0) return use[i]; }
  return use[use.length-1];
}
/* Najsłabsze rzeczy (do listy „nad tym popracuj"). */
function srsWeakest(state, n=5){
  return Object.entries(state.items)
    .filter(([,it]) => it.bad>0)
    .map(([id,it]) => ({id, ...it, rate: it.ok/(it.ok+it.bad)}))
    .sort((a,b) => a.rate-b.rate || b.bad-a.bad)
    .slice(0, n);
}
/* Ile rzeczy z puli jest opanowanych (pudełko 3+). */
function srsProgress(state, pool, now=Date.now()){
  let known=0, due=0, fresh=0;
  for(const id of pool){
    const it = state.items[id];
    if(!it){ fresh++; continue; }
    if(it.box>=3) known++;
    if(it.due<=now) due++;
  }
  return {total:pool.length, known, due, fresh, pct: pool.length ? Math.round(known*100/pool.length) : 0};
}
