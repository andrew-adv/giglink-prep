import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const bundler = new URL('../sandpack/', pathToFileURL(require.resolve('@codesandbox/sandpack-client')));
const cache = new Map();

export async function sandboxCompiler(packageJson) {
  // Use the installed bundler's real selector, not a test-only guess at its default.
  const source = await readFile(new URL('static/js/sandbox.8a7d01a44.js', bundler), 'utf8');
  const startMarker = '"../common/lib/utils/is-babel-7.js":';
  const endMarker = ',"../common/lib/utils/is-preact-10.js":';
  const start = source.indexOf(startMarker), end = source.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'Bundler changed: review its Babel selector before updating this fixture.');
  const factory = vm.runInNewContext(`(${source.slice(start + startMarker.length, end)})`);
  const module = { exports: {} };
  factory(module, module.exports, id => {
    assert.ok(id.endsWith('/semver/index.js'));
    // These fixtures use only empty dependencies or @babel/core, before semver branches.
    return {};
  });
  const modern = module.exports.isBabel7(packageJson.dependencies, packageJson.devDependencies);
  const version = modern ? packageJson.devDependencies['@babel/core'] : '6.26';
  if (!cache.has(version)) {
    // Only trusted compiler assets installed with Sandpack; no browser or network.
    const context = vm.createContext({ BrowserFS: { BFSRequire: require } });
    vm.runInContext(await readFile(new URL(`static/js/babel.${version}.min.js`, bundler), 'utf8'), context);
    cache.set(version, context.Babel);
  }
  const compiler = cache.get(version);
  return {
    version: compiler.version,
    transform: (code, filename) => compiler.transform(code, { filename, presets: modern ? [['env', { modules: false }]] : ['es2015', 'stage-0'] }).code,
  };
}
