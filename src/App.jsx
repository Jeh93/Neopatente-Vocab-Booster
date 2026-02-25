import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, NavLink, Redirect, Route, Switch } from 'react-router-dom';
import { loadChapters, loadHints, loadQuestions, loadVocab } from './services/data-loaders';
import { loadProgress, saveProgress, mergeProgress, getDefaultProgress } from './features/storage/progress-store';
import { buildWeightedQueue, buildTopicWrongRate } from './features/adaptive/scheduler';
import { updateStat } from './features/adaptive/mastery';
import { hintsMap, linkQuestionToVocab } from './features/quiz/quiz-utils';
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import VocabPage from './pages/VocabPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';
import StudyPage from './pages/StudyPage';

function App() {
  const questions = useMemo(() => loadQuestions(), []);
  const chapters = useMemo(() => loadChapters(), []);
  const hints = useMemo(() => loadHints(), []);
  const vocabCards = useMemo(() => loadVocab(), []);

  const [progress, setProgress] = useState(getDefaultProgress());
  const [ready, setReady] = useState(false);

  const hintById = useMemo(() => hintsMap(hints), [hints]);
  const questionsById = useMemo(() => questions.reduce((acc, q) => ({ ...acc, [q.id]: q }), {}), [questions]);

  useEffect(() => {
    loadProgress().then((data) => {
      setProgress(mergeProgress(getDefaultProgress(), data));
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) saveProgress(progress);
  }, [progress, ready]);

  const topicRates = useMemo(() => buildTopicWrongRate(progress.questionStats, questionsById), [progress.questionStats, questionsById]);

  function updateQuestionResult(question, correct, markedForReview = false) {
    const existing = progress.questionStats[question.id];
    const nextStat = { ...updateStat(existing, correct), markedForReview };
    const hint = hintById[question.theory];
    const linkedVocabIds = linkQuestionToVocab(question, hint, vocabCards);
    const recentMistake = correct ? [] : [{ id: question.id, at: Date.now(), topic: question.id_chapter, linkedVocabIds }];

    setProgress((current) => ({
      ...current,
      questionStats: { ...current.questionStats, [question.id]: nextStat },
      recentMistakes: [...current.recentMistakes, ...recentMistake].slice(-100),
    }));
  }

  function updateVocabResult(card, correct, markedForReview = false) {
    const existing = progress.vocabStats[card.id];
    const nextStat = { ...updateStat(existing, correct), markedForReview };
    setProgress((current) => ({ ...current, vocabStats: { ...current.vocabStats, [card.id]: nextStat } }));
  }

  function saveSessionState(sessionState) {
    setProgress((current) => ({ ...current, sessionState }));
  }

  function updateSettings(settings) {
    setProgress((current) => ({ ...current, settings: { ...current.settings, ...settings } }));
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', progress.settings.theme || 'light');
  }, [progress.settings.theme]);

  function resetProgress() {
    setProgress(getDefaultProgress());
  }

  function importProgress(payload) {
    setProgress((current) => mergeProgress(current, payload));
  }

  const schedulerBoosts = useMemo(() => {
    const boosts = {};
    progress.recentMistakes.slice(-40).forEach((mistake) => {
      boosts[mistake.id] = boosts[mistake.id] || {};
      boosts[mistake.id].topicBoost = (topicRates[String(mistake.topic)] || 0) * 0.6;
      (mistake.linkedVocabIds || []).forEach((vocabId) => {
        boosts[vocabId] = boosts[vocabId] || {};
        boosts[vocabId].linkBoost = (boosts[vocabId].linkBoost || 0) + 0.25;
      });
    });
    return boosts;
  }, [progress.recentMistakes, topicRates]);

  const dailyQuizQueue = useMemo(() => buildWeightedQueue({
    items: questions,
    stats: progress.questionStats,
    size: progress.settings.dailyQuizGoal,
    boosts: schedulerBoosts,
  }), [questions, progress.questionStats, progress.settings.dailyQuizGoal, schedulerBoosts]);

  const dailyVocabQueue = useMemo(() => buildWeightedQueue({
    items: vocabCards,
    stats: progress.vocabStats,
    size: progress.settings.dailyVocabGoal,
    boosts: schedulerBoosts,
  }), [vocabCards, progress.vocabStats, progress.settings.dailyVocabGoal, schedulerBoosts]);

  if (!ready) return <div className='loading'>Loading...</div>;

  return (
    <Router>
      <div className='app-shell'>
        <header className='top-bar'><h1>Patente AB Booster</h1></header>
        <main>
          <Switch>
            <Route path='/home'>
              <HomePage progress={progress} chapters={chapters} dailyQuizQueue={dailyQuizQueue} dailyVocabQueue={dailyVocabQueue} />
            </Route>
            <Route path='/quiz'>
              <QuizPage questions={questions} chapters={chapters} hints={hints} progress={progress} onAnswer={updateQuestionResult} onSessionChange={saveSessionState} />
            </Route>
            <Route path='/vocab'>
              <VocabPage vocabCards={vocabCards} progress={progress} onAnswer={updateVocabResult} onSessionChange={saveSessionState} />
            </Route>
            <Route path='/study'>
              <StudyPage chapters={chapters} questions={questions} hints={hints} />
            </Route>
            <Route path='/stats'>
              <StatsPage progress={progress} chapters={chapters} questionsById={questionsById} vocabCards={vocabCards} />
            </Route>
            <Route path='/settings'>
              <SettingsPage progress={progress} onSettingsChange={updateSettings} onReset={resetProgress} onImport={importProgress} />
            </Route>
            <Redirect to='/home' />
          </Switch>
        </main>
        <nav className='bottom-nav six'>
          <NavLink to='/home' activeClassName='active'>Home</NavLink>
          <NavLink to='/quiz' activeClassName='active'>Quiz</NavLink>
          <NavLink to='/vocab' activeClassName='active'>Vocab</NavLink>
          <NavLink to='/study' activeClassName='active'>Study</NavLink>
          <NavLink to='/stats' activeClassName='active'>Review</NavLink>
          <NavLink to='/settings' activeClassName='active'>Settings</NavLink>
        </nav>
      </div>
    </Router>
  );
}

export default App;
