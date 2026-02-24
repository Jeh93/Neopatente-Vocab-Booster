import React, { useMemo } from 'react';

function StatsPage({ progress, chapters, questionsById, vocabCards }) {
  const overall = useMemo(() => {
    const vals = Object.values(progress.questionStats);
    const attempts = vals.reduce((a, v) => a + v.attempts, 0);
    const correct = vals.reduce((a, v) => a + v.correct, 0);
    return attempts ? Math.round((correct / attempts) * 100) : 0;
  }, [progress.questionStats]);

  const byTopic = useMemo(() => {
    const map = {};
    Object.entries(progress.questionStats).forEach(([id, stat]) => {
      const chapter = questionsById[id]?.id_chapter;
      if (!chapter) return;
      map[chapter] = map[chapter] || { attempts: 0, correct: 0 };
      map[chapter].attempts += stat.attempts;
      map[chapter].correct += stat.correct;
    });
    return map;
  }, [progress.questionStats, questionsById]);

  const weakVocab = [...vocabCards]
    .sort((a, b) => (progress.vocabStats[a.id]?.mastery || 0.2) - (progress.vocabStats[b.id]?.mastery || 0.2))
    .slice(0, 8);

  return (
    <section className='page'>
      <h2>Review & Stats</h2>
      <div className='panel'><h3>Overall quiz accuracy: {overall}%</h3></div>
      <div className='panel'>
        <h3>Accuracy by topic</h3>
        <ul>
          {Object.entries(byTopic).map(([chapter, stat]) => {
            const label = chapters.find((c) => c.id_chapter === Number(chapter))?.descrizione || chapter;
            const acc = stat.attempts ? Math.round((stat.correct / stat.attempts) * 100) : 0;
            return <li key={chapter}>{label}: {acc}%</li>;
          })}
        </ul>
      </div>
      <div className='panel'>
        <h3>Weakest vocab</h3>
        <ul>{weakVocab.map((v) => <li key={v.id}>{v.term_it} — {v.term_en}</li>)}</ul>
      </div>
      <div className='panel'>
        <h3>Recent mistakes</h3>
        <ul>{progress.recentMistakes.slice(-10).reverse().map((m) => <li key={`${m.id}-${m.at}`}>Question #{m.id} · Topic {m.topic}</li>)}</ul>
      </div>
    </section>
  );
}

export default StatsPage;
