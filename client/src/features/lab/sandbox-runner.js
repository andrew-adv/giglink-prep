import { createGig } from './gig.js';
import { validateGig } from './validate.js';
import { publishGig } from './publish.js';
import { runChecks, runScene } from './checks.js';
import config from './run-config.json';

const api = { createGig, validateGig, publishGig };
const root = document.getElementById('app');
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = String(text);
  if (className) node.className = className;
  return node;
}
function describe(value) {
  if (value === undefined || value === null) return '(missing)';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

root.replaceChildren();
root.append(element('p', 'YOUR CODE → YOUR MINI GIGLINK', 'eyebrow'));
const checks = runChecks(api, config.through);
try {
  const { gig, errors, steps } = runScene(api, config.through, config.scenario);
  const card = element('article', undefined, 'event');
  card.append(element('span', describe(gig.publicationStatus), 'status'));
  card.append(element('h1', describe(gig.title)));
  for (const [label, value] of [['Date', gig.eventDate], ['Venue', gig.location], ['Type', gig.gigType], ['Payment', gig.postingPaymentStatus]]) {
    card.append(element('p', `${label}: ${describe(value)}`));
  }
  if (gig.gigType === 'paid') card.append(element('p', `Talent pay: ₦${describe(gig.paymentRange?.min)}–₦${describe(gig.paymentRange?.max)}`));
  root.append(card);
  const flow = element('ol', undefined, 'flow');
  for (const step of steps) flow.append(element('li', `${step.label} → ${step.value}`));
  root.append(flow);
  if (errors.length) {
    root.append(element('h2', 'Your validator found:'));
    const list = element('ul'); errors.forEach((error) => list.append(element('li', error))); root.append(list);
  } else if (config.through >= 2) root.append(element('p', 'Your validator returned no errors. Compare that with the checks below.'));
} catch (error) {
  root.append(element('p', `The scene stopped: ${error.message}`, 'fail'));
}
const passed = checks.filter((check) => check.passed).length;
root.append(element('h2', `${passed}/${checks.length} behavioral checks passed`));
const list = element('ul', undefined, 'checks');
for (const check of checks) {
  const item = element('li', undefined, check.passed ? 'pass' : 'fail');
  item.append(element('strong', `${check.passed ? 'PASS' : 'FAIL'} · ${check.label}`));
  if (!check.passed) item.append(element('p', check.message));
  list.append(item);
}
root.append(list);
window.parent.postMessage({ kind: 'giglink-prep:checks', runId: config.runId, through: config.through, checks }, config.parentOrigin);
