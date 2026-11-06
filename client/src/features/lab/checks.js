import { baseDetails } from './project.js';

const copy = (value) => JSON.parse(JSON.stringify(value));
const same = (left, right) => {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object' || Array.isArray(left) !== Array.isArray(right)) return false;
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every((key) => Object.hasOwn(right, key) && same(left[key], right[key]));
};
function expect(condition, message) { if (!condition) throw new Error(message); }
function messages(value) {
  expect(Array.isArray(value), 'Return an array: [] or an array of error messages.');
  expect(value.every((item) => typeof item === 'string' && item.trim()), 'Each error must be a useful text message.');
  return value;
}

export const checkIds = {
  1: ['create-details', 'create-second-event', 'create-owned-status', 'create-no-mutation'],
  2: ['validate-valid', 'validate-free', 'validate-title', 'validate-location', 'validate-type', 'validate-min', 'validate-max', 'validate-no-mutation'],
  3: ['publish-browser-only', 'publish-verified', 'publish-strict-proof', 'publish-invalid', 'publish-state', 'publish-no-mutation'],
};

export function requiredCheckIds(through) {
  return [1, 2, 3].filter((id) => id <= through).flatMap((id) => checkIds[id]);
}

export function runChecks(api, through) {
  const checks = [];
  function check(id, label, fn) {
    try { fn(); checks.push({ id, label, passed: true, message: 'Passed' }); }
    catch (error) { checks.push({ id, label, passed: false, message: error?.message || 'This check failed.' }); }
  }
  const draft = () => api.createGig(copy(baseDetails));
  if (through >= 1) {
    check('create-details', 'Keep the supplied event details', () => {
      const gig = draft();
      expect(gig && typeof gig === 'object' && !Array.isArray(gig), 'createGig must return an object.');
      for (const [field, value] of Object.entries(baseDetails)) expect(same(gig[field], value), `Keep details.${field} in the new gig.`);
    });
    check('create-second-event', 'A different input makes a different card', () => {
      const details = { ...copy(baseDetails), title: 'Demo afternoon session', location: 'Demo outdoor stage', gigType: 'free', paymentRange: null };
      const gig = api.createGig(details);
      expect(gig?.title === details.title && gig?.location === details.location && gig?.gigType === 'free' && gig?.paymentRange === null, 'Use the details argument instead of hardcoding one event.');
    });
    check('create-owned-status', 'Every new gig starts as an unpaid draft', () => {
      const gig = api.createGig({ ...copy(baseDetails), publicationStatus: 'published', postingPaymentStatus: 'paid' });
      expect(gig?.publicationStatus === 'draft' && gig?.postingPaymentStatus === 'unpaid', 'Set draft and unpaid after copying details; ignore supplied payment/publication status.');
    });
    check('create-no-mutation', 'Build a new object without changing the input', () => {
      const details = copy(baseDetails), before = copy(details), gig = api.createGig(details);
      expect(gig !== details && same(details, before), 'Return a new object. Do not add status fields to details itself.');
    });
  }
  if (through >= 2) {
    check('validate-valid', 'Accept a paid gig at the ₦25,000 boundary', () => {
      expect(messages(api.validateGig(draft())).length === 0, 'A valid paid gig must return [].');
    });
    check('validate-free', 'Accept a free gig without a payment range', () => {
      expect(messages(api.validateGig(api.createGig({ ...copy(baseDetails), gigType: 'free', paymentRange: null }))).length === 0, 'Only paid gigs need a payment range.');
    });
    for (const field of ['title', 'location']) {
      check(`validate-${field}`, `Reject a missing or blank ${field}`, () => {
        for (const value of ['', '   ', undefined, 42]) expect(messages(api.validateGig({ ...draft(), [field]: value })).length > 0, `Add a message when ${field} is missing or blank.`);
      });
    }
    check('validate-type', 'Reject unknown gig types', () => {
      for (const gigType of ['other', '', undefined]) expect(messages(api.validateGig({ ...draft(), gigType })).length > 0, 'Only free and paid are allowed.');
    });
    check('validate-min', 'Reject low, fractional, text, or missing minimum pay', () => {
      for (const min of [24999, 25000.5, '25000', undefined]) expect(messages(api.validateGig({ ...draft(), paymentRange: { min, max: 35000 } })).length > 0, 'Use a whole-number minimum of at least 25000.');
      expect(messages(api.validateGig({ ...draft(), paymentRange: null })).length > 0, 'A paid gig needs a payment range.');
    });
    check('validate-max', 'Reject a maximum below min or not a whole number', () => {
      for (const max of [24000, 35000.5, '35000', undefined]) expect(messages(api.validateGig({ ...draft(), paymentRange: { min: 25000, max } })).length > 0, 'The maximum must be a whole number at least the minimum.');
      expect(messages(api.validateGig({ ...draft(), paymentRange: { min: 25000, max: 25000 } })).length === 0, 'Equal min and max is valid.');
    });
    check('validate-no-mutation', 'Checking does not rewrite the gig', () => {
      const gig = draft(), before = copy(gig); api.validateGig(gig);
      expect(same(gig, before), 'Return messages without changing the gig.');
    });
  }
  if (through >= 3) {
    check('publish-browser-only', 'A browser claim cannot publish a gig', () => {
      const gig = draft(), before = copy(gig);
      const result = api.publishGig(gig, { browserSaysPaid: true, backendVerified: false });
      expect(same(result, before), 'Keep the unpaid draft when only the browser says paid.');
    });
    check('publish-verified', 'Backend proof publishes the SAME event', () => {
      const gig = draft();
      const result = api.publishGig(gig, { browserSaysPaid: false, backendVerified: true });
      expect(result?.publicationStatus === 'published' && result?.postingPaymentStatus === 'paid', 'Backend proof must publish a valid unpaid draft even when the browser says no.');
      expect(Object.entries(gig).every(([key, value]) => ['publicationStatus', 'postingPaymentStatus'].includes(key) || same(result[key], value)), 'Keep the fields created by gig.js.');
    });
    check('publish-strict-proof', 'Only boolean true counts as verified', () => {
      for (const backendVerified of [undefined, 'true', 1]) {
        const gig = draft(); expect(same(api.publishGig(gig, { browserSaysPaid: true, backendVerified }), gig), 'Use backendVerified === true; a text or number is not proof.');
      }
    });
    check('publish-invalid', 'Do not publish invalid event details', () => {
      for (const changes of [{ title: '' }, { location: '' }, { paymentRange: { min: 24000, max: 35000 } }]) {
        const gig = { ...draft(), ...changes }, before = copy(gig);
        expect(same(api.publishGig(gig, { browserSaysPaid: true, backendVerified: true }), before), 'Call your validator before publishing.');
      }
    });
    check('publish-state', 'Only an unpaid draft may move to published', () => {
      for (const changes of [{ publicationStatus: 'cancelled' }, { publicationStatus: 'published' }, { postingPaymentStatus: 'paid' }]) {
        const gig = { ...draft(), ...changes }, before = copy(gig);
        expect(same(api.publishGig(gig, { backendVerified: true }), before), 'Leave gigs outside the unpaid-draft state unchanged.');
      }
    });
    check('publish-no-mutation', 'Publish a new object without changing the draft', () => {
      const gig = draft(), before = copy(gig), result = api.publishGig(gig, { backendVerified: true });
      expect(result !== gig && same(gig, before), 'Return a new published object; keep the original draft unchanged.');
    });
  }
  return checks;
}

// Used by the sandbox scene: no reference solution decides its outcome.
export function runScene(api, through, scenario) {
  const steps = [];
  const gig = api.createGig(copy(scenario.details));
  expect(gig && typeof gig === 'object' && !Array.isArray(gig), 'createGig did not return an event object.');
  steps.push({ label: 'Create', value: gig.publicationStatus || 'status missing' });
  let errors = [];
  if (through >= 2) {
    errors = messages(api.validateGig(gig));
    steps.push({ label: 'Check', value: errors.length ? `${errors.length} problem(s)` : 'valid' });
  }
  let output = gig;
  if (through >= 3) {
    output = api.publishGig(gig, copy(scenario.payment));
    expect(output && typeof output === 'object' && !Array.isArray(output), 'publishGig must return an event object.');
    steps.push({ label: 'Verify (simulated)', value: scenario.payment.backendVerified === true ? 'backend: yes' : 'backend: no' });
    steps.push({ label: 'Publish', value: output.publicationStatus || 'status missing' });
  }
  return { gig: output, errors, steps };
}
