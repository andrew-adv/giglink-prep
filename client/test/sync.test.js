import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import { createProgressSync, learnerCredential, learnerKey, syncKey } from '../src/features/progress/sync.js';
import { freshWorkspace, legacyStorageKey, readWorkspace, saveWorkspace, storageKey } from '../src/features/progress/workspace.js';
import { editablePaths } from '../src/features/lab/project.js';
import { projectPaths, validWorkspace, workspaceText } from '../../shared/progress.mjs';
const clone = value => structuredClone(value);
const edited = (text = '// device edit') => { const work = freshWorkspace(); work.codeFiles['/gig.js'] += text; return work; };
const progress = (workspace, revision = 1) => ({ workspace: clone(workspace), revision, createdAt: '2026-11-01T00:00:00.000Z', updatedAt: '2026-11-06T00:00:00.000Z' });
const tick = () => new Promise(resolve => setTimeout(resolve, 10));
async function until(check) { for (let i = 0; i < 80; i++) { if (check()) return; await tick(); } assert.fail('Sync did not reach the expected state'); }
function storageFor(values = {}) {
  const map = new Map(Object.entries(values));
  return { map, getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) };
}
function harness(t, { storage = storageFor(), remote = null, offline = false, local = readWorkspace(storage).workspace, getGate, putGate, canAutoLoad } = {}) {
  const state = { local: clone(local), remote: clone(remote), offline, calls: [], events: [], replacements: 0, failAfterPut: false, getGate, putGate };
  const sync = createProgressSync({ storage, crypto: webcrypto, getWorkspace: () => state.local, canAutoLoad,
    replaceWorkspace: next => {
      if (saveWorkspace(storage, next).startsWith('Not saved')) return false;
      state.local = next; state.replacements++; return true;
    },
    onState: next => { state.view = next; state.events.push(next); }, debounceMs: 5, retryMs: 60000, timeoutMs: 200,
    fetch: async (url, options) => {
      state.calls.push({ url, ...options });
      if (state.offline) throw new Error('offline');
      if (options.method === 'GET' && state.getGate) await state.getGate;
      if (options.method === 'PUT' && state.putGate) await state.putGate;
      if (options.method === 'PUT') {
        const value = JSON.parse(options.body);
        if (value.expectedRevision !== (state.remote?.revision || 0)) return { status: 409, json: async () => ({ progress: clone(state.remote) }) };
        state.remote = progress(value.workspace, value.expectedRevision + 1);
        if (state.failAfterPut) { state.failAfterPut = false; throw new Error('response lost'); }
      }
      return { status: 200, json: async () => ({ progress: clone(state.remote) }) };
    },
  });
  t.after(() => sync.stop());
  state.edit = workspace => { state.local = clone(workspace); saveWorkspace(storage, state.local); sync.changed(); };
  return { state, sync, storage, writes: () => state.calls.filter(call => call.method === 'PUT') };
}

test('secure random credentials are persistent and separate from workspace/theme', () => {
  const storage = storageFor({ [storageKey]: 'retained', 'giglink-prep.theme.v1': 'light' });
  const a = learnerCredential(storage, webcrypto), b = learnerCredential(storageFor(), webcrypto);
  assert.match(a, /^[a-f0-9]{64}$/); assert.notEqual(a, b);
  assert.equal(learnerCredential(storage, { getRandomValues() { throw new Error('should not regenerate'); } }), a);
  assert.equal(storage.getItem(storageKey), 'retained'); assert.equal(storage.getItem('giglink-prep.theme.v1'), 'light');
  assert.deepEqual(projectPaths, editablePaths); assert.equal(validWorkspace(freshWorkspace()), true);
});

test('an empty first visit reads remote before writing, and loads existing code without an initial upload', async t => {
  const { sync, state, writes } = harness(t, { remote: progress(edited('// remote'), 4) });
  sync.start(); await until(() => state.view?.status === 'saved');
  assert.equal(state.replacements, 1); assert.deepEqual(state.local, state.remote.workspace); assert.equal(writes().length, 0);
  assert.equal(state.calls[0].method, 'GET'); assert.ok(!state.calls[0].url.includes(state.calls[0].headers.Authorization.slice(7)));
});

test('fresh empty workspace is not uploaded; changed code debounces and saves only after confirmation', async t => {
  const { sync, state, writes } = harness(t);
  sync.start(); await until(() => state.view?.status === 'local'); assert.equal(writes().length, 0);
  state.edit(edited('// first')); state.edit(edited('// second')); state.edit(edited('// final'));
  assert.equal(state.view.status, 'waiting');
  await until(() => state.view.status === 'saved');
  assert.equal(writes().length, 1); assert.deepEqual(state.remote.workspace, edited('// final'));
  sync.changed(); await tick(); await tick(); assert.equal(writes().length, 1);
});

