import { Link } from 'react-router-dom';
import { questions } from '../../content/questions.js';

export default function QuestionsPage() {
  return <div className="chapter-page questions-page">
    <Link className="text-link" to="/chapters/1">← Back to your project</Link>
    <p className="eyebrow">PRESENTATION PRACTICE / 12 QUESTIONS</p>
    <h1>Explain the<br /><em>reason behind it.</em></h1>
    <p className="chapter-lead">Say your answer out loud first. Then open the short answer and compare. Every source link points to the reviewed real GigLink commit.</p>
    <section className="story-entry"><h2>Prepare the whole presentation.</h2><p>Explore the original project’s purpose, team, timeline and achievements. Then rehearse with a short or full speaking outline before tackling these questions.</p><Link className="text-link" to="/presentation">Read The GigLink Story →</Link><br /><Link className="text-link" to="/presentation/practice">Open presentation practice →</Link></section>
    <div className="question-grid">{questions.map((question, index) => <article className="question-card" key={question.title}>
      <span className="eyebrow">QUESTION {String(index + 1).padStart(2, '0')}</span><h2>{question.title}</h2>
      <p className="muted">Pause here. How would you explain this to someone new?</p>
      <details><summary>Reveal the short answer</summary><p>{question.answer}</p><details><summary>Go deeper: actual GigLink behavior</summary><p>{question.depth}</p></details><p className="simulation-note"><strong>Our simplified project:</strong> {question.simulation}</p></details>
      <div className="question-sources">{question.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</div>
    </article>)}</div>
    <Link className="button primary" to="/replay">Replay your full project →</Link>
  </div>;
}
