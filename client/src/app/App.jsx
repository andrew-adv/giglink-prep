import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { lessons } from '../content/journey.js';

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function ApiStatus() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

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

  return <span className={`api-status ${status}`} role="status"><span className="status-dot" />{status === 'online' ? 'API connected' : status === 'checking' ? 'Checking API…' : 'API unavailable · preview still works'}</span>;
}

function Layout({ children }) {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header wrap">
      <Link className="brand" to="/" aria-label="GigLink Prep home"><span className="brand-mark" aria-hidden="true">&lt;/&gt;</span><span>GigLink <strong>Prep</strong></span></Link>
      <nav aria-label="Main navigation"><NavLink to="/" end>Overview</NavLink><NavLink to="/chapters/1">Chapter preview</NavLink></nav>
      <span className="phase-tag">P0 <span>· Foundation</span></span>
    </header>
    <main id="main" className="wrap" tabIndex={-1}>{children}</main>
    <footer className="site-footer wrap"><span>One project. One piece at a time.</span><ApiStatus /><span>Built for understanding.</span></footer>
  </>;
}

function ProjectPreview() {
  return <div className="project-preview" aria-label="Static illustration of the planned mini-project">
    <div className="preview-toolbar"><span><span className="window-dot" /><span className="window-dot" /><span className="window-dot" /></span><span>your-mini-giglink / gig.js</span><span className="code-label">JS</span></div>
    <div className="code-sample"><span className="code-comment">// Start with one event.</span><pre><code><span className="code-purple">const</span> gig = {'{'}{'\n'}  title: <span className="code-string">'An evening of live music'</span>,{'\n'}  status: <span className="code-string">'draft'</span>,{'\n'}  paymentVerified: <span className="code-purple">false</span>{'\n'}{'}'};</code></pre></div>
    <div className="event-card"><div className="event-icon" aria-hidden="true">♫</div><div><span className="eyebrow">YOUR FIRST GIG</span><h3>An evening of live music</h3><p>A draft, waiting for your next step.</p></div><span className="draft-tag">Draft</span></div>
    <div className="preview-bottom"><span><span className="small-dot" />Illustrative code · not running</span><button disabled>Run code <span aria-hidden="true">▷</span></button></div>
    <div className="preview-caption"><span aria-hidden="true">↳</span> Your code will bring this little project to life.</div>
  </div>;
}

function Home() {
  return <>
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy"><p className="eyebrow"><span className="small-dot" />THE GIGLINK BUILD NOTEBOOK</p><h1 id="hero-title">Build it.<br />Understand it.<br /><em>Explain it.</em></h1><p className="hero-description">Learn how GigLink works by building a small version yourself. One connected JavaScript project, with plain-English explanations along the way.</p><Link className="button primary" to="/chapters/1">Explore chapter 01 <Arrow /></Link><p className="availability">P0 preview · Lessons are not playable yet.</p></div>
      <ProjectPreview />
    </section>
    <section className="journey section-space" aria-labelledby="journey-title">
      <div className="section-heading"><div><p className="eyebrow">THE FIRST CHAPTER</p><h2 id="journey-title">From an idea to a published gig.</h2></div><span className="outline-tag">3 connected lessons · coming in P1</span></div>
      <p className="section-intro">Keep the same project as you go. Each lesson will add a small piece that the next one needs.</p>
      <ol className="journey-grid">{lessons.map((lesson) => <li key={lesson.id} className="lesson-card"><div className="lesson-top"><span className="lesson-number">0{lesson.id}</span><span className="file-tag">{lesson.file}</span></div><h3>{lesson.title}</h3><p>{lesson.description}</p><div className="lesson-bottom"><span>{lesson.concept}</span><span aria-hidden="true">→</span></div></li>)}</ol>
      <div className="journey-note"><span className="small-dot" /><p><strong>Preview only.</strong> Code editing, running tests, and saving progress arrive in P1. Nothing is marked complete here.</p></div>
    </section>
    <section className="chapter-entry section-space" aria-labelledby="chapter-title"><div><p className="eyebrow">CHAPTER 01 / THE BASICS</p><h2 id="chapter-title">Every gig starts as a draft.</h2><p>Start with an event card. Then learn why checking its details and verifying payment come before publishing.</p><Link className="text-link" to="/chapters/1">Take a look inside <Arrow /></Link></div><div className="chapter-side"><span className="chapter-big" aria-hidden="true">01</span><span className="outline-tag">Chapter preview available</span></div></section>
    <section className="beyond section-space" aria-labelledby="beyond-title"><div><p className="eyebrow">LATER IN THE SAME PROJECT</p><h2 id="beyond-title">Follow the whole GigLink story.</h2></div><p>Browse gigs → apply with samples → accept an applicant. Later chapters will connect privacy and subscription rules to the same mini-project.</p><span className="muted">Planned for P2</span></section>
  </>;
}

function Chapter() {
  const { chapterId } = useParams();
  if (chapterId !== '1') return <NotFound />;

  return <div className="chapter-page"><Link className="text-link" to="/">← Back to overview</Link><p className="eyebrow">CHAPTER 01 / PREVIEW</p><h1>Every gig starts<br />as a <em>draft.</em></h1><p className="chapter-lead">Think of a draft as an event flyer still on your desk. You can check the details before anyone else sees it.</p><div className="chapter-notice"><strong>Not playable yet.</strong> This page previews the learning path. The editor, simulation, tests, and saved work will be built in P1.</div><div className="chapter-content"><section aria-labelledby="chapter-lessons"><h2 id="chapter-lessons">What you’ll build</h2><ol className="chapter-lessons">{lessons.map((lesson) => <li key={lesson.id}><span className="lesson-number">0{lesson.id}</span><div><h3>{lesson.title}</h3><p>{lesson.detail}</p><span className="file-tag">{lesson.file}</span></div></li>)}</ol></section><aside className="lesson-plan"><p className="eyebrow">THE PLANNED LESSON LOOP</p><h2>Small steps.<br />Visible results.</h2><p>See an everyday example. Try a change. Write real code. Run it and see what happens.</p><p>Then connect it to GigLink’s source and practice explaining why it works.</p><button className="button primary" disabled>Start lesson · coming in P1</button><p className="muted">No code is executed in this preview.</p></aside></div></div>;
}

function NotFound() {
  return <section className="not-found"><p className="eyebrow">PAGE NOT FOUND</p><h1>Let’s head back<br />to the notebook.</h1><p>Only the overview and chapter 01 preview are available in P0.</p><Link className="button primary" to="/">Back to overview <Arrow /></Link></section>;
}

export default function App() {
  return <Layout><Routes><Route path="/" element={<Home />} /><Route path="/chapters/:chapterId" element={<Chapter />} /><Route path="*" element={<NotFound />} /></Routes></Layout>;
}
