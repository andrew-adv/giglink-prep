import { useEffect, useReducer, useRef } from 'react';
import { closedGuide, guideFrame, guideReducer } from './navigation.js';
import './walkthrough.css';

export default function GuidedWalkthrough({ lesson }) {
  const [state, dispatch] = useReducer(guideReducer, closedGuide);
  const opener = useRef(null);
  return <div className="guided-entry">
    <button className="button show-me" ref={opener} onClick={() => dispatch({ type: 'open', lessonId: lesson.id })}>Show me how <span aria-hidden="true">↗</span></button>
    <p className="muted">Optional guided demo · Your code and progress stay as they are.</p>
    {state.open && <GuideDialog state={state} dispatch={dispatch} lesson={lesson} opener={opener} />}
  </div>;
}

function GuideDialog({ state, dispatch, lesson, opener }) {
  const dialog = useRef(null);
  const closeButton = useRef(null);
  const { guide, variant, step, index } = guideFrame(state);
  const close = () => dispatch({ type: 'close' });
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    closeButton.current.focus();
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = previousOverflow; opener.current?.focus(); };
  }, [opener]);

  return <dialog className="guide-dialog" ref={dialog} aria-labelledby="guide-title" aria-describedby="guide-purpose" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="guide-surface">
      <header className="guide-header"><div><p className="eyebrow">SHOW ME HOW / LESSON {guide.id}</p><h2 id="guide-title">{guide.title}</h2></div><button className="button secondary" ref={closeButton} onClick={close}>Close ×</button></header>
      <div className="guide-body">
        <p id="guide-purpose" className="guide-purpose">A demonstration with authored code. Nothing here edits your workspace, runs your code, or completes a lesson.</p>
        <p className="guide-analogy">{guide.analogy}</p>
        {guide.variants.length > 1 && <label className="guide-choice">Predict another outcome<select value={variant.id} onChange={event => dispatch({ type: 'choose', choice: event.target.value })}>{guide.variants.map(choice => <option key={choice.id} value={choice.id}>{choice.label}</option>)}</select></label>}
        <div className="guide-grid">
          <section className="guide-visual" aria-label="Guided simulation" data-demo-step={index}>
            <p className="eyebrow">THE SAME MINI GIGLINK STORY</p><h3>{step.visual.title}</h3><span className={`guide-badge ${step.visual.tone}`}>{step.visual.status}</span>
            <dl>{step.visual.rows.map(([label, value], row) => <div key={`${index}-${row}`}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            <div className="guide-changed" aria-live="polite" aria-atomic="true"><h4>What changed?</h4><p>{step.changed}</p></div>
          </section>
          <section className="guide-code" aria-label="Working example code"><p className="eyebrow">AUTHORED JAVASCRIPT EXAMPLE</p><pre><code>{variant.code.map((line, row) => <span key={row} className={`guide-code-line ${step.lines.includes(row + 1) ? 'active-line' : ''}`} data-line={row + 1} aria-current={step.lines.includes(row + 1) ? 'step' : undefined}><span className="guide-line-number" aria-hidden="true">{row + 1}</span><span>{line}</span></span>)}</code></pre><p className="muted">Highlighted lines: {step.lines.join(', ')}</p></section>
        </div>
        <section className="guide-explanation" aria-live="polite" aria-atomic="true"><p className="eyebrow">STEP {index + 1} OF {variant.steps.length}</p><h3>{step.title}</h3><p>{step.explanation}</p></section>
        <details className="guide-source"><summary>How this differs from real GigLink</summary><p>{guide.scope}</p><p>{lesson.connection}</p></details>
        <a className="text-link guide-source-link" href={lesson.source} target="_blank" rel="noreferrer">{lesson.sourceName} ↗</a>
      </div>
      <footer className="guide-footer"><button className="button secondary" onClick={() => dispatch({ type: 'back' })} disabled={index === 0}>← Back</button><button className="button secondary" onClick={() => dispatch({ type: 'replay' })}>Replay</button><span className="muted">{index + 1}/{variant.steps.length}</span><button className="button primary" onClick={() => dispatch({ type: 'next' })} disabled={index === variant.steps.length - 1}>Next →</button></footer>
    </div>
  </dialog>;
}
