const eventTitle = 'Friday music night';
const visual = (status, rows, title = eventTitle, tone = 'neutral') => ({ title, status, rows, tone });
const step = (title, lines, explanation, changed, view) => ({ title, lines, explanation, changed, visual: view });

function objectExample() {
  return {
    id: 'default', label: 'Build an event',
    code: [
      'function createGig(title) { // A recipe; title is its input.',
      '  const gig = { // An object bundles named details together.',
      '    title: title, // Field name on the left, value on the right.',
      '    publicationStatus: "draft" // A string is text in quotes.',
      '  };',
      '  return gig; // Give the finished object back to the caller.',
      '}',
      'const event = createGig("Friday music night"); // Run the recipe.',
    ],
    steps: [
      step('Give the recipe a name to work with', [8], 'Text inside quotes is called a string. Here it is the event name. The parentheses in createGig(...) send that name to a recipe. const event gives the eventual answer a name we can use later.', 'The name is ready to send. No event has come back yet.', visual('waiting for recipe', [['Text supplied', eventTitle], ['Event returned', 'not yet']])),
      step('Receive the input', [1], 'A function is a named recipe made of instructions. Its input is called a parameter. Here title is that input label: it receives "Friday music night" when we call the recipe.', 'The recipe now knows which title to use.', visual('input received', [['title inside the recipe', eventTitle], ['Event returned', 'not yet']])),
      step('Bundle the details', [2, 3, 5], 'An object is a bundle of named details. The curly braces { } hold the bundle. A field is one named detail: title: title pairs the field name on the left with our input on the right. A comma separates it from the next field.', 'Our event card has a title field. const gig names the bundle inside the recipe.', visual('title added', [['Title field', eventTitle], ['State field', 'not added yet']])),
      step('Give it a starting state', [4], '"draft" is another string: a piece of text. publicationStatus is the field that holds it. The colon joins a field name to its value; it does not mean “equals”.', 'The event is a draft. It has not been published.', visual('draft set', [['Title', eventTitle], ['State', 'draft']])),
      step('Give the event back', [6, 8], 'return means “give this value back to whoever asked”. It finishes this call of the function. The object named gig becomes the answer stored as event. A semicolon ends an instruction.', 'The caller now has the whole event object, ready for the next lesson.', visual('draft', [['Title', eventTitle], ['State', 'draft']], eventTitle, 'good')),
    ],
    proof: '({ title: event.title, status: event.publicationStatus, rows: [["Title", event.title], ["State", event.publicationStatus]] })',
  };
}

function validationExample(missing) {
  const title = missing ? '' : eventTitle;
  const errors = missing ? 'Add an event title.' : 'none';
  return {
    id: missing ? 'missing' : 'named', label: missing ? 'Leave the title empty' : 'Supply a title', choiceStep: 3,
    code: [
      `const gig = { title: ${JSON.stringify(title)} }; // Our event from lesson 1.`,
      'function validateGig(gig) { // A function checks the event it receives.',
      '  const errors = []; // An array is a list; [] starts it empty.',
      '  if (!gig.title.trim()) { // If the title has no useful text...',
      '    errors.push("Add an event title."); // ...add a message to the list.',
      '  }',
      '  return errors; // Give the list of problems back.',
      '}',
      'const errors = validateGig(gig); // Run the check on our event.',
    ],
    steps: [
      step('Pass the event into a check', [1, 2, 9], 'A function is a recipe. The gig inside the parentheses is its input. Calling validateGig(gig) asks it to check this event.', 'The checker receives the event we are building.', visual('ready to check', [['Title supplied', title || '(empty)'], ['Problems checked', 'not yet']], title || '(no event title)')),
      step('Start a list of problems', [3], 'An array is a list of values, written with square brackets. errors = [] starts with no messages. Checking data should not assume it is already wrong.', 'The problem list is empty so far.', visual('checking', [['Errors', 'empty list []'], ['Title supplied', title || '(empty)']], title || '(no event title)')),
      step('Ask a yes-or-no question', [4, 5], 'A condition is a yes-or-no check. The dot reads a field: gig.title reads the title. trim() removes spaces at the ends. ! means “not”: no text left means we add a message. push adds an item to an array.', missing ? 'There is no title, so the message is added.' : 'The title has text, so no message is added.', visual(missing ? 'message added' : 'title passed', [['Check', 'title'], ['Errors', errors]], title || '(no event title)', missing ? 'bad' : 'good')),
      step('Return useful feedback', [7, 9], 'return gives the list back. An empty list means this check found no problems. A list with a message tells the caller what needs fixing.', missing ? 'The caller can show the missing-title message instead of pretending the event is ready.' : 'The caller receives an empty list and can move to the next check.', visual(missing ? 'needs changes' : 'valid', [['Check', 'title'], ['Errors', errors]], title || '(no event title)', missing ? 'bad' : 'good')),
    ],
    proof: '({ title: gig.title || "(no event title)", status: errors.length ? "needs changes" : "valid", rows: [["Check", "title"], ["Errors", errors.join(" ") || "none"]] })',
  };
}

