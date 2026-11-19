// render.js — DOM builders for the checklist, detail panel, progress and control chrome.
// Kept separate from app.js so each file has one clear job; everything here is pure-ish UI.

import { GRADE_ORDER, GRADE_LABEL, KIND_ORDER, KIND_LABEL, keyOf, isSpoiled, gradeTotals } from './trophies.js';

const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};

/** The small grade badge square used on each list row. */
export function gradeBadge(grade) {
  const b = el('span', `badge ${grade}`);
  b.textContent = grade[0].toUpperCase();
  b.title = GRADE_LABEL[grade];
  return b;
}

/** One row in the checklist. */
export function trophyRow(t, { earned, spoilerOn, selectedName, onToggle, onSelect }) {
  const key = keyOf(t);
  const done = earned.has(key);
  const spoiled = isSpoiled(t, earned, spoilerOn);

  const row = el('div', 'trophy' + (done ? ' earned' : '') + (selectedName === key ? ' selected' : ''));
  row.dataset.name = key;

  const box = el('input');
  box.type = 'checkbox';
  box.checked = done;
  box.setAttribute('aria-label', `mark ${t.name} earned`);
  box.addEventListener('click', (e) => e.stopPropagation());
  box.addEventListener('change', () => onToggle(t, box.checked));

  const main = el('div', 'main');
  if (spoiled) {
    main.append(el('div', 'name spoiled', 'Hidden trophy — tick it off to reveal'));
    main.append(el('div', 'desc', 'Earn it in-game to see its name and description here.'));
  } else {
    main.append(el('div', 'name', t.name));
    main.append(el('div', 'desc', t.description));
  }

  const flags = el('div', 'flags');
  if (t.missable) flags.append(el('span', 'flag missable', 'missable'));
  if (t.hidden) flags.append(el('span', 'flag hidden', 'hidden'));

  row.append(box, gradeBadge(t.grade), main, flags);
  row.addEventListener('click', () => onSelect(t));
  return row;
}

/** The sticky detail sidebar. */
export function detailPanel(t, { earned, spoilerOn }) {
  const panel = el('aside', 'detail');
  if (!t) {
    const empty = el('div', 'empty', 'Select a trophy to read its guide and sources.');
    panel.append(empty);
    return panel;
  }
  const key = keyOf(t);
  const done = earned.has(key);
  const spoiled = isSpoiled(t, earned, spoilerOn);

  const head = el('div', 'd-head');
  head.append(el('h3', null, spoiled ? 'Hidden trophy' : t.name));

  panel.append(head);
  panel.append(el('span', `grade-pill ${t.grade}`, GRADE_LABEL[t.grade]));

  if (spoiled) {
    panel.append(el('p', 'd-desc', 'This trophy is hidden until earned. Tick its checkbox (or earn it in-game) to reveal its name, description and guide.'));
  } else {
    panel.append(el('p', 'd-desc', t.description));

    const guide = el('div', 'd-section');
    guide.append(el('h4', null, 'Guide'));
    guide.append(el('p', 'd-guide', t.guide));
    panel.append(guide);

    if (t.missable && t.missableNote) {
      const m = el('div', 'd-missable');
      m.append(el('b', null, 'When it can be missed: '));
      m.append(document.createTextNode(t.missableNote));
      panel.append(m);
    }

    if (t.sources?.length) {
      const s = el('div', 'd-section');
      s.append(el('h4', null, 'Sources'));
      const ul = el('ul', 'd-sources');
      for (const src of t.sources) {
        const li = el('li');
        const a = el('a', null, src.name || src.url);
        a.href = src.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        li.append(a);
        ul.append(li);
      }
      s.append(ul);
      panel.append(s);
    }

    const meta = el('div', 'd-meta');
    meta.append(el('span', 'tag', KIND_LABEL[t.kind] ?? t.kind));
    if (t.hidden) meta.append(el('span', 'tag', 'hidden'));
    if (t.missable) meta.append(el('span', 'tag', 'missable'));
    if (t.roadmapStage?.label) meta.append(el('span', 'tag', `stage ${t.roadmapStage.order}: ${t.roadmapStage.label}`));
    panel.append(meta);
  }

  return panel;
}

/** The progress readout: label, percent bar and per-grade totals. */
export function progressBar(earned, totalList) {
  const earnedCount = [...earned].filter((n) => totalList.some((t) => t.name === n)).length;
  const total = totalList.length;
  const pct = total === 0 ? 0 : Math.round((earnedCount / total) * 100);

  const label = document.getElementById('progress-label');
  const pctEl = document.getElementById('progress-pct');
  const fill = document.getElementById('progress-fill');
  const totals = document.getElementById('grade-totals');

  label.textContent = `${earnedCount} / ${total} earned`;
  pctEl.textContent = `${pct}%`;
  fill.style.width = `${pct}%`;

  totals.replaceChildren();
  const perGrade = gradeTotals(totalList);
  const earnedByGrade = {};
  for (const g of GRADE_ORDER) earnedByGrade[g] = 0;
  for (const n of earned) {
    const t = totalList.find((x) => x.name === n);
    if (t) earnedByGrade[t.grade] += 1;
  }
  for (const g of GRADE_ORDER) {
    const span = el('span', g[0]);
    span.append(document.createTextNode(`${GRADE_LABEL[g]}: `));
    span.append(el('b', null, `${earnedByGrade[g]}/${perGrade[g]}`));
    totals.append(span);
  }
}

/** The kind and grade filter chips. */
export function filterChips(container, options, selected, onChange) {
  container.replaceChildren();
  for (const opt of options) {
    const chip = el('button', `chip ${opt.cls ?? ''}${selected.has(opt.value) ? ' active' : ''}`, opt.label);
    chip.type = 'button';
    chip.addEventListener('click', () => onChange(opt.value));
    container.append(chip);
  }
}
