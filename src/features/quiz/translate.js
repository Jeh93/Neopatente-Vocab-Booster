const CACHE_KEY = 'patente_translation_cache_v1';

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

export async function translateItToEn(text) {
  const input = String(text || '').trim();
  if (!input) return '';

  const cache = readCache();
  if (cache[input]) return cache[input];

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=it&tl=en&dt=t&q=${encodeURIComponent(input)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Translation service unavailable');
  }
  const payload = await response.json();
  const translated = Array.isArray(payload?.[0])
    ? payload[0].map((chunk) => chunk?.[0] || '').join('')
    : '';

  if (!translated) {
    throw new Error('No translation returned');
  }

  cache[input] = translated;
  writeCache(cache);
  return translated;
}
