/* ============================================================
   Nawigacja — na telefonie w pasku mieści się 5 zakładek z 12,
   więc reszta appki była po prostu niewidoczna. Stąd:
   1. menu „☰ Wszystko" z pełną listą i jednym zdaniem o każdej zakładce,
   2. pasek sam przewija się do zakładki, na której jesteś,
   3. cień przy krawędzi mówi, że da się przewinąć dalej.
   Opisy zakładek siedzą tutaj, żeby były w jednym miejscu.
   Testowane w test/unit/nav.test.js.
   ============================================================ */

const NAV_GROUPS = [
  {name:'Nauka', items:[
    {id:'dzis',    name:'Dziś',         opis:'Start: seria dni, trening dnia i lekcja, do której wracasz.'},
    {id:'teoria',  name:'Teoria',       opis:'10 lekcji od zera: klawiatura, gama, akordy, kadencje.'},
    {id:'nuty',    name:'Nuty',         opis:'Czytanie nut + trener „jaka to nuta".'},
    {id:'trening', name:'Trening',      opis:'Codzienna runda ćwiczeń ze słuchu. Pamięta, co Ci nie wyszło.'},
  ]},
  {name:'Granie', items:[
    {id:'petla',     name:'Pętla',        opis:'Gotowe pętle akordów i style grania. Gra w kółko, Ty grasz z nią.'},
    {id:'klawisze',  name:'Klawisze',     opis:'Żywe pianino: graj i patrz, co to za akord. Gamy z palcowaniem.'},
    {id:'gamy',      name:'Gamy',         opis:'Które akordy pasują do gamy i jak między nimi chodzić.'},
    {id:'przejscia', name:'Przejścia',    opis:'Ułóż własne akordy — appka pokaże, gdzie się gubisz.'},
    {id:'wizualizacja', name:'Wizualizacja', opis:'Drzewo ruchów i koło kwintowe.'},
  ]},
  {name:'Twoje', items:[
    {id:'piosenki', name:'Piosenki', opis:'Twoje utwory: akordy, tekst, nagranie, tonacja.'},
    {id:'glos',     name:'Głos',     opis:'Rozgrzewka, ćwiczenia emisyjne i nagrywanie się.'},
    {id:'druk',     name:'Druk',     opis:'Ściągawki A4 na pulpit pianina.'},
    {id:'zrodla',   name:'Źródła',   opis:'Gdzie uczyć się dalej.'},
  ]},
];
/* Wszystkie zakładki po kolei — przydaje się do sprawdzeń i do menu. */
const NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items.map(it => ({...it, group:g.name})));
const navById = id => NAV_ITEMS.find(it => it.id === id) || null;

/* Przewiń pasek tak, żeby aktywna zakładka była widoczna (i żeby było widać, że są kolejne). */
function navScrollToCurrent(bar){
  if(!bar) return;
  const a = bar.querySelector('a[aria-current="page"]');
  if(!a || !bar.scrollWidth || bar.scrollWidth <= bar.clientWidth) return;
  const cel = a.offsetLeft - (bar.clientWidth - a.offsetWidth) / 2;
  bar.scrollTo({left: Math.max(0, cel), behavior: 'smooth'});
}
/* Cienie na krawędziach: mówią „przewiń mnie". */
function navShadows(bar){
  if(!bar) return;
  const odswiez = () => {
    const max = bar.scrollWidth - bar.clientWidth;
    bar.classList.toggle('ma-lewo', bar.scrollLeft > 4);
    bar.classList.toggle('ma-prawo', max > 4 && bar.scrollLeft < max - 4);
  };
  bar.addEventListener('scroll', odswiez, {passive:true});
  window.addEventListener('resize', odswiez);
  odswiez();
  return odswiez;
}

