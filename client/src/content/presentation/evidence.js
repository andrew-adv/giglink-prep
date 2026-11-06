// Original GigLink is read-only evidence. All file links use this reviewed snapshot.
export const snapshot = {
  checkedOn: '2026-11-06',
  develop: '9c98a93950454c6c8a7b491794ef29727edbf15c',
  main: '6250520ea490ffa1063d4f0b1fee06ad7ba69010',
  ahead: 41,
  repository: 'https://github.com/andrew-adv/giglink',
};
const file = (label, path, kind = 'implementation') => ({ label, path, kind, url: `${snapshot.repository}/blob/${snapshot.develop}/${path}` });
const commit = (sha) => `${snapshot.repository}/commit/${sha}`;

export const sources = {
  readme: file('Product rules and MVP scope', 'README.md', 'documented'),
  agents: file('Ownership and integration rules', 'AGENTS.md', 'documented'),
  student1: file('Student 1 task assignment', 'docs/TASK_STUDENT_1.md', 'documented'),
  student2: file('Student 2 task assignment', 'docs/TASK_STUDENT_2.md', 'documented'),
  student3: file('Student 3 task assignment', 'docs/TASK_STUDENT_3.md', 'documented'),
  captain: file('Captain tasks: C00–C06', 'docs/TASK_STUDENT_4_CAPTAIN.md', 'documented'),
  release: file('Account and appearance release notes', 'docs/ACCOUNT_APPEARANCE_RELEASE.md', 'documented'),
  router: file('React routes', 'client/src/app/router.jsx'),
  app: file('Express route registration', 'server/src/app/app.js'),
  integration: file('C05 integration adapters and hooks', 'server/src/app/integration.js'),
  auth: file('JWT and active-account checks', 'server/src/modules/auth/auth.middleware.js'),
  authService: file('Password hashing and credentials', 'server/src/modules/auth/auth.service.js'),
  user: file('User model', 'server/src/modules/users/user.model.js'),
  gig: file('Gig model', 'server/src/modules/gigs/gig.model.js'),
  validation: file('Draft validation and posting fees', 'server/src/modules/gigs/gig.validation.js'),
  review: file('Customer review adapter', 'server/src/modules/customer/customer.application-adapter.js'),
  applications: file('Applications, review and venue reveal', 'server/src/modules/applications/application.service.js'),
  transactions: file('Application repository and transactions', 'server/src/modules/applications/application.repository.js'),
  discovery: file('Talent discovery and safe responses', 'server/src/modules/talent/talentDiscovery.service.js'),
  publicGigs: file('Limited public event previews', 'server/src/modules/gigs/publicGig.router.js'),
  payment: file('Posting payment verification', 'server/src/modules/payments/services/gig-posting-payment.service.js'),
  paystack: file('Server-held Paystack client', 'server/src/modules/payments/services/paystack.client.js'),
  subscription: file('Subscription duration and cancellation', 'server/src/modules/payments/services/subscription.service.js'),
  requirement: file('First Paid acceptance hook', 'server/src/modules/payments/services/subscription-requirement.service.js'),
  media: file('Server-side Cloudinary upload', 'server/src/modules/media/media.service.js'),
  deletion: file('Account deletion safeguards', 'server/src/modules/users/account-deletion.service.js'),
  admin: file('Admin read-only role preview', 'client/src/features/admin/AdminRolePreview.jsx'),
  theme: file('Original appearance provider', 'client/src/app/ThemeProvider.jsx'),
  auditionTests: file('Authored audition behavior tests', 'server/src/modules/applications/audition-requirements.test.js', 'test-code'),
  paymentTests: file('Authored Paystack error tests', 'server/src/modules/payments/services/paystack.client.test.js', 'test-code'),
  publicTests: file('Authored public response tests', 'server/src/modules/gigs/publicGig.routes.test.js', 'test-code'),
  mobileTests: file('Mobile layout CSS checks', 'client/src/app/mobile-layout.test.js', 'test-code'),
  vercel: file('Original client SPA rewrite', 'client/vercel.json'),
};

