const STORAGE_KEY = 'patente_booster_progress_v1';

const defaultData = {
  questionStats: {},
  vocabStats: {},
  sessionState: { queue: [], position: 0, mode: 'daily', selectedTopics: [] },
  settings: {
    dailyQuizGoal: 12,
    dailyVocabGoal: 8,
    simulatorQuestions: 30,
    simulatorMaxErrors: 3,
    simulatorTimer: false,
  },
  recentMistakes: [],
};

let dbPromise;
function openDB() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB unavailable'));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('patente-booster-db', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('kv');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readonly');
    const req = tx.objectStore('kv').get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadProgress() {
  try {
    const value = await idbGet(STORAGE_KEY);
    return { ...defaultData, ...(value || {}) };
  } catch {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? { ...defaultData, ...JSON.parse(value) } : defaultData;
  }
}

export async function saveProgress(progress) {
  try {
    await idbSet(STORAGE_KEY, progress);
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }
}

export function mergeProgress(base, incoming) {
  return {
    ...base,
    ...incoming,
    questionStats: { ...(base.questionStats || {}), ...(incoming.questionStats || {}) },
    vocabStats: { ...(base.vocabStats || {}), ...(incoming.vocabStats || {}) },
    settings: { ...(base.settings || {}), ...(incoming.settings || {}) },
    recentMistakes: [...(base.recentMistakes || []), ...(incoming.recentMistakes || [])].slice(-200),
  };
}

export function getDefaultProgress() {
  return defaultData;
}