function paymentExample(verified) {
  return {
    id: verified ? 'verified' : 'unverified', label: verified ? 'Backend verifies payment' : 'Backend does not verify payment', choiceStep: 3,
    code: [
      'const gig = { title: "Friday music night", publicationStatus: "draft" };',
      'const browserSaysPaid = true; // A browser claim is not proof.',
      `const backendVerified = ${verified}; // A boolean is true or false, without quotes.`,
      'function publishGig(gig, proof) { // proof receives that boolean.',
      '  if (proof !== true) return gig; // No verified proof? Keep the draft.',
      '  return { ...gig, publicationStatus: "published" }; // Copy, then change state.',
      '}',
      'const result = publishGig(gig, backendVerified); // Use backend proof only.',
    ],
    steps: [
      step('Keep the event in draft', [1], 'A state is a label describing where something is in a process. Our publicationStatus field starts with the text "draft".', 'The event is still on the host’s desk.', visual('draft', [['Event state', 'draft'], ['Payment checked', 'not yet']])),
      step('Separate a claim from proof', [2, 3], 'A boolean has one of two values: true or false. The browser claim is true here in both choices. The backend result is a separate value.', 'A “paid” screen alone has not published anything.', visual('checking proof', [['Browser claim', 'paid'], ['Backend proof', String(verified)]])),
      step('Keep the draft when proof is missing', [4, 5], 'proof is the function’s input label. !== means “is not exactly”. If proof is not the boolean true, return gives back the unchanged draft and ends the recipe.', verified ? 'The early return is skipped because proof is true.' : 'The early return keeps the event in draft.', visual(verified ? 'proof accepted' : 'draft kept', [['Browser claim', 'paid'], ['Backend proof', String(verified)], ['Can move on', verified ? 'yes' : 'no']], eventTitle, verified ? 'good' : 'bad')),
      step('Read the returned event', [6, 8], '...gig copies the event fields into a new object. The field after it replaces only publicationStatus. If the recipe returned earlier, this line never runs.', verified ? 'The returned event is published. The old draft object was not rewritten.' : 'The returned event stays draft even though the browser claimed payment.', visual(verified ? 'published' : 'draft', [['Browser claim', 'paid'], ['Backend proof', String(verified)], ['Event state', verified ? 'published' : 'draft']], eventTitle, verified ? 'good' : 'bad')),
    ],
    proof: '({ title: result.title, status: result.publicationStatus, rows: [["Browser claim", "paid"], ["Backend proof", String(backendVerified)], ["Event state", result.publicationStatus]] })',
  };
}

