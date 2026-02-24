import React, { useMemo, useState } from 'react';
import { getQuizImagePath } from '../features/quiz/quiz-utils';

function QuizPage({ questions, chapters, hints, progress, onAnswer, onSessionChange }) {
  const [mode, setMode] = useState('full');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [index, setIndex] = useState(0);
  const [queue, setQueue] = useState([]);
  const [choice, setChoice] = useState(null);
  const [marked, setMarked] = useState(false);

  const hintMap = useMemo(() => hints.reduce((acc, h) => ({ ...acc, [h.id]: h }), {}), [hints]);

  function start() {
    let selected = questions;
    if (mode === 'topic' && topic) selected = questions.filter((q) => q.id_chapter === Number(topic));
    if (mode === 'mistakes') {
      const wrongIds = Object.entries(progress.questionStats).filter(([, v]) => v.wrong > v.correct || v.markedForReview).map(([id]) => Number(id));
      selected = questions.filter((q) => wrongIds.includes(q.id) && (!topic || q.id_chapter === Number(topic)));
    }
    const shuffled = [...selected].sort(() => Math.random() - 0.5).slice(0, Number(count));
    setQueue(shuffled);
    setIndex(0);
    setChoice(null);
    onSessionChange({ queue: shuffled.map((q) => q.id), position: 0, mode, selectedTopics: topic ? [topic] : [] });
  }

  const current = queue[index];
  const currentHint = current ? hintMap[current.theory] : null;

  function answer(value) {
    setChoice(value);
    const correct = Number(value) === Number(current.answer);
    onAnswer(current, correct, marked);
  }

  function next() {
    const nextIndex = index + 1;
    setChoice(null);
    setMarked(false);
    setIndex(nextIndex);
    onSessionChange({ ...progress.sessionState, position: nextIndex });
  }

  return (
    <section className='page'>
      <h2>Quiz</h2>
      <div className='panel'>
        <div className='row'>
          <label>Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value='full'>Full quiz</option>
            <option value='topic'>Topic-wise quiz</option>
            <option value='mistakes'>Review mistakes</option>
          </select>
        </div>
        <div className='row'>
          <label>Topic</label>
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value=''>All</option>
            {chapters.map((c) => <option key={c.id_chapter} value={c.id_chapter}>{c.descrizione}</option>)}
          </select>
        </div>
        <div className='row'><label>Questions</label><input type='number' min='1' max='40' value={count} onChange={(e) => setCount(e.target.value)} /></div>
        <button className='btn-primary' onClick={start}>Start</button>
      </div>
      {current && (
        <article className='panel card'>
          <p>{index + 1}/{queue.length}</p>
          <p>{current.question}</p>
          {current.image !== null && <img src={getQuizImagePath(current.image)} alt='quiz visual' onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
          <div className='actions'>
            <button aria-label='answer true' className={choice === 1 ? 'selected' : ''} onClick={() => answer(1)} disabled={choice !== null}>Vero</button>
            <button aria-label='answer false' className={choice === 0 ? 'selected' : ''} onClick={() => answer(0)} disabled={choice !== null}>Falso</button>
          </div>
          <button className='ghost' onClick={() => setMarked((v) => !v)}>{marked ? '★ Marked' : '☆ Mark for review'}</button>
          {choice !== null && (
            <div className='feedback'>
              <p>{Number(choice) === Number(current.answer) ? 'Correct' : 'Incorrect'}</p>
              <p>{currentHint?.description || 'No explanation available.'}</p>
              <button className='btn-primary' onClick={next} disabled={index + 1 >= queue.length}>Next</button>
            </div>
          )}
        </article>
      )}
    </section>
  );
}

export default QuizPage;
