// roadmap.js — the roadmap and missables views, built from the trophy list's stage and missable data.

import { trophies, stages, keyOf, isSpoiled, GRADE_LABEL } from './trophies.js';
import { gradeBadge } from './render.js';

const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};

/** The full platinum roadmap: one stage per roadmapStage order. */
export function renderRoadmap(container, { earned, spoilerOn, onSelect }) {
  container.replaceChildren();

  const head = el('div', 'list-head');
  head.append(el('h2', null, 'Roadmap to the platinum'));
  head.append(el('span', 'count', '4 stages · about 200 hours'));
  container.append(head);

  const byStage = new Map();
  for (const t of trophies) {
    const order = t.roadmapStage?.order ?? 99;
    if (!byStage.has(order)) byStage.set(order, []);
    byStage.get(order).push(t);
  }

  const sortedStages = stages.slice().sort((a, b) => a.order - b.order);

  for (const stage of sortedStages) {
    const list = byStage.get(stage.order) ?? [];
    if (list.length === 0) continue;

    const sec = el('section', 'stage');
    const headRow = el('div', 'stage-head');
    headRow.append(el('span', 'stage-num', String(stage.order)));
    headRow.append(el('h3', null, stage.label));
    sec.append(headRow);

    if (stage.note) sec.append(el('p', 'stage-note', stage.note));

    const chips = el('div', 'stage-trophies');
    for (const t of list) {
      const key = keyOf(t);
      const done = earned.has(key);
      const chip = el('button', 'st-trophy' + (done ? ' earned' : ''));
      chip.type = 'button';
      chip.append(gradeBadge(t.grade));
      chip.append(document.createTextNode(' '));
      const name = isSpoiled(t, earned, spoilerOn) ? 'Hidden trophy' : t.name;
      chip.append(el('span', null, name));
      chip.addEventListener('click', () => onSelect(t));
      chips.append(chip);
    }
    sec.append(chips);
    container.append(sec);
  }
}

/** The missables view: every missable trophy with its missableNote front and centre. */
export function renderMissables(container, { earned, spoilerOn, onSelect }) {
  container.replaceChildren();

  const head = el('div', 'list-head');
  head.append(el('h2', null, 'Missable trophies'));
  head.append(el('span', 'count', `${trophies.filter((t) => t.missable).length} flagged`));
  container.append(head);

  const note = el('div', 'missable-note');
  note.append(el('b', null, 'One trophy is potentially missable: '));
  note.append(document.createTextNode('Positive Mental Attitude, because of an unmarked Chapter 1 meditation at Jason\u2019s house. Everything else can be done after the story, and nothing toward 100% completion is missable.'));
  container.append(note);

  const missables = trophies.filter((t) => t.missable);
  for (const t of missables) {
    const key = keyOf(t);
    const done = earned.has(key);
    const card = el('div', 'trophy' + (done ? ' earned' : ''));
    card.dataset.name = key;

    const box = el('input');
    box.type = 'checkbox';
    box.checked = done;
    box.disabled = true;

    const main = el('div', 'main');
    main.append(el('div', 'name', t.name));
    main.append(el('div', 'desc', t.description));

    const when = el('div', 'd-missable');
    when.append(el('b', null, 'When it can be missed: '));
    when.append(document.createTextNode(t.missableNote));
    main.append(when);

    card.append(box, gradeBadge(t.grade), main);
    card.addEventListener('click', () => onSelect(t));
    container.append(card);
  }

  const safe = el('p', 'empty', 'That\u2019s the complete list. Save early, save often, and keep a manual save at the start of each chapter.');
  container.append(safe);
}
