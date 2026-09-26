/* ============================================================
   Zapis lokalny — IndexedDB. Wszystko zostaje w przeglądarce Laury,
   bez logowania. Piosenki + pliki audio (jako Blob).
   ============================================================ */
const DB = (()=>{
  let dbp = null;
  function open(){
    if(dbp) return dbp;
    dbp = new Promise((res,rej)=>{
      const rq = indexedDB.open('harmonia', 2);
      rq.onupgradeneeded = ()=>{
        const db = rq.result;
        if(!db.objectStoreNames.contains('songs')) db.createObjectStore('songs',{keyPath:'id'});
        if(!db.objectStoreNames.contains('audio')) db.createObjectStore('audio',{keyPath:'id'});
        if(!db.objectStoreNames.contains('pdf')) db.createObjectStore('pdf',{keyPath:'id'});
      };
      rq.onsuccess = ()=>res(rq.result);
      rq.onerror = ()=>rej(rq.error);
    });
    return dbp;
  }
  function tx(store, mode, fn){
    return open().then(db=>new Promise((res,rej)=>{
      const t = db.transaction(store, mode);
      const s = t.objectStore(store);
      const r = fn(s);
      t.oncomplete = ()=>res(r && 'result' in r ? r.result : undefined);
      t.onerror = ()=>rej(t.error);
      t.onabort = ()=>rej(t.error);
    }));
  }
  return {
    allSongs(){ return tx('songs','readonly',s=>s.getAll()).then(a=>(a||[]).sort((x,y)=>(y.updated||0)-(x.updated||0))); },
    getSong(id){ return tx('songs','readonly',s=>s.get(id)); },
    putSong(song){ song.updated = Date.now(); return tx('songs','readwrite',s=>s.put(song)); },
    delSong(id){ return tx('songs','readwrite',s=>s.delete(id)).then(()=>tx('audio','readwrite',s=>s.delete(id))).then(()=>tx('pdf','readwrite',s=>s.delete(id))); },
    getAudio(id){ return tx('audio','readonly',s=>s.get(id)); },
    putAudio(id, blob, name){ return tx('audio','readwrite',s=>s.put({id, blob, name})); },
    delAudio(id){ return tx('audio','readwrite',s=>s.delete(id)); },
    getPdf(id){ return tx('pdf','readonly',s=>s.get(id)); },
    putPdf(id, blob, name){ return tx('pdf','readwrite',s=>s.put({id, blob, name})); },
    delPdf(id){ return tx('pdf','readwrite',s=>s.delete(id)); },
  };
})();
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
