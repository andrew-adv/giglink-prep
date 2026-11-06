import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { baseDetails, lessonIds } from '../../src/features/lab/project.js';

// Only repository-authored fixtures run here, never user uploads or API input.
export async function compile(files) {
  const context = vm.createContext({});
  const modules = Object.fromEntries(Object.entries(files).map(([path, code]) => [path, new vm.SourceTextModule(code, { context, identifier: path })]));
  for (const module of Object.values(modules)) if (module.status === 'unlinked') await module.link(specifier => {
    const dependency = modules[`/${specifier.replace('./', '')}`];
    if (!dependency) throw new Error('Fixture import is outside the mini-project');
    return dependency;
  });
  for (const module of Object.values(modules)) await module.evaluate({ timeout: 500 });
  return Object.assign({}, ...Object.values(modules).map(module => ({ ...module.namespace })));
}

export async function renderRunner(files, config, preparedSources) {
  class Element {
    constructor(tag) { this.tag = tag; this.children = []; this.textContent = ''; }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
  }
  const root = new Element('main');
  let posted;
  const documentRoot = { dataset: {} };
  let themeListener;
  const parent = { postMessage: (message, origin) => { posted = { message, origin }; } };
  const context = vm.createContext({ document: { documentElement: documentRoot, createElement: tag => new Element(tag), getElementById: () => root }, window: { parent, addEventListener: (_type, listener) => { themeListener = listener; } } });
  const authored = { ...files, '/project.js': `export const baseDetails = ${JSON.stringify(baseDetails)}; export const lessonIds = ${JSON.stringify(lessonIds)};` };
  for (const name of ['sandbox-runner', 'checks', 'story-checks', 'story-scene', 'story-project']) {
    authored[name === 'sandbox-runner' ? '/index.js' : `/${name}.js`] = await readFile(new URL(`../../src/features/lab/${name}.js`, import.meta.url), 'utf8');
  }
  authored['/theme.js'] = await readFile(new URL('../../src/features/theme/theme.js', import.meta.url), 'utf8');
  // Optional compiler-tested sources from the actual sandboxFiles output.
  // Existing tests retain the direct-source path for independent behavior coverage.
  if (preparedSources) Object.assign(authored, preparedSources);
  const modules = Object.fromEntries(Object.entries(authored).map(([path, code]) => [path, new vm.SourceTextModule(code, { context, identifier: path })]));
  modules['/run-config.json'] = new vm.SyntheticModule(['default'], function () { this.setExport('default', config); }, { context });
  await modules['/index.js'].link(specifier => modules[`/${specifier.replace('./', '')}`]);
  await modules['/index.js'].evaluate({ timeout: 1000 });
  const text = node => [node.textContent, ...node.children.map(text)].join(' ');
  return { rendered: text(root), posted, documentRoot, changeTheme: theme => themeListener({ source: parent, origin: config.parentOrigin, data: { kind: 'giglink-prep:theme', theme } }) };
}
