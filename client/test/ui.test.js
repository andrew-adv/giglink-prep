import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { act, createElement as h } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { walkthroughs } from '../src/features/guided/walkthroughs.js';
import { exampleSolutions, scenarios, starterFiles } from '../src/features/lab/project.js';
import { storyOptions } from '../src/features/lab/story-project.js';
import { renderRunner } from './helpers/fixtures.js';
import { sandboxCompiler } from './helpers/sandbox-compiler.js';
import { freshWorkspace, legacyStorageKey, storageKey } from '../src/features/progress/workspace.js';
import { themeStorageKey } from '../src/features/theme/theme.js';
import { learnerKey, syncKey } from '../src/features/progress/sync.js';

let dom, server, createRoot, ThemeProvider, ThemeSwitcher, WorkspaceProvider, useWorkspace, SyncStatus, LabPage, App;
let systemDark = false;
const mediaListeners = new Set();
before(async () => {
  dom = new JSDOM('<!doctype html><html><head><meta name="theme-color"></head><body></body></html>', { url: 'http://localhost:5173', pretendToBeVisual: true });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.fetch = async () => ({ status: 503, ok: false, json: async () => ({ error: 'Storage unavailable' }) });
  window.scrollTo = () => {};
  window.matchMedia = () => ({ get matches() { return systemDark; }, addEventListener: (_type, fn) => mediaListeners.add(fn), removeEventListener: (_type, fn) => mediaListeners.delete(fn) });
  // jsdom is not a browser: model open/close only; native focus trapping remains manual QA.
  window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  ({ createRoot } = await import('react-dom/client'));
  server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, plugins: [react()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, watch: { ignored: ['**/*'] } }, appType: 'custom' });
  ({ ThemeProvider, ThemeSwitcher } = await server.ssrLoadModule('/src/features/theme/ThemeProvider.jsx'));
  ({ WorkspaceProvider, useWorkspace } = await server.ssrLoadModule('/src/features/progress/WorkspaceProvider.jsx'));
  ({ default: SyncStatus } = await server.ssrLoadModule('/src/features/progress/SyncStatus.jsx'));
  ({ default: LabPage } = await server.ssrLoadModule('/src/features/lab/LabPage.jsx'));
  ({ default: App } = await server.ssrLoadModule('/src/app/App.jsx'));
});
after(async () => { await server?.close(); dom?.window.close(); delete globalThis.window; delete globalThis.document; delete globalThis.HTMLElement; delete globalThis.IS_REACT_ACT_ENVIRONMENT; });

async function mount(element) {
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(element));
  return { container, unmount: async () => { await act(async () => root.unmount()); container.remove(); } };
}
const button = (container, text) => [...container.querySelectorAll('button')].find(item => item.textContent.includes(text));
async function click(element) { assert.ok(element); await act(async () => element.click()); }
async function choose(select, value) { await act(async () => { select.value = value; select.dispatchEvent(new window.Event('change', { bubbles: true })); }); }
function providers(child, syncOptions) { return h(ThemeProvider, null, h(WorkspaceProvider, { syncOptions }, child)); }

