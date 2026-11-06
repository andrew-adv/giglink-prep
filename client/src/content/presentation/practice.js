import { chapters } from './story.js';
import { snapshot, sources } from './evidence.js';

// Suggested language, not a claim that a named student personally built each feature.
const speeches = [
  'GigLink is a platform for event hosts who need instrumentalists or backup vocalists, and performers looking for opportunities. A generic vacancy does not tell a performer which samples to prepare or tell a host how to compare applicants. GigLink puts the event, requested role, people needed and audition samples in one place. A host can review matching videos and make a decision. The exact venue is protected until a talent is accepted. The documented purpose is clear, but I would not name the original proposer without confirmation. The important point is the connected booking journey, rather than simply a page of job cards.',
  'The repository divides the work into four student roles. Authentication and accounts belong to Student 1. Customers, gigs and review screens belong to Student 2. Talent profiles, discovery, auditions and applications belong to Student 3. Student 4, the Captain, is assigned payments, subscriptions, admin and shared integration. Each feature has a separate branch and clear folders. Those assignments are not proof of each person’s exact contributions. The user reports that the instructor supplied the initial C00 foundation, even though the task document assigns it to the Captain. After that common starting point, shared contracts let the different workstreams build compatible features.',
  'The MVP focuses on proving one complete booking flow. Free and Paid describe the gig, not whether posting is free. A Free gig has a five-thousand-naira posting fee; a Paid gig has a ten-thousand-naira posting fee. A Paid gig also gives the performer a compensation range starting at twenty-five thousand naira. That range is information, not a transfer of money to the performer. The backend must verify the posting payment before publication. Each role now requests one to three different samples, with one matching video per request. Features such as escrow, talent payouts, chat and automatic renewals are outside this MVP.',
  'The browser is the front desk, the backend checks the rules, and MongoDB is the booking ledger. React builds the screens, React Router selects them, and Vite builds the frontend. Node runs the server JavaScript and Express directs API requests. Mongoose models describe the stored records. A signed JWT identifies a logged-in user, but the backend still checks role and ownership. Paystack Test Mode supplies payment verification, and Cloudinary stores uploaded audition videos through the backend. The documented hosting targets are Vercel for the frontend, Render for the API and Atlas for MongoDB. These are architecture and configuration facts, not proof of a current successful live deployment.',
  'The recorded history starts with specifications on the fourth of October 2026, then a common foundation on the fifth. Authentication, customer and talent features appear in the following feature work. Payment and subscription services come next. On the twelfth, four feature merges are followed by the C05 integration commit. Later changes tighten authorization order, environment loading, route refreshes and the production API address. Early November brings public-page reconciliation, flexible auditions, account controls and mobile improvements. This timeline comes from commits and diffs. It does not establish private conversations, personal effort or instructor approval. At the checked snapshot, develop is forty-one commits ahead of main.',
  'C05 is where separate work becomes one application. The Express app mounts the feature routers, and the React router exposes their screens. The customer review adapter is connected to the talent application service, so both sides use the same application records. Payment verification receives a Gig repository method that can publish the owned draft. Talent discovery receives the shared active-subscription helper. First acceptance on a Paid gig calls a hook that marks the user as subscription-required. A hook here simply means a function called after an important event. Merging folders would not create these connections by itself; the integration code shows the actual handoffs.',
  'Here is the complete journey. A customer registers, creates a draft and completes a posting payment in Test Mode. The backend verifies the reference before publishing. Talent browses eligible gigs without receiving the exact venue, then submits one matching demo for each requested sample. The owning customer reviews the application and may accept it if the role has space. My Applications reveals the venue to the accepted talent. First Paid acceptance activates the rule for future Paid discovery. Free gigs remain available, and an accepted commitment remains accessible through My Applications without an active pass. Admin tools provide account oversight separately from this booking flow.',
  'One useful refinement is the change from exactly three audition videos to one through three requested samples. Changing only a label would not be enough. The form, validation, stored models and submission service now agree on the same count and unique titles. Other refinements include safer limited public previews, mobile navigation, appearance controls, subscription cancellation and guarded account deletion. The review service checks role capacity and updates a pending application inside a transaction. A transaction groups database changes so they can succeed or fail together. Its presence is useful evidence of design, but it does not replace concurrent database testing or prove every possible race is prevented.',
  'The current reviewed develop snapshot includes the connected workflows and later public, account and mobile refinements. There are clear limits. Payments are specified as Paystack Test Mode, with no talent payout or escrow. The talent pass is a one-off five-thousand-naira payment for thirty days, not automatic recurring billing. Cancellation ends access without issuing a refund. Account deletion checks upcoming accepted bookings and is not complete historical erasure; records and provider media can remain. Original test files were inspected for this story, but were not executed during this phase. A successful hosted demo still needs provider, device and end-to-end checks. Main and develop are not synchronized at the checked revision.',
  'The main lesson is that a shared product needs both separate ownership and deliberate connections. The task documents define boundaries, and C05 supplies the links between features. The security decisions also follow a consistent principle: the backend makes the trusted decision. It checks who owns a gig, verifies payment proof and decides which venue fields can be returned. The history then shows focused fixes and refinements across the same application. To demonstrate understanding, I would trace a complete successful request and one rejected case, such as a wrong-owner review or mismatched audition. GigLink’s accomplishment is a structured path from event request to audition, decision and accepted commitment.',
];

