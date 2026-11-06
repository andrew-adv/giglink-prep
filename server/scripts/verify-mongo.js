// Opt-in real-database check. Never prints the URI, token, driver errors or saved code.
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { createDatabase } from '../src/db.js';
import { LearnerProgress } from '../src/models/LearnerProgress.js';
import { freshWorkspace } from '../../client/src/features/progress/workspace.js';

const token = randomBytes(32).toString('hex'), other = randomBytes(32).toString('hex');
const id = createHash('sha256').update(token).digest('hex');
let server, database, base;
async function open() {
  database = createDatabase({ log: { info() {}, warn() {} } });
  database.start();
  for (let i = 0; i < 60 && database.state() !== 'connected'; i++) await new Promise(resolve => setTimeout(resolve, 100));
  if (database.state() !== 'connected') throw new Error('Connection unavailable');
  server = createApp({ database }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}/api`;
}
async function close() {
  if (server) { await new Promise(resolve => { server.close(resolve); server.closeIdleConnections(); }); server = null; }
  await database?.stop();
}
async function request(method, payload, credential = token) {
  const response = await fetch(`${base}/progress`, { method, headers: { Authorization: `Bearer ${credential}`, 'Content-Type': 'application/json' }, body: payload ? JSON.stringify(payload) : undefined });
  return { status: response.status, ...await response.json() };
}
try {
  if (!process.env.MONGODB_URI) throw new Error('Missing configuration');
  await open();
  const workspace = freshWorkspace(); workspace.codeFiles['/gig.js'] += '\n// temporary persistence verification';
  const created = await request('PUT', { workspace, expectedRevision: 0 });
  assert.equal(created.status, 201); assert.equal(created.progress.revision, 1);
  assert.deepEqual((await request('GET')).progress.workspace, workspace);
  assert.equal((await request('GET', undefined, other)).progress, null);
  workspace.attempts[1] = 2;
  const saved = await request('PUT', { workspace, expectedRevision: 1 });
  assert.equal(saved.progress.revision, 2);
  const raced = await Promise.all([request('PUT', { workspace, expectedRevision: 2 }), request('PUT', { workspace, expectedRevision: 2 })]);
  assert.deepEqual(raced.map(result => result.status).sort(), [200, 409]);
  console.log('PASS: MongoDB create/read/update, anonymous isolation, and atomic revision conflict.');
  await close();
  await open();
  const restored = await request('GET');
  assert.equal(restored.progress.revision, 3); assert.deepEqual(restored.progress.workspace, workspace);
  assert.ok(await LearnerProgress.findById(id).lean());
  console.log('PASS: HTTP API and database connection reopened; the same saved document remains in giglink_prep.');
} catch {
  console.error('FAIL: Real MongoDB persistence verification did not complete. Check the private server environment, database permissions and network access.');
  process.exitCode = 1;
} finally {
  if (database?.state() === 'connected') {
    try { await LearnerProgress.deleteOne({ _id: id }); }
    catch { console.error('Temporary verification document cleanup failed in giglink_prep.'); process.exitCode = 1; }
  }
  await close();
}
