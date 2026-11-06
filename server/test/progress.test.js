import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { createApp } from '../src/app.js';
import { createProgressStore } from '../src/progress-store.js';
import { createDatabase } from '../src/db.js';
import { LearnerProgress } from '../src/models/LearnerProgress.js';
import { freshWorkspace } from '../../client/src/features/progress/workspace.js';
import { bodyLimit } from '../../shared/progress.mjs';

const token = 'a'.repeat(64), other = 'b'.repeat(64);
const hash = value => createHash('sha256').update(value).digest('hex');
const copy = value => structuredClone(value);
function memoryStore() {
  const docs = new Map();
  return {
    docs,
    async read(id) { return copy(docs.get(id) || null); },
    async write(id, workspace, expectedRevision) {
      const current = docs.get(id);
      if ((current?.revision || 0) !== expectedRevision) return null;
      const now = new Date().toISOString();
      const progress = { workspace: copy(workspace), revision: expectedRevision + 1, createdAt: current?.createdAt || now, updatedAt: now };
      docs.set(id, progress); return copy(progress);
    },
  };
}
async function setup(t, options = {}) {
  const store = options.store || memoryStore();
  const server = createApp({ store, database: { state: () => 'connected' }, ...options }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeIdleConnections(); }));
  const url = `http://127.0.0.1:${server.address().port}/api/progress`;
  const request = async (method = 'GET', data, credential = token, raw = false) => {
    const response = await fetch(url, { method, headers: { Authorization: `Bearer ${credential}`, ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: data === undefined ? undefined : raw ? data : JSON.stringify(data) });
    return { status: response.status, body: await response.json(), headers: response.headers };
  };
  return { request, store, url };
}

test('progress create/read/update uses revisions, timestamps, no-store, and learner isolation', async t => {
  const { request, store } = await setup(t);
  assert.deepEqual((await request()).body, { progress: null });
  const workspace = freshWorkspace(); workspace.codeFiles['/gig.js'] += '// retained code';
  const created = await request('PUT', { workspace, expectedRevision: 0 });
  assert.equal(created.status, 201); assert.equal(created.body.progress.revision, 1);
  assert.equal(created.headers.get('cache-control'), 'no-store');
  assert.deepEqual((await request()).body.progress.workspace, workspace);
  assert.ok(created.body.progress.createdAt); assert.ok(created.body.progress.updatedAt);
  assert.deepEqual((await request('GET', undefined, other)).body, { progress: null });
  assert.deepEqual([...store.docs.keys()], [hash(token)]);
  assert.ok(!JSON.stringify(created.body).includes(token));
  workspace.attempts[1] = 2;
  const updated = await request('PUT', { workspace, expectedRevision: 1 });
  assert.equal(updated.status, 200); assert.equal(updated.body.progress.revision, 2);
  assert.equal(updated.body.progress.createdAt, created.body.progress.createdAt);
  const stale = await request('PUT', { workspace: freshWorkspace(), expectedRevision: 1 });
  assert.equal(stale.status, 409); assert.deepEqual(stale.body.progress, updated.body.progress);
  const duplicate = await request('PUT', { workspace: freshWorkspace(), expectedRevision: 0 });
  assert.equal(duplicate.status, 409);
  assert.equal((await request('GET', undefined, other)).body.progress, null);
});

test('simultaneous saves at one revision cannot both succeed', async t => {
  const { request } = await setup(t);
  const payload = { workspace: freshWorkspace(), expectedRevision: 0 };
  await request('PUT', payload);
  const results = await Promise.all([request('PUT', { ...payload, expectedRevision: 1 }), request('PUT', { ...payload, expectedRevision: 1 })]);
  assert.deepEqual(results.map(x => x.status).sort(), [200, 409]);
});

