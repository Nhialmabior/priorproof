import { initialData } from '../data/demoData.js';
import { getSupabase } from './supabase.js';

const LEGACY_KEY = 'priorproof-demo-v1';
let activeUserId = null;
let saveTimer = null;
let saveQueue = Promise.resolve();
let saveVersion = 0;
let loadVersion = 0;

function blankWorkspace(user) {
  return {
    user: {
      id: user.id,
      fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
      email: user.email || '',
      targetOccupation: '',
      location: '',
      summary: '',
      interests: ''
    },
    experiences: [],
    evidence: [],
    competencies: [],
    assessments: []
  };
}

function dispatchSyncStatus(status, message = '') {
  window.dispatchEvent(new CustomEvent('priorproof:sync-status', {
    detail: { status, message }
  }));
}

function workspaceKey(userId) {
  return `priorproof-workspace-v1:${userId}`;
}

function pendingKey(userId) {
  return `priorproof-workspace-pending-v1:${userId}`;
}

function validWorkspace(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && value.user && typeof value.user === 'object'
    && Array.isArray(value.experiences)
    && Array.isArray(value.evidence)
    && Array.isArray(value.competencies);
}

function readLocal(userId) {
  try {
    const value = JSON.parse(localStorage.getItem(workspaceKey(userId)) || 'null');
    return validWorkspace(value) ? value : null;
  } catch {
    return null;
  }
}

function writeLocal(userId, data) {
  localStorage.setItem(workspaceKey(userId), JSON.stringify(data));
}

function hasPendingSave(userId) {
  return localStorage.getItem(pendingKey(userId)) === 'true';
}

function markPendingSave(userId) {
  localStorage.setItem(pendingKey(userId), 'true');
}

function clearPendingSave(userId) {
  localStorage.removeItem(pendingKey(userId));
}

export function getData() {
  if (!activeUserId) return structuredClone(initialData);
  return readLocal(activeUserId) || structuredClone(initialData);
}

