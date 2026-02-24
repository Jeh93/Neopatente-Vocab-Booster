import { normalizeText } from '../../utils/normalizeText';

export function getQuizImagePath(imageCode) {
  if (!imageCode && imageCode !== 0) return null;
  return `/images/${String(imageCode).padStart(3, '0')}.gif`;
}

export function hintsMap(hints) {
  return hints.reduce((acc, hint) => {
    acc[hint.id] = hint;
    return acc;
  }, {});
}

export function linkQuestionToVocab(question, hint, vocabCards) {
  const haystack = normalizeText(`${question?.question || ''} ${hint?.title || ''} ${hint?.description || ''}`);
  return vocabCards
    .filter((card) => {
      const terms = [card.term_it, ...(card.aliases_it || [])].map(normalizeText).filter(Boolean);
      return terms.some((term) => haystack.includes(term));
    })
    .map((card) => card.id);
}
