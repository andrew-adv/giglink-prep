import { baseDetails } from './project.js';
import { characters, demoSet, storyDetails } from './story-project.js';

const copy = value => JSON.parse(JSON.stringify(value));
function expect(value, message) { if (!value) throw new Error(message); }
function rejects(fn, message) { let rejected = false; try { fn(); } catch { rejected = true; } expect(rejected, message); }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const talent = () => copy(characters.talent);
const published = api => api.publishGig(api.createGig(copy({ ...baseDetails, ...storyDetails })), { backendVerified: true });
const freeGig = gig => ({ ...copy(gig), id: 'free-demo', gigType: 'free', paymentRange: null });
const board = (api, gig, viewer = talent()) => api.browseGigs([gig], viewer);
function input(api) {
  const gig = published(api), person = talent();
  const application = api.applyForGig(board(api, gig)[0], person, demoSet(gig.position.auditionSongs));
  return { gig, application, customer: copy(characters.host), decision: 'accepted', applications: [application], talent: person };
}

export const storyCheckIds = {
  4: ['browse-published', 'browse-private', 'browse-free', 'browse-gate', 'browse-role', 'browse-no-mutation'],
  5: ['apply-matching', 'apply-counts', 'apply-mapping', 'apply-metadata', 'apply-request', 'apply-access', 'apply-active', 'apply-no-mutation'],
  6: ['review-owner', 'review-pending', 'review-capacity', 'review-scoped-slots', 'review-matches', 'review-paid', 'review-free-reject', 'review-commitments', 'review-private', 'review-no-mutation'],
};

