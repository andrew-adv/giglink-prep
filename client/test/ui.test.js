import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { act, createElement as h } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { walkthroughs } from '../src/features/guided/walkthroughs.js';
import { exampleSolutions } from '../src/features/lab/project.js';
import { freshWorkspace, legacyStorageKey, storageKey } from '../src/features/progress/workspace.js';
import { themeStorageKey } from '../src/features/theme/theme.js';

let dom, server, createRoot, ThemeProvider, ThemeSwitcher, WorkspaceProvider, LabPage, App;
let systemDark = false;
const mediaListeners = new Set();
before(async () => {
  dom = new JSDOM('<!doctype html><html><head><meta name="theme-color"></head><body></body></html>', { url: 'http://localhost:5173', pretendToBeVisual: true });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.scrollTo = () => {};
  window.matchMedia = () => ({ get matches() { return systemDark; }, addEventListener: (_type, fn) => mediaListeners.add(fn), removeEventListener: (_type, fn) => mediaListeners.delete(fn) });
  // jsdom is not a browser: model open/close only; native focus trapping remains manual QA.
  window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  ({ createRoot } = await import('react-dom/client'));
  server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, plugins: [react()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, watch: { ignored: ['**/*'] } }, appType: 'custom' });
  ({ ThemeProvider, ThemeSwitcher } = await server.ssrLoadModule('/src/features/theme/ThemeProvider.jsx'));
  ({ WorkspaceProvider } = await server.ssrLoadModule('/src/features/progress/WorkspaceProvider.jsx'));
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
function providers(child) { return h(ThemeProvider, null, h(WorkspaceProvider, null, child)); }

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
    assert.equal(window.localStorage.length, 1);
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
