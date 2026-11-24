const DB_NAME='priorproof-evidence-files';
const STORE_NAME='files';

function openDatabase(){
 return new Promise((resolve,reject)=>{
  if(!('indexedDB' in window)){reject(new Error('This browser does not support local file storage.'));return;}
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE_NAME))db.createObjectStore(STORE_NAME,{keyPath:'id'});};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||new Error('Could not open local file storage.'));
 });
}
export async function saveEvidenceFile(id,file){
 if(!file||!file.size)return null;
 if(file.size>5*1024*1024)throw new Error('Please choose a file smaller than 5 MB.');
 const db=await openDatabase();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE_NAME,'readwrite');
  tx.objectStore(STORE_NAME).put({id,name:file.name,type:file.type,size:file.size,blob:file});
  tx.oncomplete=()=>{db.close();resolve({id,name:file.name,type:file.type,size:file.size});};
  tx.onerror=()=>{db.close();reject(tx.error||new Error('Could not save the file.'));};
  tx.onabort=()=>{db.close();reject(tx.error||new Error('File storage was interrupted.'));};
 });
}
export async function getEvidenceFile(id){
 const db=await openDatabase();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE_NAME,'readonly');
  const request=tx.objectStore(STORE_NAME).get(id);
  request.onsuccess=()=>{db.close();resolve(request.result||null);};
  request.onerror=()=>{db.close();reject(request.error||new Error('Could not retrieve the file.'));};
 });
}
export async function deleteEvidenceFile(id){
 if(!id)return;
 const db=await openDatabase();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE_NAME,'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  tx.oncomplete=()=>{db.close();resolve();};
  tx.onerror=()=>{db.close();reject(tx.error||new Error('Could not remove the file.'));};
 });
}
export async function clearEvidenceFiles(){
 const db=await openDatabase();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE_NAME,'readwrite');
  tx.objectStore(STORE_NAME).clear();
  tx.oncomplete=()=>{db.close();resolve();};
  tx.onerror=()=>{db.close();reject(tx.error||new Error('Could not clear local files.'));};
 });
}