const fullSections = chapters.map((chapter, index) => ({
  id: chapter.id, title: chapter.title, keyPoint: chapter.summary,
  speech: speeches[index], remember: chapter.points.map(([title]) => title),
  followUp: chapter.question, response: chapter.answer, sources: chapter.sources.slice(0, 3),
}));
const quickSections = [
  { ...fullSections[0], speech: 'GigLink connects event hosts with instrumentalists and backup vocalists. Hosts describe the role and audition samples they need. Performers send matching videos, and the host reviews them. It is a structured booking journey, with venue privacy and clear application status, rather than just a list of vacancies.' },
  { ...fullSections[5], speech: 'Four documented workstreams cover accounts, customer gigs, talent applications, and payments/admin integration. The user reports that the instructor supplied the foundation. C05 connects routes, review services, verified payments and subscription checks. React provides the screens; Express and MongoDB handle trusted decisions and records.' },
  { ...fullSections[8], speech: 'A verified test posting payment publishes a draft. Talent applies, the host accepts, and My Applications reveals the venue. First Paid acceptance gates future Paid discovery, while Free gigs and accepted commitments remain available. Payments use Test Mode; talent payouts and escrow are outside the MVP. Personal contribution details and live demo results still need confirmation.' },
];

export const presentationModes = [
  { id: 'quick', title: 'Quick introduction', length: 'About 1 minute', targetSeconds: 60, sections: quickSections },
  { id: 'standard', title: 'Standard explanation', length: 'About 3–5 minutes', targetSeconds: 240, sections: [fullSections[0], fullSections[1], fullSections[3], fullSections[5], fullSections[6], fullSections[8]] },
  { id: 'full', title: 'Full presentation', length: 'About 8–10 minutes', targetSeconds: 540, sections: fullSections },
];

export function speakerNotes(mode) {
  return [
    `THE GIGLINK STORY — ${mode.title} (${mode.length})`,
    'Use these as prompts. Explain in your own words; pause to show one concrete example.',
    `Original develop: ${snapshot.develop}; checked ${snapshot.checkedOn}. Main is ${snapshot.ahead} commits behind.`,
    'Evidence limits: task roles are assignments; C00 instructor foundation is user-reported. Personal identities, proposal history and final approval are To confirm. Original tests were inspected, not run for this story. Live demo verification remains separate.',
    ...mode.sections.map((section, index) => [
      `\n${index + 1}. ${section.title}`, `KEY POINT: ${section.keyPoint}`, section.speech,
      `REMEMBER: ${section.remember.join('; ')}`, `FOLLOW-UP: ${section.followUp}`, `RESPONSE: ${section.response}`,
      ...section.sources.map(key => `${sources[key].label}: ${sources[key].url}`),
    ].join('\n')),
    '\nFinish: explain the connected booking journey, its trusted backend decisions and its MVP limits.',
    'For deeper practice: /questions (12 existing CTO questions).',
  ].join('\n\n');
}

export function elapsedSeconds(startedAt, accumulatedMs, now) {
  return Math.max(0, Math.floor((accumulatedMs + (startedAt === null ? 0 : Math.max(0, now - startedAt))) / 1000));
}

export function formatTime(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
