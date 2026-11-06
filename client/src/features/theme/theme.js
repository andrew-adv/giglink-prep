export const themeStorageKey = 'giglink-prep.theme.v1';
export const themePreferences = ['dark', 'light', 'system'];

// Shared by the React shell, editor, and separate sandbox document.
export const palettes = {
  dark: {
    page: '#090f1d', panel: '#101c32', raised: '#142440', line: '#304564',
    text: '#f2f7ff', muted: '#a5b7cf', accent: '#72f8c5', secondary: '#78bcff',
    onAccent: '#090f1d', soft: '#173b3b', code: '#0c1629', focus: '#78bcff',
    success: '#72f8c5', successBg: '#133b32', danger: '#ffb4a9', dangerBg: '#3c202b',
    warning: '#f3ce8b', warningBg: '#332d24', string: '#b5efad', keyword: '#cbb4ff', shadow: '#00000040',
  },
  light: {
    page: '#f9faf5', panel: '#fffef9', raised: '#f0f3e9', line: '#c5cfbd',
    text: '#173d35', muted: '#596b62', accent: '#12594e', secondary: '#235c93',
    onAccent: '#ffffff', soft: '#eaf0df', code: '#f0f3e9', focus: '#9a501b',
    success: '#225d43', successBg: '#eaf0df', danger: '#803328', dangerBg: '#fff0e9',
    warning: '#795b21', warningBg: '#f4eddc', string: '#426b37', keyword: '#805390', shadow: '#213d3210',
  },
};

export function readThemePreference(storage) {
  try {
    const preference = storage.getItem(themeStorageKey);
    return themePreferences.includes(preference) ? preference : 'dark';
  } catch { return 'dark'; }
}

export function saveThemePreference(storage, preference) {
  if (!themePreferences.includes(preference)) return false;
  try { storage.setItem(themeStorageKey, preference); return true; } catch { return false; }
}

export function resolveTheme(preference, systemDark) {
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference === 'light' ? 'light' : 'dark';
}

export function tokenText(theme) {
  return Object.entries(palettes[theme]).map(([name, value]) => `--${name}:${value}`).join(';');
}

export const themeCss = `:root{${tokenText('dark')};color-scheme:dark}:root[data-theme="light"]{${tokenText('light')};color-scheme:light}`;

export function applyDocumentTheme(document, theme) {
  let style = document.getElementById('giglink-theme-tokens');
  if (!style) {
    style = document.createElement('style');
    style.id = 'giglink-theme-tokens';
    style.textContent = themeCss;
    document.head.append(style);
  }
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palettes[theme].page);
}

export function initializeTheme(document, window) {
  let storage;
  try { storage = window.localStorage; } catch { storage = null; }
  const preference = readThemePreference(storage);
  applyDocumentTheme(document, resolveTheme(preference, window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true));
}

export function editorTheme(theme) {
  const p = palettes[theme];
  return {
    colors: { surface1: p.code, surface2: p.panel, surface3: p.raised, clickable: p.muted, base: p.text, disabled: p.muted, hover: p.text, accent: p.accent, error: p.danger, errorSurface: p.dangerBg },
    syntax: { plain: p.text, comment: { color: p.muted, fontStyle: 'italic' }, keyword: p.keyword, tag: p.secondary, punctuation: p.muted, definition: p.secondary, property: p.text, static: p.string, string: p.string },
    font: { size: '13px', lineHeight: '1.7' },
  };
}

export function sendPreviewTheme(frame, theme) {
  if (!palettes[theme] || !frame?.contentWindow) return;
  let url;
  try { url = new URL(frame.src); } catch { return; }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('-sandpack.codesandbox.io')) return;
  frame.contentWindow.postMessage({ kind: 'giglink-prep:theme', theme }, url.origin);
}

export function receivePreviewTheme(event, parentWindow, parentOrigin, root) {
  if (event.source !== parentWindow || event.origin !== parentOrigin || event.data?.kind !== 'giglink-prep:theme' || !palettes[event.data.theme]) return false;
  if (root) root.dataset.theme = event.data.theme;
  return true;
}
