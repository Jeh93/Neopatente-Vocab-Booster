export const DEFAULT_MASTERY = 0.2;

export function updateMastery(mastery = DEFAULT_MASTERY, correct) {
  const next = correct ? mastery + (0.08 * (1 - mastery)) : mastery - (0.18 * mastery);
  return Math.max(0, Math.min(1, Number(next.toFixed(4))));
}

export function getDefaultStat() {
  return {
    attempts: 0,
    correct: 0,
    wrong: 0,
    lastSeenAt: 0,
    mastery: DEFAULT_MASTERY,
    streakCorrect: 0,
    markedForReview: false,
  };
}

export function updateStat(stat, correct) {
  const current = { ...getDefaultStat(), ...(stat || {}) };
  return {
    ...current,
    attempts: current.attempts + 1,
    correct: current.correct + (correct ? 1 : 0),
    wrong: current.wrong + (correct ? 0 : 1),
    lastSeenAt: Date.now(),
    mastery: updateMastery(current.mastery, correct),
    streakCorrect: correct ? current.streakCorrect + 1 : 0,
  };
}