export function runStoryChecks(api, through, check) {
  if (through >= 4) {
    check('browse-published', 'Board uses the published event from your earlier files', () => {
      const gig = published(api), items = api.browseGigs([gig, { ...gig, id: 'draft', publicationStatus: 'draft' }, { ...gig, id: 'cancelled', publicationStatus: 'cancelled' }], talent());
      expect(Array.isArray(items) && items.length === 1 && items[0].id === gig.id && items[0].title === gig.title, 'Return the earlier published event, and filter drafts/cancelled gigs.');
      expect(items[0].position?.id === gig.position.id, 'Keep the position so the next lesson can apply.');
    });
    check('browse-private', 'The board never carries the exact venue or private fields', () => {
      const gig = { ...published(api), internalNotes: 'PRIVATE-HOST-NOTE' };
      gig.position.internalNotes = 'PRIVATE-ROLE-NOTE';
      const cards = board(api, gig);
      expect(cards.length === 1 && !Object.hasOwn(cards[0], 'location'), 'Omit location entirely. Hiding it with CSS still leaks it.');
      expect(!JSON.stringify(cards).includes(gig.location) && !JSON.stringify(cards).includes('PRIVATE-'), 'Build a safe response; do not copy private fields or nested notes.');
    });
    check('browse-free', 'Free gigs stay visible without a subscription', () => {
      const gig = published(api), viewer = { ...talent(), paidGigSubscriptionRequired: true, hasActiveSubscription: false };
      const cards = api.browseGigs([gig, freeGig(gig)], viewer);
      expect(cards.length === 1 && cards[0].gigType === 'free', 'After the first Paid acceptance, keep Free discovery open.');
    });
    check('browse-gate', 'Paid discovery follows the first-acceptance flag and active subscription', () => {
      for (const [required, active, count] of [[false, false, 1], [true, false, 0], [true, true, 1], [true, 'true', 0]]) {
        expect(board(api, published(api), { ...talent(), paidGigSubscriptionRequired: required, hasActiveSubscription: active }).length === count, 'Paid access is !required OR hasActiveSubscription === true.');
      }
    });
    check('browse-role', 'Only a talent character with an identity can browse', () => {
      for (const viewer of [characters.host, { ...talent(), id: '' }]) rejects(() => board(api, published(api), viewer), 'Reject a customer or a missing talent identity.');
    });
    check('browse-no-mutation', 'Redacting the board does not erase the host’s venue', () => {
      const gig = published(api), before = copy(gig), viewer = talent(), beforeViewer = copy(viewer);
      board(api, gig, viewer);
      expect(same(gig, before) && same(viewer, beforeViewer), 'Return safe copies; keep the original event and talent unchanged.');
    });
  }
  if (through >= 5) {
    check('apply-matching', 'Matching demos create a pending application for THIS event', () => {
      const data = input(api), app = data.application;
      expect(app?.status === 'pending' && app.gigId === data.gig.id && app.positionId === data.gig.position.id && app.talentId === data.talent.id && typeof app.id === 'string' && app.id, 'Return a pending application linked to this gig, position, and talent.');
      expect(Array.isArray(app.demos) && app.demos.length === 2, 'Keep the matched fictional demo metadata.');
      expect(!JSON.stringify(app).includes(data.gig.location), 'An application submission must not embed the private venue.');
    });
    check('apply-counts', 'Accept exactly 1, 2, or 3 requested samples in any order', () => {
      for (const count of [1, 2, 3]) {
        const gig = published(api); gig.position.auditionSongs = ['Solo A', 'Solo B', 'Solo C'].slice(0, count);
        const demos = demoSet(gig.position.auditionSongs).reverse().map(d => ({ ...d, songTitle: ` ${d.songTitle} ` }));
        expect(api.applyForGig(board(api, gig)[0], talent(), demos).status === 'pending', 'Match titles, not array order; trim surrounding spaces.');
      }
    });
    check('apply-mapping', 'Reject missing, duplicate, extra, and mismatched demos', () => {
      const gig = published(api);
      for (const kind of ['missing', 'duplicate', 'extra', 'mismatch']) rejects(() => api.applyForGig(board(api, gig)[0], talent(), demoSet(gig.position.auditionSongs, kind)), `Reject ${kind} demos; every requested title needs exactly one match.`);
    });
    check('apply-metadata', 'Every simulated video has a title and a different clip ID', () => {
      const gig = published(api), good = demoSet(gig.position.auditionSongs);
      for (const bad of [null, [], [null, good[1]], [{ ...good[0], clipId: '' }, good[1]], [good[0], { ...good[1], clipId: good[0].clipId }]]) rejects(() => api.applyForGig(board(api, gig)[0], talent(), bad), 'Require complete fictional clip metadata; do not reuse a clip.');
    });
    check('apply-request', 'The role itself must request 1–3 different named samples', () => {
      for (const songs of [[], ['A', 'B', 'C', 'D'], ['A', ' A '], [''], [42]]) {
        const gig = published(api); gig.position.auditionSongs = songs;
        rejects(() => api.applyForGig(gig, talent(), demoSet(songs)), 'Reject an invalid sample request before creating an application.');
      }
    });
    check('apply-access', 'Only talent can apply and only to a published event', () => {
      const gig = published(api), demos = demoSet(gig.position.auditionSongs);
      for (const person of [characters.host, { ...talent(), id: '' }]) rejects(() => api.applyForGig(gig, person, demos), 'Reject a non-talent or missing identity.');
      rejects(() => api.applyForGig({ ...gig, publicationStatus: 'draft' }, talent(), demos), 'Do not accept applications for drafts.');
    });
    check('apply-active', 'Do not create a second pending/accepted application for the same role', () => {
      const data = input(api), demos = demoSet(data.gig.position.auditionSongs);
      for (const status of ['pending', 'accepted']) rejects(() => api.applyForGig(data.gig, data.talent, demos, [{ ...data.application, status }]), 'An active application for this gig/position/talent already exists.');
      expect(api.applyForGig(data.gig, data.talent, demos, [{ ...data.application, talentId: 'someone-else' }]).status === 'pending', 'Another talent’s application is not a duplicate.');
    });
    check('apply-no-mutation', 'Submitting does not rewrite the event, talent, or clips', () => {
      const gig = published(api), person = talent(), demos = demoSet(gig.position.auditionSongs), before = copy([gig, person, demos]);
      api.applyForGig(gig, person, demos);
      expect(same([gig, person, demos], before), 'Build a new application without changing the inputs.');
    });
  }
  if (through >= 6) {
    check('review-owner', 'A different host or a talent cannot review this event', () => {
      for (const customer of [characters.outsider, characters.talent, { ...characters.host, id: '' }]) {
        const data = { ...input(api), customer: copy(customer) }, before = copy(data);
        rejects(() => api.reviewApplication(data), 'Check customer role AND ownership before changing state.');
        expect(same(data, before), 'An unauthorized review must not change any input state before throwing.');
      }
    });
    check('review-pending', 'Accept/reject pending applications only', () => {
      for (const status of ['accepted', 'rejected', 'withdrawn']) {
        const data = input(api); data.application.status = status;
        rejects(() => api.reviewApplication(data), 'A reviewed or withdrawn application cannot be reviewed again.');
      }
      rejects(() => api.reviewApplication({ ...input(api), decision: 'pending' }), 'Only accepted and rejected are valid review decisions.');
    });
    check('review-capacity', 'Accept the first candidate; block a second when the role is full', () => {
      const first = input(api), accepted = api.reviewApplication(first);
      expect(accepted.application.status === 'accepted', 'The owner must be able to accept an available pending application.');
      const next = { ...first, talent: copy(characters.otherTalent), application: { ...first.application, id: 'second', talentId: characters.otherTalent.id }, applications: [accepted.application] };
      const before = copy(next);
      rejects(() => api.reviewApplication(next), 'Count accepted applications for this role before accepting another.');
      expect(same(next, before), 'A full-role rejection must not change state.');
      for (const slots of [0, -1, 1.5]) { const data = input(api); data.gig.position.slots = slots; rejects(() => api.reviewApplication(data), 'Available slots must be a positive whole number.'); }
    });
    check('review-scoped-slots', 'Other gigs, other positions, and rejected applicants do not fill this role', () => {
      const data = input(api);
      data.applications = [{ ...data.application, gigId: 'other', status: 'accepted' }, { ...data.application, positionId: 'other', status: 'accepted' }, { ...data.application, status: 'rejected' }];
      expect(api.reviewApplication(data).application.status === 'accepted', 'Scope the accepted count to this gig AND position.');
    });
    check('review-matches', 'Do not review an application belonging to another event, position, or talent', () => {
      for (const patch of [{ gigId: 'other' }, { positionId: 'other' }, { talentId: 'other' }, { id: '' }]) {
        const data = input(api); data.application = { ...data.application, ...patch };
        rejects(() => api.reviewApplication(data), 'The application must match this gig, role, and talent.');
      }
    });
    check('review-paid', 'Paid acceptance activates the future discovery requirement', () => {
      const data = input(api), result = api.reviewApplication(data);
      expect(result.talent.id === data.talent.id && result.talent.paidGigSubscriptionRequired === true, 'Set the accepted talent’s subscription-required flag.');
      const gigs = [data.gig, freeGig(data.gig)];
      const after = api.browseGigs(gigs, result.talent);
      expect(after.length === 1 && after[0].gigType === 'free', 'New Paid discovery must close, while Free remains available.');
      expect(api.browseGigs(gigs, { ...result.talent, hasActiveSubscription: true }).length === 2, 'An active simulated subscription restores Paid discovery.');
    });
    check('review-free-reject', 'Rejection/free acceptance creates no new requirement and never clears an existing one', () => {
      for (const existing of [false, true]) for (const kind of ['reject', 'free']) {
        const data = input(api); data.talent.paidGigSubscriptionRequired = existing;
        if (kind === 'reject') { data.decision = 'rejected'; data.applications = [{ ...data.application, status: 'accepted' }]; }
        else data.gig.gigType = 'free';
        const result = api.reviewApplication(data);
        expect(result.application.status === data.decision && result.talent.paidGigSubscriptionRequired === existing, 'Rejection works even for a full role; Free/rejection must preserve the old flag.');
      }
    });
    check('review-commitments', 'Accepted Paid commitments remain in My Applications without a subscription', () => {
      const data = input(api), result = api.reviewApplication(data);
      const mine = api.myApplications([data.gig], [result.application], result.talent);
      expect(mine.length === 1 && mine[0].gig?.location === data.gig.location, 'Discovery restrictions must not remove an accepted commitment or its venue.');
    });
    check('review-private', 'Only this talent’s accepted application reveals the venue', () => {
      const data = input(api);
      for (const status of ['pending', 'rejected', 'withdrawn']) {
        const mine = api.myApplications([data.gig], [{ ...data.application, status }], data.talent);
        expect(mine.length === 1 && mine[0].gig && !Object.hasOwn(mine[0].gig, 'location') && !JSON.stringify(mine).includes(data.gig.location), 'Only accepted applications may contain location.');
      }
      expect(api.myApplications([data.gig], [{ ...data.application, status: 'accepted' }], characters.otherTalent).length === 0, 'A different talent cannot see this accepted application.');
      rejects(() => api.myApplications([data.gig], [data.application], characters.host), 'My Applications is for talent only.');
    });
    check('review-no-mutation', 'Review and application views leave their inputs unchanged', () => {
      const data = input(api), before = copy(data), result = api.reviewApplication(data);
      expect(same(data, before) && result.application !== data.application && result.talent !== data.talent, 'Return new application and talent objects.');
      const mineInput = [[data.gig], [result.application], result.talent], beforeMine = copy(mineInput);
      api.myApplications(...mineInput);
      expect(same(mineInput, beforeMine), 'Do not attach the venue to the stored application. Build a separate view.');
    });
  }
}
