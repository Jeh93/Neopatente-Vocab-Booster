export function buildVocabOptions(card, allCards, reverseMode = false) {
  const correctLabel = reverseMode ? card.term_it : (card.term_en || card.definition_en);
  const sameGroup = allCards.filter((c) => c.id !== card.id && (c.category === card.category || c.pos === card.pos || c.tags.some((t) => card.tags.includes(t))));
  const fallback = allCards.filter((c) => c.id !== card.id);

  const picks = [];
  const taken = new Set([correctLabel]);
  [...sameGroup, ...fallback].forEach((candidate) => {
    if (picks.length >= 2) return;
    const label = reverseMode ? candidate.term_it : (candidate.term_en || candidate.definition_en);
    if (!label || taken.has(label) || label === correctLabel) return;
    taken.add(label);
    picks.push(label);
  });

  const options = [correctLabel, ...picks].slice(0, 3);
  while (options.length < 3) {
    options.push(`Option ${options.length + 1}`);
  }

  return options.sort(() => Math.random() - 0.5);
}
