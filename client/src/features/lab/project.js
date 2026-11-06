export const editablePaths = ['/gig.js', '/validate.js', '/publish.js'];

export const starterFiles = {
  '/gig.js': `export function createGig(details) {
  // TODO: return a new event object with all of details.
  // It must start with publicationStatus: "draft"
  // and postingPaymentStatus: "unpaid", even if details says otherwise.
  return {};
}
`,
  '/validate.js': `export function validateGig(gig) {
  const errors = [];
  // TODO: add a message for a missing/blank title or location.
  // gigType must be "free" or "paid".
  // For paid gigs, min and max must be whole numbers:
  // min >= 25000, and max >= min.
  return errors;
}
`,
  '/publish.js': `import { validateGig } from "./validate.js";

export function publishGig(gig, payment) {
  // TODO: keep the gig unchanged unless ALL of these are true:
  // validateGig(gig) has no errors; gig is an unpaid draft;
  // payment.backendVerified is exactly true.
  // Ignore payment.browserSaysPaid.
  // If allowed, return a NEW object with publicationStatus: "published"
  // and postingPaymentStatus: "paid".
  return gig;
}
`,
};

// Teaching examples, also used as authored fixtures in the automated checks.
export const exampleSolutions = {
  '/gig.js': `export function createGig(details) {
  return {
    ...details,
    publicationStatus: "draft",
    postingPaymentStatus: "unpaid"
  };
}
`,
  '/validate.js': `export function validateGig(gig) {
  const errors = [];
  if (typeof gig.title !== "string" || !gig.title.trim()) {
    errors.push("Add an event title.");
  }
  if (typeof gig.location !== "string" || !gig.location.trim()) {
    errors.push("Add a location.");
  }
  if (gig.gigType !== "free" && gig.gigType !== "paid") {
    errors.push("Choose free or paid.");
  }
  if (gig.gigType === "paid") {
    const min = gig.paymentRange?.min;
    const max = gig.paymentRange?.max;
    if (!Number.isInteger(min) || min < 25000) {
      errors.push("Paid gigs start at 25000 whole naira.");
    }
    if (!Number.isInteger(max) || max < min) {
      errors.push("The maximum must be a whole amount at least the minimum.");
    }
  }
  return errors;
}
`,
  '/publish.js': `import { validateGig } from "./validate.js";

export function publishGig(gig, payment) {
  const valid = validateGig(gig).length === 0;
  const unpaidDraft = gig.publicationStatus === "draft"
    && gig.postingPaymentStatus === "unpaid";
  if (!valid || !unpaidDraft || payment.backendVerified !== true) {
    return gig;
  }
  return { ...gig, publicationStatus: "published", postingPaymentStatus: "paid" };
}
`,
};

export const baseDetails = {
  title: 'An evening of live music',
  eventDate: '2030-06-21',
  location: 'Demo music hall',
  gigType: 'paid',
  paymentRange: { min: 25000, max: 35000 },
};

export const scenarios = [
  { id: 'valid', label: 'Ready to check', details: baseDetails, payment: { browserSaysPaid: false, backendVerified: false } },
  { id: 'missing-title', label: 'Missing event title', details: { ...baseDetails, title: '' }, payment: { browserSaysPaid: false, backendVerified: true } },
  { id: 'low-pay', label: 'Paid gig below ₦25,000', details: { ...baseDetails, paymentRange: { min: 24000, max: 35000 } }, payment: { browserSaysPaid: false, backendVerified: true } },
  { id: 'browser-only', label: 'Browser says paid; backend says no', details: baseDetails, payment: { browserSaysPaid: true, backendVerified: false } },
  { id: 'verified', label: 'Backend verified; browser says no', details: baseDetails, payment: { browserSaysPaid: false, backendVerified: true } },
];

export function prepareScenario(scenarioId, title, replay = false) {
  const selected = scenarios.find((item) => item.id === (replay ? 'verified' : scenarioId)) || scenarios[0];
  const eventTitle = replay ? (title.trim() ? title : selected.details.title) : scenarioId === 'missing-title' ? '' : title;
  return { ...selected, details: { ...selected.details, title: eventTitle } };
}
