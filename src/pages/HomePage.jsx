import React from 'react';
import { Link } from 'react-router-dom';

function HomePage({ progress, chapters, dailyQuizQueue, dailyVocabQueue }) {
  const streak = Object.values(progress.questionStats).filter((s) => s.streakCorrect > 2).length;
  const chapterName = (id) => chapters.find((c) => c.id_chapter === Number(id))?.descrizione || `Topic ${id}`;

  return (
    <section className='page'>
      <h2>Daily Plan</h2>
      <div className='panel'>
        <p>Today: {dailyQuizQueue.length} quiz + {dailyVocabQueue.length} vocab cards.</p>
        <p>Daily goal: {progress.settings.dailyQuizGoal} / {progress.settings.dailyVocabGoal}</p>
        <p>Streak indicators: {streak}</p>
        <Link className='btn-primary' to='/quiz'>Continue</Link>
      </div>
      <div className='panel'>
        <h3>Weak topics</h3>
        <ul>
          {Object.entries(progress.questionStats)
            .sort((a, b) => (b[1].wrong || 0) - (a[1].wrong || 0))
            .slice(0, 5)
            .map(([id]) => <li key={id}>{chapterName((id % 10) + 1)}</li>)}
        </ul>
      </div>
    </section>
  );
}

export default HomePage;
