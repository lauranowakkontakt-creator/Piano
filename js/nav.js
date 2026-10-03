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
  const zamknij = () => { panel.hidden = true; btn.setAttribute('aria-expanded','false'); };
  const btn = h('button',{class:'navbtn',type:'button','aria-expanded':'false','aria-label':'Wszystkie zakładki'},'☰');

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

  btn.onclick = ()=>{
    panel.hidden = !panel.hidden;
    btn.setAttribute('aria-expanded', String(!panel.hidden));
    if(!panel.hidden) navMarkCurrent(panel);
  };
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape') zamknij(); });
  document.addEventListener('click', e=>{
    if(panel.hidden) return;
    if(!panel.contains(e.target) && e.target !== btn) zamknij();
  });
  return {panel, btn, zamknij};
}
/* Zaznacz w menu zakładkę, na której jesteśmy. */
function navMarkCurrent(panel){
  const teraz = (location.hash.replace(/^#/,'') || 'gamy').split('/')[0];
  panel.querySelectorAll('a[data-id]').forEach(a=>
    a.setAttribute('aria-current', String(a.dataset.id === teraz)));
}