/* Panel „Wszystko": pełna lista zakładek z opisami. Zwraca {panel, toggle}. */
function navMenu(){
  const panel = h('div',{class:'navmenu',hidden:true,role:'dialog','aria-label':'Wszystkie zakładki'});
  const zamknij = () => {
    panel.hidden = true; btn.setAttribute('aria-expanded','false');
    document.querySelectorAll('.nav-wiecej').forEach(b=>b.setAttribute('aria-expanded','false'));
  };
  const btn = h('button',{class:'navbtn',type:'button','aria-expanded':'false','aria-label':'Wszystkie zakładki'},'☰');
  const przelacz = ()=>{
    panel.hidden = !panel.hidden;
    btn.setAttribute('aria-expanded', String(!panel.hidden));
    document.querySelectorAll('.nav-wiecej').forEach(b=>b.setAttribute('aria-expanded', String(!panel.hidden)));
    if(!panel.hidden) navMarkCurrent(panel);
  };

  NAV_GROUPS.forEach(g=>{
    const lista = h('div',{class:'navgrupa'});
    g.items.forEach(it=>{
      const a = h('a',{href:'#'+it.id,'data-id':it.id},
        h('b',null, it.name), h('span',null, it.opis));
      a.addEventListener('click', zamknij);
      lista.append(a);
    });
    panel.append(h('div',{class:'navsekcja'}, h('h3',null, g.name), lista));
  });

  /* Wygląd: wybór motywu kolorów (js/motyw.js) */
  if(typeof MOTYWY !== 'undefined'){
    const rzad = h('div',{class:'motywy',role:'group','aria-label':'Motyw kolorów'});
    const zaznacz = id => rzad.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.motyw===id)));
    MOTYWY.forEach(m=>{
      const b = h('button',{type:'button',class:'motyw','data-motyw':m.id,'aria-pressed':'false'},
        h('i',{class:'probka','aria-hidden':'true'}), h('b',null,m.name), h('span',null,m.opis));
      b.onclick = ()=>zaznacz(ustawMotyw(m.id, true));
      rzad.append(b);
    });
    zaznacz(motywTeraz());
    panel.append(h('div',{class:'navsekcja'}, h('h3',null,'Wygląd'), rzad));
  }

  btn.onclick = przelacz;
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape') zamknij(); });
  document.addEventListener('click', e=>{
    if(panel.hidden) return;
    if(!panel.contains(e.target) && !e.target.closest('.navbtn,.nav-wiecej')) zamknij();
  });
  return {panel, btn, zamknij, przelacz};
}
/* Zaznacz w menu zakładkę, na której jesteśmy. */
function navMarkCurrent(panel){
  const teraz = (location.hash.replace(/^#/,'') || 'dzis').split('/')[0];
  panel.querySelectorAll('a[data-id]').forEach(a=>
    a.setAttribute('aria-current', String(a.dataset.id === teraz)));
}

/* ---------- dolny pasek na telefonie ----------
   Pięć miejsc pod kciukiem. „Nauka" świeci się też w Nutach i Treningu,
   „Więcej" otwiera pełne menu i świeci się w pozostałych zakładkach. */
const NAV_DOL = [
  {id:'dzis',     name:'Dziś',     ikona:'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z'},
  {id:'teoria',   name:'Nauka',    ikona:'M4 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-5a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h5z', teZ:['nuty','trening']},
  {id:'klawisze', name:'Klawisze', ikona:'M3 5h18v14H3zM8 5v8M12 5v8M16 5v8'},
  {id:'piosenki', name:'Piosenki', ikona:'M9 18V6l11-2v12M9 18a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0zM20 16a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0z'},
];
/* Która pozycja dolnego paska jest aktywna dla danej zakładki ('wiecej' = reszta). */
function navDolAktywny(id){
  const it = NAV_DOL.find(x => x.id === id || (x.teZ || []).includes(id));
  return it ? it.id : 'wiecej';
}
function navDol(menu){
  const ikona = d => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('aria-hidden','true');
    const p = document.createElementNS('http://www.w3.org/2000/svg','path'); p.setAttribute('d', d);
    svg.append(p); return svg;
  };
  const pasek = h('nav',{class:'navdol','aria-label':'Najważniejsze zakładki'});
  NAV_DOL.forEach(it => pasek.append(h('a',{href:'#'+it.id,'data-dol':it.id}, ikona(it.ikona), h('span',null,it.name))));
  const wiecej = h('button',{type:'button',class:'nav-wiecej','data-dol':'wiecej','aria-expanded':'false','aria-label':'Więcej zakładek i wygląd'},
    ikona('M4 7h16M4 12h16M4 17h16'), h('span',null,'Więcej'));
  wiecej.onclick = ()=>{ menu.przelacz(); };
  pasek.append(wiecej);
  const odswiez = ()=>{
    const akt = navDolAktywny((location.hash.replace(/^#/,'') || 'dzis').split('/')[0]);
    pasek.querySelectorAll('[data-dol]').forEach(el=>el.toggleAttribute('data-akt', el.dataset.dol === akt));
    pasek.querySelectorAll('a[data-dol]').forEach(el=>el.setAttribute('aria-current', el.dataset.dol === akt ? 'page' : 'false'));
  };
  odswiez();
  return {pasek, odswiez};
}
