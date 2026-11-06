import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('repository-root backend starts with supplied PORT, shared imports and production environment', async t => {
  const reservation = createServer().listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const child = spawn(process.execPath, ['server/src/server.js'], {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    env: { ...process.env, NODE_ENV: 'production', CLIENT_ORIGIN: 'https://prep.example', MONGODB_URI: '', PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.resume();
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const closed = once(child, 'close'); child.kill(); await closed;
    }
  });
  for (let i = 0; i < 100 && !output.includes('API listening') && child.exitCode === null; i++) await new Promise(resolve => setTimeout(resolve, 50));
  assert.match(output, new RegExp(`localhost:${port}`), 'API must boot from the complete repository and use the supplied PORT.');
  const response = await fetch(`http://127.0.0.1:${port}/api/health`, { headers: { Origin: 'https://prep.example' } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://prep.example');
  assert.deepEqual(await response.json(), { status: 'ok', service: 'giglink-prep-api', phase: 'P3', database: 'not-configured' });
  const progress = await fetch(`http://127.0.0.1:${port}/api/progress`, { headers: { Authorization: `Bearer ${'a'.repeat(64)}` } });
  assert.equal(progress.status, 503);
});