// Assignments describe workstreams, not verified identities or individual authorship.
export const workstreams = [
  { id: 1, title: 'Authentication & accounts', branch: 'feature/auth-users', role: 'Student 1',
    responsibility: 'Register and log in, hash passwords, issue tokens, and allow safe profile changes.',
    dependency: 'Everyone needs a trustworthy current user before protecting a gig, application or payment.',
    handoff: 'Export auth/user routers and protected-route components for shared registration.', sources: ['student1', 'auth', 'user'] },
  { id: 2, title: 'Customers & gigs', branch: 'feature/customer-gigs', role: 'Student 2',
    responsibility: 'Create valid drafts, manage the customer’s own gigs, and provide applicant review screens.',
    dependency: 'Uses Student 1’s identity, Student 3’s application service and the Captain’s posting-payment flow.',
    handoff: 'Export gig/customer routers; keep application persistence in its owning module.', sources: ['student2', 'validation', 'review'] },
  { id: 3, title: 'Talent & applications', branch: 'feature/talent-applications', role: 'Student 3',
    responsibility: 'Build talent profiles, safe browsing, matching audition submissions and My Applications.',
    dependency: 'Reads the Gig model and asks the payment module whether a subscription is active.',
    handoff: 'Export application services and the first accepted Paid-gig hook; do not duplicate payment models.', sources: ['student3', 'applications', 'discovery'] },
  { id: 4, title: 'Payments & integration', branch: 'feature/payments-admin', role: 'Student 4 / Captain',
    responsibility: 'Posting payments, subscription passes, admin tools, shared routes and final integration.',
    dependency: 'Connects all three workstreams: authenticated owners, valid drafts and acceptance events.',
    handoff: 'Coordinate branch merges, inspect conflicts if they arise, run integrated QA and prepare deployment. These are assigned responsibilities, not proof of each person’s actions.', sources: ['captain', 'integration', 'payment'] },
];

