/* ============================================================
   Motyw kolorów. Trzy palety z systemu „Harmonia":
   kość słoniowa (domyślna, jasna), nocna scena (ciemna), szałwia (jasna, zielona).
   Ładuje się w <head>, zanim strona się narysuje — dzięki temu nic nie miga.
   Wybór siedzi w localStorage pod tym samym kluczem co inne ustawienia (prefs).
   Testowane w test/unit/motyw.test.js.
   ============================================================ */
const MOTYWY = [
  {id:'kosc',    name:'Kość słoniowa', opis:'jasny, ciepły — na dzień',    bar:'#f8f4ec'},
  {id:'noc',     name:'Nocna scena',   opis:'ciemny — wieczorem przy pianinie', bar:'#111218'},
  {id:'szalwia', name:'Szałwia',       opis:'jasny, zielony, spokojny',     bar:'#eef2ec'},
];
const MOTYW_DOMYSLNY = 'kosc';
const MOTYW_KLUCZ = 'harmonia.motyw';

/* Cokolwiek leży w pamięci (stare, zepsute, puste) → poprawne id motywu. */
function motywZ(raw){
  let id = raw;
  if(typeof raw === 'string'){ try{ id = JSON.parse(raw); }catch(e){ id = raw; } }
  return MOTYWY.some(m => m.id === id) ? id : MOTYW_DOMYSLNY;
}
function motywTeraz(){
  try{ return motywZ(localStorage.getItem(MOTYW_KLUCZ)); }catch(e){ return MOTYW_DOMYSLNY; }
}
function ustawMotyw(id, zapisz){
  id = motywZ(JSON.stringify(id));
  const m = MOTYWY.find(x => x.id === id);
  document.documentElement.setAttribute('data-theme', id);
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute('content', m.bar);
  if(zapisz){ try{ localStorage.setItem(MOTYW_KLUCZ, JSON.stringify(id)); }catch(e){} }
  return id;
}
if(typeof document !== 'undefined') ustawMotyw(motywTeraz());
