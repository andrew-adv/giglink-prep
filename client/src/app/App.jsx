import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { lessons } from '../content/journey.js';
import { useWorkspace } from '../features/progress/WorkspaceProvider.jsx';
import { ThemeSwitcher } from '../features/theme/ThemeProvider.jsx';
import SyncStatus from '../features/progress/SyncStatus.jsx';
import { getApiBaseUrl } from '../config/api-url.js';

const LabPage = lazy(() => import('../features/lab/LabPage.jsx'));
const QuestionsPage = lazy(() => import('../features/questions/QuestionsPage.jsx'));

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function ApiStatus() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const baseUrl = getApiBaseUrl();

    fetch(`${baseUrl}/health`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data.status !== 'ok') throw new Error('API unavailable');
        if (active) setStatus('online');
      })
      .catch(() => {
        if (active) setStatus('offline');
      })
      .finally(() => clearTimeout(timeout));

    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, []);

  return <span className={`api-status ${status}`} role="status"><span className="status-dot" />{status === 'online' ? 'API connected' : status === 'checking' ? 'Checking API…' : 'API unavailable · local work still available'}</span>;
}

function Layout({ children }) {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header wrap">
      <Link className="brand" to="/" aria-label="GigLink Prep home"><span className="brand-mark" aria-hidden="true">&lt;/&gt;</span><span>GigLink <strong>Prep</strong></span></Link>
      <nav aria-label="Main navigation"><NavLink to="/" end>Overview</NavLink><NavLink to="/chapters/1">Chapter 01</NavLink><NavLink to="/questions">CTO practice</NavLink></nav>
      <ThemeSwitcher />
      <span className="phase-tag">P3 <span>· Safe progress saving</span></span>
    </header>
    <main id="main" className="wrap" tabIndex={-1}><SyncStatus />{children}</main>
    <footer className="site-footer wrap"><span>One project. One piece at a time.</span><ApiStatus /><span>Built for understanding.</span></footer>
  </>;
}

function ProjectPreview() {
  return <div className="project-preview" aria-label="Static illustration of the mini-project; open the lab to run code">
    <div className="preview-toolbar"><span><span className="window-dot" /><span className="window-dot" /><span className="window-dot" /></span><span>your-mini-giglink / gig.js</span><span className="code-label">JS</span></div>
    <div className="code-sample"><span className="code-comment">// Start with one event.</span><pre><code><span className="code-purple">const</span> gig = {'{'}{'\n'}  title: <span className="code-string">'An evening of live music'</span>,{'\n'}  publicationStatus: <span className="code-string">'draft'</span>,{'\n'}  postingPaymentStatus: <span className="code-string">'unpaid'</span>{'\n'}{'}'};</code></pre></div>
    <div className="event-card"><div className="event-icon" aria-hidden="true">♫</div><div><span className="eyebrow">YOUR FIRST GIG</span><h3>An evening of live music</h3><p>A draft, waiting for your next step.</p></div><span className="draft-tag">Draft</span></div>
    <div className="preview-bottom"><span><span className="small-dot" />Illustration · open the lab to run</span><Link className="preview-lab-link" to="/lessons/1">Open code lab ↗</Link></div>
    <div className="preview-caption"><span aria-hidden="true">↳</span> Your code will bring this little project to life.</div>
  </div>;
}

