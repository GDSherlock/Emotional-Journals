export function openDatabase(basePath: string): Promise<IDBDatabase> {
 const path='/'+basePath.split('/').filter(Boolean).join('/');
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open('mood-journal:'+path,1); let blocked=false;
  request.onupgradeneeded=()=>{const db=request.result; for(const name of ['journals','care']) {if(!db.objectStoreNames.contains(name)) db.createObjectStore(name,{keyPath:['space','id']});} if(!db.objectStoreNames.contains('preferences')) db.createObjectStore('preferences');};
  request.onerror=()=>reject(new Error('无法打开本地数据库，请检查浏览器存储权限后重试'));
  request.onblocked=()=>{blocked=true;reject(new Error('请关闭此网站的其他标签页后重试'));};
  request.onsuccess=()=>{if(blocked){request.result.close();return;} request.result.onversionchange=()=>request.result.close();resolve(request.result);};
 });
}
export function result<T>(request: IDBRequest<T>): Promise<T> { return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);}); }
export function complete(tx: IDBTransaction): Promise<void> { return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error??new Error('保存未完成，请重试'));tx.onerror=()=>reject(tx.error??new Error('保存失败，请重试'));}); }
