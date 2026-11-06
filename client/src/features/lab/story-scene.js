import { characters, demoSet, storyDetails, storyOptions } from './story-project.js';

const copy = value => JSON.parse(JSON.stringify(value));
function expect(condition, message) { if (!condition) throw new Error(message); }

export function runStory(api, through, scenario, runOpening) {
  const options = { ...storyOptions, ...scenario.story };
  const songs = ['Warm-up groove', 'Closing rhythm', 'Encore phrase'].slice(0, options.sampleCount);
  const details = { ...storyDetails, ...scenario.details, gigType: options.gigType,
    paymentRange: options.gigType === 'free' ? null : scenario.details.paymentRange,
    position: { ...storyDetails.position, ...scenario.details.position, auditionSongs: songs } };
  const initial = runOpening({ ...scenario, details });
  const result = { ...initial, stages: [], board: [], afterBoard: [], mine: [], pendingViews: [], firstFailure: null };
  function stage(id, label, fn) {
    try { fn(); result.stages.push({ id, label, passed: true }); return true; }
    catch (error) { result.firstFailure = { stage: id, message: error.message || 'This step did not finish.' }; result.stages.push({ id, label, passed: false }); return false; }
  }
  if (!stage(1, 'Create the event', () => expect(initial.gig.id === details.id && typeof initial.gig.title === 'string', 'gig.js must keep the event id and title.'))) return result;
  if (!stage(2, 'Check the draft', () => expect(initial.errors.length === 0, initial.errors.join(' ') || 'The draft did not pass validation.'))) return result;
  if (!stage(3, 'Verify (simulated) and publish', () => expect(initial.gig.publicationStatus === 'published', 'publish.js did not publish this valid event with simulated backend proof.'))) return result;
  const talent = { ...copy(characters[options.character || 'talent']), paidGigSubscriptionRequired: options.talentStatus !== 'new', hasActiveSubscription: options.talentStatus === 'active' };
  result.talent = talent;
  const relatedGig = (id, title, gigType) => api.publishGig(api.createGig({ ...copy(details), id, title, gigType, paymentRange: gigType === 'free' ? null : copy(details.paymentRange || { min: 25000, max: 35000 }) }), { backendVerified: true });
  const gigs = [initial.gig, relatedGig('free-demo', 'Demo free music meet-up', 'free'), relatedGig('next-paid', 'Demo next Paid event', 'paid')];
  if (!stage(4, `${talent.label} browses the event board`, () => {
    result.board = api.browseGigs(gigs, copy(talent));
    expect(Array.isArray(result.board), 'browse.js must return an array of safe cards.');
    expect(result.board.every(card => !Object.hasOwn(card, 'location') && !JSON.stringify(card).includes(details.location)), 'browse.js leaked an exact venue. Omit it from every board card.');
    expect(result.board.every(card => card.publicationStatus === 'published'), 'Only published gigs belong on the event board.');
    result.steps.push({ label: 'Browse', value: `${result.board.length} cards returned; exact venues hidden` });
  })) return result;
  if (through === 4) return result;
  const selected = result.board.find(gig => gig.id === initial.gig.id);
  if (!selected) {
    result.notice = 'This event is absent from your board. A subscription-required talent without an active subscription cannot discover new Paid gigs. Try New talent or Active subscription.';
    return result;
  }
  if (!stage(5, 'Match the samples and apply', () => {
    result.demos = demoSet(initial.gig.position.auditionSongs, options.demos);
    result.application = api.applyForGig(selected, copy(talent), copy(result.demos), []);
    expect(result.application?.status === 'pending' && result.application.gigId === initial.gig.id && result.application.talentId === talent.id, 'apply.js must create a pending application linked to this event and talent.');
    result.steps.push({ label: 'Apply', value: result.application.status });
  })) return result;
  if (through === 5) return result;
  if (!stage(6, 'Review → reveal venue → check future discovery', () => {
    const applications = [result.application];
    if (options.full) applications.push({ ...result.application, id: 'already-accepted', talentId: 'talent-existing', status: 'accepted' });
    result.pendingViews = api.myApplications(gigs, applications, copy(talent));
    expect(result.pendingViews.every(view => !view.gig || !Object.hasOwn(view.gig, 'location')), 'myApplications revealed a venue before acceptance.');
    result.review = api.reviewApplication({ gig: copy(initial.gig), application: copy(result.application), customer: copy(characters[options.reviewer]), decision: options.decision, applications: copy(applications), talent: copy(talent) });
    expect(result.review.application.status === options.decision, 'review.js did not apply the customer’s decision.');
    result.mine = api.myApplications(gigs, [result.review.application], result.review.talent);
    result.afterBoard = api.browseGigs(gigs, result.review.talent);
    const accepted = options.decision === 'accepted';
    const view = result.mine.find(item => item.id === result.application.id);
    expect(view && (accepted ? view.gig?.location === initial.gig.location : !Object.hasOwn(view.gig || {}, 'location')), 'Accepted talent must keep their venue through My Applications; rejection must keep it hidden.');
    if (accepted && initial.gig.gigType === 'paid') expect(result.review.talent.paidGigSubscriptionRequired === true, 'Paid acceptance must set the subscription-required flag.');
    const gated = result.review.talent.paidGigSubscriptionRequired && !result.review.talent.hasActiveSubscription;
    expect(result.afterBoard.some(gig => gig.gigType === 'free') && (!gated || result.afterBoard.every(gig => gig.gigType === 'free')), 'Future discovery must keep Free gigs visible and apply the Paid gate.');
    result.steps.push({ label: 'Review', value: result.review.application.status });
    result.steps.push({ label: 'Venue through My Applications', value: accepted && view.gig?.location ? 'revealed to accepted talent' : 'hidden' });
    result.steps.push({ label: 'Future Paid discovery', value: `${result.afterBoard.filter(gig => gig.gigType === 'paid').length} cards` });
    result.steps.push({ label: 'Free discovery', value: `${result.afterBoard.filter(gig => gig.gigType === 'free').length} cards` });
  })) return result;
  return result;
}