test('invalid credentials, malformed/unknown fields, operators and code-file keys are rejected', async t => {
  const { request, store, url } = await setup(t);
  for (const invalid of ['', '1', '1234', 'a'.repeat(63), 'A'.repeat(64), 'a'.repeat(65), '$ne', 'a'.repeat(63) + '!']) {
    const result = await request('GET', undefined, invalid);
    assert.equal(result.status, 401); assert.ok(!JSON.stringify(result.body).includes(invalid || 'Bearer'));
  }
  const missing = await fetch(url); assert.equal(missing.status, 401);
  const valid = { workspace: freshWorkspace(), expectedRevision: 0 };
  const mutations = [
    x => { x.extra = true; }, x => { x.$set = {}; }, x => { x.expectedRevision = -1; }, x => { x.expectedRevision = '0'; },
    x => { x.expectedRevision = Number.MAX_SAFE_INTEGER; }, x => { x.workspace.version = 1; },
    x => { x.workspace.currentLesson = 7; }, x => { x.workspace.completed = [1, 1]; }, x => { x.workspace.completed = ['1']; },
    x => { x.workspace.attempts[1] = 1.5; }, x => { x.workspace.attempts[2] = -1; }, x => { x.workspace.attempts[3] = 1000001; },
    x => { x.workspace.attempts[7] = 0; }, x => { delete x.workspace.attempts[6]; }, x => { x.workspace.extra = 'x'; },
    x => { x.workspace.codeFiles['/steal.js'] = 'x'; }, x => { delete x.workspace.codeFiles['/apply.js']; },
    x => { x.workspace.codeFiles['/gig.js'] = { $ne: '' }; }, x => { x.workspace.codeFiles['/gig.js'] = 'x'.repeat(50001); },
    x => { x.workspace.codeFiles = []; }, x => { x.workspace = null; },
  ];
  for (const mutate of mutations) { const value = copy(valid); mutate(value); assert.equal((await request('PUT', value)).status, 400); }
  for (const raw of ['{', '[]', 'null', JSON.stringify(valid).replace('"version":2', '"__proto__":{},"version":2')]) assert.equal((await request('PUT', raw, token, true)).status, 400);
  assert.equal((await request('PUT', '{"padding":"' + 'x'.repeat(bodyLimit) + '"}', token, true)).status, 413);
  assert.equal(store.docs.size, 0);
});

test('missing/disconnected database and internal exceptions return safe responses without secrets', async t => {
  for (const state of ['not-configured', 'unavailable']) {
    const { request, url } = await setup(t, { database: { state: () => state } });
    const health = await fetch(url.replace('/progress', '/health'));
    assert.equal(health.status, 200); assert.equal((await health.json()).database, state);
    assert.equal((await request()).status, 503);
    assert.equal((await request('PUT', { workspace: freshWorkspace(), expectedRevision: 0 })).status, 503);
  }
  const { request } = await setup(t, { store: { read() { throw new Error(`secret-uri ${token}`); } } });
  const result = await request(); assert.equal(result.status, 503);
  assert.ok(!JSON.stringify(result.body).includes('secret-uri')); assert.ok(!JSON.stringify(result.body).includes(token));
});

test('Mongoose adapter uses atomic revision predicates, a unique id, and never accepts update operators from callers', async () => {
  const workspace = freshWorkspace(), stamp = new Date();
  let called;
  const query = result => ({ lean() { return this; }, async exec() { return result; } });
  const Model = {
    async create(doc) { called = doc; return { ...doc, createdAt: stamp, updatedAt: stamp }; },
    findById(id) { called = id; return query(null); },
    findOneAndUpdate(filter, update, options) { called = { filter, update, options }; return query(null); },
  };
  const store = createProgressStore(Model);
  assert.equal((await store.write(hash(token), workspace, 0)).revision, 1);
  assert.deepEqual(called, { _id: hash(token), workspace, revision: 1 });
  assert.equal(await store.write(hash(token), workspace, 3), null);
  assert.deepEqual(called, { filter: { _id: hash(token), revision: 3 }, update: { $set: { workspace }, $inc: { revision: 1 } }, options: { new: true, runValidators: true } });
  Model.create = async () => { throw Object.assign(new Error('duplicate'), { code: 11000 }); };
  assert.equal(await store.write(hash(token), workspace, 0), null);
  Model.create = async () => { throw new Error('not a duplicate'); };
  await assert.rejects(store.write(hash(token), workspace, 0));
  assert.equal(await store.read(hash(token)), null);
  const doc = new LearnerProgress({ _id: hash(token), workspace, revision: 1 });
  await doc.validate();
  doc.workspace = { $set: {} }; await assert.rejects(doc.validate());
  assert.equal(LearnerProgress.schema.options.bufferCommands, false);
  assert.equal(LearnerProgress.schema.path('_id').instance, 'String');
});

test('database startup failure, retry and shutdown keep driver errors private', async () => {
  const messages = [], driver = { connection: { readyState: 0 }, connect: async () => { throw new Error('mongodb://private'); }, disconnect: async () => { driver.stopped = true; } };
  const absent = createDatabase({ uri: '', driver });
  absent.start(); assert.equal(absent.state(), 'not-configured'); await absent.stop();
  let calls = 0;
  driver.connect = async (_uri, options) => {
    calls++; assert.equal(options.bufferCommands, false);
    if (calls === 1) throw new Error('secret database credential');
    driver.connection.readyState = 1;
  };
  const db = createDatabase({ uri: 'private', driver, retryMs: 1, log: { warn: x => messages.push(x), info: x => messages.push(x) } });
  db.start();
  await new Promise(resolve => setTimeout(resolve, 15));
  assert.equal(db.state(), 'connected'); assert.equal(calls, 2);
  assert.ok(!messages.join('').includes('secret')); await db.stop(); assert.equal(driver.stopped, true);
});
