import runner from './sandbox-runner.js?raw';
import checks from './checks.js?raw';
import storyChecks from './story-checks.js?raw';
import storyScene from './story-scene.js?raw';
import storyProject from './story-project.js?raw';
import { baseDetails, editablePaths, lessonIds, scenarios } from './project.js';
import themeSource from '../theme/theme.js?raw';
import { previewHtml } from './preview-html.js';

export function sandboxFiles(codeFiles, theme = 'dark') {
  return {
    ...Object.fromEntries(editablePaths.map((path) => [path, { code: codeFiles[path] }])),
    '/index.js': { code: runner, hidden: true, readOnly: true },
    '/index.html': { code: previewHtml(theme), hidden: true, readOnly: true },
    '/theme.js': { code: themeSource, hidden: true, readOnly: true },
    '/checks.js': { code: checks, hidden: true, readOnly: true },
    '/story-checks.js': { code: storyChecks, hidden: true, readOnly: true },
    '/story-scene.js': { code: storyScene, hidden: true, readOnly: true },
    '/story-project.js': { code: storyProject, hidden: true, readOnly: true },
    '/project.js': { code: `export const baseDetails = ${JSON.stringify(baseDetails)}; export const lessonIds = ${JSON.stringify(lessonIds)};`, hidden: true, readOnly: true },
    '/run-config.json': { code: JSON.stringify({ runId: 'not-run', through: 1, scenario: scenarios[0], theme, parentOrigin: window.location.origin }), hidden: true, readOnly: true },
    // Parcel selects Babel 6 without this marker. Babel 7 parses the runner,
    // hidden modules, and existing learner code (optional chaining/catch bindings).
    '/package.json': { code: JSON.stringify({ name: 'mini-giglink', main: '/index.js', dependencies: {}, devDependencies: { '@babel/core': '7.21.8' } }), hidden: true, readOnly: true },
  };
}
