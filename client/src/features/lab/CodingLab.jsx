import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SandpackCodeEditor, SandpackProvider, useSandpack, useSandpackClient } from '@codesandbox/sandpack-react';
import { lessonContent, replayQuestion } from '../../content/lessons.js';
import { useWorkspace } from '../progress/WorkspaceProvider.jsx';
import { editablePaths, prepareScenario, scenarios, starterFiles } from './project.js';
import { sandboxFiles } from './sandbox-files.js';
import { isCurrentReport } from './report.js';
import { storyOptions } from './story-project.js';
import LessonExplanation from './LessonExplanation.jsx';
import { useTheme } from '../theme/ThemeProvider.jsx';
import { editorTheme, sendPreviewTheme } from '../theme/theme.js';
import './lab.css';

function Question({ title, answer, depth, source }) {
  return <section className="defend"><p className="eyebrow">EXPLAIN IT</p><h3>{title}</h3><p>{answer}</p><details><summary>Go a little deeper</summary><p>{depth}</p></details>{source && <a className="text-link" href={source} target="_blank" rel="noreferrer">Read the source ↗</a>}</section>;
}

function Workspace({ lesson, replayMode }) {
  const { theme } = useTheme();
  const latestTheme = useRef(theme);
  latestTheme.current = theme;
  const { workspace, saveStatus, updateFiles, visitLesson, startAttempt, acceptChecks } = useWorkspace();
  const { sandpack } = useSandpack();
  const { iframe } = useSandpackClient();
  const [tab, setTab] = useState('learn');
  const [scenarioId, setScenarioId] = useState(lesson.id >= 4 ? 'verified' : 'valid');
  const [story, setStory] = useState({ ...storyOptions });
  const [eventTitle, setEventTitle] = useState(scenarios[0].details.title);
  const [feedback, setFeedback] = useState({ state: 'idle', text: 'Choose a scenario, finish the TODO, then press Run / Check.' });
  const [queued, setQueued] = useState(null);
  const pending = useRef(null);
  const timeout = useRef(null);
  const codeFiles = Object.fromEntries(editablePaths.map((path) => [path, sandpack.files[path]?.code ?? starterFiles[path]]));
  const signature = JSON.stringify(codeFiles);
  const latestCode = useRef(signature);
  latestCode.current = signature;
  const previousCode = useRef(signature);
  const scenario = scenarios.find((item) => item.id === scenarioId);
  const configCode = sandpack.files['/run-config.json']?.code;

  useEffect(() => { sendPreviewTheme(iframe.current, theme); }, [iframe, theme]);

  function clearPending() {
    pending.current = null;
    clearTimeout(timeout.current);
    setQueued(null);
  }

  function changedScenario(id, title) {
    clearPending();
    setScenarioId(id);
    setEventTitle(title);
    setFeedback({ state: 'stale', text: 'Scenario changed. Press Run / Check to see what your code does.' });
  }

  function changeStory(patch) {
    clearPending();
    setStory(current => ({ ...current, ...patch }));
    setFeedback({ state: 'stale', text: 'Prediction inputs changed. Run your code to see the consequence.' });
  }

  useEffect(() => {
    visitLesson(lesson.id);
    sandpack.setActiveFile(lesson.file);
    if (lesson.id < 3 && ['browser-only', 'verified'].includes(scenarioId)) setScenarioId('valid');
    if (lesson.id >= 4 && !['verified', 'missing-title', 'low-pay'].includes(scenarioId)) setScenarioId('verified');
    clearPending();
    setTab('learn');
    setFeedback({ state: 'idle', text: 'Your files are retained. Finish this lesson’s TODO, then run the connected project.' });
    // Sandpack action identities change during editing; switch files only on lesson navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, visitLesson, replayMode]);

  useEffect(() => {
    updateFiles(JSON.parse(signature));
    if (previousCode.current !== signature) {
      clearPending();
      setFeedback({ state: 'stale', text: 'Code changed. Run again; dependent lessons need fresh passing checks.' });
      previousCode.current = signature;
    }
  }, [signature, updateFiles]);

  useEffect(() => {
    function receive(event) {
      const run = pending.current;
      if (!isCurrentReport(event, iframe.current, run) || run.signature !== latestCode.current) return;
      clearTimeout(timeout.current);
      pending.current = null;
      const checks = event.data.checks;
      sendPreviewTheme(iframe.current, latestTheme.current);
      const passed = checks.filter((check) => check.passed).length;
      acceptChecks(run.through, checks);
      setFeedback({ state: passed === checks.length ? 'pass' : 'fail', text: `${passed}/${checks.length} checks passed. ${passed === checks.length ? 'Your connected code passed. Try another scenario to see the result change.' : 'Read the failed checks below. Fix the named file and run again.'}` });
    }
    window.addEventListener('message', receive);
    return () => { window.removeEventListener('message', receive); clearTimeout(timeout.current); };
  }, [iframe, acceptChecks]);

  useEffect(() => {
    if (!queued || JSON.parse(configCode || '{}').runId !== queued.id) return;
    // Wait for Sandpack's file state to contain this run's configuration.
    setQueued(null);
    sandpack.runSandpack().catch(() => {
      if (pending.current?.id !== queued.id) return;
      clearPending();
      setFeedback({ state: 'error', text: 'Could not start Sandpack. Check your connection, then run again. Your local code is kept.' });
    });
    // The files in this render are the snapshot that runSandpack must execute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queued, configCode]);

  useEffect(() => {
    if (!sandpack.error || !pending.current) return;
    clearPending();
    setFeedback({ state: 'error', text: `Code could not run: ${sandpack.error.message || 'Check the syntax in your files.'}` });
  }, [sandpack.error]);

  function run(replay = false) {
    clearPending();
    const fullJourney = Boolean(replayMode || (replay && lesson.id >= 4));
    const next = { id: crypto.randomUUID(), through: fullJourney ? 6 : replay ? 3 : lesson.id, signature };
    pending.current = next;
    const selectedScenario = prepareScenario(scenarioId, eventTitle, replay || fullJourney);
    if (next.through >= 4) {
      selectedScenario.story = fullJourney ? { ...storyOptions } : { ...story };
      if (fullJourney) setStory({ ...storyOptions });
    }
    if (replay || fullJourney) {
      setScenarioId(selectedScenario.id);
      setEventTitle(selectedScenario.details.title);
    }
    sandpack.updateFile('/run-config.json', JSON.stringify({ runId: next.id, through: next.through, fullJourney, scenario: selectedScenario, theme, parentOrigin: window.location.origin }), false);
    updateFiles(codeFiles);
    startAttempt(next.through);
    setQueued(next);
    setTab('preview');
    setFeedback({ state: 'running', text: fullJourney ? 'Running your six files: create → check → publish → browse → apply → review…' : replay ? 'Running all three files: create → check → simulated verification → publish…' : 'Running your JavaScript and behavioral checks inside Sandpack…' });
    timeout.current = setTimeout(() => {
      if (pending.current?.id !== next.id) return;
      clearPending();
      setFeedback({ state: 'error', text: 'No result after 30 seconds. Check your connection or an infinite loop in your code, then run again. No completion was awarded.' });
    }, 30000);
  }

  function resetLesson() {
    clearPending();
    const files = { ...codeFiles, [lesson.file]: starterFiles[lesson.file] };
    sandpack.updateFile(lesson.file, starterFiles[lesson.file], false);
    updateFiles(files);
    sandpack.setActiveFile(lesson.file);
    setFeedback({ state: 'stale', text: `Reset ${lesson.file.slice(1)} only. Your other files are kept.` });
  }

  const running = feedback.state === 'running';
  return <div className="lab-page">
    <Link className="text-link" to="/chapters/1">← Chapter 01</Link>
    <header className="lab-heading"><div><p className="eyebrow">{replayMode ? 'SAME PROJECT / FULL JOURNEY' : `CHAPTER 01 / LESSON 0${lesson.id}`}</p><h1>{replayMode ? 'Replay the full journey' : lesson.title}</h1></div><div className="save-state" role="status">{saveStatus}<br /><span>{workspace.completed.length}/6 lessons checked · Attempt {workspace.attempts[lesson.id]}</span></div></header>
    <div className="chapter-progress"><progress value={workspace.completed.length} max="6" aria-label="Lessons with current passing checks" /><span>{workspace.completed.length} of 6 complete</span></div>
    <div className="journey-links"><Link className="text-link" to="/replay">Replay full journey →</Link><Link className="text-link" to="/questions">Practice presentation questions →</Link></div>
    {replayMode && <p className="chapter-notice">This runs the six files you have already written. Full replay uses matching demos, a new talent, the owning host, and simulated payment proof. It reports the first failing lesson. Use lesson 6 to try rejection, full roles, or different characters.</p>}
    <nav className="lesson-switcher" aria-label="Lessons">{lessonContent.map((item) => <Link key={item.id} to={`/lessons/${item.id}`} aria-current={lesson.id === item.id ? 'page' : undefined}><span>{workspace.completed.includes(item.id) ? '✓' : `0${item.id}`}</span>{item.title}</Link>)}</nav>
    <div className="mobile-panels" role="group" aria-label="Workspace panels">{[['learn', '1 · Learn'], ['code', '2 · Code'], ['preview', '3 · Result']].map(([id, label]) => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}</div>
    <div className="lab-grid">
      <section className={`lab-pane lesson-copy ${tab !== 'learn' ? 'mobile-hidden' : ''}`} aria-label="Explanation and exercise">
        <LessonExplanation key={lesson.id} lesson={lesson} onOpenCode={() => setTab('code')} />
        {lesson.id > 1 && <p className="dependency-note">This lesson uses your earlier files: {editablePaths.slice(0, lesson.id - 1).map(path => path.slice(1)).join(', ')}. Fix the earliest failing stage first.</p>}
      </section>
      <section className={`lab-pane code-pane ${tab !== 'code' ? 'mobile-hidden' : ''}`} aria-label="Code editor">
        <div className="pane-heading"><h2>Your project</h2><span>All 6 files stay with you</span></div>
        <p className="editor-help">Edit the TODO in <strong>{lesson.file.slice(1)}</strong>. You can open earlier files too. Tab indents; Escape then Tab moves out of the editor.</p>
        <SandpackCodeEditor showTabs showLineNumbers showInlineErrors wrapContent closableTabs={false} showRunButton={false} initMode="immediate" />
        <div className="editor-actions"><button className="button primary" onClick={() => run()} disabled={running}>Run / Check ▷</button><button className="button secondary" onClick={resetLesson} disabled={running}>Reset this lesson</button></div>
        <p className="muted">Code runs in a separate browser sandbox. The Express API does not run it.</p>
      </section>
      <section className={`lab-pane result-pane ${tab !== 'preview' ? 'mobile-hidden' : ''}`} aria-label="Running simulation and checks">
        <div className="pane-heading"><h2>See what happens</h2><span>Simulated event & payment</span></div>
        {!replayMode && <label className="scenario-label">Try a scenario<select value={scenarioId} onChange={(event) => { const next = scenarios.find((item) => item.id === event.target.value); changedScenario(next.id, next.details.title); }}>{scenarios.filter((item) => lesson.id >= 4 ? ['verified', 'missing-title', 'low-pay'].includes(item.id) : lesson.id === 3 || !['browser-only', 'verified'].includes(item.id)).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
        <label className="scenario-label">Fictional event title<input value={eventTitle} disabled={scenarioId === 'missing-title'} maxLength={100} onChange={(event) => changedScenario(scenarioId, event.target.value)} /></label>
        {lesson.id === 3 && <p className="payment-inputs">Browser claim: <strong>{scenario.payment.browserSaysPaid ? 'paid' : 'not paid'}</strong> · Simulated backend: <strong>{scenario.payment.backendVerified ? 'verified' : 'not verified'}</strong></p>}
        {lesson.id >= 4 && !replayMode && <div className="story-controls"><p>Predict the result, then Run. Characters, subscriptions, payment proof, and clips are all simulated.</p>
          <label className="scenario-label">Talent character<select value={story.character || 'talent'} onChange={event => changeStory({ character: event.target.value })}><option value="talent">Zara</option><option value="otherTalent">Kai</option></select></label>
          <label className="scenario-label">Talent discovery status<select value={story.talentStatus} onChange={event => changeStory({ talentStatus: event.target.value })}><option value="new">New talent · no Paid acceptance yet</option><option value="required">First Paid accepted · no active subscription</option><option value="active">First Paid accepted · active subscription</option></select></label>
          <label className="scenario-label">Event type<select value={story.gigType} onChange={event => changeStory({ gigType: event.target.value })}><option value="paid">Paid</option><option value="free">Free</option></select></label>
          {lesson.id >= 5 && <><label className="scenario-label">Requested samples<select value={story.sampleCount} onChange={event => changeStory({ sampleCount: Number(event.target.value) })}>{[1, 2, 3].map(count => <option key={count}>{count}</option>)}</select></label>
          <label className="scenario-label">Fictional demo metadata<select value={story.demos} onChange={event => changeStory({ demos: event.target.value })}>{[['matching', 'One matching clip per sample'], ['missing', 'Missing clip'], ['duplicate', 'Duplicate clips'], ['extra', 'Extra clip'], ['mismatch', 'Wrong sample title']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></>}
          {lesson.id >= 6 && <><label className="scenario-label">Who reviews?<select value={story.reviewer} onChange={event => changeStory({ reviewer: event.target.value })}><option value="host">Ada · owning customer</option><option value="outsider">Obi · different customer</option><option value="talent">Zara · talent</option></select></label>
          <label className="scenario-label">Decision<select value={story.decision} onChange={event => changeStory({ decision: event.target.value })}><option value="accepted">Accept</option><option value="rejected">Reject</option></select></label>
          <label className="capacity-toggle"><input type="checkbox" checked={story.full} onChange={event => changeStory({ full: event.target.checked })} /> Role already full</label></>}
        </div>}
        <button className="button primary result-run" onClick={() => run()} disabled={running}>Run / Check ▷</button>
        <p className={`run-feedback ${feedback.state}`} role="status">{feedback.text}</p>
        <div className="sandbox-frame"><iframe ref={iframe} onLoad={() => sendPreviewTheme(iframe.current, theme)} title="Your mini GigLink: executed code, event card, and behavioral checks" sandbox="allow-scripts allow-same-origin" allow="" style={{ visibility: ['pass', 'fail', 'running'].includes(feedback.state) ? 'visible' : 'hidden' }} />{!['pass', 'fail', 'running'].includes(feedback.state) && <div className="sandbox-placeholder">Your next run will appear here.<br />No result is assumed.</div>}</div>
        {lesson.id < 6 && <Link className="text-link" to={`/lessons/${lesson.id + 1}`}>Next: {lessonContent[lesson.id].title} →</Link>}
        {lesson.id === 3 && <section className="replay"><h3>Replay the first three steps</h3><button className="button primary" onClick={() => run(true)} disabled={running}>Replay all 3 lessons ▷</button><Question {...replayQuestion} /></section>}
        {lesson.id === 6 && <section className="replay"><h3>Follow the whole story</h3><button className="button primary" onClick={() => run(true)} disabled={running}>Replay full journey ▷</button><Link className="text-link" to="/questions">Practice 12 presentation questions →</Link></section>}
        <p className="muted">Sandpack needs internet access to load its bundler. Your code is sent to its sandbox; use fictional examples only. Local saving works without the API.</p>
      </section>
    </div>
  </div>;
}

export default function CodingLab({ lesson, replayMode }) {
  const { theme } = useTheme();
  const { workspace } = useWorkspace();
  const [files] = useState(() => sandboxFiles(workspace.codeFiles, theme));
  const [options] = useState(() => ({ autorun: false, autoReload: false, visibleFiles: editablePaths, activeFile: lesson.file, initMode: 'immediate' }));
  return <SandpackProvider template="vanilla" files={files} options={options} theme={editorTheme(theme)}><Workspace lesson={lesson} replayMode={replayMode} /></SandpackProvider>;
}
