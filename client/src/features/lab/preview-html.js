import { palettes, themeCss } from '../theme/theme.js';

export function previewHtml(theme = 'dark') {
  const selected = palettes[theme] ? theme : 'dark';
  return `<!doctype html><html lang="en" data-theme="${selected}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your mini GigLink</title>
<style>${themeCss}
*{box-sizing:border-box}body{margin:0;padding:20px;background:var(--page);color:var(--text);font:14px/1.65 system-ui,sans-serif;overflow-wrap:anywhere}h1{font-size:24px;line-height:1.2;margin:14px 0}h2{font-size:17px;margin-top:26px}.eyebrow{font-size:10px;letter-spacing:.12em;color:var(--muted)}.event{border:1px solid var(--line);border-radius:12px;background:var(--panel);padding:20px}.event p{margin:6px 0}.status{border-radius:20px;padding:4px 10px;background:var(--soft);color:var(--accent);font-size:12px}.flow{padding-left:22px}.checks{list-style:none;padding:0}.checks li{padding:12px;border-left:3px solid;margin-bottom:10px;background:var(--panel)}.checks p{margin:6px 0 0}.pass{color:var(--success)}.fail{color:var(--danger)}strong{font-weight:600}:focus-visible{outline:3px solid var(--focus);outline-offset:3px}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}</style></head><body><main id="app"><p>Press Run / Check to start.</p></main><script src="/index.js"></script></body></html>`;
}
