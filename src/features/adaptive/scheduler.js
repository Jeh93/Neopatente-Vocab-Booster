import { DEFAULT_MASTERY } from './mastery';

function getItemScore(stat, recentWrongBoost = 0, linkedBoost = 0) {
  const mastery = stat?.mastery ?? DEFAULT_MASTERY;
  const lastSeen = stat?.lastSeenAt ?? 0;
  const attempts = stat?.attempts ?? 0;
  const recencyPenalty = lastSeen ? Math.max(0, 1 - (Date.now() - lastSeen) / (1000 * 60 * 60 * 24 * 7)) : 0;
  return (1 - mastery) + (1 - recencyPenalty) + recentWrongBoost + linkedBoost - Math.min(attempts, 4) * 0.05;
}

export function buildWeightedQueue({ items, stats, size, reviewRatio = 0.7, boosts = {} }) {
  const scored = items.map((item) => {
    const stat = stats[item.id] || null;
    const score = getItemScore(stat, boosts[item.id]?.topicBoost || 0, boosts[item.id]?.linkBoost || 0);
    return { item, stat, score };
  }).sort((a, b) => b.score - a.score);

  const reviewTarget = Math.round(size * reviewRatio);
  const review = scored.filter(({ stat }) => stat && stat.attempts > 0).slice(0, reviewTarget);
  const fresh = scored.filter(({ stat }) => !stat || stat.attempts < 2).slice(0, Math.max(0, size - review.length));
  const merged = [...review, ...fresh];
  return merged.slice(0, size).map(({ item }) => item);
}

export function buildTopicWrongRate(questionStats, questionsById) {
  const totals = {};
  Object.entries(questionStats).forEach(([id, stat]) => {
    const q = questionsById[id];
    if (!q) return;
    const topic = String(q.id_chapter);
    totals[topic] = totals[topic] || { wrong: 0, attempts: 0 };
    totals[topic].wrong += stat.wrong || 0;
    totals[topic].attempts += stat.attempts || 0;
  });

  const rates = {};
  Object.entries(totals).forEach(([topic, value]) => {
    rates[topic] = value.attempts ? value.wrong / value.attempts : 0;
  });
  return rates;
}
