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
import { chapters } from '../src/content/presentation/story.js';
import { milestones, refinements, requestSteps, workstreams } from '../src/content/presentation/evidence.js';
import { presentationModes, speakerNotes } from '../src/content/presentation/practice.js';

let dom, server, createRoot, ThemeProvider, ThemeSwitcher, WorkspaceProvider, useWorkspace, SyncStatus, LabPage, App, PresentationPage;
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
  ({ default: PresentationPage } = await server.ssrLoadModule('/src/features/presentation/PresentationPage.jsx'));
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

test('public story and practice routes load with API unavailable; entry links exist on home, chapter and CTO pages', async () => {
  for (const route of ['/', '/chapters/1', '/questions', '/presentation', '/presentation/practice']) {
    window.localStorage.clear();
    const { container, unmount } = await mount(providers(h(MemoryRouter, { initialEntries: [route] }, h(App))));
    try {
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
      const links = [...container.querySelectorAll('a[href="/presentation"]')];
      assert.ok(links.some(link => link.closest('nav[aria-label="Main navigation"]')), route);
      assert.ok(links.some(link => !link.closest('nav')), route);
      if (route.startsWith('/presentation')) {
        assert.ok(container.querySelector('.presentation-page'));
        assert.ok(container.textContent.includes('From the first idea to the working application.'));
        assert.equal(container.querySelector('iframe'), null);
        assert.ok(route.endsWith('practice') ? button(container, 'Start timer') : container.querySelector('[data-chapter="1"]'));
      }
    } finally { await unmount(); }
  }
});

test('all ten story chapters navigate, reveal layered answers and restore a linked chapter without completion', async () => {
  const { container, unmount } = await mount(h(MemoryRouter, { initialEntries: ['/presentation'] }, h(PresentationPage)));
  try {
    assert.equal(button(container, 'Previous chapter').disabled, true);
    for (const chapter of chapters) {
      assert.equal(container.querySelector('.story-chapter').dataset.chapter, String(chapter.id));
      assert.equal(container.querySelector('.story-chapter > h2').textContent, chapter.title);
      assert.equal(container.querySelector('.story-recap p:last-child').textContent, chapter.summary);
      assert.equal(container.querySelector('.story-chapters [aria-current="step"]').getAttribute('href'), `/presentation?chapter=${chapter.id}`);
      const answer = container.querySelector('.story-question > details');
      assert.equal(answer.open, false);
      await click(answer.querySelector('summary'));
      assert.equal(answer.open, true);
      assert.equal(answer.querySelector('p').textContent, chapter.answer);
      await click(answer.querySelector('details').querySelector('summary'));
      assert.ok(answer.querySelector('details').open);
      if (chapter.id < 10) await click(button(container, 'Next chapter'));
    }
    assert.equal(button(container, 'Next chapter').disabled, true);
    await click(button(container, 'Previous chapter'));
    assert.equal(container.querySelector('.story-chapter').dataset.chapter, '9');
    await choose(container.querySelector('.story-chapters select'), '1');
    assert.equal(container.querySelector('.story-chapter').dataset.chapter, '2');
  } finally { await unmount(); }
  const restored = await mount(h(MemoryRouter, { initialEntries: ['/presentation?chapter=6'] }, h(PresentationPage)));
  assert.equal(restored.container.querySelector('.story-chapter').dataset.chapter, '6');
  await restored.unmount();
  const invalid = await mount(h(MemoryRouter, { initialEntries: ['/presentation?chapter=400'] }, h(PresentationPage)));
  assert.equal(invalid.container.querySelector('.story-chapter').dataset.chapter, '1');
  await invalid.unmount();
});