test('local edits made during delayed hydration cannot be overwritten by the incoming server copy', async t => {
  let release; const gate = new Promise(resolve => { release = resolve; });
  const { sync, state, writes } = harness(t, { remote: progress(edited('// server')), getGate: gate });
  sync.start(); state.edit(edited('// typed while GET pending')); release();
  await until(() => state.view?.status === 'conflict');
  assert.deepEqual(state.local, edited('// typed while GET pending')); assert.equal(state.replacements, 0); assert.equal(writes().length, 0);
});

test('offline edits survive refresh and reconnect safely when remote still equals the saved baseline', async t => {
  const base = edited('// base');
  const storage = storageFor({ [learnerKey]: 'a'.repeat(64), [storageKey]: workspaceText(base), [syncKey]: JSON.stringify({ revision: 2, base }) });
  const first = harness(t, { storage, offline: true, remote: progress(base, 2) });
  first.sync.start(); first.state.edit(edited('// offline work'));
  await until(() => first.state.view?.status === 'waiting'); first.sync.stop();
  assert.deepEqual(readWorkspace(storage).workspace, edited('// offline work'));
  const next = harness(t, { storage, remote: progress(base, 2) });
  next.sync.start(); await until(() => next.state.view?.status === 'saved');
  assert.deepEqual(next.state.remote.workspace, edited('// offline work')); assert.equal(next.state.remote.revision, 3);
  assert.equal(next.state.replacements, 0);
});

test('offline diverging work conflicts after recovery; keeping device uses the latest remote revision', async t => {
  const base = edited('// base'), local = edited('// local'), remote = progress(edited('// other tab'), 3);
  const storage = storageFor({ [learnerKey]: 'a'.repeat(64), [storageKey]: workspaceText(local), [syncKey]: JSON.stringify({ revision: 2, base }) });
  const { sync, state, writes } = harness(t, { storage, remote, offline: true });
  sync.start(); await until(() => state.view?.status === 'waiting'); state.offline = false; sync.retry();
  await until(() => state.view?.status === 'conflict'); assert.equal(writes().length, 0); assert.deepEqual(state.local, local);
  assert.equal(sync.resolve('local'), true); await until(() => state.view?.status === 'saved');
  assert.equal(JSON.parse(writes()[0].body).expectedRevision, 3); assert.equal(state.remote.revision, 4);
  const recovery = JSON.parse(storage.getItem(syncKey)).recovery;
  assert.deepEqual(recovery, { local, remote });
});

test('loading a conflicting remote preserves both earlier copies, restores on refresh, and does not upload it again', async t => {
  const local = edited('// device'), remote = progress(edited('// server'), 6);
  const storage = storageFor({ [storageKey]: workspaceText(local) });
  const first = harness(t, { storage, remote }); first.sync.start();
  await until(() => first.state.view?.status === 'conflict');
  assert.equal(first.sync.resolve('remote'), true); assert.deepEqual(first.state.local, remote.workspace);
  assert.deepEqual(readWorkspace(storage).workspace, remote.workspace); assert.equal(first.writes().length, 0); first.sync.stop();
  const next = harness(t, { storage, remote }); next.sync.start(); await until(() => next.state.view?.status === 'saved');
  assert.deepEqual(next.state.view.recovery, { local, remote }); assert.equal(next.writes().length, 0);
});

test('a 409 received during PUT preserves code and requires a new explicit choice', async t => {
  const base = freshWorkspace();
  const { sync, state, writes } = harness(t, { remote: progress(base, 1) });
  sync.start(); await until(() => state.view?.status === 'saved');
  state.remote = progress(edited('// another tab'), 2); state.edit(edited('// this tab'));
  await until(() => state.view?.status === 'conflict');
  assert.equal(writes().length, 1); assert.deepEqual(state.local, edited('// this tab'));
  state.remote = progress(edited('// changed again'), 3);
  sync.resolve('local'); await until(() => writes().length === 2 && state.view?.status === 'conflict');
  assert.deepEqual(state.view.conflict.progress, state.remote); assert.deepEqual(state.local, edited('// this tab'));
});

test('missing or older server revisions never silently replace newer device code', async t => {
  for (const remote of [null, progress(edited('// older'), 1)]) {
    const base = edited('// newest');
    const storage = storageFor({ [learnerKey]: 'a'.repeat(64), [storageKey]: workspaceText(base), [syncKey]: JSON.stringify({ revision: 5, base }) });
    const { sync, state, writes } = harness(t, { storage, remote }); sync.start(); await until(() => state.view?.status === 'conflict');
    assert.deepEqual(state.local, base); assert.equal(writes().length, 0);
    if (!remote) { assert.equal(sync.resolve('remote'), false); assert.equal(sync.resolve('local'), true); await until(() => state.view?.status === 'saved'); assert.equal(state.remote.revision, 1); }
  }
});

test('lost acknowledgement recovers with GET rather than blind retrying PUT', async t => {
  const { sync, state, writes } = harness(t);
  sync.start(); await until(() => state.view?.status === 'local');
  state.failAfterPut = true; state.edit(edited('// save reached DB but response lost'));
  await until(() => writes().length === 1 && state.view?.status === 'waiting');
  sync.retry(); await until(() => state.view?.status === 'saved');
  assert.equal(writes().length, 1); assert.deepEqual(state.calls.map(call => call.method), ['GET', 'PUT', 'GET']);
});

