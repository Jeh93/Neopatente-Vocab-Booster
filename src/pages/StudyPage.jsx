import React, { useMemo, useState } from 'react';
import { getQuizImagePath } from '../features/quiz/quiz-utils';
import { translateItToEn } from '../features/quiz/translate';

function StudyPage({ chapters, questions, hints }) {
  const [topic, setTopic] = useState(String(chapters[0]?.id_chapter || ''));
  const [translations, setTranslations] = useState({});
  const [loadingKey, setLoadingKey] = useState('');

  const material = useMemo(() => {
    const selectedQuestions = questions.filter((q) => String(q.id_chapter) === String(topic));
    const theoryIds = [...new Set(selectedQuestions.map((q) => q.theory))];
    const byTheory = hints.reduce((acc, hint) => ({ ...acc, [hint.id]: hint }), {});
    const examples = selectedQuestions.filter((q) => q.image !== null).slice(0, 8);

    return {
      hintItems: theoryIds.map((id) => byTheory[id]).filter(Boolean).slice(0, 15),
      examples,
    };
  }, [topic, questions, hints]);

  async function requestTranslation(key, text) {
    setLoadingKey(key);
    try {
      const translated = await translateItToEn(text);
      setTranslations((prev) => ({ ...prev, [key]: translated }));
    } catch {
      setTranslations((prev) => ({ ...prev, [key]: 'Translation failed. Check connection and retry.' }));
    } finally {
      setLoadingKey('');
    }
  }

  return (
    <section className='page'>
      <h2>Study Topics</h2>
      <div className='panel'>
        <label>Topic</label>
        <select value={topic} onChange={(e) => setTopic(e.target.value)}>
          {chapters.map((c) => <option key={c.id_chapter} value={c.id_chapter}>{c.descrizione}</option>)}
        </select>
      </div>

      <div className='panel'>
        <h3>Topic hints and theory material</h3>
        <ul>
          {material.hintItems.map((hint) => {
            const key = `hint-${hint.id}`;
            return (
              <li key={hint.id} className='study-item'>
                <strong>{hint.title}</strong>
                <p>{hint.description}</p>
                <button onClick={() => requestTranslation(key, `${hint.title}. ${hint.description}`)} disabled={loadingKey === key}>
                  {loadingKey === key ? 'Translating…' : 'Translate to English'}
                </button>
                {translations[key] && <p className='translated'>{translations[key]}</p>}
              </li>
            );
          })}
        </ul>
      </div>

      <div className='panel'>
        <h3>Example questions with images</h3>
        <ul>
          {material.examples.map((q) => {
            const key = `question-${q.id}`;
            return (
              <li key={q.id} className='study-item'>
                <p>{q.question}</p>
                <img src={getQuizImagePath(q.image)} alt='topic example' onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <button onClick={() => requestTranslation(key, q.question)} disabled={loadingKey === key}>
                  {loadingKey === key ? 'Translating…' : 'Translate to English'}
                </button>
                {translations[key] && <p className='translated'>{translations[key]}</p>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default StudyPage;