test('workstream, request, timeline and comparison explorers synchronize selected evidence and details', async () => {
  for (const [chapter, items, kind] of [[2, workstreams, 'team'], [4, requestSteps, 'architecture'], [5, milestones, 'timeline'], [8, refinements, 'refinements']]) {
    const { container, unmount } = await mount(h(MemoryRouter, { initialEntries: [`/presentation?chapter=${chapter}`] }, h(PresentationPage)));
    try {
      const explorer = container.querySelector('.story-explorer');
      assert.equal(button(explorer, 'Previous step').disabled, true);
      for (let index = 0; index < items.length; index++) {
        const detail = explorer.querySelector('.story-detail');
        assert.equal(detail.dataset.explorerIndex, String(index));
        assert.equal(detail.querySelector('h3').textContent, items[index].title);
        assert.equal(explorer.querySelectorAll('[aria-pressed="true"]').length, 1);
        if (kind === 'team') assert.ok(detail.textContent.includes(items[index].dependency));
        if (kind === 'architecture') assert.equal(detail.querySelector('output').textContent, items[index].state);
        if (kind === 'timeline') assert.ok(detail.querySelector(`a[href="${items[index].url}"]`));
        if (kind === 'refinements') assert.deepEqual([...detail.querySelectorAll('dt')].map(node => node.textContent), ['Earlier state', 'Change', 'Reason', 'Result']);
        if (index < items.length - 1) await click(button(explorer, 'Next step'));
      }
      assert.equal(button(explorer, 'Next step').disabled, true);
      await click(button(explorer, 'Previous step'));
      assert.equal(explorer.querySelector('.story-detail').dataset.explorerIndex, String(items.length - 2));
      await choose(explorer.querySelector('select'), '0');
      assert.equal(explorer.querySelector('.story-detail').dataset.explorerIndex, '0');
      await click(explorer.querySelectorAll('.story-nodes button')[1]);
      assert.equal(explorer.querySelector('.story-detail').dataset.explorerIndex, '1');
    } finally { await unmount(); }
  }
});

test('product rule choices change the authored example and the journey reaches subscription gating', async () => {
  const rules = await mount(h(MemoryRouter, { initialEntries: ['/presentation?chapter=3'] }, h(PresentationPage)));
  try {
    assert.match(rules.container.querySelector('.story-rule-grid').textContent, /₦5,000/);
    await click(button(rules.container, 'Paid gig'));
    assert.match(rules.container.querySelector('.story-rule-grid').textContent, /₦10,000/);
    await click(rules.container.querySelector('input[type="checkbox"]'));
    assert.match(rules.container.querySelector('output').textContent, /needs an active/);
    await click(button(rules.container, 'Free gig'));
    assert.match(rules.container.querySelector('output').textContent, /remains available/);
  } finally { await rules.unmount(); }
  const journey = await mount(h(MemoryRouter, { initialEntries: ['/presentation?chapter=7'] }, h(PresentationPage)));
  await choose(journey.container.querySelector('.story-explorer select'), '9');
  assert.equal(journey.container.querySelector('.story-detail h3').textContent, 'Subscription gating');
  assert.match(journey.container.querySelector('.story-detail').textContent, /Accepted commitment remains accessible/);
  assert.equal(journey.container.querySelectorAll('.story-verification .story-card').length, 3);
  await journey.unmount();
});

test('three practice modes navigate, reset and produce the selected copyable and printable notes', async () => {
  const { container, unmount } = await mount(h(MemoryRouter, { initialEntries: ['/presentation/practice'] }, h(PresentationPage, { practiceMode: true })));
  const previousPrint = window.print;
  let prints = 0; window.print = () => prints++;
  try {
    for (const mode of presentationModes) {
      await choose(container.querySelector('.story-mode-label select'), mode.id);
      assert.equal(button(container, 'Previous section').disabled, true);
      for (let i = 0; i < mode.sections.length; i++) {
        const card = container.querySelector('.story-speaking-card');
        assert.equal(card.dataset.speakingSection, String(mode.sections[i].id));
        assert.equal(card.querySelector('.story-spoken').textContent, mode.sections[i].speech);
        if (i < mode.sections.length - 1) await click(button(container, 'Next section'));
      }
      assert.equal(button(container, 'Next section').disabled, true);
      await click(button(container, 'Previous section'));
      assert.equal(container.querySelector('.story-speaking-card').dataset.speakingSection, String(mode.sections.at(-2).id));
      await click(button(container, 'Restart rehearsal'));
      assert.equal(container.querySelector('.story-speaking-card').dataset.speakingSection, String(mode.sections[0].id));
      assert.equal(container.querySelector('textarea').value, speakerNotes(mode));
      assert.equal(container.querySelector('.story-print-notes pre').textContent, speakerNotes(mode));
      // jsdom has no system clipboard. Exercise the accessible manual-copy fallback.
      await click(button(container, 'Copy speaker notes'));
      const area = container.querySelector('textarea');
      assert.equal(document.activeElement, area);
      assert.equal(area.selectionEnd, area.value.length);
      await click(button(container, 'Print speaker notes'));
    }
    assert.equal(prints, 3);
    assert.ok(container.querySelector('a[href="/questions"]'));
  } finally { window.print = previousPrint; await unmount(); }
});

