import {check, clone, now, uid, canContribute, USER_ID} from "./domain.js";
const DB_NAME="grad-trip-planner-v1";
const SCHEMA=1;
let connection;
export function openDatabase(name=DB_NAME){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(name,1);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains("trips"))db.createObjectStore("trips",{keyPath:"id"});
      if(!db.objectStoreNames.contains("media")){const media=db.createObjectStore("media",{keyPath:"id"});media.createIndex("tripId","tripId");}
      if(!db.objectStoreNames.contains("meta"))db.createObjectStore("meta",{keyPath:"key"});
    };
    request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>db.close();resolve(db)};
    request.onerror=()=>reject(request.error||new Error("本地数据库无法打开"));
    request.onblocked=()=>reject(new Error("请关闭其他打开的同游页面后重试"));
  });
}
export async function connect(name=DB_NAME){connection=await openDatabase(name);return connection}
export function closeDatabase(){connection?.close();connection=null}
function db(){check(connection,"本地存储尚未准备好");return connection}
export function allTrips(){return read("trips","getAll")}
export function getTrip(id){return read("trips","get",id)}
export function getMedia(id){return read("media","get",id)}
export function getMeta(key){return read("meta","get",key)}
function read(store,method,key){
  return new Promise((resolve,reject)=>{
    const request=db().transaction(store,"readonly").objectStore(store)[method](key);
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
}
export function transact(id,mutator){
  return new Promise((resolve,reject)=>{
    const tx=db().transaction(["trips","media"],"readwrite");
    const trips=tx.objectStore("trips"),media=tx.objectStore("media");
    let result,updated,error;
    const request=trips.get(id);
    request.onsuccess=()=>{
      try{
        check(request.result,"旅行不存在");
        check(request.result.schemaVersion===SCHEMA,"本地数据版本不兼容，请先导出备份，不会自动清空");
        updated=clone(request.result);result=mutator(updated,media);
        check(!(result instanceof Promise),"事务内操作必须为同步");
        updated.revision=(updated.revision||0)+1;trips.put(updated);
      }catch(e){error=e;tx.abort()}
    };
    tx.oncomplete=()=>resolve({trip:updated,result});
    tx.onabort=()=>reject(error||tx.error||new Error("保存失败，请重试"));
    tx.onerror=()=>{error=error||tx.error};
  });
}
export function insertTrip(trip,cover=null){
  return new Promise((resolve,reject)=>{
    const tx=db().transaction(["trips","media"],"readwrite");
    tx.objectStore("trips").add(trip);
    if(cover)tx.objectStore("media").add(cover);
    tx.oncomplete=()=>resolve(trip);tx.onabort=()=>reject(tx.error||new Error("旅行保存失败"));
  });
}
export function initializeSeeds(trips,media=[]){
  return new Promise((resolve,reject)=>{
    const tx=db().transaction(["trips","media","meta"],"readwrite");
    const meta=tx.objectStore("meta"),request=meta.get("initialized");
    request.onsuccess=()=>{
      if(request.result)return;
      trips.forEach(t=>tx.objectStore("trips").add(t));
      media.forEach(m=>tx.objectStore("media").put(m));
      meta.put({key:"initialized",schemaVersion:SCHEMA,at:now()});
    };
    tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||new Error("示例初始化失败"));
  });
}
export function resetNamespace(namespace,seedTrips=[],seedMedia=[]){
  check(["demo","user"].includes(namespace),"重置范围无效");
  return new Promise((resolve,reject)=>{
    const tx=db().transaction(["trips","media"],"readwrite");
    const trips=tx.objectStore("trips"),media=tx.objectStore("media");
    const req=trips.getAll();
    req.onsuccess=()=>{
      const removedIds=new Set(req.result.filter(t=>t.namespace===namespace).map(t=>t.id));
      const mediaRequest=media.getAll();
      mediaRequest.onsuccess=()=>{
        removedIds.forEach(id=>trips.delete(id));
        mediaRequest.result.filter(m=>removedIds.has(m.tripId)).forEach(m=>media.delete(m.id));
        seedTrips.forEach(t=>trips.put(t));seedMedia.forEach(m=>media.put(m));
      };
    };
    tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||new Error("重置失败"));
  });
}
export async function savePhotos(tripId,nodeId,drafts,caption,actor=USER_ID){
  check(drafts.length>0&&drafts.length<=9,"一次请选择1—9张照片");
  return transact(tripId,(trip,media)=>{
    canContribute(trip,actor);check(trip.nodes.some(n=>n.id===nodeId),"请选择照片所属节点");
    const saved=drafts.map(d=>{
      const id=d.id||uid("photo");
      check(d.blob instanceof Blob&&d.blob.size>0,"照片文件尚未准备好");
      if(trip.photos.some(p=>p.id===id))return null;
      const record={id,tripId,nodeId,ownerId:actor,caption:String(caption||"").trim(),at:now(),namespace:trip.namespace,kind:"photo"};
      media.add({...record,blob:d.blob});
      trip.photos.push(record);return record;
    }).filter(Boolean);
    if(saved.length)trip.moments.push({id:uid("event"),kind:"photo",actorId:actor,nodeId,at:now(),text:"上传了"+saved.length+"张照片"});
    return saved;
  });
}
export async function deletePhoto(tripId,photoId,actor=USER_ID){
  return transact(tripId,(trip,media)=>{
    canContribute(trip,actor);const photo=trip.photos.find(p=>p.id===photoId);
    check(photo,"照片不存在");check(photo.ownerId===actor,"只能删除自己上传的照片");
    trip.photos=trip.photos.filter(p=>p.id!==photoId);media.delete(photoId);
  });
}
export async function compressImage(file,maxEdge=1800,quality=.84){
  check(["image/jpeg","image/png","image/webp"].includes(file.type),"仅支持 JPEG、PNG、WebP 图片");
  check(file.size<=10*1024*1024,"单张图片不能超过10MB");
  const url=URL.createObjectURL(file);
  try{
    const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error("图片解码失败"));img.src=url});
    const scale=Math.min(1,maxEdge/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement("canvas");canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
    const context=canvas.getContext("2d");check(context,"当前浏览器无法处理图片");
    context.fillStyle="#ffffff";context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
    return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("图片压缩失败")),"image/jpeg",quality));
  }finally{URL.revokeObjectURL(url)}
}
export async function exportData(){
  const [trips,media]=await Promise.all([allTrips(),read("media","getAll")]);
  const encoded=await Promise.all(media.map(async m=>({...m,blob:await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(m.blob)})})));
  return {schemaVersion:SCHEMA,exportedAt:now(),trips,media:encoded};
}

