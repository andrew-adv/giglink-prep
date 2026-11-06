import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { chapters } from '../../content/presentation/story.js';
import { integrations, milestones, productJourney, refinements, requestSteps, snapshot, sources, verification, workstreams } from '../../content/presentation/evidence.js';
import { foundationReport, personalDetails } from '../../content/presentation/personal-details.js';
import { elapsedSeconds, formatTime, presentationModes, speakerNotes } from '../../content/presentation/practice.js';
import './presentation.css';

function SourceLinks({ ids }) {
  return <div className="story-sources" aria-label="Original GigLink source evidence">{ids.map(id => <a key={id} href={sources[id].url} target="_blank" rel="noreferrer">{sources[id].label} ↗ <small>{sources[id].kind}</small></a>)}</div>;
}

function Controls({ index, count, onChange, noun = 'step' }) {
  return <div className="story-controls"><button type="button" disabled={index === 0} onClick={() => onChange(index - 1)}>← Previous {noun}</button><span>{index + 1} / {count}</span><button type="button" disabled={index === count - 1} onClick={() => onChange(index + 1)}>Next {noun} →</button></div>;
}

// One selection model for workstreams, requests, milestones, comparisons and product stages.
function Explorer({ items, title, kind }) {
  const [index, setIndex] = useState(0);
  const item = items[index];
  return <section className={`story-explorer story-${kind}`} aria-label={title}>
    <p className="eyebrow">{title}</p>
    {kind === 'team' && <p className="story-hub">Shared README contract + C00 foundation <span aria-hidden="true">↓</span></p>}
    <label className="story-mobile-selector">Choose {kind}<select value={index} onChange={event => setIndex(Number(event.target.value))}>{items.map((entry, i) => <option value={i} key={entry.title}>{i + 1}. {entry.title}</option>)}</select></label>
    <div className="story-explorer-grid">
      <ol className="story-nodes" aria-label={`${title} choices`}>{items.map((entry, i) => <li key={entry.title}><button type="button" aria-pressed={index === i} onClick={() => setIndex(i)}><span className="story-node-number">{entry.role || String(i + 1).padStart(2, '0')}</span><span>{entry.date && <time dateTime={entry.date}>{entry.date}</time>}{entry.title}</span></button></li>)}</ol>
      <div className="story-detail" aria-live="polite" aria-atomic="true" data-explorer-index={index}>
        <h3>{item.title}</h3>
        {kind === 'team' && <><code>{item.branch}</code><p>{item.responsibility}</p><h4>Needs from the other workstreams</h4><p>{item.dependency}</p><h4>Integration handoff</h4><p>{item.handoff}</p></>}
        {kind === 'architecture' && <><p className="story-analogy">{item.analogy}</p><p>{item.detail}</p><output className="story-state">{item.state}</output></>}
        {kind === 'timeline' && <><time dateTime={item.date}>{item.date} · UTC commit date</time><h4>What changed</h4><p>{item.built}</p><h4>Why it mattered</h4><p>{item.why}</p><h4>What the evidence shows</h4><p>{item.achieved}</p><a className="text-link" href={item.url} target="_blank" rel="noreferrer">Inspect commit {item.sha.slice(0, 7)} ↗</a>{item.related.length > 0 && <details><summary>Related commits in this milestone</summary><ul>{item.related.map(ref => <li key={ref.sha}><a href={ref.url} target="_blank" rel="noreferrer">{ref.sha.slice(0, 7)} ↗</a></li>)}</ul></details>}</>}
        {kind === 'journey' && <><p>{item.detail}</p><p className="story-state">{index >= 8 ? 'Accepted commitment remains accessible' : index >= 3 ? 'Published gig • backend rules apply' : 'Draft / identity / payment checks'}</p><p className="muted">This diagram explains original GigLink code. Run your own miniature project in the coding lab.</p></>}
        {kind === 'refinements' && <><dl className="story-comparison">{[['Earlier state', item.before], ['Change', item.change], ['Reason', item.reason], ['Result', item.result]].map(([label, text]) => <div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl><a className="text-link" href={milestones[item.milestone].url} target="_blank" rel="noreferrer">Related historical milestone ↗</a></>}
        {item.sources && <SourceLinks ids={item.sources} />}
      </div>
    </div>
    <Controls index={index} count={items.length} onChange={setIndex} />
  </section>;
}

function Purpose() {
  const [person, setPerson] = useState('host');
  return <section className="story-card" aria-label="Two sides of one booking"><p className="eyebrow">ONE EVENT, TWO NEEDS · AUTHORED ILLUSTRATION</p><div className="story-choice"><button type="button" aria-pressed={person === 'host'} onClick={() => setPerson('host')}>Event host</button><span aria-hidden="true">⇄</span><button type="button" aria-pressed={person === 'talent'} onClick={() => setPerson('talent')}>Performer</button></div><div className="story-detail" aria-live="polite"><h3>{person === 'host' ? '“Who can perform this role?”' : '“What should I prepare?”'}</h3><p>{person === 'host' ? 'Record the role, number of people and sample requests. Compare applications with the matching audition videos together.' : 'Read the sample requests, submit matching videos and follow the application status. Acceptance unlocks the exact venue through My Applications.'}</p></div></section>;
}

function Rules() {
  const [gigType, setGigType] = useState('free');
  const [accepted, setAccepted] = useState(false);
  return <section className="story-card" aria-label="Explore the product rules"><p className="eyebrow">PREDICT THE FEE AND ACCESS · AUTHORED EXAMPLE</p><div className="story-choice"><button type="button" aria-pressed={gigType === 'free'} onClick={() => setGigType('free')}>Free gig</button><button type="button" aria-pressed={gigType === 'paid'} onClick={() => setGigType('paid')}>Paid gig</button></div><div className="story-rule-grid" aria-live="polite"><div><h3>{gigType === 'free' ? '₦5,000' : '₦10,000'} posting fee</h3><p>Backend-verified test payment is required for either type.</p></div><div><h3>{gigType === 'free' ? 'No talent pay range' : 'Minimum ₦25,000'}</h3><p>Compensation is separate from the posting fee. The MVP does not transfer it.</p></div></div><label className="story-checkbox"><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} />Talent has already accepted a first Paid gig</label><output className="story-state">{gigType === 'free' ? 'Free discovery remains available with or without a subscription.' : accepted ? 'New Paid discovery needs an active ₦5,000 / 30-day pass. Accepted commitments stay in My Applications.' : 'Paid discovery is available before the first accepted Paid gig.'}</output><SourceLinks ids={['validation', 'discovery', 'subscription']} /></section>;
}

function Verification() {
  return <div className="story-verification">{verification.map(item => <section className="story-card" key={item.label}><h3>{item.label}</h3><p>{item.detail}</p><SourceLinks ids={item.sources} /></section>)}</div>;
}

function ChapterVisual({ type }) {
  if (type === 'purpose') return <Purpose />;
  if (type === 'team') return <Explorer items={workstreams} title="Select a workstream" kind="team" />;
  if (type === 'rules') return <Rules />;
  if (type === 'architecture') return <><Explorer items={requestSteps} title="Follow the request" kind="architecture" /><div className="story-service-map"><span>Vercel → React browser</span><span>Render → Express API</span><span>Atlas → MongoDB</span><span>Server → Paystack Test Mode / Cloudinary</span><span>GitHub → branches and integration history</span></div></>;
  if (type === 'timeline') return <Explorer items={milestones} title="Evidence timeline" kind="timeline" />;
  if (type === 'integration') return <div className="story-integration-map">{integrations.map(item => <section className="story-card" key={item.title}><h3>{item.title}</h3><p>{item.before}</p><details><summary>See the connection</summary><p>{item.change}</p><p><strong>Why:</strong> {item.reason}</p><p><strong>Result:</strong> {item.result}</p><SourceLinks ids={item.sources} /></details></section>)}</div>;
  if (type === 'journey') return <><Explorer items={productJourney} title="The complete product journey" kind="journey" /><Verification /></>;
  if (type === 'refinements') return <Explorer items={refinements} title="Earlier state → change → result" kind="refinements" />;
  if (type === 'verification') return <Verification />;
  return <div className="story-card"><h3>Your turn to explain</h3><p>Choose a workflow and say what happens at each boundary. Then explain one refusal: wrong owner, unverified payment or mismatched demo.</p><div className="story-actions"><Link className="button primary" to="/presentation/practice">Rehearse the presentation →</Link><Link className="text-link" to="/questions">Try the 12 CTO questions →</Link></div></div>;
}

function EvidenceNotes() {
  return <details className="story-evidence-notes"><summary>Evidence, snapshot and personal details to confirm</summary><p>Original GigLink reviewed on <strong>{snapshot.checkedOn}</strong>. Develop: <code>{snapshot.develop}</code>. Main: <code>{snapshot.main}</code>. Develop was {snapshot.ahead} commits ahead and 0 behind. This is a dated snapshot, not a live status indicator.</p><p><strong>{foundationReport.status}:</strong> {foundationReport.text}</p><SourceLinks ids={['agents', 'captain', 'readme']} /><h3>Personal history</h3><p>These entries live in one content file, personal-details.js. Confirm them before adding personal credits to your presentation.</p><ul>{personalDetails.map(item => <li key={item.id}><strong>{item.status}: {item.label}</strong>{item.value ? ` — ${item.value}` : ''}<p>{item.source}</p></li>)}</ul><p>Documented assignments, implementation, test code and Git history are separate evidence types. This section does not claim that the original test suite, external services or final demo were run successfully during P5.</p></details>;
}

function Story() {
  const [params, setParams] = useSearchParams();
  const chapterId = Number(params.get('chapter'));
  const index = Number.isInteger(chapterId) && chapterId >= 1 && chapterId <= chapters.length ? chapterId - 1 : 0;
  const chapter = chapters[index];
  const heading = useRef(null);
  const previousChapter = useRef(index);
  const select = next => { setParams({ chapter: String(next + 1) }); };
  useEffect(() => {
    if (previousChapter.current !== index) heading.current?.focus();
    previousChapter.current = index;
  }, [index]);
  return <div className="story-layout">
    <aside className="story-chapters screen-only" aria-label="Story chapters"><label>Jump to a chapter<select value={index} onChange={event => select(Number(event.target.value))}>{chapters.map((item, i) => <option value={i} key={item.id}>{item.id}. {item.title}</option>)}</select></label><ol>{chapters.map((item, i) => <li key={item.id}><Link to={`?chapter=${item.id}`} aria-current={i === index ? 'step' : undefined}><span>{String(item.id).padStart(2, '0')}</span>{item.title}</Link></li>)}</ol></aside>
    <article className="story-chapter" key={chapter.id} data-chapter={chapter.id}>
      <p className="eyebrow">CHAPTER {String(chapter.id).padStart(2, '0')} / 10 · {chapter.kicker}</p>
      <h2 ref={heading} tabIndex={-1}>{chapter.title}</h2><p className="story-introduction">{chapter.introduction}</p>
      <ChapterVisual type={chapter.visual} />
      <div className="story-points">{chapter.points.map(([title, text]) => <section key={title}><h3>{title}</h3><p>{text}</p></section>)}</div>
      <details className="story-deeper"><summary>A little more detail</summary><p>{chapter.depth}</p></details>
      <div className="story-recap"><p className="eyebrow">QUICK REVISION</p><p>{chapter.summary}</p></div>
      <section className="story-question"><h3>Could you explain this?</h3><p>{chapter.question}</p><p className="muted">Try saying it out loud before opening the answer.</p><details><summary>Reveal a short answer</summary><p>{chapter.answer}</p><details><summary>Go deeper</summary><p>{chapter.technical}</p></details></details></section>
      <SourceLinks ids={chapter.sources} />
      <div className="screen-only"><Controls index={index} count={chapters.length} onChange={select} noun="chapter" /></div>
    </article>
  </div>;
}

function Practice() {
  const [modeId, setModeId] = useState('standard');
  const [index, setIndex] = useState(0);
  const [clock, setClock] = useState({ startedAt: null, accumulatedMs: 0 });
  const [now, setNow] = useState(() => Date.now());
  const [copyStatus, setCopyStatus] = useState('');
  const mode = presentationModes.find(item => item.id === modeId);
  const section = mode.sections[index];
  const seconds = elapsedSeconds(clock.startedAt, clock.accumulatedMs, now);
  const notes = speakerNotes(mode);
  const notesArea = useRef(null);
  useEffect(() => {
    if (clock.startedAt === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [clock.startedAt]);
  function resetClock() { setClock({ startedAt: null, accumulatedMs: 0 }); setNow(Date.now()); }
  function changeMode(event) { setModeId(event.target.value); setIndex(0); resetClock(); setCopyStatus(''); }
  function toggleClock() {
    const current = Date.now(); setNow(current);
    setClock(previous => previous.startedAt === null ? { ...previous, startedAt: current } : { startedAt: null, accumulatedMs: previous.accumulatedMs + Math.max(0, current - previous.startedAt) });
  }
  async function copyNotes() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(notes); setCopyStatus('Speaker notes copied.');
    } catch {
      notesArea.current?.focus(); notesArea.current?.select(); setCopyStatus('Notes selected below. Use your device’s Copy command.');
    }
  }
  return <section className="presentation-practice" aria-labelledby="practice-title">
    <div className="screen-only"><h2 id="practice-title">Presentation practice</h2><p>Use prompts, not memorized lines. Change the wording to sound like yourself, show an example, and leave personal credits unclaimed until confirmed.</p><label className="story-mode-label">Presentation length<select value={modeId} onChange={changeMode}>{presentationModes.map(item => <option value={item.id} key={item.id}>{item.title} · {item.length}</option>)}</select></label>
      <div className="story-rehearsal"><div><p className="eyebrow">OPTIONAL REHEARSAL TIMER</p><output aria-label="Elapsed rehearsal time">{formatTime(seconds)}</output><p>{mode.length} · timing guide only, no automatic advance</p><p role="status">{seconds > mode.targetSeconds ? 'Past the target: shorten an example or finish your conclusion.' : 'Explain the idea, then advance when you are ready.'}</p></div><div className="story-actions"><button type="button" onClick={toggleClock}>{clock.startedAt === null ? seconds ? 'Resume timer' : 'Start timer' : 'Pause timer'}</button><button type="button" onClick={resetClock}>Reset timer</button></div></div>
      <ol className="story-speaking-steps" aria-label="Speaking sections">{mode.sections.map((item, i) => <li key={item.id}><button type="button" aria-pressed={index === i} onClick={() => setIndex(i)}>{i + 1}. {item.title}</button></li>)}</ol>
      <article className="story-speaking-card" data-speaking-section={section.id} aria-live="polite"><p className="eyebrow">SPEAKING SECTION {index + 1} / {mode.sections.length}</p><h3>{section.title}</h3><p className="story-key-point"><strong>Key point:</strong> {section.keyPoint}</p><h4>One natural way to explain it</h4><p className="story-spoken">{section.speech}</p><h4>Remember</h4><ul>{section.remember.map(item => <li key={item}>{item}</li>)}</ul><h4>Likely follow-up</h4><p>{section.followUp}</p><details><summary>Reveal a short response</summary><p>{section.response}</p></details><SourceLinks ids={section.sources} /></article>
      <Controls index={index} count={mode.sections.length} onChange={setIndex} noun="section" />
      <div className="story-actions"><button type="button" onClick={() => { setIndex(0); resetClock(); }}>Restart rehearsal</button><button type="button" onClick={copyNotes}>Copy speaker notes</button><button type="button" onClick={() => window.print()}>Print speaker notes</button><Link className="text-link" to="/questions">Practice the 12 CTO questions →</Link></div><p role="status">{copyStatus}</p>
      <label className="story-notes-label">Copyable outline and speaker notes<textarea ref={notesArea} readOnly value={notes} rows={10} /></label>
    </div>
    <div className="story-print-notes"><h2>The GigLink Story · speaker notes</h2><pre>{notes}</pre></div>
  </section>;
}

export default function PresentationPage({ practiceMode = false }) {
  return <div className="presentation-page">
    <header className="presentation-header screen-only"><p className="eyebrow">ORIGINAL PROJECT / STORY & PRESENTATION</p><h1>The GigLink <em>Story</em></h1><p className="chapter-lead">From the first idea to the working application.</p><p>Understand the original product, follow its recorded development and prepare to explain the decisions. No coding-lesson completion or server connection is required.</p><div className="presentation-tabs" aria-label="Presentation mode"><Link to="/presentation" aria-current={!practiceMode ? 'page' : undefined}>Explore the story</Link><Link to="/presentation/practice" aria-current={practiceMode ? 'page' : undefined}>Presentation practice</Link></div><p className="story-snapshot">Evidence checked {snapshot.checkedOn} · original develop <a href={`${snapshot.repository}/commit/${snapshot.develop}`} target="_blank" rel="noreferrer">{snapshot.develop.slice(0, 7)} ↗</a> · main is {snapshot.ahead} commits behind in this snapshot.</p><p className="story-distinction">This is the original GigLink story. GigLink Prep’s six coding lessons use a smaller simulation; their checks do not certify the original application.</p></header>
    {practiceMode ? <Practice /> : <Story />}
    <div className="screen-only"><EvidenceNotes /><div className="story-actions"><Link className="text-link" to="/chapters/1">Build the smaller project →</Link><Link className="text-link" to="/questions">Existing CTO practice →</Link></div></div>
  </div>;
}
