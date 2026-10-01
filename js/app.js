/* Router: #zakladka/podstrona */
const ROUTES = {
  teoria: ViewTeoria,
  gamy: ViewGamy,
  nuty: ViewNuty,
  trening: ViewTrening,
  klawisze: ViewKlawisze,
  piosenki: ViewPiosenki,
  wizualizacja: ViewWizualizacja,
  petla: ViewPetla,
  przejscia: ViewPrzejscia,
  glos: ViewGlos,
  druk: ViewDruk,
  zrodla: ViewZrodla,
};
async function route(){
  stopSeq(); if(typeof Ladder!=='undefined') Ladder.stop();
  const [name, ...rest] = (location.hash.replace(/^#/,'') || 'gamy').split('/');
  const view = ROUTES[name] || ViewGamy;
  const sub = rest.join('/') || null;
  document.querySelectorAll('.tabs a').forEach(a=>a.setAttribute('aria-current', a.getAttribute('href')==='#'+(ROUTES[name]?name:'gamy') ? 'page' : 'false'));
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
route();