test('all six lesson routes open/navigate/replay/close guides without loading Sandpack or writing P1/P2 progress', async () => {
  for (const version of [1, 2]) for (const guide of walkthroughs) {
    window.localStorage.clear();
    const p2 = { ...freshWorkspace(), codeFiles: { ...exampleSolutions, '/gig.js': exampleSolutions['/gig.js'] + '// retained user work\n' }, completed: [1, 2, 3], currentLesson: 2 };
    const saved = version === 1 ? { version: 1, codeFiles: Object.fromEntries(Object.entries(p2.codeFiles).slice(0, 3)), completed: [1, 2, 3], currentLesson: 2, attempts: { 1: 2, 2: 4, 3: 6 } } : p2;
    const key = version === 1 ? legacyStorageKey : storageKey;
    const bytes = JSON.stringify(saved); window.localStorage.setItem(key, bytes);
    const { container, unmount } = await mount(providers(h(MemoryRouter, { initialEntries: [`/lessons/${guide.id}`] }, h(Routes, null, h(Route, { path: '/lessons/:lessonId', element: h(LabPage) })))));
    assert.equal(container.querySelector('iframe'), null);
    const opener = button(container, 'Show me how');
    await click(opener);
    assert.ok(container.querySelector('dialog[open]'));
    const variant = guide.variants[0];
    for (let index = 0; index < variant.steps.length; index++) {
      const actualLines = [...container.querySelectorAll('.active-line')].map(line => Number(line.dataset.line));
      assert.deepEqual(actualLines, variant.steps[index].lines, `lesson ${guide.id}, step ${index + 1}`);
      assert.equal(container.querySelector('.guide-badge').textContent, variant.steps[index].visual.status);
      assert.equal(container.querySelector('.guide-changed p').textContent, variant.steps[index].changed);
      assert.equal(container.querySelector('.guide-explanation h3').textContent, variant.steps[index].title);
      if (index < variant.steps.length - 1) await click(button(container, 'Next'));
    }
    assert.equal(button(container, 'Next').disabled, true);
    await click(button(container, 'Back'));
    assert.equal(container.querySelector('.guide-visual').dataset.demoStep, String(variant.steps.length - 2));
    await click(button(container, 'Replay'));
    assert.equal(container.querySelector('.guide-visual').dataset.demoStep, '0');
    if (guide.variants.length > 1) {
      await choose(container.querySelector('.guide-choice select'), guide.variants[1].id);
      assert.equal(container.querySelector('.guide-badge').textContent, guide.variants[1].steps.at(-1).visual.status);
    }
    await click(button(container, 'Close'));
    assert.equal(container.querySelector('dialog'), null);
    assert.equal(document.activeElement, opener);
    await click(opener);
    await act(async () => container.querySelector('dialog').dispatchEvent(new window.Event('cancel', { cancelable: true })));
    assert.equal(container.querySelector('dialog'), null);
    assert.equal(window.localStorage.getItem(key), bytes);
    assert.equal(window.localStorage.length, 2);
    assert.match(window.localStorage.getItem(learnerKey), /^[a-f0-9]{64}$/);
    assert.equal(container.querySelector('iframe'), null);
    await unmount();
  }
  const heavy = [...server.moduleGraph.idToModuleMap.values()].find(module => module.id?.endsWith('/CodingLab.jsx'));
  assert.ok(!heavy?.ssrModule, 'The heavy coding lab must not be evaluated for guided use.');
});

test('theme UI follows System changes, persists separately, and restores on remount', async () => {
  window.localStorage.clear(); systemDark = false;
  const bytes = JSON.stringify({ ...freshWorkspace(), codeFiles: exampleSolutions, completed: [1, 2, 3, 4, 5, 6] });
  window.localStorage.setItem(storageKey, bytes);
  let mounted = await mount(providers(h(ThemeSwitcher)));
  assert.equal(document.documentElement.dataset.theme, 'dark', 'New visitors start Dark even with a light OS.');
  await choose(mounted.container.querySelector('select'), 'light');
  assert.equal(document.documentElement.dataset.theme, 'light');
  assert.equal(window.localStorage.getItem(themeStorageKey), 'light');
  await choose(mounted.container.querySelector('select'), 'system');
  assert.equal(document.documentElement.dataset.theme, 'light');
  await act(async () => { systemDark = true; mediaListeners.forEach(fn => fn({ matches: true })); });
  assert.equal(document.documentElement.dataset.theme, 'dark');
  await choose(mounted.container.querySelector('select'), 'light');
  await act(async () => { mediaListeners.forEach(fn => fn({ matches: true })); });
  assert.equal(document.documentElement.dataset.theme, 'light', 'Explicit Light ignores dark OS.');
  await mounted.unmount();
  mounted = await mount(providers(h(ThemeSwitcher)));
  assert.equal(mounted.container.querySelector('select').value, 'light');
  assert.equal(document.documentElement.dataset.theme, 'light');
  assert.equal(window.localStorage.getItem(storageKey), bytes);
  await mounted.unmount();
  assert.equal(mediaListeners.size, 0);
});

test('replay entry and all 12 question cards still render with both themes', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ status: 'ok' }) });
  try {
    for (const theme of ['light', 'dark']) for (const route of ['/replay', '/questions']) {
      window.localStorage.setItem(themeStorageKey, theme);
      const { container, unmount } = await mount(providers(h(MemoryRouter, { initialEntries: [route] }, h(App))));
      try {
        await act(async () => {
          await server.ssrLoadModule(route === '/questions' ? '/src/features/questions/QuestionsPage.jsx' : '/src/features/lab/LabPage.jsx');
          await new Promise(resolve => setTimeout(resolve, 0));
        });
        assert.equal(document.documentElement.dataset.theme, theme);
        if (route === '/replay') assert.ok(button(container, 'Open replay lab'));
        else {
          assert.equal(container.querySelectorAll('.question-card').length, 12);
          assert.equal(container.querySelectorAll('.question-card details[open]').length, 0);
        }
      } finally { await unmount(); }
    }
  } finally { globalThis.fetch = previousFetch; }
});

