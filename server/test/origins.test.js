import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { clientOrigins } from '../src/origins.js';
import { createApp } from '../src/app.js';

test('production origin configuration rejects missing, wildcard, insecure or non-origin values', () => {
  for (const clientOrigin of [undefined, '', '*', 'https://*.vercel.app', 'http://prep.example', 'https://prep.example/', 'https://prep.example/path', 'https://prep.example?x=1', 'https://user:private@prep.example']) {
    assert.throws(() => clientOrigins({ nodeEnv: 'production', clientOrigin }), error => error.message.includes('CLIENT_ORIGIN') && !error.message.includes('private'));
  }
});

test('production CORS permits exactly the configured origin; development also permits local dev/preview', async t => {
  const configured = 'https://prep.example';
  for (const nodeEnv of ['production', 'development']) {
    const server = createApp({ clientOrigin: configured, nodeEnv }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    t.after(() => new Promise(resolve => { server.close(resolve); server.closeIdleConnections(); }));
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const origin of [configured, 'https://prep.example.attacker.example', 'https://preview.prep.example', 'https://other.example', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173']) {
      const allowed = origin === configured || (nodeEnv === 'development' && origin.startsWith('http://'));
      const response = await fetch(`${base}/api/health`, { headers: { Origin: origin } });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('access-control-allow-origin'), allowed ? origin : null, `${nodeEnv}: ${origin}`);
      const preflight = await fetch(`${base}/api/progress`, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'authorization,content-type' } });
      assert.equal(preflight.headers.get('access-control-allow-origin'), allowed ? origin : null);
      if (allowed) assert.equal(preflight.status, 204);
    }
  }
});