async function persistWorkspace(userId, workspace) {
  const { error } = await getSupabase()
    .from('user_workspaces')
    .upsert({ user_id: userId, workspace, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw error;
}

function queueWorkspaceSave(userId, workspace, version) {
  const task = saveQueue
    .catch(() => {})
    .then(() => persistWorkspace(userId, workspace));

  saveQueue = task;
  return task.then(() => {
    // A completed older write must never clear the pending marker for a newer edit.
    if (activeUserId === userId && saveVersion === version) {
      clearPendingSave(userId);
      dispatchSyncStatus('saved');
    }
  });
}

export async function flushWorkspaceSave() {
  const userId = activeUserId;
  if (!userId) return;

  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
    const latest = readLocal(userId);
    if (latest) {
      const version = saveVersion;
      markPendingSave(userId);
      dispatchSyncStatus('saving');
      try {
        await queueWorkspaceSave(userId, latest, version);
      } catch (error) {
        dispatchSyncStatus('error', error.message || 'Cloud save failed.');
        throw new Error('Your latest workspace changes could not be saved to the cloud. Please check your connection and try again before signing out.');
      }
    }
  }

  try {
    await saveQueue;
  } catch (error) {
    dispatchSyncStatus('error', error.message || 'Cloud save failed.');
    throw new Error('A workspace save is still pending. Please check your connection and try again.');
  }

  if (hasPendingSave(userId)) {
    const latest = readLocal(userId);
    if (!latest) throw new Error('Your unsynchronised workspace copy could not be recovered from this browser.');
    const version = saveVersion;
    try {
      await queueWorkspaceSave(userId, latest, version);
    } catch (error) {
      dispatchSyncStatus('error', error.message || 'Cloud save failed.');
      throw new Error('Your latest workspace changes could not be saved to the cloud. Please check your connection and try again.');
    }
  }
}

export async function loadUserWorkspace(user) {
  if (!user?.id) throw new Error('A signed-in user is required to load a workspace.');

  const userId = user.id;
  const thisLoad = ++loadVersion;
  const revisionAtStart = saveVersion;

  // Finish any in-flight edit before asking the cloud for a potentially older copy.
  if (activeUserId === userId && (saveTimer || hasPendingSave(userId))) {
    try {
      await flushWorkspaceSave();
    } catch {
      // Keep the browser copy available; the sync indicator reports the cloud failure.
      const local = readLocal(userId);
      if (local) return local;
    }
  }

  activeUserId = userId;

  // A pending local copy is more recent than the last confirmed cloud copy.
  // Retry it instead of replacing it with stale cloud data on refresh or reconnect.
  if (hasPendingSave(userId)) {
    const local = readLocal(userId);
    if (local) {
      const version = saveVersion;
      try {
        await queueWorkspaceSave(userId, local, version);
      } catch (error) {
        dispatchSyncStatus('error', error.message || 'Cloud save failed.');
      }
      return local;
    }
  }

  const supabase = getSupabase();
  const { data: row, error } = await supabase
    .from('user_workspaces')
    .select('workspace')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    const local = readLocal(userId);
    if (local) {
      dispatchSyncStatus('error', 'Using this browser’s saved copy because the cloud workspace could not be loaded.');
      return local;
    }
    throw new Error('Could not load your cloud workspace: ' + error.message);
  }

  // A newer local edit or a newer login/load cycle took place while the request ran.
  if (thisLoad !== loadVersion || activeUserId !== userId) return readLocal(userId) || blankWorkspace(user);

  if (saveVersion !== revisionAtStart || hasPendingSave(userId)) {
    const local = readLocal(userId);
    if (local) return local;
  }

  if (row?.workspace && validWorkspace(row.workspace)) {
    const workspace = {
      ...row.workspace,
      user: {
        ...row.workspace.user,
        id: userId,
        email: user.email || row.workspace.user.email || '',
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || row.workspace.user.fullName || ''
      },
      experiences: row.workspace.experiences,
      evidence: row.workspace.evidence,
      competencies: row.workspace.competencies,
      assessments: Array.isArray(row.workspace.assessments) ? row.workspace.assessments : []
    };
    writeLocal(userId, workspace);
    dispatchSyncStatus('saved');
    return workspace;
  }

  // Migrate legacy browser data only when its email matches this signed-in account.
  let workspace = null;
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
    if (validWorkspace(legacy) && String(legacy.user.email || '').toLowerCase() === String(user.email || '').toLowerCase()) {
      workspace = {
        ...legacy,
        user: { ...legacy.user, id: userId, email: user.email || legacy.user.email },
        experiences: legacy.experiences,
        evidence: legacy.evidence,
        competencies: legacy.competencies,
        assessments: Array.isArray(legacy.assessments) ? legacy.assessments : []
      };
    }
  } catch {
    // Ignore malformed legacy browser data and start with an empty account workspace.
  }

  workspace ||= blankWorkspace(user);
  writeLocal(userId, workspace);
  markPendingSave(userId);
  try {
    await queueWorkspaceSave(userId, workspace, saveVersion);
  } catch (saveError) {
    dispatchSyncStatus('error', saveError.message || 'Cloud save failed.');
  }
  return workspace;
}

export function saveData(data) {
  if (!activeUserId) {
    console.warn('PriorProof workspace is not linked to a signed-in account; cloud save skipped.');
    return;
  }

  const userId = activeUserId;
  const snapshot = structuredClone(data);
  snapshot.user = { ...snapshot.user, id: userId };
  const version = ++saveVersion;

  try {
    writeLocal(userId, snapshot);
    markPendingSave(userId);
  } catch (error) {
    console.error('PriorProof local workspace save failed:', error);
    dispatchSyncStatus('error', 'Could not save a local recovery copy. Your browser storage may be full or unavailable.');
    return;
  }

  window.dispatchEvent(new CustomEvent('priorproof:data-updated'));
  dispatchSyncStatus('saving');

  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    queueWorkspaceSave(userId, snapshot, version).catch(error => {
      console.error('PriorProof cloud save failed:', error);
      dispatchSyncStatus('error', error.message || 'Cloud save failed. Your browser copy is being kept for recovery.');
    });
  }, 450);
}

export function resetData() {
  if (!activeUserId) return structuredClone(initialData);
  const current = getData();
  const blank = {
    user: { ...current.user },
    experiences: [],
    evidence: [],
    competencies: [],
    assessments: []
  };
  saveData(blank);
  return blank;
}

export function clearActiveWorkspace() {
  // Capture the current local copy before clearing the account context.
  // The explicit sign-out flow awaits flushWorkspaceSave while auth is still valid.
  if (saveTimer && activeUserId) {
    const userId = activeUserId;
    clearTimeout(saveTimer);
    saveTimer = null;
    const latest = readLocal(userId);
    if (latest) {
      const version = saveVersion;
      markPendingSave(userId);
      queueWorkspaceSave(userId, latest, version).catch(error => {
        console.error('PriorProof final workspace sync failed:', error);
      });
    }
  }
  activeUserId = null;
  loadVersion++;
}
