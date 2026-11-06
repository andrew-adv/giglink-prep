import { lazy, Suspense, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { lessonContent } from '../../content/lessons.js';
import { useWorkspace } from '../progress/WorkspaceProvider.jsx';
import LessonExplanation from './LessonExplanation.jsx';
import './lab.css';

// This import runs only after the learner asks to open the normal coding lab.
const CodingLab = lazy(() => import('./CodingLab.jsx'));

export default function LabPage({ replayMode = false }) {
  const { lessonId } = useParams();
  const { workspace, saveStatus } = useWorkspace();
  const [coding, setCoding] = useState(false);
  const lesson = lessonContent.find(item => String(item.id) === (replayMode ? '6' : lessonId));
  if (!lesson) return <section className="not-found"><h1>Lesson not found.</h1><Link className="text-link" to="/chapters/1">Back to chapter 01 →</Link></section>;
  if (coding) return <Suspense fallback={<p role="status">Opening Sandpack… Your saved code is kept.</p>}><CodingLab lesson={lesson} replayMode={replayMode} /></Suspense>;

  return <div className="lab-page">
    <Link className="text-link" to="/chapters/1">← Chapter 01</Link>
    <header className="lab-heading"><div><p className="eyebrow">{replayMode ? 'SAME PROJECT / FULL JOURNEY' : `CHAPTER 01 / LESSON 0${lesson.id}`}</p><h1>{replayMode ? 'Replay the full journey' : lesson.title}</h1></div><p className="save-state" role="status">{saveStatus}<br />{workspace.completed.length}/6 lessons checked</p></header>
    <nav className="lesson-switcher" aria-label="Lessons">{lessonContent.map(item => <Link key={item.id} to={`/lessons/${item.id}`} aria-current={lesson.id === item.id ? 'page' : undefined}>{workspace.completed.includes(item.id) ? '✓' : `0${item.id}`} · {item.title}</Link>)}</nav>
    <div className="lesson-intro-grid"><section className="lab-pane lesson-copy"><LessonExplanation key={lesson.id} lesson={lesson} /></section><aside className="lab-pane open-lab"><p className="eyebrow">WHEN YOU’RE READY</p><h2>{replayMode ? 'Run your whole project.' : 'Try your own code.'}</h2><p>Show me how uses a small authored example. The coding lab runs your own saved JavaScript in Sandpack and checks what it does.</p><button className="button primary" onClick={() => setCoding(true)}>{replayMode ? 'Open replay lab' : 'Open coding lab'} →</button><p className="muted">Sandpack loads only when you open this lab. Guided demos do not need it.</p><Link className="text-link" to="/replay">Replay full journey →</Link><Link className="text-link" to="/questions">Presentation practice →</Link></aside></div>
  </div>;
}