function browseExample(required, active) {
  const paid = !required || active;
  const rows = [...(paid ? [[eventTitle, 'paid · venue hidden']] : []), ['Free afternoon', 'free · venue hidden']];
  return {
    id: !required ? 'new' : active ? 'active' : 'required', label: !required ? 'New talent' : active ? 'Required · active subscription' : 'Required · no active subscription', choiceStep: 3,
    code: [
      `const talent = { paidGigSubscriptionRequired: ${required}, hasActiveSubscription: ${active} };`,
      'const gigs = [ // An array holds more than one event.',
      '  { title: "Friday music night", gigType: "paid", publicationStatus: "published", location: "Demo music hall" },',
      '  { title: "Free afternoon", gigType: "free", publicationStatus: "published", location: "Demo park" }',
      '];',
      'const paidAccess = !talent.paidGigSubscriptionRequired || talent.hasActiveSubscription;',
      'const visible = gigs.filter(gig => gig.publicationStatus === "published"',
      '  && (gig.gigType === "free" || paidAccess)); // Keep only allowed events.',
      'const board = visible.map(gig => ({ title: gig.title, gigType: gig.gigType }));',
      '// Safe cards name their fields. location was never copied.',
    ],
    steps: [
      step('Start with a list of events', [2, 3, 4, 5], 'An array is a list, written inside [ ]. Each object inside this list holds one event’s fields. This is the host’s data; it still contains private venues.', 'Two events are available to check. We have not built a talent response yet.', visual('host data only', [['Paid event', eventTitle], ['Free event', 'Free afternoon']], 'Talent’s event board')),
      step('Work out Paid access', [1, 6], '! means “not”. || means “or”. A new talent can discover Paid gigs before the requirement starts. After it starts, an active subscription restores access.', `Paid discovery is ${paid ? 'open' : 'closed'} for this choice. Free discovery stays open.`, visual('access decided', [['Paid discovery', paid ? 'open' : 'closed'], ['Free discovery', 'open']], 'Talent’s event board')),
      step('Filter the list', [7, 8], 'filter makes a new array containing only items that pass a check. gig => means “for each event, do this check”. === checks equality, and && means both checks must pass.', `The filter keeps ${paid ? 'both events' : 'only the Free event'}.`, visual('events selected', rows.map(([name]) => [name, 'selected; response not built yet']), 'Talent’s event board')),
      step('Build safe cards', [9, 10], 'map makes a new value for each selected item. Here we create a new object with just title and gigType. The private location field is not copied into the response.', 'The board contains only the chosen safe fields. Hiding text with CSS would not remove data sent to a browser.', visual('safe board', rows, 'Talent’s event board', 'good')),
    ],
    proof: '({ title: "Talent’s event board", status: "safe board", rows: board.map(gig => [gig.title, gig.gigType + " · venue hidden"]) })',
  };
}

function auditionExample(duplicate) {
  const second = duplicate ? 'Warm-up groove' : 'Closing rhythm';
  return {
    id: duplicate ? 'duplicate' : 'matching', label: duplicate ? 'Two clips with the same song label' : 'One clip for each requested song', choiceStep: 4,
    code: [
      'const requested = ["Warm-up groove", "Closing rhythm"]; // Titles the host asked for.',
      `const demos = [{ songTitle: "Warm-up groove" }, { songTitle: ${JSON.stringify(second)} }];`,
      'const titles = demos.map(demo => demo.songTitle); // Collect the clip labels.',
      'const sameCount = titles.length === requested.length; // Two requests, two clips?',
      'const unique = new Set(titles).size === titles.length; // Different labels?',
      'const matched = requested.every(song => titles.includes(song)); // Every song is covered?',
      'const result = sameCount && unique && matched ? "pending" : "rejected";',
      '// Before ? is the check; after it are the yes and no answers.',
    ],
    steps: [
      step('Read the request', [1], 'An array is a list. Each string in requested names one song the host wants to hear.', 'There are two requests, and neither has been matched yet.', visual('waiting for clips', [['Warm-up groove', 'requested'], ['Closing rhythm', 'requested']], 'Zara’s audition')),
      step('Read the fictional clip records', [2], 'A record here is an object holding details about one clip. songTitle is the field we use to match it. These are labels only; there is no video upload.', 'Two clip records arrived. We still need to check their labels.', visual('clips received', [['Clip 1', 'Warm-up groove'], ['Clip 2', second]], 'Zara’s audition')),
      step('Collect just the labels', [3, 4], 'map reads each demo and puts its songTitle into a new list. length counts the items in a list. Equal counts are useful, but they do not prove the labels match.', 'The count check passes in both choices. Two copies of one song would still have a count of two.', visual('count matches', [['Requested count', '2'], ['Submitted count', '2'], ['Second clip label', second]], 'Zara’s audition')),
      step('Look for repeats and missing matches', [5, 6], 'A Set keeps one copy of each different value; size counts those values. every asks whether all requested songs pass a check. includes asks whether a title appears in the submitted list.', duplicate ? 'Only one distinct label remains, and Closing rhythm has no matching clip.' : 'Both labels are different, and each requested title has a match.', visual(duplicate ? 'bad mapping' : 'all samples matched', [['Different labels', duplicate ? '1' : '2'], ['Closing rhythm', duplicate ? 'missing' : 'matched']], 'Zara’s audition', duplicate ? 'bad' : 'good')),
      step('Choose the result', [7, 8], '&& means all three checks must be true. The ? and : choose one of two answers: pending if the checks pass, rejected if they fail. Pending means waiting for the host’s review.', duplicate ? 'The duplicate mapping is rejected. A correct file count did not hide the missing song.' : 'The audition can become a pending application. It has not been accepted yet.', visual(duplicate ? 'rejected' : 'pending', [['Warm-up groove', duplicate ? 'two clips — duplicate' : 'one matching clip'], ['Closing rhythm', duplicate ? 'no matching clip' : 'one matching clip']], 'Zara’s audition', duplicate ? 'bad' : 'good')),
    ],
    proof: '({ title: "Zara’s audition", status: result, rows: [["Warm-up groove", unique ? "one matching clip" : "two clips — duplicate"], ["Closing rhythm", matched ? "one matching clip" : "no matching clip"]] })',
  };
}