function Home() {
  const { workspace } = useWorkspace();
  return <>
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy"><p className="eyebrow"><span className="small-dot" />THE GIGLINK BUILD NOTEBOOK</p><h1 id="hero-title">Build it.<br />Understand it.<br /><em>Explain it.</em></h1><p className="hero-description">Learn how GigLink works by building a small version yourself. One connected JavaScript project, with plain-English explanations along the way.</p><Link className="button primary" to={`/lessons/${workspace.currentLesson}`}>{workspace.completed.length ? 'Continue your project' : 'Start building'} <Arrow /></Link><p className="availability">6 connected lessons · JavaScript · Your P1 work stays with you</p></div>
      <ProjectPreview />
    </section>
    <section className="journey section-space" aria-labelledby="journey-title">
      <div className="section-heading"><div><p className="eyebrow">ONE CONNECTED CHAPTER</p><h2 id="journey-title">From an idea to an accepted performer.</h2></div><span className="outline-tag">{workspace.completed.length}/6 lessons checked</span></div>
      <p className="section-intro">Keep the same project as you go. Each lesson will add a small piece that the next one needs.</p>
      <ol className="journey-grid">{lessons.map((lesson) => <li key={lesson.id} className="lesson-card"><div className="lesson-top"><span className="lesson-number">{workspace.completed.includes(lesson.id) ? '✓' : `0${lesson.id}`}</span><span className="file-tag">{lesson.file}</span></div><h3><Link to={`/lessons/${lesson.id}`}>{lesson.title} →</Link></h3><p>{lesson.description}</p><div className="lesson-bottom"><span>{lesson.concept}</span><span>{workspace.completed.includes(lesson.id) ? 'Checked' : 'Open lesson'}</span></div></li>)}</ol>
      <div className="journey-note"><span className="small-dot" /><p><strong>One real code loop.</strong> Edit JavaScript, run it in Sandpack, and see which checks pass. Earlier files stay in the next lesson.</p></div>
    </section>
    <section className="chapter-entry section-space" aria-labelledby="chapter-title"><div><p className="eyebrow">CHAPTER 01 / THE BASICS</p><h2 id="chapter-title">Every gig starts as a draft.</h2><p>Start with an event card. Then learn why checking its details and verifying payment come before publishing.</p><Link className="text-link" to="/chapters/1">Take a look inside <Arrow /></Link></div><div className="chapter-side"><span className="chapter-big" aria-hidden="true">01</span><span className="outline-tag">Chapter 01 is ready</span></div></section>
    <section className="beyond section-space" aria-labelledby="beyond-title"><div><p className="eyebrow">PUT YOUR CODE TO WORK</p><h2 id="beyond-title">Follow the whole GigLink story.</h2></div><p>Create → check → publish → browse → apply → review. See the venue reveal and the subscription consequence, all from your own files.</p><div><Link className="text-link" to="/replay">Replay full journey →</Link><Link className="text-link" to="/questions">Practice 12 questions →</Link></div></section>
  </>;
}

function Chapter() {
  const { chapterId } = useParams();
  const { workspace, saveStatus } = useWorkspace();
  if (chapterId !== '1') return <NotFound />;

  return <div className="chapter-page">
    <Link className="text-link" to="/">← Back to overview</Link>
    <p className="eyebrow">CHAPTER 01 / CREATE → CHECK → PUBLISH → BROWSE → APPLY → REVIEW</p>
    <h1>Every gig starts<br />as a <em>draft.</em></h1>
    <p className="chapter-lead">Think of a draft as an event flyer still on your desk. You can check the details before anyone else sees it.</p>
    <div className="chapter-notice"><strong>One connected project.</strong> Write real JavaScript, try good and bad inputs, then see what your code does. Payments are simulated.</div>
    <div className="chapter-content"><section aria-labelledby="chapter-lessons"><h2 id="chapter-lessons">What you’ll build</h2>
      <ol className="chapter-lessons">{lessons.map((lesson) => <li key={lesson.id}><span className="lesson-number">{workspace.completed.includes(lesson.id) ? '✓' : `0${lesson.id}`}</span><div><h3>{lesson.title}</h3><p>{lesson.detail}</p><span className="file-tag">{lesson.file}</span><br /><Link className="chapter-lesson-link" to={`/lessons/${lesson.id}`}>Open lesson {lesson.id} →</Link></div></li>)}</ol>
    </section><aside className="lesson-plan"><p className="eyebrow">THE LESSON LOOP</p><h2>Small steps.<br />Visible results.</h2><p>See an everyday example. Try a change. Write real code. Run it and see what happens.</p><p>Then connect it to GigLink’s source and practice explaining why it works.</p><Link className="button primary" to={`/lessons/${workspace.currentLesson}`}>Open your workspace →</Link><p className="muted" role="status">{saveStatus}</p><div className="chapter-progress"><progress value={workspace.completed.length} max="6" aria-label="Completed lessons" /><span>{workspace.completed.length}/6 checked</span></div><Link className="text-link" to="/replay">Replay full journey →</Link><Link className="text-link" to="/questions">Practice presentation questions →</Link></aside></div>
  </div>;
}

function NotFound() {
  return <section className="not-found"><p className="eyebrow">PAGE NOT FOUND</p><h1>Let’s head back<br />to the notebook.</h1><p>Open chapter 01 to find the six connected lessons.</p><Link className="button primary" to="/">Back to overview <Arrow /></Link></section>;
}

export default function App() {
  return <Layout><Suspense fallback={<p role="status">Opening your workspace…</p>}><Routes><Route path="/" element={<Home />} /><Route path="/chapters/:chapterId" element={<Chapter />} /><Route path="/lessons/:lessonId" element={<LabPage />} /><Route path="/replay" element={<LabPage replayMode />} /><Route path="/questions" element={<QuestionsPage />} /><Route path="*" element={<NotFound />} /></Routes></Suspense></Layout>;
}
