import { bodyLimit, tokenPattern, validProgress, validWorkspace, workspaceText } from '../../../../shared/progress.mjs';
import { freshWorkspace, legacyStorageKey, readWorkspace, storageKey } from './workspace.js';
import { getApiBaseUrl } from '../../config/api-url.js';

export const learnerKey = 'giglink-prep.learner.v1';
export const syncKey = 'giglink-prep.sync.v1';
const same = (a, b) => workspaceText(a) === workspaceText(b);
const clone = value => JSON.parse(JSON.stringify(value));

export function learnerCredential(storage, crypto) {
  const existing = storage.getItem(learnerKey);
  if (tokenPattern.test(existing || '')) return existing;
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  storage.setItem(learnerKey, token);
  storage.removeItem(syncKey);
  return token;
}

// Owns network scheduling only. The existing provider still saves every local edit.
export function createProgressSync({ storage, crypto, getWorkspace, replaceWorkspace, onState, canAutoLoad = () => true, fetch: request = globalThis.fetch, baseUrl = getApiBaseUrl(), debounceMs = 900, retryMs = 30000, timeoutMs = 10000, schedule = setTimeout, cancel = clearTimeout }) {
  let token, base = null, revision = 0, hydrated = false, stopped = false, busy = false;
  let timer, controller, conflict = null, recovery = null, fault = false;
  const emit = (status, message) => { if (!stopped) onState({ status, message, conflict, recovery }); };
  const remember = () => {
    try { storage.setItem(syncKey, JSON.stringify({ revision, base, recovery })); return true; }
    catch { return false; }
  };
  function later(delay) {
    cancel(timer);
    timer = schedule(() => { timer = null; void synchronize(); }, delay);
    timer?.unref?.();
  }
  async function api(method, body) {
    controller = new AbortController();
    const deadline = schedule(() => controller?.abort(), timeoutMs);
    try {
      const response = await request(`${baseUrl.replace(/\/$/, '')}/progress`, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: controller.signal, cache: 'no-store' });
      const data = await response.json();
      if (![200, 201, 409].includes(response.status) || !(data.progress === null || validProgress(data.progress))) throw new Error('Unavailable');
      return { conflict: response.status === 409, progress: data.progress };
    } finally { cancel(deadline); controller = null; }
  }
  function showConflict(remote) {
    conflict = { progress: clone(remote) };
    recovery = { local: clone(getWorkspace()), remote: clone(remote) };
    const kept = remember();
    emit('conflict', kept ? 'Two versions need your choice. Both copies are kept on this device.' : 'Two versions need your choice. Storage is full; download both copies.');
  }
  function reconcile(remote) {
    const local = getWorkspace();
    if (remote && remote.revision < revision) { showConflict(remote); return; }
    if (!remote) {
      // A previously confirmed server document disappearing is also a conflict.
      if (revision > 0) { showConflict(null); return; }
      base = base || freshWorkspace(); revision = 0; hydrated = true;
      remember(); return;
    }
    if (same(local, remote.workspace)) {
      base = remote.workspace; revision = remote.revision; hydrated = true; remember();
    } else if (canAutoLoad() && ((base && same(local, base)) || (!base && !storage.getItem(storageKey) && !storage.getItem(legacyStorageKey) && same(local, freshWorkspace())))) {
      // This synchronous decision uses the latest workspace, including edits during GET.
      if (replaceWorkspace(clone(remote.workspace)) === false) throw new Error('Cannot keep remote work locally');
      base = remote.workspace; revision = remote.revision; hydrated = true; remember();
    } else if (base && remote.revision === revision && same(remote.workspace, base)) {
      hydrated = true; // Only the device changed since the last acknowledgement.
    } else showConflict(remote);
  }
  async function synchronize() {
    if (stopped || busy || conflict !== null || fault) return;
    busy = true;
    try {
      emit('syncing', 'Saved on this device · checking server…');
      // Always GET after an outage before PUT, including an ambiguous lost response.
      if (!hydrated) {
        const result = await api('GET');
        if (stopped) return;
        reconcile(result.progress);
        if (conflict !== null || !hydrated) return;
      }
      const local = clone(getWorkspace());
      if (base && same(local, base)) {
        emit(revision ? 'saved' : 'local', revision ? 'Saved on this device and server' : 'Saved on this device');
        return;
      }
      if (!validWorkspace(local) || new TextEncoder().encode(JSON.stringify({ workspace: local, expectedRevision: revision })).length > bodyLimit) {
        emit('local', 'Saved on this device · this workspace exceeds server limits.');
        return;
      }
      if (!same(readWorkspace(storage).workspace, local)) {
        emit('local', 'Not synced · device saving needs attention. Keep this tab open and copy your code.');
        return;
      }
      const result = await api('PUT', { workspace: local, expectedRevision: revision });
      if (stopped) return;
      if (result.conflict) { showConflict(result.progress); return; }
      if (!result.progress || !same(result.progress.workspace, local)) throw new Error('Unconfirmed save');
      base = result.progress.workspace; revision = result.progress.revision;
      remember();
      if (!same(getWorkspace(), base)) { emit('waiting', 'Saved on this device · waiting to sync latest edits'); later(debounceMs); }
      else emit('saved', 'Saved on this device and server');
    } catch {
      hydrated = false;
      emit('waiting', 'Saved on this device · waiting to sync');
      if (!stopped) later(retryMs);
    } finally { busy = false; }
  }
  try {
    token = learnerCredential(storage, crypto);
    try {
      const saved = JSON.parse(storage.getItem(syncKey));
      if (saved && validWorkspace(saved.base) && Number.isSafeInteger(saved.revision) && saved.revision >= 0) {
        base = saved.base; revision = saved.revision;
        if (saved.recovery && validWorkspace(saved.recovery.local) && (saved.recovery.remote === null || validProgress(saved.recovery.remote))) recovery = saved.recovery;
      }
    } catch { /* A missing/corrupt baseline requires reconciliation, never blind upload. */ }
  } catch { fault = true; }

  return {
    start() {
      if (fault) emit('local', 'Saved on this device · sync needs browser storage and secure random numbers.');
      else void synchronize();
    },
    changed() {
      if (stopped || fault) return;
      if (conflict !== null) { emit('conflict', 'Two versions need your choice. Your latest device edits are kept.'); return; }
      emit('waiting', 'Saved on this device · waiting to sync');
      later(debounceMs);
    },
    retry() { if (!stopped && !fault && conflict === null) { cancel(timer); hydrated = false; void synchronize(); } },
    resolve(choice) {
      if (conflict === null || !['local', 'remote'].includes(choice)) return false;
      const remote = conflict.progress;
      if (choice === 'remote' && !remote) return false;
      // Keep both copies before either choice. If storage is full, refuse destructive replacement.
      recovery = { local: clone(getWorkspace()), remote: clone(remote) };
      if (!remember()) { emit('conflict', 'Could not keep both copies. Download them before freeing browser storage.'); return false; }
      if (choice === 'remote') {
        if (replaceWorkspace(clone(remote.workspace)) === false) {
          emit('conflict', 'Could not save the server copy on this device. Download both copies before freeing storage.'); return false;
        }
      }
      base = remote?.workspace || freshWorkspace(); revision = remote?.revision || 0;
      conflict = null; hydrated = true;
      remember();
      if (choice === 'remote') {
        emit('saved', 'Loaded the server copy · both earlier copies are kept in recovery');
      } else { emit('waiting', 'Device copy selected · waiting for server confirmation'); later(debounceMs); }
      return true;
    },
    stop() { stopped = true; cancel(timer); controller?.abort(); },
  };
}