test('theme switching and guided navigation cause no progress writes after reconciliation', async () => {
  window.localStorage.clear();
  const workspace = { ...freshWorkspace(), codeFiles: exampleSolutions, completed: [1, 2, 3, 4, 5, 6] };
  const bytes = JSON.stringify(workspace); window.localStorage.setItem(storageKey, bytes);
  const calls = [];
  const syncOptions = { debounceMs: 1, fetch: async (_url, options) => {
    calls.push(options.method);
    return { status: 200, json: async () => ({ progress: { workspace, revision: 2, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-06T00:00:00Z' } }) };
  } };
  const { container, unmount } = await mount(providers(h(MemoryRouter, { initialEntries: ['/lessons/1'] }, h(ThemeSwitcher), h(Routes, null, h(Route, { path: '/lessons/:lessonId', element: h(LabPage) }))), syncOptions));
  try {
    assert.deepEqual(calls, ['GET']);
    await choose(container.querySelector('.theme-switcher select'), 'light');
    await choose(container.querySelector('.theme-switcher select'), 'system');
    await click(button(container, 'Show me how')); await click(button(container, 'Next')); await click(button(container, 'Replay')); await click(button(container, 'Close'));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
    assert.deepEqual(calls, ['GET']); assert.equal(window.localStorage.getItem(storageKey), bytes);
  } finally { await unmount(); }
});

test('real provider saves offline edits, syncs on reconnect, and exposes conflict choices with recovery', async () => {
  window.localStorage.clear();
  const base = freshWorkspace();
  window.localStorage.setItem(storageKey, JSON.stringify(base));
  const stamp = '2026-11-06T00:00:00Z';
  let context, offline = true, remote = { workspace: base, revision: 1, createdAt: stamp, updatedAt: stamp }, writes = 0;
  function Probe() { context = useWorkspace(); return h('div', null, h('p', { 'data-testid': 'code' }, context.workspace.codeFiles['/gig.js']), h(SyncStatus)); }
  const syncOptions = { debounceMs: 1, retryMs: 60000, fetch: async (_url, options) => {
    if (offline) throw new Error('offline');
    if (options.method === 'PUT') {
      writes++; const payload = JSON.parse(options.body);
      if (payload.expectedRevision !== remote.revision) return { status: 409, json: async () => ({ progress: remote }) };
      remote = { ...remote, workspace: payload.workspace, revision: remote.revision + 1 };
    }
    return { status: 200, json: async () => ({ progress: remote }) };
  } };
  const mounted = await mount(providers(h(Probe), syncOptions));
  await act(async () => { context.updateFiles({ ...context.workspace.codeFiles, '/gig.js': '// offline code' }); });
  assert.equal(readStored().codeFiles['/gig.js'], '// offline code');
  const token = window.localStorage.getItem(learnerKey);
  await mounted.unmount();
  const second = await mount(providers(h(Probe), syncOptions));
  try {
    assert.equal(context.workspace.codeFiles['/gig.js'], '// offline code');
    assert.equal(window.localStorage.getItem(learnerKey), token);
    // With no prior baseline, two different copies require an explicit choice.
    offline = false;
    await act(async () => { window.dispatchEvent(new window.Event('online')); });
    assert.equal(context.syncState.status, 'conflict'); assert.equal(writes, 0);
    await click(button(second.container, 'Keep device version'));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
    assert.equal(context.syncState.status, 'saved'); assert.equal(writes, 1); assert.equal(remote.workspace.codeFiles['/gig.js'], '// offline code');
    remote = { ...remote, workspace: { ...base, codeFiles: { ...base.codeFiles, '/gig.js': '// other version' } }, revision: remote.revision + 1 };
    await act(async () => { context.updateFiles({ ...context.workspace.codeFiles, '/gig.js': '// newest device code' }); });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
    assert.equal(context.syncState.status, 'conflict');
    const epoch = context.workspaceEpoch;
    await click(button(second.container, 'Load server version'));
    assert.equal(context.workspace.codeFiles['/gig.js'], '// other version'); assert.equal(context.workspaceEpoch, epoch + 1);
    assert.equal(readStored().codeFiles['/gig.js'], '// other version');
    assert.equal(JSON.parse(window.localStorage.getItem(syncKey)).recovery.local.codeFiles['/gig.js'], '// newest device code');
  } finally { await second.unmount(); }
  function readStored() { return JSON.parse(window.localStorage.getItem(storageKey)); }
});

test('Sandpack selects Babel 7; its old compiler reproduces the reported /index.js error', async () => {
  const { sandboxFiles } = await server.ssrLoadModule('/src/features/lab/sandbox-files.js');
  const files = sandboxFiles(exampleSolutions);
  const legacy = await sandboxCompiler({ dependencies: {} });
  assert.equal(legacy.version, '6.26.0');
  assert.throws(() => legacy.transform(files['/index.js'].code, '/index.js'), /\/index.js: Unexpected token \(38:19\)/);
  assert.throws(() => legacy.transform('try {} catch {}', '/catch.js'), /Unexpected token/);
  const compiler = await sandboxCompiler(JSON.parse(files['/package.json'].code));
  assert.equal(compiler.version, '7.21.8');
  // Parse/transform the entire shipped graph, including optional chaining,
  // nullish coalescing, optional catch bindings, and all worked examples.
  for (const codeFiles of [starterFiles, exampleSolutions]) {
    for (const [path, file] of Object.entries(sandboxFiles(codeFiles))) {
      if (path.endsWith('.js')) assert.ok(compiler.transform(file.code, path), path);
    }
  }
});

test('compiler-processed sandbox graph runs unfinished/4/12/18-check lessons, replay, changed output and dark preview', async () => {
  const { sandboxFiles } = await server.ssrLoadModule('/src/features/lab/sandbox-files.js');
  const workspace = { ...freshWorkspace(), codeFiles: exampleSolutions, completed: [1, 2, 3], currentLesson: 3 };
  window.localStorage.clear(); window.localStorage.setItem(storageKey, JSON.stringify(workspace));
  const saved = window.localStorage.getItem(storageKey);
  async function run(codeFiles, through, fullJourney = false) {
    const files = sandboxFiles(codeFiles, 'dark');
    const compiler = await sandboxCompiler(JSON.parse(files['/package.json'].code));
    const transformed = Object.fromEntries(Object.entries(files).filter(([path]) => path.endsWith('.js')).map(([path, file]) => [path, compiler.transform(file.code, path)]));
    assert.match(files['/index.html'].code, /data-theme="dark"/);
    assert.match(files['/index.html'].code, /--page:#090f1d/);
    return renderRunner(codeFiles, { runId: 'compiler-regression', through, fullJourney, theme: 'dark', scenario: { ...scenarios[4], story: storyOptions }, parentOrigin: 'http://localhost:5173' }, transformed);
  }
  const unfinished = await run(starterFiles, 1);
  assert.ok(unfinished.posted.message.checks.some(check => !check.passed));
  assert.match(unfinished.rendered, /FAIL/);
  for (const [through, count] of [[1, 4], [2, 12], [3, 18]]) {
    const result = await run(exampleSolutions, through);
    assert.equal(result.posted.message.checks.length, count);
    assert.ok(result.posted.message.checks.every(check => check.passed));
    assert.match(result.rendered, new RegExp(`${count}/${count} behavioral checks passed`));
  }
  const replay = await run(exampleSolutions, 6, true);
  assert.match(replay.rendered, /Full journey passed/);
  assert.equal(replay.posted.message.checks.length, 42);
  assert.equal(replay.documentRoot.dataset.theme, 'dark');
  replay.changeTheme('light'); assert.equal(replay.documentRoot.dataset.theme, 'light');
  replay.changeTheme('dark'); assert.equal(replay.documentRoot.dataset.theme, 'dark');
  const changed = await run({ ...exampleSolutions, '/gig.js': exampleSolutions['/gig.js'].replace('...details,', '...details, title: "Compiler-tested changed event",') }, 1);
  assert.match(changed.rendered, /Compiler-tested changed event/);
  assert.ok(changed.posted.message.checks.some(check => !check.passed));
  assert.equal(window.localStorage.getItem(storageKey), saved);
});
