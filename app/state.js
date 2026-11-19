// state.js — persisted progress: which trophies are ticked, plus the spoiler toggle.
// Everything lives in localStorage so progress survives reloads; export/import are JSON blobs.

const KEY = 'viceguide.gta6.progress';
const SPOILER_KEY = 'viceguide.gta6.spoiler';

/** Load the set of earned trophy names. Always returns a Set. */
export function loadEarned() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

/** Persist the earned set. */
export function saveEarned(earned) {
  localStorage.setItem(KEY, JSON.stringify([...earned].sort()));
}

/** Replace the earned set from an imported JSON blob. Throws on malformed input. */
export function importEarned(text) {
  const value = JSON.parse(text);
  const names = Array.isArray(value) ? value : value?.earned;
  if (!Array.isArray(names)) throw new Error('not a list of trophy names');
  const clean = names.filter((x) => typeof x === 'string');
  const set = new Set(clean);
  saveEarned(set);
  return set;
}

/** The exported JSON: an array of earned names under a stable envelope. */
export function exportEarned(earned) {
  return JSON.stringify({ app: 'vice-guide', game: 'Grand Theft Auto VI', earned: [...earned].sort() }, null, 2);
}

/** Load the spoiler toggle (default: on, to protect hidden story trophies). */
export function loadSpoiler() {
  try {
    return localStorage.getItem(SPOILER_KEY) !== '0';
  } catch {
    return true;
  }
}

export function saveSpoiler(on) {
  localStorage.setItem(SPOILER_KEY, on ? '1' : '0');
}
