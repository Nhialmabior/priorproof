import { initialData } from '../data/demoData.js';
import { getSupabase } from './supabase.js';

const LEGACY_KEY = 'priorproof-demo-v1';
let activeUserId = null;
let saveTimer = null;
let saveQueue = Promise.resolve();

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

export function getData() {
  if (!activeUserId) return structuredClone(initialData);
  return readLocal(activeUserId) || structuredClone(initialData);
}

export async function loadUserWorkspace(user) {
  if (!user?.id) throw new Error('A signed-in user is required to load a workspace.');
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  activeUserId = user.id;

  const supabase = getSupabase();
  const { data: row, error } = await supabase
    .from('user_workspaces')
    .select('workspace')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw new Error('Could not load your cloud workspace: ' + error.message);

  if (row?.workspace && validWorkspace(row.workspace)) {
    const workspace = {
      ...row.workspace,
      user: {
        ...row.workspace.user,
        id: user.id,
        email: user.email || row.workspace.user.email || '',
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || row.workspace.user.fullName || ''
      },
      experiences: row.workspace.experiences,
      evidence: row.workspace.evidence,
      competencies: row.workspace.competencies,
      assessments: Array.isArray(row.workspace.assessments) ? row.workspace.assessments : []
    };
    writeLocal(user.id, workspace);
    return workspace;
  }

  // Migrate legacy browser data only when its email matches this signed-in account.
  let workspace = null;
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
    if (validWorkspace(legacy) && String(legacy.user.email || '').toLowerCase() === String(user.email || '').toLowerCase()) {
      workspace = {
        ...legacy,
        user: { ...legacy.user, id: user.id, email: user.email || legacy.user.email },
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
  writeLocal(user.id, workspace);
  await persistWorkspace(user.id, workspace);
  return workspace;
}

async function persistWorkspace(userId, workspace) {
  const { error } = await getSupabase()
    .from('user_workspaces')
    .upsert({ user_id: userId, workspace, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw error;
}

export function saveData(data) {
  if (!activeUserId) {
    console.warn('PriorProof workspace is not linked to a signed-in account; cloud save skipped.');
    return;
  }

  const snapshot = structuredClone(data);
  snapshot.user = { ...snapshot.user, id: activeUserId };
  writeLocal(activeUserId, snapshot);
  window.dispatchEvent(new CustomEvent('priorproof:data-updated'));
  dispatchSyncStatus('saving');

  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const userId = activeUserId;
    saveQueue = saveQueue
      .catch(() => {})
      .then(() => persistWorkspace(userId, snapshot))
      .then(() => dispatchSyncStatus('saved'))
      .catch(error => {
        console.error('PriorProof cloud save failed:', error);
        dispatchSyncStatus('error', error.message || 'Cloud save failed.');
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
  activeUserId = null;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
}
