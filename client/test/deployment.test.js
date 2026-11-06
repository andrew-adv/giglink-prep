import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { getApiBaseUrl } from '../src/config/api-url.js';

test('production API URL is required, HTTPS, public, credential-free and ends in /api', () => {
  assert.equal(getApiBaseUrl({ PROD: true, VITE_API_BASE_URL: 'https://prep-api.example/api/' }), 'https://prep-api.example/api');
  for (const value of [undefined, '', 'http://localhost:5000/api', 'https://localhost/api', 'https://127.0.0.1/api', 'https://[::1]/api', 'http://prep-api.example/api', 'https://prep-api.example', 'https://prep-api.example/api?token=private', 'https://prep-api.example/api#private', 'https://user:private@prep-api.example/api', 'not a URL']) {
    assert.throws(() => getApiBaseUrl({ PROD: true, VITE_API_BASE_URL: value }), error => error.message.includes('VITE_API_BASE_URL') && !error.message.includes('private'));
  }
});

test('local development retains localhost fallback and explicit API configuration', () => {
  assert.equal(getApiBaseUrl({}), 'http://localhost:5000/api');
  assert.equal(getApiBaseUrl({ VITE_API_BASE_URL: 'http://127.0.0.1:5000/api' }), 'http://127.0.0.1:5000/api');
});

test('retained SPA rewrite sends each release deep link to index.html', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  for (const route of ['/lessons/1', '/lessons/6', '/replay', '/questions', '/chapters/1', '/presentation', '/presentation/practice']) {
    const match = config.rewrites.find(rule => new RegExp(`^${rule.source}$`).test(route));
    assert.equal(match?.destination, '/index.html', route);
  }
});