function reviewExample(kind) {
  const owner = kind !== 'outsider', full = kind === 'full' || kind === 'reject', reject = kind === 'reject';
  const accepted = owner && !full, status = reject ? 'rejected' : accepted ? 'accepted' : 'pending';
  return {
    id: kind, label: { accept: 'Ada accepts an available role', outsider: 'Obi tries to review Ada’s event', full: 'Ada tries to accept a full role', reject: 'Ada rejects while the role is full' }[kind], choiceStep: 4,
    code: [
      'const gig = { customerId: "ada", slots: 1, gigType: "paid", location: "Demo music hall" };',
      `const customerId = "${owner ? 'ada' : 'obi'}"; // Who is trying to review?`,
      `const decision = "${reject ? 'rejected' : 'accepted'}";`,
      'const application = { status: "pending", talentId: "zara" };',
      `const acceptedCount = ${full ? 1 : 0}; // Already accepted for this role.`,
      'const allowed = customerId === gig.customerId && application.status === "pending"',
      '  && (decision === "rejected" || acceptedCount < gig.slots);',
      'const result = allowed ? { ...application, status: decision } : application;',
      'const accepted = result.status === "accepted"; // A boolean, not a text label.',
      'const myApplication = { status: result.status }; // A separate view for Zara.',
      'if (accepted) myApplication.location = gig.location; // Reveal only on acceptance.',
      'const talent = { paidGigSubscriptionRequired: accepted && gig.gigType === "paid" };',
      'const futureBoard = talent.paidGigSubscriptionRequired ? ["Free events"] : ["Paid events", "Free events"];',
    ],
    steps: [
      step('Know who owns the event', [1, 2, 6], 'Ownership means the event belongs to this customer. === checks that the customer’s id equals the event’s customerId. A customer label alone is not enough.', owner ? 'Ada matches the owner. Review can continue to the other checks.' : 'Obi is a different customer. This review cannot change the application.', visual(owner ? 'owner matches' : 'wrong owner', [['Event owner', 'ada'], ['Reviewer', owner ? 'ada' : 'obi']], 'Review Zara’s application', owner ? 'neutral' : 'bad')),
      step('Check the application’s state', [3, 4, 6], 'Status is a label for where an application is in the process. Pending means waiting. Only a pending application can be reviewed in this example.', 'Zara’s application is pending. The requested decision has not been applied yet.', visual('pending', [['Decision requested', reject ? 'rejected' : 'accepted'], ['Current state', 'pending']], 'Review Zara’s application')),
      step('Check the available place', [5, 7], 'slots is the number of places available. acceptedCount counts people already accepted for this role. < means “less than”. Rejection does not need an empty place.', reject ? 'The role is full, but rejection is still allowed for the owner.' : full ? 'There are no places left, so acceptance must stop.' : 'One place is open; the owner may accept.', visual(full ? 'role full' : 'place available', [['Places available', '1'], ['Already accepted', full ? '1' : '0']], 'Review Zara’s application')),
      step('Apply only an allowed decision', [8, 9], 'The ? and : choose a result. If allowed is true, ...application copies the old fields and replaces status. Otherwise the original application stays unchanged.', status === 'pending' ? 'The application stays pending because this review was blocked.' : `The application is now ${status}.`, visual(status, [['Application status', status], ['Venue', 'not included yet']], 'Review Zara’s application', status === 'accepted' ? 'good' : 'bad')),
      step('Follow the consequences', [10, 11, 12, 13], 'A view is the smaller object we send back to one reader. Accepted talent get the venue through My Applications. A subscription is permission to discover future Paid gigs; it does not cancel an existing accepted commitment.', accepted ? 'Zara keeps the accepted event and venue in My Applications. Future discovery shows Free events until there is an active subscription.' : reject ? 'No venue is revealed and this rejection creates no subscription requirement.' : 'Nothing was accepted: the venue stays hidden and no new requirement starts.', visual(status, [['My Applications venue', accepted ? 'Demo music hall' : 'hidden'], ['Subscription required', String(accepted)], ['Future board', accepted ? 'Free events' : 'Paid events, Free events']], 'Review Zara’s application', accepted ? 'good' : 'bad')),
    ],
    proof: '({ title: "Review Zara’s application", status: result.status, rows: [["My Applications venue", myApplication.location || "hidden"], ["Subscription required", String(talent.paidGigSubscriptionRequired)], ["Future board", futureBoard.join(", ")]] })',
  };
}