test('rehearsal timer pauses, resumes and resets without advancing the speaking section', async () => {
  const realNow = Date.now; let time = realNow(); Date.now = () => time;
  const { container, unmount } = await mount(h(MemoryRouter, null, h(PresentationPage, { practiceMode: true })));
  try {
    const initial = container.querySelector('.story-speaking-card').dataset.speakingSection;
    await click(button(container, 'Start timer'));
    time += 65000;
    await click(button(container, 'Pause timer'));
    assert.equal(container.querySelector('output').textContent, '1:05');
    assert.equal(container.querySelector('.story-speaking-card').dataset.speakingSection, initial);
    time += 10000;
    await click(button(container, 'Resume timer'));
    time += 1000;
    await click(button(container, 'Pause timer'));
    assert.equal(container.querySelector('output').textContent, '1:06');
    await click(button(container, 'Reset timer'));
    assert.equal(container.querySelector('output').textContent, '0:00');
    await click(button(container, 'Start timer'));
    await choose(container.querySelector('.story-mode-label select'), 'quick');
    assert.equal(container.querySelector('output').textContent, '0:00');
    assert.ok(button(container, 'Start timer'));
  } finally { Date.now = realNow; await unmount(); }
});

test('copy speaker notes uses only authored presentation text when clipboard is available', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis.navigator, 'clipboard');
  let copied = '';
  Object.defineProperty(globalThis.navigator, 'clipboard', { configurable: true, value: { writeText: async value => { copied = value; } } });
  const { container, unmount } = await mount(h(MemoryRouter, null, h(PresentationPage, { practiceMode: true })));
  try {
    await click(button(container, 'Copy speaker notes'));
    assert.equal(copied, speakerNotes(presentationModes[1]));
    assert.match(container.textContent, /Speaker notes copied/);
  } finally {
    if (descriptor) Object.defineProperty(globalThis.navigator, 'clipboard', descriptor);
    else delete globalThis.navigator.clipboard;
    await unmount();
  }
});

test('story and rehearsal interactions preserve learner bytes, completion, theme independence and issue no progress PUT', async () => {
  window.localStorage.clear();
  const workspace = { ...freshWorkspace(), codeFiles: { ...exampleSolutions, '/gig.js': exampleSolutions['/gig.js'] + '// private retained work' }, completed: [1, 2, 3, 4, 5, 6], attempts: { 1: 3 }, currentLesson: 6 };
  const bytes = JSON.stringify(workspace); window.localStorage.setItem(storageKey, bytes);
  const calls = [];
  const syncOptions = { debounceMs: 1, fetch: async (_url, options) => {
    calls.push(options.method);
    return { status: 200, json: async () => ({ progress: { workspace, revision: 2, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-06T00:00:00Z' } }) };
  } };
  const { container, unmount } = await mount(providers(h(MemoryRouter, { initialEntries: ['/presentation'] }, h(App)), syncOptions));
  try {
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 15)); });
    const baseline = calls.length;
    const metadata = window.localStorage.getItem(syncKey);
    for (const theme of ['light', 'dark', 'system']) {
      await choose(container.querySelector('.theme-switcher select'), theme);
      assert.ok(container.querySelector('.presentation-page'));
    }
    for (let index = 0; index < 9; index++) await click(button(container, 'Next chapter'));
    await click(container.querySelector('a[href="/presentation/practice"]'));
    await choose(container.querySelector('.story-mode-label select'), 'full');
    await click(button(container, 'Next section'));
    assert.ok(!container.querySelector('textarea').value.includes('private retained work'));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 15)); });
    assert.equal(window.localStorage.getItem(storageKey), bytes);
    assert.equal(window.localStorage.getItem(syncKey), metadata);
    assert.deepEqual(calls.slice(baseline), []);
    assert.ok(!calls.includes('PUT'));
    assert.equal(container.querySelector('iframe'), null);
  } finally { await unmount(); }
});