export const milestones = [
  { date: '2026-10-04', title: 'Specifications before features', sha: '59d17b46842e9c19e15f4e1cbe83242a1521d209',
    built: 'The first commit contains README, agent rules and four task documents.', why: 'A shared contract gives separate branches the same fees, models and privacy rules.', achieved: 'Requirements and ownership were recorded. This is the earliest repository event, not a verified date for the first idea.' },
  { date: '2026-10-05', title: 'A common foundation', sha: '4738b67ee195cb8a4f11c2abd1d1021963ad21e2',
    built: 'React/Vite client, Express health route, shared folders, dependencies and environment example.', why: 'Feature branches can start from the same runnable structure.', achieved: 'Foundation code was added and merged to main in 6250520. The user reports that the instructor supplied C00; the task file assigns it to the Captain.' },
  { date: '2026-10-07', title: 'Separate feature workstreams', sha: '5a8bc55d11e01efbc91d9d7534e1df119ecb64ce',
    related: ['feeb43b8df62324b7171d98cb300ee4e2cf58fa5', 'ba7bae6996169edd0b3b0894a0c41f5bc9b851c6', 'e9cd9bcb653cd2ae75ebf26afb70a6815e90420e'],
    built: 'Authentication, gig models/CRUD, talent auditions and customer review appear in feature history.', why: 'A review screen needs applications; applications need a gig and a user.', achieved: 'Feature-local exports existed for later integration. A commit author’s name does not identify a student role.' },
  { date: '2026-10-09', title: 'Payment and subscription work', sha: 'f7d71a3dc8ba825d3caf0aa2fd41aca63320906d', related: ['6c815fda4daa9ed0f30842437b9520020dbb1dbc'],
    built: 'Paystack Test Mode posting-payment and talent-subscription flows.', why: 'Publication and paid discovery need trusted server decisions.', achieved: 'Payment services calculate fees and verify provider responses instead of trusting a browser success claim.' },
  { date: '2026-10-12', title: 'C05: connect the MVP', sha: '56764832067abed70cac391903a09a1207c4c820', related: ['0391acec0c4907008a1a6a16dfb37b1e317ae2a1', '12e7d47d7808b43bbd4824dc81d626ccd420bbef', '9bffa13373321a4f569b469a55e3d7e1b8b134f3', '0bd4a28abeea2252a1b1f19b745edcf73d6e6aa5'],
    built: 'Four feature merges are followed by shared Express/React wiring and integration adapters.', why: 'Merging files alone does not connect the customer controller to the talent application service.', achieved: 'One shared application service, subscription lookup and first-Paid-acceptance hook are connected.' },
  { date: '2026-10-19', title: 'A focused stability fix', sha: '986b7714ae4134abe412b95944f736816365f80d',
    built: 'Withdrawal ownership is checked before opening a transaction, then checked again inside it.', why: 'An expected authorization refusal should not enter transaction retry machinery.', achieved: 'The diff records a narrow authorization-order change. It does not prove that every concurrency concern is solved.' },
  { date: '2026-10-23', title: 'Deployment configuration tightened', sha: '3139d8eca25507eab7de87c96c584118d4a9daa9', related: ['3272f915044ca37ac664dd8cf53bc61bfd8293f5', '03c0a80d2ec0f6573874bba38892afe26df2b10e'],
    built: 'Startup requires database configuration; the SPA rewrite is placed under client.', why: 'A deployed route refresh must reach React, and a missing database must not look like a usable server.', achieved: 'Repository configuration addresses these startup/refresh cases; live hosting is a separate verification.' },
  { date: '2026-10-30', title: 'Production API address made explicit', sha: 'b5b95d8ea3e88c8eeffbf2b9c17bd83e19ed8874', related: ['193d4a595f79244ee348bb88bce359cbf5973895'],
    built: 'Public/dashboard polish is followed by a required production API base URL.', why: 'A production browser must call the deployed backend, rather than an accidental local address.', achieved: 'Configuration becomes an explicit release requirement; this does not establish a live deployment URL.' },
  { date: '2026-11-03', title: 'Demo workstreams reconciled', sha: 'edc1ec814ba8e56efa6ede9b0fb77e6e08499f97', related: ['47cf28a28f4524b9fd84fa4dda4263466660d69a', 'ddee92f86a2dcab1574b6e232d6440c3b296e34f'],
    built: 'Public-shell and demo-core merges are followed by a workflow reconciliation commit.', why: 'Navigation and core workflows need to agree after separate UI changes.', achieved: 'The history records integration and refinement, without establishing the real identities behind work labels.' },
  { date: '2026-11-04', title: 'Public pages and flexible auditions', sha: 'ec51cada4715cabe30605894fe2b1eb7596c2ddf',
    built: 'Public previews, auth experience and audition rules are updated across UI, services and models.', why: 'A role can ask for the samples it actually needs while private details stay protected.', achieved: 'One to three unique samples replace the original fixed-three requirement; matching behavior has authored tests.' },
  { date: '2026-11-04', title: 'Account and appearance controls', sha: 'a876c593886821a4845203f93a71a494fa774694', related: ['47dc0070f725c3611ea31b0344905c4b629e133f'],
    built: 'Pass cancellation, guarded account deletion, theme palettes and an Admin role preview.', why: 'Account controls need clear consequences; a preview must not impersonate real users.', achieved: 'Release notes and implementation explain retained records, booking safeguards and local appearance preferences.' },
  { date: '2026-11-04', title: 'Latest reviewed integration: mobile browsing', sha: snapshot.develop,
    built: 'Mobile navigation, gig card layouts and limited public event details are refined.', why: 'Phone users need reachable navigation and readable event information without leaking the venue.', achieved: 'This is the latest develop commit checked on 6 November. Main remains at the older foundation revision.' },
].map(item => ({ ...item, url: commit(item.sha), related: (item.related || []).map(sha => ({ sha, url: commit(sha) })) }));

