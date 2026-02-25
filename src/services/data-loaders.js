import questions from './questions.json';
import chapters from './chapters.json';
import hints from './hints.json';
import vocabDataset from '../../patente_vocab_it_en.json';

export function loadQuestions() {
  return questions;
}

export function loadChapters() {
  return chapters;
}

export function loadHints() {
  return hints;
}

export function loadVocab() {
  return vocabDataset.cards ?? [];
}