test('edits during an in-flight save produce one follow-up save of the latest snapshot', async t => {
  let release; const gate = new Promise(resolve => { release = resolve; });
  const { sync, state, writes } = harness(t, { putGate: gate });
  sync.start(); await until(() => state.view?.status === 'local'); state.edit(edited('// first'));
  await until(() => writes().length === 1); state.edit(edited('// latest')); release();
  await until(() => state.view?.status === 'saved'); assert.equal(writes().length, 2); assert.deepEqual(state.remote.workspace, edited('// latest'));
});

test('P1 migration sync retains original backup, all code, completions, selected lesson and attempts', async t => {
  const work = edited('// P1 work');
  const p1 = { ...work, version: 1, codeFiles: Object.fromEntries(Object.entries(work.codeFiles).slice(0, 3)), completed: [1, 2], currentLesson: 3, attempts: { 1: 2, 2: 4, 3: 1 } };
  const bytes = JSON.stringify(p1), storage = storageFor({ [legacyStorageKey]: bytes });
  const { sync, state } = harness(t, { storage }); sync.start(); await until(() => state.view?.status === 'saved');
  assert.equal(storage.getItem(legacyStorageKey), bytes); assert.deepEqual(state.remote.workspace, readWorkspace(storage).workspace);
  assert.deepEqual(state.remote.workspace.completed, [1, 2]); assert.equal(state.remote.workspace.attempts[2], 4); assert.equal(state.remote.workspace.currentLesson, 3);
});

test('blocked storage disables sync; full storage refuses a destructive conflict choice; oversize code never uploads', async t => {
  const blocked = harness(t, { storage: { getItem() { throw new Error('blocked'); } }, local: freshWorkspace() }); blocked.sync.start();
  assert.equal(blocked.state.view.status, 'local'); assert.equal(blocked.state.calls.length, 0);
  const full = harness(t, { storage: storageFor({ [storageKey]: workspaceText(edited()) }), remote: progress(edited('// server')) });
  full.sync.start(); await until(() => full.state.view?.status === 'conflict'); full.storage.setItem = () => { throw new Error('full'); };
  assert.equal(full.sync.resolve('remote'), false); assert.deepEqual(full.state.local, edited());
  const big = harness(t); big.sync.start(); await until(() => big.state.view?.status === 'local');
  big.state.edit(edited('x'.repeat(50001))); await until(() => big.state.view?.status === 'local'); assert.equal(big.writes().length, 0);
});

test('corrupt metadata conflicts safely; stopping aborts late hydration and pending saves', async t => {
  const storage = storageFor({ [storageKey]: workspaceText(edited()), [learnerKey]: 'a'.repeat(64), [syncKey]: '{broken' });
  const current = harness(t, { storage, remote: progress(edited('// server')) }); current.sync.start(); await until(() => current.state.view?.status === 'conflict');
  let release; const gate = new Promise(resolve => { release = resolve; });
  const late = harness(t, { remote: progress(edited('// server')), getGate: gate }); late.sync.start(); late.sync.stop(); release(); await tick();
  assert.equal(late.state.replacements, 0); assert.equal(late.writes().length, 0);
});

test('a failed device write cannot replace local code or advance its remote baseline', async t => {
  const local = edited('// keep me'), storage = storageFor({ [storageKey]: workspaceText(local) });
  const { sync, state } = harness(t, { storage, remote: progress(edited('// server'), 4) });
  sync.start(); await until(() => state.view?.status === 'conflict');
  const write = storage.setItem;
  storage.setItem = (key, value) => { if (key === storageKey) throw new Error('quota'); write(key, value); };
  assert.equal(sync.resolve('remote'), false); assert.deepEqual(state.local, local); assert.equal(state.replacements, 0);
  assert.equal(JSON.parse(storage.getItem(syncKey)).revision, 0);
  assert.deepEqual(readWorkspace(storage).workspace, local);
});

test('unsaved device edits are not uploaded and acknowledged as a durable baseline', async t => {
  const base = edited('// saved'), storage = storageFor({ [storageKey]: workspaceText(base) });
  const { sync, state, writes } = harness(t, { storage, remote: progress(base) });
  sync.start(); await until(() => state.view?.status === 'saved');
  const write = storage.setItem;
  storage.setItem = (key, value) => { if (key === storageKey) throw new Error('transient storage failure'); write(key, value); };
  state.edit(edited('// in memory only')); await until(() => state.view?.status === 'local');
  assert.equal(writes().length, 0); assert.deepEqual(JSON.parse(storage.getItem(syncKey)).base, base);
});

test('an open editor requires a choice instead of automatic hydration, protecting pending editor changes', async t => {
  const { sync, state, writes } = harness(t, { remote: progress(edited('// server copy')), canAutoLoad: () => false });
  sync.start(); await until(() => state.view?.status === 'conflict');
  assert.equal(state.replacements, 0); assert.equal(writes().length, 0);
});