export const requestSteps = [
  { title: 'Browser: ask to publish', analogy: 'The front desk takes your request.', detail: 'React renders the screen. React Router chooses a screen from the address. An API request is a message asking the server to do a job.', state: 'Draft • payment reference sent', sources: ['router'] },
  { title: 'Express: check the caller', analogy: 'A staff pass identifies you; the booking name shows what you own.', detail: 'Node runs JavaScript on the server. Express directs requests. A JWT is a signed login token, not permission to edit every gig: the backend also checks role, active account and ownership.', state: 'Customer identified • ownership checked', sources: ['app', 'auth', 'payment'] },
  { title: 'Paystack: verify the proof', analogy: 'The cashier checks the receipt with the till.', detail: 'The server asks Paystack about the reference. Status, reference, amount in kobo and NGN currency must match. A browser callback alone cannot publish.', state: 'Test payment verified • not a talent payout', sources: ['payment', 'paystack'] },
  { title: 'MongoDB: store the change', analogy: 'Update the booking ledger after checking the receipt.', detail: 'MongoDB stores documents: records with named fields. A Mongoose model defines their shape. Gig, User, Application, Payment and Subscription records have different jobs.', state: 'Posting paid • gig published', sources: ['gig', 'user', 'integration'] },
  { title: 'Browser: show the result', analogy: 'The front desk reports what the ledger now says.', detail: 'JSON is the structured message returned by the API. The UI displays the server result and useful failures. It does not get database credentials or Paystack secrets.', state: 'Published card • safe response', sources: ['app', 'payment'] },
];

export const integrations = [
  { title: 'Login → protected operations', before: 'Auth exports exist in one feature folder.', change: 'Shared Express routes use requireAuthenticatedUser; React routes use protected screens.', reason: 'A hidden button alone cannot protect an API.', result: 'Requests are tied to an active User before feature checks.', sources: ['app', 'auth', 'router'] },
  { title: 'Draft → verified publication', before: 'Customer code saves an unpaid draft.', change: 'Posting-payment UI calls the payment service; the Gig repository supplies the publication update.', reason: 'The browser must not choose its posting fee or publication status.', result: 'Verified test payment can mark the owned draft paid and published.', sources: ['payment', 'integration'] },
  { title: 'Review screen → application service', before: 'Customer UI and talent persistence belong to different workstreams.', change: 'C05 configures the customer adapter with the exported application service.', reason: 'Two competing Application models would disagree about status.', result: 'Customer review uses the same application records as My Applications.', sources: ['integration', 'review', 'applications'] },
  { title: 'Acceptance → discovery and venue access', before: 'Application, User and Subscription records have separate owners.', change: 'The first Paid acceptance hook marks the user; browsing calls hasActiveTalentSubscription.', reason: 'New opportunities and an existing commitment need different access rules.', result: 'Free discovery and accepted-application venue access remain available when Paid browsing is gated.', sources: ['integration', 'requirement', 'discovery', 'applications'] },
];

export const productJourney = [
  ['Register', 'Customer/Talent accounts use hashed passwords and signed login tokens.', 'authService'],
  ['Create gig', 'The owning customer saves an unpaid draft with roles, slots and 1–3 sample requests.', 'validation'],
  ['Verify posting payment', 'The server verifies the Paystack Test Mode reference and expected fee.', 'payment'],
  ['Publish', 'The verified owned draft changes to paid/published.', 'integration'],
  ['Discover', 'Eligible talent sees published opportunities without the exact venue in the feed.', 'discovery'],
  ['Apply with demos', 'One matching uploaded video is required for every requested sample.', 'applications'],
  ['Review', 'The owning customer reads the application and audition videos.', 'review'],
  ['Accept', 'Only a pending application can change; the service checks the role’s available slots.', 'applications'],
  ['Reveal venue', 'My Applications includes the location for that talent’s accepted application.', 'applications'],
  ['Subscription gating', 'First Paid acceptance marks subscription required. Free gigs and accepted commitments remain accessible.', 'requirement'],
].map(([title, detail, source]) => ({ title, detail, sources: [source] }));

