import { createGig } from './gig.js';
import { validateGig } from './validate.js';
import { publishGig } from './publish.js';
import { browseGigs } from './browse.js';
import { applyForGig } from './apply.js';
import { reviewApplication, myApplications } from './review.js';
import { checkIds, runChecks, runFullJourney, runScene } from './checks.js';
import config from './run-config.json';
import { palettes, receivePreviewTheme } from './theme.js';

if (document.documentElement) document.documentElement.dataset.theme = palettes[config.theme] ? config.theme : 'dark';
window.addEventListener('message', event => receivePreviewTheme(event, window.parent, config.parentOrigin, document.documentElement));

const api = { createGig, validateGig, publishGig, browseGigs, applyForGig, reviewApplication, myApplications };
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
const journey = config.fullJourney ? runFullJourney(api, config.scenario) : null;
const checks = journey ? journey.checks : runChecks(api, config.through);
try {
  const scene = journey || runScene(api, config.through, config.scenario);
  const { gig, errors, steps } = scene;
  const failed = checks.find(check => !check.passed);
  const checkFailure = failed && { stage: Number(Object.keys(checkIds).find(id => checkIds[id].includes(failed.id))), message: failed.message };
  const failure = checkFailure && (!scene.firstFailure || checkFailure.stage <= scene.firstFailure.stage) ? checkFailure : scene.firstFailure;
  if (failure) root.append(element('p', `First failing stage: lesson ${failure.stage}. ${failure.message}`, 'fail'));
  else if (journey?.complete) root.append(element('p', 'Full journey passed: your six files worked together.', 'pass'));
  if (config.through >= 4) {
    root.append(element('h1', scene.talent?.label || 'Fictional talent event board'));
    function showBoard(title, cards) {
      root.append(element('h2', title));
      if (!cards.length) root.append(element('p', 'No discoverable events returned by your code.'));
      for (const item of cards) {
        if (gig.location && JSON.stringify(item).includes(gig.location)) {
          root.append(element('p', 'PRIVATE CARD BLOCKED: your board output included the exact venue. Fix browse.js.', 'fail'));
          continue;
        }
        const card = element('article', undefined, 'event');
        card.append(element('h2', `${describe(item.title)} · ${describe(item.gigType)}`));
        card.append(element('p', Object.hasOwn(item, 'location') ? 'PRIVACY CHECK FAILED: location was included; the exact value is blocked here.' : 'Exact venue: hidden on event board'));
        root.append(card);
      }
    }
    showBoard('Event board before review', scene.board);
    if (scene.demos) root.append(element('p', `Fictional demos: ${scene.demos.map(demo => `${demo.songTitle} → ${demo.clipId}`).join(' | ')}`));
    if (scene.application) root.append(element('p', `Application: ${scene.application.status} · ${scene.application.gigId} · ${scene.application.talentId}`));
    if (scene.review) {
      root.append(element('h2', 'Customer review result'));
      root.append(element('p', `${config.scenario.story?.reviewer === 'outsider' ? 'Obi' : 'Ada'} → ${scene.review.application.status}`));
      root.append(element('p', `Subscription required for future Paid discovery: ${describe(scene.review.talent.paidGigSubscriptionRequired)}`));
      root.append(element('h2', 'My Applications · existing commitments'));
      for (const view of scene.mine) {
        const ownedAccepted = scene.review.application.status === 'accepted' && view.id === scene.application.id && scene.application.talentId === scene.talent.id;
        root.append(element('p', `${view.gig?.title} · ${view.status} · Venue: ${ownedAccepted ? describe(view.gig?.location) : 'hidden'}`));
      }
      showBoard('Event board after review', scene.afterBoard);
    }
    if (scene.notice) root.append(element('p', scene.notice));
    const stages = element('ol', undefined, 'flow');
    for (const step of steps) stages.append(element('li', `${step.label} → ${step.value}`));
    if (scene.firstFailure) stages.append(element('li', `STOP · lesson ${scene.firstFailure.stage}: ${scene.firstFailure.message}`, 'fail'));
    root.append(stages);
  } else {
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
  }
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
