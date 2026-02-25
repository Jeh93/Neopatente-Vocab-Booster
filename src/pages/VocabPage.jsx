import React, { useMemo, useState } from 'react';
import { buildVocabOptions } from '../features/vocab/vocab-utils';

function VocabPage({ vocabCards, progress, onAnswer, onSessionChange }) {
  const [reverseMode, setReverseMode] = useState(false);
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [choice, setChoice] = useState(null);
  const [marked, setMarked] = useState(false);

  const weak = useMemo(() => [...vocabCards].sort((a, b) => (progress.vocabStats[a.id]?.mastery || 0.2) - (progress.vocabStats[b.id]?.mastery || 0.2)), [vocabCards, progress.vocabStats]);

  function start() {
    const selected = weak.slice(0, progress.settings.dailyVocabGoal + 8);
    setQueue(selected);
    setIndex(0);
    setChoice(null);
    setOptions(buildVocabOptions(selected[0], vocabCards, reverseMode));
    onSessionChange({ queue: selected.map((c) => c.id), position: 0, mode: 'vocab', selectedTopics: [] });
  }

  const card = queue[index];
  const correctLabel = card ? (reverseMode ? card.term_it : (card.term_en || card.definition_en)) : '';

  function answer(opt) {
    setChoice(opt);
  }

  function next(feedbackCorrect) {
    if (card) onAnswer(card, feedbackCorrect, marked);
    const nextIndex = index + 1;
    const nextCard = queue[nextIndex];
    setIndex(nextIndex);
    setChoice(null);
    setMarked(false);
    if (nextCard) setOptions(buildVocabOptions(nextCard, vocabCards, reverseMode));
    onSessionChange({ ...progress.sessionState, position: nextIndex });
  }

  return (
    <section className='page'>
      <h2>Vocabulary Booster</h2>
      <div className='panel'>
        <label><input type='checkbox' checked={reverseMode} onChange={(e) => setReverseMode(e.target.checked)} /> Reverse mode</label>
        <button className='btn-primary' onClick={start}>Start session</button>
      </div>
      {card && (
        <article className='panel card flip'>
          <p>{index + 1}/{queue.length}</p>
          <h3>{reverseMode ? card.term_en : card.term_it}</h3>
          {card.images?.[0]?.path && <img src={card.images[0].path} alt={card.term_it} onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
          <div className='actions'>
            {options.slice(0, 3).map((opt) => (
              <button key={opt} onClick={() => answer(opt)} disabled={choice !== null}>{opt}</button>
            ))}
          </div>
          <button className='ghost' onClick={() => setMarked((v) => !v)}>{marked ? '★ Marked' : '☆ Mark for review'}</button>
          {choice && (
            <div className='feedback'>
              <p>{choice === correctLabel ? 'Correct' : `Wrong · ${correctLabel}`}</p>
              <p>{card.definition_en}</p>
              <div className='actions'>
                <button onClick={() => next(true)}>I knew it</button>
                <button onClick={() => next(false)}>I missed it</button>
              </div>
            </div>
          )}
        </article>
      )}
    </section>
  );
}

export default VocabPage;