export const refinements = [
  { title: 'Joining separate modules', before: 'Feature branches export routes and service contracts.', change: 'C05 mounts the routes and supplies adapters and hooks.', reason: 'Features must exchange real data, not just coexist in Git.', result: 'Customer review, acceptance and payment services share the integrated models.', sources: ['captain', 'integration'], milestone: 4 },
  { title: 'Payment trust', before: 'A browser success screen is insufficient proof by the original contract.', change: 'The payment service verifies status, reference, amount and currency server-side.', reason: 'Browser claims can be changed by the caller.', result: 'Unverified payment does not publish. This is an implemented design rule, not a claim that a historic exploit occurred.', sources: ['readme', 'payment'], milestone: 3 },
  { title: 'Private venues', before: 'The stored Gig includes an exact location.', change: 'Talent responses copy allowed fields; accepted application views add venue access.', reason: 'Hiding text with CSS would still send the private value.', result: 'The feed omits the venue; My Applications can reveal an accepted commitment.', sources: ['discovery', 'applications', 'publicGigs'], milestone: 9 },
  { title: 'Available places', before: 'Each role declares how many people are needed.', change: 'Review checks accepted count and updates only a pending application inside a transaction.', reason: 'One available place should not mean unlimited acceptances.', result: 'The service refuses a full role. Concurrent race/load guarantees still require dedicated integration testing.', sources: ['applications', 'transactions'], milestone: 4 },
  { title: 'Discovery versus commitments', before: 'Talent initially has no subscription requirement.', change: 'First Paid acceptance triggers the requirement; My Applications has its own response path.', reason: 'A subscription gate must not erase a booking already accepted.', result: 'Free browsing and accepted venue access remain; new Paid discovery requires an active pass.', sources: ['requirement', 'discovery', 'applications'], milestone: 4 },
  { title: 'Auditions fit the role', before: 'Student 2/3 tasks require exactly three samples.', change: 'Models, validation, form and application service move together to 1–3 unique requests.', reason: 'The host can request the evidence needed for that role.', result: 'The demo count must match exactly; authored tests reject missing, extra, duplicate and wrong titles.', sources: ['student3', 'validation', 'auditionTests'], milestone: 9 },
  { title: 'Public pages and mobile navigation', before: 'Earlier feature screens and public-shell work are integrated separately.', change: 'Public experience, role-aware links, gig cards and mobile navigation are refined.', reason: 'People need a clear entry point and readable phone layouts.', result: 'Latest develop includes limited public previews and CSS regression checks. Phone usability still needs a real-browser check.', sources: ['router', 'publicGigs', 'mobileTests'], milestone: 11 },
  { title: 'Appearance and account controls', before: 'The MVP task set focuses on the core booking flow.', change: 'Later work adds Light/Dark/System, palettes, cancellation and guarded account deletion.', reason: 'Users need readable screens and clear control over access/account state.', result: 'Cancellation ends pass access immediately without refund; deletion is blocked by upcoming accepted bookings and retains historical/provider records.', sources: ['release', 'theme', 'deletion', 'subscription'], milestone: 10 },
  { title: 'Admin preview without impersonation', before: 'Admin account oversight is part of C04.', change: 'A later read-only Customer/Talent role preview explains the other workspaces.', reason: 'A demonstration must not grant another person’s authority.', result: 'The Admin role and JWT stay unchanged; real role QA requires separate demo accounts.', sources: ['captain', 'admin', 'release'], milestone: 10 },
  { title: 'Deployment settings', before: 'Local startup and client-side navigation do not prove hosted behavior.', change: 'Root environment loading, database startup checks, client SPA rewrite and production API configuration are tightened.', reason: 'Hosting needs explicit addresses, credentials and route handling.', result: 'Configuration is present; hosted availability and real external flows are not proven by these commits.', sources: ['vercel', 'readme'], milestone: 6 },
];

export const verification = [
  { label: 'Implemented code', detail: 'Routes, models and services support Customer, Talent and Admin workflows at the pinned develop snapshot. Reading code does not establish a successful live demo.', sources: ['router', 'app', 'applications'] },
  { label: 'Test code present', detail: 'The original snapshot contains focused audition, public-response, payment-error, cancellation, deletion and layout tests. They were inspected for this story; the original suite was not executed during P5.', sources: ['auditionTests', 'publicTests', 'paymentTests', 'mobileTests'] },
  { label: 'Live demonstration required', detail: 'Rehearse with separate test accounts: provider checkout/uploads, concurrent acceptance, venue redaction, cancellation, account deletion safeguards and hosted route refreshes. No instructor approval or deployment success is inferred.', sources: ['captain', 'release'] },
];
