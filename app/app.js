// app.js — entry point: wires state, filters, views and the detail panel together.
// Loads the trophy data via a static import (trophies.js), never fetch(), so it works offline.

import { trophies, keyOf, matchesQuery, GRADE_ORDER, GRADE_LABEL, KIND_ORDER, KIND_LABEL } from './trophies.js';
import { loadEarned, saveEarned, importEarned, exportEarned, loadSpoiler, saveSpoiler } from './state.js';
import { trophyRow, detailPanel, progressBar, filterChips } from './render.js';
import { renderRoadmap, renderMissables } from './roadmap.js';

// --- live state ---
let earned = loadEarned();
let spoilerOn = loadSpoiler();
let view = 'checklist';
let selectedName = null;
const kindFilter = new Set();
const gradeFilter = new Set();
let query = '';

// --- element refs ---
const $ = (id) => document.getElementById(id);
const checklistView = $('checklist-view');
const roadmapView = $('roadmap-view');
const missablesView = $('missables-view');
const detailEl = $('detail');
const searchInput = $('search');
const spoilerInput = $('spoiler');
const kindFilters = $('kind-filters');
const gradeFilters = $('grade-filters');
const exportBtn = $('export');
const importInput = $('import');

// --- helpers ---
function visibleTrophies() {
  return trophies.filter((t) => {
    if (kindFilter.size > 0 && !kindFilter.has(t.kind)) return false;
    if (gradeFilter.size > 0 && !gradeFilter.has(t.grade)) return false;
    if (!matchesQuery(t, query)) return false;
    return true;
  });
}

function setView(v) {
  view = v;
  for (const [key, node] of [['checklist', checklistView], ['roadmap', roadmapView], ['missables', missablesView]]) {
    node.classList.toggle('hidden', key !== v);
  }
  for (const btn of document.querySelectorAll('.viewtabs button')) {
    btn.classList.toggle('active', btn.dataset.view === v);
  }
}

function render() {
  const visible = visibleTrophies();
  progressBar(earned, visible);

  if (view === 'checklist') {
    checklistView.replaceChildren();
    if (visible.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'No trophies match the current filters.';
      checklistView.append(empty);
    }
    for (const t of visible) {
      checklistView.append(trophyRow(t, {
        earned,
        spoilerOn,
        selectedName,
        onToggle: (trophy, checked) => toggleEarned(trophy, checked),
        onSelect: selectTrophy,
      }));
    }
  } else if (view === 'roadmap') {
    renderRoadmap(roadmapView, { earned, spoilerOn, onSelect: selectTrophy });
  } else if (view === 'missables') {
    renderMissables(missablesView, { earned, spoilerOn, onSelect: selectTrophy });
  }

  renderDetail();
}

function toggleEarned(t, checked) {
  const key = keyOf(t);
  if (checked) earned.add(key);
  else earned.delete(key);
  saveEarned(earned);
  if (selectedName === key) selectedName = key; // keep selection
  render();
}

function selectTrophy(t) {
  selectedName = keyOf(t);
  // switch to checklist view so the detail panel's subject is visible in context
  if (view !== 'checklist') setView('checklist');
  render();
  // scroll the selected row into view without losing the panel
  const row = checklistView.querySelector(`[data-name="${CSS.escape(selectedName)}"]`);
  if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function renderDetail() {
  const t = selectedName ? trophies.find((x) => keyOf(x) === selectedName) ?? null : null;
  detailEl.replaceChildren(detailPanel(t, { earned, spoilerOn }));
}

// --- filters ---
function toggleSet(set, v) {
  if (set.has(v)) set.delete(v);
  else set.add(v);
}

function renderFilterChips() {
  filterChips(kindFilters,
    KIND_ORDER.map((k) => ({ value: k, label: KIND_LABEL[k], cls: `k-${k}` })),
    kindFilter,
    (v) => { toggleSet(kindFilter, v); renderFilterChips(); render(); });
  filterChips(gradeFilters,
    GRADE_ORDER.map((g) => ({ value: g, label: GRADE_LABEL[g], cls: `g-${g}` })),
    gradeFilter,
    (v) => { toggleSet(gradeFilter, v); renderFilterChips(); render(); });
}

searchInput.addEventListener('input', () => {
  query = searchInput.value;
  render();
});

spoilerInput.checked = spoilerOn;
spoilerInput.addEventListener('change', () => {
  spoilerOn = spoilerInput.checked;
  saveSpoiler(spoilerOn);
  render();
});

// --- view tabs ---
for (const btn of document.querySelectorAll('.viewtabs button')) {
  btn.addEventListener('click', () => setView(btn.dataset.view));
}

// --- deep linking (shareable state): #roadmap | #missables | #checklist | #trophy=<name> ---
// A `#demo` prefix seeds a few earned trophies in memory only (never persisted), so a fresh
// screenshot or share shows realistic progress without touching the visitor's save.
const DEMO_EARNED = [
  'Just Like Paradise', 'Paradise Lost', 'T**s Ass Drug Money', 'Trust', 'Break the Bank',
  'Master of None', 'Whip It Good', 'The Goodtime State',
];

function applyHash() {
  let hash = location.hash.replace(/^#/, '');
  // A `demo+` prefix seeds a few earned trophies in memory only (never persisted).
  if (hash.startsWith('demo+')) {
    for (const name of DEMO_EARNED) if (trophies.some((x) => x.name === name)) earned.add(name);
    hash = hash.slice('demo+'.length);
  } else if (hash === 'demo') {
    for (const name of DEMO_EARNED) if (trophies.some((x) => x.name === name)) earned.add(name);
    hash = 'checklist';
  }
  if (hash === 'roadmap' || hash === 'missables' || hash === 'checklist') {
    setView(hash);
    return;
  }
  if (hash.startsWith('trophy=')) {
    const name = decodeURIComponent(hash.slice('trophy='.length));
    const t = trophies.find((x) => x.name === name);
    if (t) {
      selectedName = keyOf(t);
      if (view !== 'checklist') setView('checklist');
      return;
    }
  }
  setView('checklist');
}
applyHash();
window.addEventListener('hashchange', applyHash);

// --- export / import ---
exportBtn.addEventListener('click', () => {
  const blob = new Blob([exportEarned(earned)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

importInput.addEventListener('change', async () => {
  const file = importInput.files?.[0];
  if (!file) return;
  try {
    earned = importEarned(await file.text());
  } catch (err) {
    alert(`Could not import: ${err.message}`);
  }
  importInput.value = '';
  render();
});

// --- first paint ---
renderFilterChips();
render();
