import { exampleSolutions } from './project.js';
import GuidedWalkthrough from '../guided/Walkthrough.jsx';

export default function LessonExplanation({ lesson, onOpenCode }) {
  return <>
    <p className="eyebrow">PICTURE THIS</p><h2>{lesson.heading || (lesson.id === 1 ? 'Start with an event card.' : lesson.id === 2 ? 'Check before you print.' : 'A claim is not proof.')}</h2><p>{lesson.analogy}</p>
    <GuidedWalkthrough lesson={lesson} />
    <h3>Try a change</h3><p>{lesson.try}</p><h3>Your code task</h3><p>{lesson.task}</p><div className="code-contract">{lesson.contract}</div>
    {onOpenCode && <button className="button primary mobile-code-cta" onClick={onOpenCode}>Open the code →</button>}
    <details className="worked-example"><summary>Need a worked example?</summary><p>Read it, then type the changes into {lesson.file.slice(1)}. Opening this example does not complete the lesson.</p><pre><code>{exampleSolutions[lesson.file]}</code></pre></details>
    <section className="source-connection"><p className="eyebrow">CONNECT TO REAL GIGLINK</p><a href={lesson.source} target="_blank" rel="noreferrer">{lesson.sourceName} ↗</a><p>{lesson.connection}</p>{lesson.extraSource && <a href={lesson.extraSource} target="_blank" rel="noreferrer">gig.model.js → required fields ↗</a>}</section>
    <section className="defend"><p className="eyebrow">EXPLAIN IT</p><h3>{lesson.question}</h3><p>{lesson.answer}</p><details><summary>Go a little deeper</summary><p>{lesson.depth}</p></details></section>
  </>;
}
