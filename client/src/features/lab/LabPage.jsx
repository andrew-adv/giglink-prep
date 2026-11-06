import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SandpackCodeEditor, SandpackProvider, useSandpack, useSandpackClient } from '@codesandbox/sandpack-react';
import { lessonContent, replayQuestion } from '../../content/lessons.js';
import { useWorkspace } from '../progress/WorkspaceProvider.jsx';
import { editablePaths, exampleSolutions, prepareScenario, scenarios, starterFiles } from './project.js';
import { sandboxFiles } from './sandbox-files.js';
import { isCurrentReport } from './report.js';
import './lab.css';

function Question({ title, answer, depth, source }) {
  return <section className="defend"><p className="eyebrow">EXPLAIN IT</p><h3>{title}</h3><p>{answer}</p><details><summary>Go a little deeper</summary><p>{depth}</p></details>{source && <a className="text-link" href={source} target="_blank" rel="noreferrer">Read the source ↗</a>}</section>;
}

function Workspace({ lesson }) {
  const { workspace, saveStatus, updateFiles, visitLesson, startAttempt, acceptChecks } = useWorkspace();
  const { sandpack } = useSandpack();
  const { iframe } = useSandpackClient();
  const [tab, setTab] = useState('learn');
  const [scenarioId, setScenarioId] = useState('valid');
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

  useEffect(() => {
    visitLesson(lesson.id);
    sandpack.setActiveFile(lesson.file);
    if (lesson.id < 3 && ['browser-only', 'verified'].includes(scenarioId)) setScenarioId('valid');
    clearPending();
    setTab('learn');
    setFeedback({ state: 'idle', text: 'Your files are retained. Finish this lesson’s TODO, then run the connected project.' });
    // Sandpack action identities change during editing; switch files only on lesson navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, visitLesson]);

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
    const next = { id: crypto.randomUUID(), through: replay ? 3 : lesson.id, signature };
    pending.current = next;
    const selectedScenario = prepareScenario(scenarioId, eventTitle, replay);
    if (replay) {
      setScenarioId(selectedScenario.id);
      setEventTitle(selectedScenario.details.title);
    }
    sandpack.updateFile('/run-config.json', JSON.stringify({ runId: next.id, through: next.through, scenario: selectedScenario, parentOrigin: window.location.origin }), false);
    updateFiles(codeFiles);
    startAttempt(next.through);
    setQueued(next);
    setTab('preview');
    setFeedback({ state: 'running', text: replay ? 'Running all three files: create → check → simulated verification → publish…' : 'Running your JavaScript and behavioral checks inside Sandpack…' });
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
    <header className="lab-heading"><div><p className="eyebrow">CHAPTER 01 / LESSON 0{lesson.id}</p><h1>{lesson.title}</h1></div><div className="save-state" role="status">{saveStatus}<br /><span>{workspace.completed.length}/3 lessons checked · Attempt {workspace.attempts[lesson.id]}</span></div></header>
    <div className="chapter-progress"><progress value={workspace.completed.length} max="3" aria-label="Lessons with current passing checks" /><span>{workspace.completed.length} of 3 complete</span></div>
    <nav className="lesson-switcher" aria-label="Lessons">{lessonContent.map((item) => <Link key={item.id} to={`/lessons/${item.id}`} aria-current={lesson.id === item.id ? 'page' : undefined}><span>{workspace.completed.includes(item.id) ? '✓' : `0${item.id}`}</span>{item.title}</Link>)}</nav>
    <div className="mobile-panels" role="group" aria-label="Workspace panels">{[['learn', '1 · Learn'], ['code', '2 · Code'], ['preview', '3 · Result']].map(([id, label]) => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}</div>
    <div className="lab-grid">
      <section className={`lab-pane lesson-copy ${tab !== 'learn' ? 'mobile-hidden' : ''}`} aria-label="Explanation and exercise">
        <p className="eyebrow">PICTURE THIS</p><h2>{lesson.id === 1 ? 'Start with an event card.' : lesson.id === 2 ? 'Check before you print.' : 'A claim is not proof.'}</h2><p>{lesson.analogy}</p>
        <h3>Try a change</h3><p>{lesson.try}</p><h3>Your code task</h3><p>{lesson.task}</p><div className="code-contract">{lesson.contract}</div>
        {lesson.id > 1 && <p className="dependency-note">This lesson uses {lesson.id === 2 ? 'gig.js' : 'gig.js and validate.js'} from your earlier work. If those checks fail, fix those files first.</p>}
        <button className="button primary mobile-code-cta" onClick={() => setTab('code')}>Open the code →</button>
        <details className="worked-example"><summary>Need a worked example?</summary><p>Read it, then type the changes into {lesson.file.slice(1)}. Opening this example does not complete the lesson.</p><pre><code>{exampleSolutions[lesson.file]}</code></pre></details>
        <section className="source-connection"><p className="eyebrow">CONNECT TO REAL GIGLINK</p><a href={lesson.source} target="_blank" rel="noreferrer">{lesson.sourceName} ↗</a><p>{lesson.connection}</p>{lesson.extraSource && <a href={lesson.extraSource} target="_blank" rel="noreferrer">gig.model.js → required fields ↗</a>}</section>
        <Question title={lesson.question} answer={lesson.answer} depth={lesson.depth} />
      </section>
      <section className={`lab-pane code-pane ${tab !== 'code' ? 'mobile-hidden' : ''}`} aria-label="Code editor">
        <div className="pane-heading"><h2>Your project</h2><span>All 3 files stay with you</span></div>
        <p className="editor-help">Edit the TODO in <strong>{lesson.file.slice(1)}</strong>. You can open earlier files too. Tab indents; Escape then Tab moves out of the editor.</p>
        <SandpackCodeEditor showTabs showLineNumbers showInlineErrors wrapContent closableTabs={false} showRunButton={false} initMode="immediate" />
        <div className="editor-actions"><button className="button primary" onClick={() => run()} disabled={running}>Run / Check ▷</button><button className="button secondary" onClick={resetLesson} disabled={running}>Reset this lesson</button></div>
        <p className="muted">Code runs in a separate browser sandbox. The Express API does not run it.</p>
      </section>
      <section className={`lab-pane result-pane ${tab !== 'preview' ? 'mobile-hidden' : ''}`} aria-label="Running simulation and checks">
        <div className="pane-heading"><h2>See what happens</h2><span>Simulated event & payment</span></div>
        <label className="scenario-label">Try a scenario<select value={scenarioId} onChange={(event) => { const next = scenarios.find((item) => item.id === event.target.value); changedScenario(next.id, next.details.title); }}>{scenarios.filter((item) => lesson.id === 3 || !['browser-only', 'verified'].includes(item.id)).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label className="scenario-label">Fictional event title<input value={eventTitle} disabled={scenarioId === 'missing-title'} maxLength={100} onChange={(event) => changedScenario(scenarioId, event.target.value)} /></label>
        {lesson.id === 3 && <p className="payment-inputs">Browser claim: <strong>{scenario.payment.browserSaysPaid ? 'paid' : 'not paid'}</strong> · Simulated backend: <strong>{scenario.payment.backendVerified ? 'verified' : 'not verified'}</strong></p>}
        <button className="button primary result-run" onClick={() => run()} disabled={running}>Run / Check ▷</button>
        <p className={`run-feedback ${feedback.state}`} role="status">{feedback.text}</p>
        <div className="sandbox-frame"><iframe ref={iframe} title="Your mini GigLink: executed code, event card, and behavioral checks" sandbox="allow-scripts allow-same-origin" allow="" style={{ visibility: ['pass', 'fail', 'running'].includes(feedback.state) ? 'visible' : 'hidden' }} />{!['pass', 'fail', 'running'].includes(feedback.state) && <div className="sandbox-placeholder">Your next run will appear here.<br />No result is assumed.</div>}</div>
        {lesson.id < 3 ? <Link className="text-link" to={`/lessons/${lesson.id + 1}`}>Next: {lessonContent[lesson.id].title} →</Link> : <section className="replay"><h3>Run the whole story</h3><p>Create your event, check it, use a simulated verified result, and try to publish. This runs all three of your files again.</p><button className="button primary" onClick={() => run(true)} disabled={running}>Replay all 3 lessons ▷</button><Question {...replayQuestion} /></section>}
        <p className="muted">Sandpack needs internet access to load its bundler. Your code is sent to its sandbox; use fictional examples only. Local saving works without the API.</p>
      </section>
    </div>
  </div>;
}

function Lab({ lesson }) {
  const { workspace } = useWorkspace();
  const [files] = useState(() => sandboxFiles(workspace.codeFiles));
  const [options] = useState(() => ({ autorun: false, autoReload: false, visibleFiles: editablePaths, activeFile: lesson.file, initMode: 'immediate' }));
  return <SandpackProvider template="vanilla" files={files} options={options} theme="light"><Workspace lesson={lesson} /></SandpackProvider>;
}

export default function LabPage() {
  const { lessonId } = useParams();
  const lesson = lessonContent.find((item) => String(item.id) === lessonId);
  if (!lesson) return <section className="not-found"><h1>Lesson not found.</h1><Link className="text-link" to="/chapters/1">Back to chapter 01 →</Link></section>;
  return <Lab lesson={lesson} />;
}
