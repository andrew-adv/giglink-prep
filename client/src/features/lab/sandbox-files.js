import runner from './sandbox-runner.js?raw';
import checks from './checks.js?raw';
import storyChecks from './story-checks.js?raw';
import storyScene from './story-scene.js?raw';
import storyProject from './story-project.js?raw';
import { baseDetails, editablePaths, lessonIds, scenarios } from './project.js';

const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your mini GigLink</title>
<style> *{box-sizing:border-box}body{margin:0;padding:20px;background:#f9faf5;color:#173d35;font:14px/1.65 system-ui,sans-serif;overflow-wrap:anywhere}h1{font-size:24px;line-height:1.2;margin:14px 0}h2{font-size:17px;margin-top:26px}.eyebrow{font-size:10px;letter-spacing:.12em}.event{border:1px solid #dbe1d5;border-radius:12px;background:#fffef9;padding:20px}.event p{margin:6px 0}.status{border-radius:20px;padding:4px 10px;background:#eaf0df;font-size:12px}.flow{padding-left:22px}.checks{list-style:none;padding:0}.checks li{padding:12px;border-left:3px solid;margin-bottom:10px;background:white}.checks p{margin:6px 0 0}.pass{color:#225d43}.fail{color:#8b3028}strong{font-weight:600}</style></head><body><main id="app"><p>Press Run / Check to start.</p></main><script src="/index.js"></script></body></html>`;

export function sandboxFiles(codeFiles) {
  return {
    ...Object.fromEntries(editablePaths.map((path) => [path, { code: codeFiles[path] }])),
    '/index.js': { code: runner, hidden: true, readOnly: true },
    '/index.html': { code: html, hidden: true, readOnly: true },
    '/checks.js': { code: checks, hidden: true, readOnly: true },
    '/story-checks.js': { code: storyChecks, hidden: true, readOnly: true },
    '/story-scene.js': { code: storyScene, hidden: true, readOnly: true },
    '/story-project.js': { code: storyProject, hidden: true, readOnly: true },
    '/project.js': { code: `export const baseDetails = ${JSON.stringify(baseDetails)}; export const lessonIds = ${JSON.stringify(lessonIds)};`, hidden: true, readOnly: true },
    '/run-config.json': { code: JSON.stringify({ runId: 'not-run', through: 1, scenario: scenarios[0], parentOrigin: window.location.origin }), hidden: true, readOnly: true },
    '/package.json': { code: JSON.stringify({ name: 'mini-giglink', main: '/index.js', dependencies: {} }), hidden: true, readOnly: true },
  };
}
