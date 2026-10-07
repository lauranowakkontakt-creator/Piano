/* Router: #zakladka/podstrona */
const ROUTES = {
  dzis: ViewDzis,
  teoria: ViewTeoria,
  gamy: ViewGamy,
  nuty: ViewNuty,
  trening: ViewTrening,
  klawisze: ViewKlawisze,
  piosenki: ViewPiosenki,
  setlista: ViewSetlista,
  wizualizacja: ViewWizualizacja,
  petla: ViewPetla,
  przejscia: ViewPrzejscia,
  glos: ViewGlos,
  druk: ViewDruk,
  zrodla: ViewZrodla,
};
async function route(){
  stopSeq(); if(typeof Ladder!=='undefined') Ladder.stop();
  const [name, ...rest] = (location.hash.replace(/^#/,'') || 'dzis').split('/');
  const view = ROUTES[name] || ViewDzis;
  const sub = rest.join('/') || null;
  const akt = ROUTES[name] ? name : 'dzis';
  document.querySelectorAll('.tabs a').forEach(a=>a.setAttribute('aria-current', a.getAttribute('href')==='#'+akt ? 'page' : 'false'));
  // zakładka, której nie ma w pasku (Druk, Źródła) — świeci się przycisk ☰
  document.querySelectorAll('.navbtn').forEach(b=>b.toggleAttribute('data-akt', !document.querySelector('.tabs a[href="#'+akt+'"]')));
  document.title = view.title + ' · Harmonia';
  const root = document.getElementById('view');
  root.innerHTML='';
  const sameTab = route.last === name;
  route.last = name;
  try{ await view.render(root, sub); }
  catch(e){ console.error(e); root.append(h('div',{class:'card'},'Coś poszło nie tak przy wyświetlaniu tej zakładki: '+e.message)); }
  if(!sameTab || !sub) window.scrollTo(0,0);
  else { const a=root.querySelector('article'); if(a && a.getBoundingClientRect().top<0) a.scrollIntoView({block:'start'}); }
}
window.addEventListener('hashchange', route);

/* ---------- nawigacja: menu „wszystko", przewijanie paska ---------- */
const tabsBar = document.querySelector('.tabs');
const odswiezCienie = navShadows(tabsBar);
const menu = navMenu();
document.getElementById('nav-btn').replaceWith(menu.btn);
document.querySelector('.topbar').append(menu.panel);
const dol = navDol(menu);
document.body.append(dol.pasek);
window.addEventListener('hashchange', ()=>{ navScrollToCurrent(tabsBar); navMarkCurrent(menu.panel); dol.odswiez(); });

/* wersja plików — żeby dało się sprawdzić, co naprawdę siedzi w przeglądarce na telefonie */
const metaW = document.querySelector('meta[name="harmonia-wersja"]');
const polW = document.getElementById('wersja');
if(metaW && polW) polW.textContent = '· wersja ' + metaW.content;

route();
requestAnimationFrame(()=>{ navScrollToCurrent(tabsBar); if(odswiezCienie) odswiezCienie(); });
