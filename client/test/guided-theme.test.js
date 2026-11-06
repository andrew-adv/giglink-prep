import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { walkthroughs } from '../src/features/guided/walkthroughs.js';
import { closedGuide, guideFrame, guideReducer } from '../src/features/guided/navigation.js';
import { editorTheme, palettes, readThemePreference, receivePreviewTheme, resolveTheme, saveThemePreference, sendPreviewTheme, themeStorageKey } from '../src/features/theme/theme.js';
import { previewHtml } from '../src/features/lab/preview-html.js';
import { exampleSolutions, scenarios } from '../src/features/lab/project.js';
import { renderRunner } from './helpers/fixtures.js';
import { freshWorkspace, storageKey, legacyStorageKey } from '../src/features/progress/workspace.js';

test('all six guides have runnable authored examples whose final visuals agree with the code', () => {
  assert.deepEqual(walkthroughs.map(guide => guide.id), [1, 2, 3, 4, 5, 6]);
  for (const guide of walkthroughs) for (const variant of guide.variants) {
    const actual = vm.runInNewContext(variant.code.join('\n') + '\nJSON.stringify(' + variant.proof + ');', {}, { timeout: 500 });
    const { tone, ...expected } = variant.steps.at(-1).visual;
    assert.deepEqual(JSON.parse(actual), expected, `lesson ${guide.id}, ${variant.id}`);
    for (const step of variant.steps) {
      assert.ok(step.lines.length && step.lines.every(line => Number.isInteger(line) && line > 0 && line <= variant.code.length));
      assert.ok(step.explanation && step.changed && step.visual.rows.length);
    }
  }
});

test('Back/Next/Replay/Close stay bounded and synchronize the code highlight with its visual', () => {
  for (const guide of walkthroughs) {
    let state = guideReducer(closedGuide, { type: 'open', lessonId: guide.id });
    const frames = [];
    for (let index = 0; index < guide.variants[0].steps.length; index++) {
      frames.push(guideFrame(state));
      state = guideReducer(state, { type: 'next' });
    }
    assert.equal(guideFrame(state).index, guide.variants[0].steps.length - 1);
    assert.ok(frames.slice(1).every((frame, index) => JSON.stringify(frame.step.lines) !== JSON.stringify(frames[index].step.lines)));
    assert.ok(frames.slice(1).every((frame, index) => JSON.stringify(frame.step.visual) !== JSON.stringify(frames[index].step.visual)));
    state = guideReducer(state, { type: 'back' });
    assert.equal(guideFrame(state).index, guide.variants[0].steps.length - 2);
    state = guideReducer(state, { type: 'replay' });
    assert.equal(guideReducer(state, { type: 'back' }).index, 0);
    assert.equal(guideReducer(state, { type: 'close' }).open, false);
  }
});

test('authored choices change both the example code and the visible consequence', () => {
  for (const guide of walkthroughs.filter(guide => guide.variants.length > 1)) {
    const original = guideReducer(closedGuide, { type: 'open', lessonId: guide.id });
    for (const choice of guide.variants.slice(1)) {
      const frame = guideFrame(guideReducer(original, { type: 'choose', choice: choice.id }));
      assert.equal(frame.variant.id, choice.id);
      assert.notDeepEqual(frame.variant.code, guide.variants[0].code);
    }
    assert.ok(guide.variants.slice(1).some(choice => JSON.stringify(choice.steps.at(-1).visual) !== JSON.stringify(guide.variants[0].steps.at(-1).visual)));
    assert.deepEqual(guideReducer(original, { type: 'choose', choice: 'unknown' }), original);
  }
});

test('theme defaults Dark, restores preferences, and System resolves both OS states', () => {
  const values = new Map(), storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.equal(readThemePreference(storage), 'dark');
  for (const preference of ['dark', 'light', 'system']) {
    assert.equal(saveThemePreference(storage, preference), true);
    assert.equal(readThemePreference(storage), preference);
  }
  assert.equal(resolveTheme('dark', false), 'dark');
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('system', false), 'light');
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(saveThemePreference(storage, 'unknown'), false);
  values.set(themeStorageKey, 'unknown');
  assert.equal(readThemePreference(storage), 'dark');
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('full'); } };
  assert.equal(readThemePreference(blocked), 'dark');
  assert.equal(saveThemePreference(blocked, 'light'), false);
});

test('theme writes stay separate from both workspace versions', () => {
  const values = new Map([[storageKey, JSON.stringify(freshWorkspace())], [legacyStorageKey, '{"original":"P1 backup"}']]);
  const before = new Map(values), storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  for (const preference of ['light', 'dark', 'system']) saveThemePreference(storage, preference);
  assert.equal(values.get(storageKey), before.get(storageKey));
  assert.equal(values.get(legacyStorageKey), before.get(legacyStorageKey));
  assert.equal(themeStorageKey === storageKey || themeStorageKey === legacyStorageKey, false);
});

test('editor and separate preview use the same palette and accept only trusted theme messages', () => {
  for (const theme of ['light', 'dark']) {
    assert.equal(editorTheme(theme).colors.surface1, palettes[theme].code);
    assert.equal(editorTheme(theme).colors.base, palettes[theme].text);
    const html = previewHtml(theme);
    assert.match(html, new RegExp(`data-theme="${theme}"`));
    assert.ok(html.includes(palettes[theme].page) && html.includes(palettes[theme].text));
  }
  let sent;
  const parent = {}, frame = { src: 'https://2-19-8-sandpack.codesandbox.io/', contentWindow: { postMessage: (...args) => { sent = args; } } };
  sendPreviewTheme(frame, 'light');
  assert.deepEqual(sent, [{ kind: 'giglink-prep:theme', theme: 'light' }, 'https://2-19-8-sandpack.codesandbox.io']);
  const root = { dataset: {} }, event = { source: parent, origin: 'http://localhost:5173', data: sent[0] };
  assert.equal(receivePreviewTheme(event, parent, event.origin, root), true);
  assert.equal(root.dataset.theme, 'light');
  for (const patch of [{ source: {} }, { origin: 'https://untrusted.example' }, { data: { kind: 'giglink-prep:theme', theme: 'unknown' } }]) assert.equal(receivePreviewTheme({ ...event, ...patch }, parent, event.origin, root), false);
});

test('live preview theme changes do not run exercises again or alter check results', async () => {
  const result = await renderRunner(exampleSolutions, { runId: 'appearance', through: 3, scenario: scenarios[4], theme: 'dark', parentOrigin: 'http://localhost:5173' });
  const report = JSON.stringify(result.posted);
  assert.equal(result.documentRoot.dataset.theme, 'dark');
  result.changeTheme('light');
  assert.equal(result.documentRoot.dataset.theme, 'light');
  assert.equal(JSON.stringify(result.posted), report);
  result.changeTheme('dark');
  assert.equal(result.documentRoot.dataset.theme, 'dark');
});

function luminance(color) {
  const rgb = color.slice(1).match(/../g).map(part => parseInt(part, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
test('primary, secondary, code, button, and feedback text tokens meet 4.5:1 contrast', () => {
  for (const palette of Object.values(palettes)) for (const [foreground, background] of [['text', 'page'], ['text', 'panel'], ['muted', 'raised'], ['onAccent', 'accent'], ['success', 'successBg'], ['danger', 'dangerBg'], ['warning', 'warningBg']]) {
    const [a, b] = [luminance(palette[foreground]), luminance(palette[background])].sort((x, y) => y - x);
    assert.ok((a + .05) / (b + .05) >= 4.5, `${foreground} on ${background}`);
  }
});
