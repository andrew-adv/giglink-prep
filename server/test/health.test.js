import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createApp } from '../src/app.js';

test('health reports P0 and allows the configured frontend origin', async (t) => {
  const origin = 'http://localhost:5173';
  const server = createApp({ clientOrigin: origin }).listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;

  const response = await fetch(`${base}/api/health`, { headers: { Origin: origin } });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.equal(response.headers.get('access-control-allow-origin'), origin);
  assert.deepEqual(await response.json(), { status: 'ok', service: 'giglink-prep-api', phase: 'P0' });

  const missing = await fetch(`${base}/api/missing`);
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: 'Route not found' });

  const otherOrigin = await fetch(`${base}/api/health`, { headers: { Origin: 'https://unlisted.example' } });
  assert.notEqual(otherOrigin.headers.get('access-control-allow-origin'), 'https://unlisted.example');
});
