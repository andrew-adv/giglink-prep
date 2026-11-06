const sourceRoot = 'https://github.com/andrew-adv/giglink/blob/9c98a93950454c6c8a7b491794ef29727edbf15c/server/src/modules/';

export const lessonContent = [
  {
    id: 1, file: '/gig.js', title: 'Create a gig',
    analogy: 'An event card holds the title, date, and venue. In JavaScript, an object holds those same details with a name for each piece.',
    try: 'In Result, change the fictional event title, then run your code. The card must use that name. Try another name: a hardcoded card will not follow it.',
    task: 'Finish createGig(details). Return a new object that keeps every detail. Set publicationStatus to "draft" and postingPaymentStatus to "unpaid" after copying the details.',
    contract: 'Input: event details → Output: a new unpaid draft object. The ...details syntax copies the fields into a new object.',
    source: `${sourceRoot}gigs/gig.service.js`, sourceName: 'gig.service.js → createGigDraft',
    connection: 'createGigDraft validates the input, adds the customer, and saves an unpaid draft through a repository. Our createGig only builds an object in memory. We add the checks in lesson 2; we do not save to a database.',
    question: 'Why not let the customer choose whether a gig is published?',
    answer: 'Anyone can change a browser request. The server must own the fields that decide whether a gig can be seen.',
    depth: 'createGigDraft sets postingPaymentStatus="unpaid" and publicationStatus="draft" after the validated fields. updateCustomerGig rejects system-controlled fields. In this exercise, putting the draft fields after ...details shows the same ownership rule without accounts or a database.',
  },
  {
    id: 2, file: '/validate.js', title: 'Check the gig',
    analogy: 'Before you print a flyer, check it. An empty event name or an impossible budget should send it back to your desk.',
    try: 'In Result, choose a missing title or a low payment. Run your code. The event card and error list come from your gig.js and validate.js together.',
    task: 'Finish validateGig(gig). Return an array of helpful error messages. A valid gig returns []. Require a non-blank title and location, and gigType "free" or "paid". For paid gigs, min and max must be whole numbers, min must be at least 25000, and max must be at least min.',
    contract: 'Input: a gig object → Output: [] when valid, or ["a useful message", ...] when invalid. Use errors.push("message") to add a problem.',
    source: `${sourceRoot}gigs/gig.validation.js`, sourceName: 'gig.validation.js → validateGigDraft',
    connection: 'The real validator checks gig type, roles, samples, and paid payment ranges; it throws on failure. The real gig.model.js also requires title and location. Our smaller check returns messages, skips roles and dates, and keeps only a few rules. Free means talent is unpaid; it does not mean the real posting fee is zero.',
    extraSource: `${sourceRoot}gigs/gig.model.js`,
    question: 'Why test a valid gig as well as invalid gigs?',
    answer: 'A function that rejects everything keeps bad data out, but it also stops every real event. We need to prove both sides.',
    depth: 'validateGigDraft returns normalized data when rules pass and throws errors when they fail. The mini-project checks both outcomes, including the exact ₦25,000 boundary and free gigs without a payment range. Returning [] for every input also fails the checks.',
  },
  {
    id: 3, file: '/publish.js', title: 'Publish with proof',
    analogy: 'Someone showing you a “paid” screen is like someone showing you a receipt they typed themselves. Check the payment record before you put the event on the noticeboard.',
    try: 'In Result, first choose “Browser says paid; backend says no”. Then try “Backend verified; browser says no”. Your code should trust only the second result. All payments here are simulated.',
    task: 'Finish publishGig(gig, payment). Use your validator. Publish only a valid, unpaid draft with payment.backendVerified === true. Return a new object with publicationStatus "published" and postingPaymentStatus "paid". Otherwise return the unchanged gig.',
    contract: 'Input: your gig + a simulated verification result → Output: the unchanged gig, or a new published gig. browserSaysPaid is not proof.',
    source: `${sourceRoot}payments/services/gig-posting-payment.service.js`, sourceName: 'gig-posting-payment.service.js → verify / publishVerifiedGig',
    connection: 'The real backend verifies transaction status, reference, amount, and currency before asking the repository to publish. Here, one boolean stands for that verified result. Both controls are learning inputs in the browser; this is not payment processing or a secure verification service.',
    question: 'Why is a browser payment callback not enough?',
    answer: 'The browser is controlled by its user. The server checks the payment provider before it believes that payment worked.',
    depth: 'verify compares the provider response with the stored payment: success status, matching reference, amount in kobo, and NGN currency. Only then does publishVerifiedGig call markPostingPaymentVerified. We test the trust decision with backendVerified; we do not test or reproduce the provider integration.',
  },
];

export const replayQuestion = {
  title: 'Why does publishing still need the earlier checks?',
  answer: 'A later step should not turn a broken draft into a live event. Keeping the same gig through the flow makes that mistake visible.',
  depth: 'In GigLink, createGigDraft and updateCustomerGig both call validateGigDraft. The payment service then checks ownership, eligible payment state, and transaction details. Our publishGig calls the smaller validateGig directly because this mini-project has no stored, validated database record. That is a deliberate simplification, not a claim that the payment service calls validateGigDraft.',
  source: `${sourceRoot}gigs/gig.service.js`,
};