export const walkthroughs = [
  { id: 1, title: 'Build an event card', analogy: 'Think of a blank event card. We write a name and a state on it, then hand the whole card back to the person who asked for it.', scope: 'This first example keeps only the title and draft state. The coding lab also keeps the other event details and unpaid payment state.', variants: [objectExample()] },
  { id: 2, title: 'Check before printing', analogy: 'Before printing an event flyer, check whether it has a name. Write down the problem so someone knows what to fix.', scope: 'This example checks one field. Your coding exercise also checks the location, gig type, and paid payment range.', variants: [validationExample(false), validationExample(true)] },
  { id: 3, title: 'Check the receipt', analogy: 'A screen saying “paid” is like a receipt someone typed themselves. Check the trusted payment record before putting the event on the noticeboard.', scope: 'One simulated boolean stands for backend proof. The coding lab also checks validation, unpaid state, and draft state. No real payment is made.', variants: [paymentExample(true), paymentExample(false)] },
  { id: 4, title: 'Choose safe event cards', analogy: 'A noticeboard lists events without giving every passer-by the exact venue. Different readers may be allowed to discover different events.', scope: 'These two fixture events are already published. The lab also checks talent identity, keeps the requested role, and tests drafts and private nested fields.', variants: [browseExample(false, false), browseExample(true, false), browseExample(true, true)] },
  { id: 5, title: 'Match every requested song', analogy: 'The host asks for two songs. Two recordings of the first song still leave the second request unanswered.', scope: 'These are fictional song labels. The lab additionally checks 1–3 requests, clip IDs, trimming, identity, publication, and active duplicates. It throws on invalid input rather than returning the demo’s rejected label.', variants: [auditionExample(false), auditionExample(true)] },
  { id: 6, title: 'Review the last place', analogy: 'Only the host can fill their guest list. Once a performer is accepted, they still need the venue even when they cannot discover the next Paid event.', scope: 'This example starts with a new talent and no subscription. The lab also checks roles, matching identities, positive slots, and preserving an existing requirement. It throws for blocked reviews and uses separate functions for discovery and application views.', variants: [reviewExample('accept'), reviewExample('outsider'), reviewExample('full'), reviewExample('reject')] },
];
