import { getSupabase } from './supabase.js';
import { getEvidenceFileValidationError } from '../utils/evidenceValidation.js';

const DB_NAME = 'priorproof-evidence-files';
const STORE_NAME = 'files';
const BUCKET = 'priorproof-evidence';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('This browser does not support local file storage.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local file storage.'));
  });
}

async function currentUser() {
  const { data, error } = await getSupabase().auth.getUser();
  if (error) throw error;
  if (!data?.user?.id) throw new Error('Please sign in again before managing evidence files.');
  return data.user;
}

function safeFileName(name) {
  const cleaned = String(name || 'evidence-file')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  return cleaned || 'evidence-file';
}

export async function saveEvidenceFile(id, file) {
  if (!file) return null;
  const validationError = getEvidenceFileValidationError(file);
  if (validationError) throw new Error(validationError);

  const user = await currentUser();
  const path = user.id + '/' + id + '/' + crypto.randomUUID() + '-' + safeFileName(file.name);
  const { error } = await getSupabase().storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || 'application/octet-stream' });

  if (error) throw new Error('Could not upload your evidence file: ' + error.message);

  // Keep any previous attachment until the new workspace metadata is safely saved.

  return { id, name: file.name, type: file.type, size: file.size, path };
}

export async function getEvidenceFile(id, path = null) {
  if (path) {
    const user = await currentUser();
    if (!path.startsWith(user.id + '/')) throw new Error('You do not have permission to access this evidence file.');
    const { data, error } = await getSupabase().storage.from(BUCKET).download(path);
    if (error) throw new Error('Could not download your evidence file: ' + error.message);
    return { id, name: path.split('/').pop() || 'evidence-file', type: data.type, size: data.size, blob: data };
  }

  // Compatibility for attachments saved by an earlier browser-only version.
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => { db.close(); resolve(request.result || null); };
    request.onerror = () => { db.close(); reject(request.error || new Error('Could not retrieve the file.')); };
  });
}

export async function deleteEvidenceFile(id, path = null) {
  if (path) {
    const user = await currentUser();
    if (!path.startsWith(user.id + '/')) throw new Error('You do not have permission to remove this evidence file.');
    const { error } = await getSupabase().storage.from(BUCKET).remove([path]);
    if (error) throw new Error('Could not remove your evidence file: ' + error.message);
    return;
  }

  if (!id) return;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error('Could not remove the file.')); };
  });
}

export async function clearEvidenceFiles(legacyIds = []) {
  // Remove this user's cloud attachments before clearing the legacy browser cache.
  const user = await currentUser();
  const storage = getSupabase().storage.from(BUCKET);
  const objectPaths = [];

  async function collectFiles(folder) {
    const limit = 1000;
    let offset = 0;
    while (true) {
      const { data, error } = await storage.list(folder, { limit, offset });
      if (error) throw new Error('Could not list your evidence files: ' + error.message);
      const entries = data || [];
      for (const entry of entries) {
        const path = folder + '/' + entry.name;
        if (entry.id) objectPaths.push(path);
        else await collectFiles(path);
      }
      if (entries.length < limit) break;
      offset += limit;
    }
  }

  await collectFiles(user.id);
  // Keep each Storage removal request comfortably below the API batch limit.
  for (let i = 0; i < objectPaths.length; i += 100) {
    const { error } = await storage.remove(objectPaths.slice(i, i + 100));
    if (error) throw new Error('Could not clear your cloud evidence files: ' + error.message);
  }

  // Legacy IndexedDB attachments are keyed by evidence record ID, not account ID.
  // Delete only IDs supplied from the signed-in user's previous workspace. Clearing
  // the entire object store here could erase another account's files on a shared browser.
  const ids = [...new Set((legacyIds || []).filter(id => typeof id === 'string' && id))];
  if (!ids.length || !('indexedDB' in window)) return;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    ids.forEach(id => store.delete(id));
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error('Could not clear this account’s legacy files.')); };
  });
}

export async function clearLocalEvidenceFiles(ids = []) {
  const uniqueIds = [...new Set((ids || []).filter(id => typeof id === 'string' && id))];
  if (!uniqueIds.length || !('indexedDB' in window)) return;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    uniqueIds.forEach(id => store.delete(id));
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error('Could not clear local evidence files.')); };
  });
}
