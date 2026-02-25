import React, { useEffect, useMemo, useState } from 'react';
import { getQuizImagePath } from '../features/quiz/quiz-utils';
import { translateItToEn } from '../features/quiz/translate';

function QuizPage({ questions, chapters, hints, progress, onAnswer, onSessionChange }) {
  const [mode, setMode] = useState('full');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [index, setIndex] = useState(0);
  const [queue, setQueue] = useState([]);
  const [choice, setChoice] = useState(null);
  const [marked, setMarked] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [translatedQuestion, setTranslatedQuestion] = useState('');
  const [translatedHint, setTranslatedHint] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const hintMap = useMemo(() => hints.reduce((acc, h) => ({ ...acc, [h.id]: h }), {}), [hints]);
  const isSimulator = mode === 'simulator';

  useEffect(() => {
    if (!isSimulator || !progress.settings.simulatorTimer || queue.length === 0) return;
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearInterval(timer);
  }, [isSimulator, progress.settings.simulatorTimer, queue.length, timeLeft]);

  function start() {
    let selected = questions;
    let limit = Number(count);

    if (mode === 'topic' && topic) selected = questions.filter((q) => q.id_chapter === Number(topic));
    if (mode === 'mistakes') {
      const wrongIds = Object.entries(progress.questionStats)
        .filter(([, v]) => v.wrong > v.correct || v.markedForReview)
        .map(([id]) => Number(id));
      selected = questions.filter((q) => wrongIds.includes(q.id) && (!topic || q.id_chapter === Number(topic)));
    }
    if (mode === 'simulator') {
      limit = Number(progress.settings.simulatorQuestions || 30);
      selected = topic ? questions.filter((q) => q.id_chapter === Number(topic)) : questions;
      if (progress.settings.simulatorTimer) {
        setTimeLeft(limit * 35);
      }
    }

    const shuffled = [...selected].sort(() => Math.random() - 0.5).slice(0, limit);
    setQueue(shuffled);
    setIndex(0);
    setChoice(null);
    setMarked(false);
    setMistakes(0);
    setTranslatedQuestion('');
    setTranslatedHint('');
    onSessionChange({ queue: shuffled.map((q) => q.id), position: 0, mode, selectedTopics: topic ? [topic] : [] });
  }

  const current = queue[index];
  const currentHint = current ? hintMap[current.theory] : null;
  const examFailed = isSimulator && mistakes >= Number(progress.settings.simulatorMaxErrors || 3);
  const examTimedOut = isSimulator && progress.settings.simulatorTimer && queue.length > 0 && timeLeft <= 0;
  const completed = queue.length > 0 && (index >= queue.length || examFailed || examTimedOut);

  async function translateCurrent() {
    if (!current || isSimulator) return;
    setIsTranslating(true);
    try {
      const [qText, hText] = await Promise.all([
        translateItToEn(current.question),
        currentHint?.description ? translateItToEn(currentHint.description) : Promise.resolve(''),
      ]);
      setTranslatedQuestion(qText);
      setTranslatedHint(hText);
    } catch {
      setTranslatedQuestion('Translation failed. Please retry with network access.');
    } finally {
      setIsTranslating(false);
    }
  }

  function answer(value) {
    setChoice(value);
    const correct = Number(value) === Number(current.answer);
    if (!correct) setMistakes((m) => m + 1);
    onAnswer(current, correct, marked);
  }

  function next() {
    const nextIndex = index + 1;
    setChoice(null);
    setMarked(false);
    setIndex(nextIndex);
    setTranslatedQuestion('');
    setTranslatedHint('');
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
            <option value='simulator'>Exam simulator</option>
          </select>
        </div>
        <div className='row'>
          <label>Topic</label>
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value=''>All</option>
            {chapters.map((c) => <option key={c.id_chapter} value={c.id_chapter}>{c.descrizione}</option>)}
          </select>
        </div>
        {!isSimulator && <div className='row'><label>Questions</label><input type='number' min='1' max='40' value={count} onChange={(e) => setCount(e.target.value)} /></div>}
        {isSimulator && (
          <p>Simulator: {progress.settings.simulatorQuestions} questions · max {progress.settings.simulatorMaxErrors} errors {progress.settings.simulatorTimer ? '· timer on' : ''}</p>
        )}
        <button className='btn-primary' onClick={start}>Start</button>
      </div>

      {completed && (
        <div className='panel'>
          <h3>Exam result</h3>
          <p>{examTimedOut ? 'Time is over.' : examFailed ? 'Max errors reached.' : 'Completed.'}</p>
          <p>Answered: {Math.min(index, queue.length)} / {queue.length}</p>
          <p>Mistakes: {mistakes}</p>
        </div>
      )}

      {!completed && current && (
        <article className='panel card'>
          <p>{index + 1}/{queue.length}</p>
          {isSimulator && <p>Mistakes: {mistakes} / {progress.settings.simulatorMaxErrors}</p>}
          {isSimulator && progress.settings.simulatorTimer && <p>Time left: {Math.max(timeLeft, 0)}s</p>}
          <p>{current.question}</p>
          {translatedQuestion && <p className='translated'>{translatedQuestion}</p>}
          {current.image !== null && <img src={getQuizImagePath(current.image)} alt='quiz visual' onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
          <div className='actions'>
            <button aria-label='answer true' className={choice === 1 ? 'selected' : ''} onClick={() => answer(1)} disabled={choice !== null}>Vero</button>
            <button aria-label='answer false' className={choice === 0 ? 'selected' : ''} onClick={() => answer(0)} disabled={choice !== null}>Falso</button>
          </div>
          {!isSimulator && (
            <button className='ghost' onClick={translateCurrent} disabled={isTranslating}>
              {isTranslating ? 'Translating…' : 'Translate question & hint to English'}
            </button>
          )}
          <button className='ghost' onClick={() => setMarked((v) => !v)}>{marked ? '★ Marked' : '☆ Mark for review'}</button>
          {choice !== null && (
            <div className='feedback'>
              <p>{Number(choice) === Number(current.answer) ? 'Correct' : 'Incorrect'}</p>
              <p>{currentHint?.description || 'No explanation available.'}</p>
              {translatedHint && <p className='translated'>{translatedHint}</p>}
              <button className='btn-primary' onClick={next} disabled={index + 1 >= queue.length}>Next</button>
            </div>
          )}
        </article>
      )}
    </section>
  );
}

export default QuizPage;
