(function (root) {
  'use strict';
  const INDEX='cermat-student-study-index-v1', PREFIX='cermat-student-study-attempt:', HISTORY='cermat-student-study-history:';
  const copy=value=>JSON.parse(JSON.stringify(value));
  const metadata=record=>({key:record.key,attemptId:record.attemptId,title:record.test.title,kind:record.kind||'exam',category:record.practice?.category||null,status:record.status,updatedAt:record.updatedAt,answered:Object.values(record.answers||{}).filter(v=>Array.isArray(v)?v.some(x=>x!==null&&x!==undefined):v!==''&&v!==undefined).length,total:record.questions.length,left:record.left,score:record.result?.pct??null,pending:record.result?.rows?.filter(row=>row.pend).length||0,currentQuestion:record.currentQuestion||''});
  class StudyStore {
    constructor() {
      this.records=new Map();this.history=new Map();this.historyMeta=new Map();this.index=new Map();this.database=null;this.queue=Promise.resolve();this.available={local:false,idb:false};
      const local=this.read(INDEX)||{};
      for(const meta of local.attempts||[]){if(!meta||typeof meta.key!=='string')continue;this.index.set(meta.key,meta);const record=this.read(PREFIX+meta.key);if(record&&record.key===meta.key)this.records.set(meta.key,record);}
      for(const item of local.history||[])if(item&&typeof item.attemptId==='string')this.historyMeta.set(item.attemptId,item);
      this.ready=this.hydrate();
    }
    read(key) {try{const text=localStorage.getItem(key);this.available.local=true;return text?JSON.parse(text):null;}catch(_){return null;}}
    write(key,value) {try{localStorage.setItem(key,JSON.stringify(value));this.available.local=true;return true;}catch(_){return false;}}
    db() {
      if(this.database)return this.database;
      this.database=new Promise((resolve,reject)=>{
        if(typeof indexedDB==='undefined'){reject(new Error('IndexedDB unavailable'));return;}
        let request;try{request=indexedDB.open('cermat-testy',1);}catch(error){reject(error);return;}
        request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('kv'))request.result.createObjectStore('kv');};
        request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();this.database=null;};this.available.idb=true;resolve(db);};
        request.onerror=()=>{this.database=null;reject(request.error);};
        request.onblocked=()=>{this.database=null;reject(new Error('Database blocked'));};
      });
      return this.database;
    }
    async get(key) {const db=await this.db();return new Promise((resolve,reject)=>{const request=db.transaction('kv').objectStore('kv').get(key);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
    async put(key,value) {const db=await this.db();return new Promise((resolve,reject)=>{const tx=db.transaction('kv','readwrite');tx.objectStore('kv').put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Save aborted'));});}
    indexValue() {return{version:1,attempts:[...this.index.values()],history:[...this.historyMeta.values()]};}
    mergeIndex(value) {
      for(const meta of value?.attempts||[]){if(!meta||typeof meta.key!=='string')continue;const current=this.index.get(meta.key);if(!current||(meta.updatedAt||0)>(current.updatedAt||0))this.index.set(meta.key,meta);}
      for(const meta of value?.history||[]){if(!meta||typeof meta.attemptId!=='string')continue;const current=this.historyMeta.get(meta.attemptId);if(!current||(meta.updatedAt||0)>(current.updatedAt||0)){this.historyMeta.set(meta.attemptId,meta);if((this.history.get(meta.attemptId)?.updatedAt||0)<(meta.updatedAt||0))this.history.delete(meta.attemptId);}}
      return this.indexValue();
    }
    async writeIndex() {
      const db=await this.db();
      return new Promise((resolve,reject)=>{
        const tx=db.transaction('kv','readwrite'),kv=tx.objectStore('kv'),request=kv.get(INDEX);
        request.onsuccess=()=>{kv.put(this.mergeIndex(request.result),INDEX);};
        tx.oncomplete=()=>{this.mergeIndex(this.read(INDEX));this.write(INDEX,this.indexValue());resolve();};
        tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Save aborted'));
      });
    }
    async hydrate() {
      this.mergeIndex(this.read(INDEX));
      for(const key of this.index.keys()){const local=this.read(PREFIX+key),current=this.records.get(key);if(local&&(!current||(local.updatedAt||0)>(current.updatedAt||0)))this.records.set(key,local);}
      try{
        const saved=await this.get(INDEX);
        this.mergeIndex(saved);
        await Promise.all([...this.index.keys()].map(async key=>{
          const stored=await this.get(PREFIX+key),local=this.records.get(key);
          if(stored&&(!local||(stored.updatedAt||0)>(local.updatedAt||0)))this.records.set(key,stored);
          const record=this.records.get(key);if(record)this.index.set(key,metadata(record));
        }));
      }catch(_){/* The synchronous journal remains available. */}
      return this;
    }
    save(record) {
      const value=copy(record);this.records.set(value.key,value);this.index.set(value.key,metadata(value));
      const local=this.write(PREFIX+value.key,value);this.mergeIndex(this.read(INDEX));this.write(INDEX,this.indexValue());
      this.queue=this.queue.catch(()=>{}).then(async()=>{
        try{await this.put(PREFIX+value.key,value);await this.writeIndex();return{saved:true,local,idb:true};}
        catch(error){return{saved:local,local,idb:false,error:String(error)};}
      });
      return this.queue;
    }
    async complete(record) {
      const value=copy(record);value.status='completed';this.history.set(value.attemptId,value);this.historyMeta.set(value.attemptId,metadata(value));
      const local=this.write(HISTORY+value.attemptId,value),saved=await this.save(value);
      try{await this.put(HISTORY+value.attemptId,value);await this.writeIndex();return{saved:true};}catch(_){return{saved:saved.saved&&local};}
    }
    async historyRecord(id) {if(this.history.has(id))return this.history.get(id);const local=this.read(HISTORY+id);let stored=null;try{stored=await this.get(HISTORY+id);}catch(_){}const value=stored&&(!local||stored.updatedAt>=local.updatedAt)?stored:local;if(value)this.history.set(id,value);return value;}
    async export() {
      await this.ready;await this.queue;await this.hydrate();
      const history=[];for(const id of this.historyMeta.keys()){const value=await this.historyRecord(id);if(value)history.push(value);}
      return{version:1,attempts:[...this.records.values()].map(copy),history:history.map(copy)};
    }
    async restoreLegacy({attempts,history}) {
      let durable=true;
      for (const record of attempts) {
        const existing=this.records.get(record.key);
        if (existing && existing.attemptId!==record.attemptId) {
          // Keep both unfinished attempts when older built-in IDs map to the same test.
          if (record.status==='in-progress') record.key=record.test.id+'::'+record.attemptId;
          else continue;
        }
        const previous=this.records.get(record.key);
        if (!previous || record.updatedAt>previous.updatedAt) durable=(await this.save(record)).saved && durable;
      }
      for (const record of history) {
        if ((this.historyMeta.get(record.attemptId)?.updatedAt||0)>=record.updatedAt) continue;
        const local=this.write(HISTORY+record.attemptId,record);
        let stored=false;
        try {await this.put(HISTORY+record.attemptId,record);stored=true;} catch (_) {}
        this.history.set(record.attemptId,record);
        this.historyMeta.set(record.attemptId,metadata(record));
        durable=(local||stored)&&durable;
      }
      if (history.length) {
        this.mergeIndex(this.read(INDEX));
        const local=this.write(INDEX,this.indexValue());
        try {await this.writeIndex();} catch (_) {durable=local&&durable;}
      }
      return durable;
    }
    valid(record) {
      if(!record||record.version!==1||typeof record.key!=='string'||typeof record.attemptId!=='string'||!record.test||!Array.isArray(record.questions)||!record.questions.length||!Number.isFinite(record.updatedAt))return false;
      if(root.CermatTopics&&!root.CermatTopics.validSession(record))return false;
      const types=new Set(['pencil','highlight','point','segment','line','ruler','circle','arc','angle','triangle','rect','polygon','text']);
      for(const page of Object.values(record.papers||{})){
        if(!Number.isFinite(page.height)||page.height<100||page.height>30000||!Array.isArray(page.objects)||page.objects.length>20000)return false;
        for(const object of page.objects){if(!object||typeof object.id!=='string'||!types.has(object.type))return false;for(const key of ['a','b','c','v','p'])if(object[key]&&(!Array.isArray(object[key])||!Number.isFinite(object[key][0])||!Number.isFinite(object[key][1])))return false;if(object.points&&(!Array.isArray(object.points)||object.points.length>300000||object.points.some(p=>!Array.isArray(p)||!Number.isFinite(p[0])||!Number.isFinite(p[1]))))return false;}
      }
      return true;
    }
  }
  root.CermatStudyStore={StudyStore,metadata,INDEX,PREFIX,HISTORY};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.CermatStudyStore;
})(typeof window!=='undefined'?window:globalThis);
