import assert from 'node:assert/strict';
import test from 'node:test';
import { changeFiles, freshWorkspace, readWorkspace, recordChecks, saveWorkspace, storageKey } from '../src/features/progress/workspace.js';
import { requiredCheckIds } from '../src/features/lab/checks.js';
import { isCurrentReport } from '../src/features/lab/report.js';

const passingChecks = () => requiredCheckIds(3).map((id) => ({ id, passed: true }));
function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('save then reload restores code, completion, selected lesson, and attempts', () => {
  const storage = memoryStorage();
  let workspace = freshWorkspace();
  workspace.codeFiles['/gig.js'] = '// retained event code';
  workspace.currentLesson = 3;
  workspace.attempts[3] = 4;
  workspace = recordChecks(workspace, 3, passingChecks());
  assert.equal(saveWorkspace(storage, workspace), 'Saved on this device');
  assert.deepEqual(readWorkspace(storage).workspace, workspace);
  assert.deepEqual(readWorkspace(storage).workspace.completed, [1, 2, 3]);
});

test('editing a file invalidates only it and downstream completion; no-op edits keep state', () => {
  const initial = recordChecks(freshWorkspace(), 3, passingChecks());
  assert.equal(changeFiles(initial, initial.codeFiles), initial);
  for (const [path, expected] of [['/gig.js', []], ['/validate.js', [1]], ['/publish.js', [1, 2]]]) {
    const updated = changeFiles(initial, { ...initial.codeFiles, [path]: '// changed' });
    assert.deepEqual(updated.completed, expected);
    for (const other of Object.keys(initial.codeFiles).filter((file) => file !== path)) assert.equal(updated.codeFiles[other], initial.codeFiles[other]);
  }
});

test('a failure in an earlier stage cannot award later completion', () => {
  const checks = passingChecks(); checks.find((check) => check.id === 'validate-valid').passed = false;
  assert.deepEqual(recordChecks(freshWorkspace(), 3, checks).completed, [1]);
  assert.deepEqual(recordChecks(freshWorkspace(), 3, []).completed, []);
});

test('corrupt saves are preserved on read; blocked storage and large files report unsaved', () => {
  const storage = memoryStorage(); storage.setItem(storageKey, '{broken');
  assert.deepEqual(readWorkspace(storage).workspace, freshWorkspace());
  assert.equal(storage.getItem(storageKey), '{broken');
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); } };
  assert.match(readWorkspace(blocked).message, /Could not read/);
  assert.match(saveWorkspace(blocked, freshWorkspace()), /Not saved/);
  const huge = freshWorkspace(); huge.codeFiles['/gig.js'] = 'a'.repeat(50001);
  assert.match(saveWorkspace(storage, huge), /Not saved/);
});

test('unsupported workspace data does not restore forged completion or non-project files', () => {
  for (const patch of [{ version: 99 }, { completed: [99] }, { currentLesson: 7 }, { attempts: {} }, { codeFiles: {} }]) {
    const storage = memoryStorage(); storage.setItem(storageKey, JSON.stringify({ ...freshWorkspace(), ...patch }));
    assert.deepEqual(readWorkspace(storage).workspace, freshWorkspace());
  }
  const storage = memoryStorage();
  const value = freshWorkspace(); value.codeFiles['/extra.js'] = 'unrelated';
  storage.setItem(storageKey, JSON.stringify(value));
  assert.equal(readWorkspace(storage).workspace.codeFiles['/extra.js'], undefined);
});

test('only current, complete reports from the actual sandbox frame are accepted', () => {
  const frame = { src: 'https://2-19-8-sandpack.codesandbox.io/', contentWindow: {} };
  const run = { id: 'current', through: 3 };
  const event = { source: frame.contentWindow, origin: new URL(frame.src).origin, data: { kind: 'giglink-prep:checks', runId: 'current', through: 3, checks: passingChecks() } };
  assert.equal(isCurrentReport(event, frame, run), true);
  for (const patch of [{ source: {} }, { origin: 'https://untrusted.example' }, { data: { ...event.data, runId: 'old' } }, { data: { ...event.data, checks: [] } }, { data: { ...event.data, through: 1 } }]) assert.equal(isCurrentReport({ ...event, ...patch }, frame, run), false);
  assert.equal(isCurrentReport(event, frame, null), false);
  assert.equal(isCurrentReport({ ...event, data: { ...event.data, checks: passingChecks().map(() => null) } }, frame, run), false);
  assert.equal(isCurrentReport({ ...event, origin: 'null' }, { ...frame, src: 'about:blank' }, run), false);
});
