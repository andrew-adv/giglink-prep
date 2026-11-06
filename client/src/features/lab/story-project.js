export const storyStarterFiles = {
  '/browse.js': `export function browseGigs(gigs, talent) {
  // TODO: require a talent character with an id.
  // Keep only published gigs. Free stays visible.
  // Paid is visible before the first accepted Paid gig OR with an active subscription.
  // Return safe cards: id, title, gigType, publicationStatus, position.
  // Never include location on the board, even for accepted talent.
  return [];
}
`,
  '/apply.js': `export function applyForGig(gig, talent, demos, applications = []) {
  // TODO: require talent, a published gig, and 1–3 different requested samples.
  // Match exactly one { songTitle, clipId } demo to each sample; trim titles.
  // Reject missing, duplicate, extra or mismatched demos by throwing Error.
  // Reject an existing pending/accepted application for this gig/position/talent.
  // Return { id, gigId, positionId, talentId, demos, status: "pending" }.
  throw new Error("Finish the demo checks in apply.js.");
}
`,
  '/review.js': `export function reviewApplication({ gig, application, customer, decision, applications, talent }) {
  // TODO: only the owning customer may accept/reject a matching pending application.
  // On acceptance, count accepted applications for THIS gig and position.
  // Throw if the role is full. Return NEW { application, talent } objects.
  // Acceptance of a paid gig sets talent.paidGigSubscriptionRequired = true.
  // Never clear an existing requirement; rejection/free acceptance does not create it.
  throw new Error("Finish the review rules in review.js.");
}

export function myApplications(gigs, applications, talent) {
  // TODO: require a talent character. Return only that talent's applications.
  // Each view: { id, status, gig: { id, title, gigType } }.
  // Add gig.location ONLY for an accepted application.
  // Do not apply the discovery subscription gate here.
  return [];
}
`,
};

export const storySolutions = {
  '/browse.js': `export function browseGigs(gigs, talent) {
  if (talent.role !== "talent" || !talent.id) throw new Error("Talent only.");
  const paidAccess = !talent.paidGigSubscriptionRequired
    || talent.hasActiveSubscription === true;
  return gigs.filter(gig => gig.publicationStatus === "published"
    && (gig.gigType === "free" || (gig.gigType === "paid" && paidAccess)))
    .map(gig => ({
      id: gig.id, title: gig.title, gigType: gig.gigType,
      publicationStatus: gig.publicationStatus,
      position: { id: gig.position.id, slots: gig.position.slots,
        auditionSongs: [...gig.position.auditionSongs] }
    }));
}
`,
  '/apply.js': `export function applyForGig(gig, talent, demos, applications = []) {
  if (talent.role !== "talent" || !talent.id) throw new Error("Talent only.");
  if (!gig.id || gig.publicationStatus !== "published") throw new Error("Choose a published gig.");
  const songs = gig.position?.auditionSongs;
  if (!gig.position?.id || !Array.isArray(songs) || songs.length < 1 || songs.length > 3
    || songs.some(song => typeof song !== "string" || !song.trim())) {
    throw new Error("Request 1–3 named samples.");
  }
  const requested = songs.map(song => song.trim());
  if (new Set(requested).size !== requested.length) throw new Error("Requested samples must differ.");
  if (!Array.isArray(demos) || demos.length !== requested.length) throw new Error("One demo for each sample.");
  const submitted = new Set();
  const clips = new Set();
  for (const demo of demos) {
    if (!demo || typeof demo.songTitle !== "string" || typeof demo.clipId !== "string"
      || !demo.clipId.trim() || !requested.includes(demo.songTitle.trim())
      || submitted.has(demo.songTitle.trim()) || clips.has(demo.clipId.trim())) {
      throw new Error("Match each sample once with a different fictional clip.");
    }
    submitted.add(demo.songTitle.trim());
    clips.add(demo.clipId.trim());
  }
  if (applications.some(app => app.gigId === gig.id && app.positionId === gig.position.id
    && app.talentId === talent.id && ["pending", "accepted"].includes(app.status))) {
    throw new Error("An active application already exists.");
  }
  return { id: "app-" + gig.id + "-" + talent.id,
    gigId: gig.id, positionId: gig.position.id, talentId: talent.id,
    demos: demos.map(demo => ({ songTitle: demo.songTitle.trim(), clipId: demo.clipId.trim() })),
    status: "pending" };
}
`,
  '/review.js': `export function reviewApplication({ gig, application, customer, decision, applications, talent }) {
  if (customer.role !== "customer" || !customer.id || customer.id !== gig.customerId) {
    throw new Error("Only this event's customer can review.");
  }
  if (!gig.id || !gig.position?.id || !application.id || !talent.id
    || application.gigId !== gig.id || application.positionId !== gig.position.id
    || application.talentId !== talent.id || talent.role !== "talent") {
    throw new Error("This application does not match the event, role, or talent.");
  }
  if (application.status !== "pending" || !["accepted", "rejected"].includes(decision)) {
    throw new Error("Accept or reject a pending application only.");
  }
  if (decision === "accepted") {
    const count = applications.filter(app => app.gigId === gig.id
      && app.positionId === gig.position.id && app.status === "accepted").length;
    if (!Number.isInteger(gig.position.slots) || gig.position.slots < 1 || count >= gig.position.slots) {
      throw new Error("This role is full.");
    }
  }
  return { application: { ...application, status: decision },
    talent: { ...talent, paidGigSubscriptionRequired:
      Boolean(talent.paidGigSubscriptionRequired || (decision === "accepted" && gig.gigType === "paid")) } };
}

export function myApplications(gigs, applications, talent) {
  if (talent.role !== "talent" || !talent.id) throw new Error("Talent only.");
  return applications.filter(app => app.talentId === talent.id).map(app => {
    const gig = gigs.find(item => item.id === app.gigId);
    const view = gig ? { id: gig.id, title: gig.title, gigType: gig.gigType } : null;
    if (view && app.status === "accepted") view.location = gig.location;
    return { id: app.id, status: app.status, gig: view };
  });
}
`,
};

export const characters = {
  host: { id: 'host-ada', role: 'customer', label: 'Ada · event host' },
  outsider: { id: 'host-obi', role: 'customer', label: 'Obi · another host' },
  talent: { id: 'talent-zara', role: 'talent', label: 'Zara · fictional talent', paidGigSubscriptionRequired: false, hasActiveSubscription: false },
  otherTalent: { id: 'talent-kai', role: 'talent', label: 'Kai · fictional talent', paidGigSubscriptionRequired: false, hasActiveSubscription: false },
};

export const storyDetails = {
  id: 'demo-gig', customerId: characters.host.id,
  position: { id: 'demo-role', slots: 1, auditionSongs: ['Warm-up groove', 'Closing rhythm'] },
};

export function demoSet(songs, kind = 'matching') {
  const demos = songs.map((songTitle, index) => ({ songTitle, clipId: `fictional-clip-${index + 1}` }));
  if (kind === 'missing') return demos.slice(1);
  if (kind === 'duplicate') return demos.length === 1 ? [demos[0], { ...demos[0] }] : demos.map(() => ({ ...demos[0] }));
  if (kind === 'extra') return [...demos, { songTitle: 'Unrequested solo', clipId: 'fictional-extra' }];
  if (kind === 'mismatch') return demos.map((demo, index) => index === 0 ? { ...demo, songTitle: 'Wrong sample' } : demo);
  return demos;
}

export const storyOptions = { talentStatus: 'new', demos: 'matching', sampleCount: 2, reviewer: 'host', decision: 'accepted', full: false, gigType: 'paid' };
