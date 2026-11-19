// trophies.js — data access and pure helpers over the imported trophy list.
// The data itself lives in app/data/trophies.js, generated from trophies.json.

import { TROPHIES, STAGES } from './data/trophies.js';

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
export const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
export const KIND_ORDER = ['story', 'missable', 'collectibles', 'activities', 'online'];
export const KIND_LABEL = { story: 'Story', missable: 'Missable', collectibles: 'Collectibles', activities: 'Activities', online: 'Online' };

export const trophies = TROPHIES;
export const stages = STAGES;

/** A stable key for a trophy: its official name. */
export const keyOf = (t) => t.name;

export function byName(name) {
  return TROPHIES.find((t) => t.name === name) ?? null;
}

/** Grade badges in fixed order with counts over the given list. */
export function gradeTotals(list) {
  const out = {};
  for (const g of GRADE_ORDER) out[g] = 0;
  for (const t of list) out[t.grade] += 1;
  return out;
}

/** Whether a trophy's story content should be hidden under the spoiler setting. */
export function isSpoiled(t, earned, spoilerOn) {
  return spoilerOn && t.hidden && !earned.has(keyOf(t));
}

/** Normalize text for case-insensitive search. */
export function normalize(s) {
  return (s ?? '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Match a trophy against the search query across its name, description, guide and mission names.
 * Returns true when every whitespace-separated term matches somewhere.
 */
export function matchesQuery(t, query) {
  const q = normalize(query).trim();
  if (q === '') return true;
  const hay = normalize([t.name, t.description, t.guide, t.missableNote, t.roadmapStage?.label].join(' '));
  return q.split(/\s+/).every((term) => hay.includes(term));
}
