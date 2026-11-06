import { requiredCheckIds } from './checks.js';

// Messages can update learning progress only for the current run and exact iframe.
export function isCurrentReport(event, frame, run) {
  if (!frame || !run || event.source !== frame.contentWindow) return false;
  let url;
  try { url = new URL(frame.src); } catch { return false; }
  if (event.origin !== url.origin || url.protocol !== 'https:' || !url.hostname.endsWith('-sandpack.codesandbox.io')) return false;
  const data = event.data;
  if (data?.kind !== 'giglink-prep:checks' || data.runId !== run.id || data.through !== run.through) return false;
  const ids = requiredCheckIds(run.through);
  return Array.isArray(data.checks) && data.checks.length === ids.length
    && data.checks.every((check) => check && typeof check.id === 'string')
    && new Set(data.checks.map((check) => check.id)).size === ids.length
    && data.checks.every((check) => ids.includes(check.id) && typeof check.passed === 'boolean');
}
