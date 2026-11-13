import { defaultSettings } from './data/defaults.js';
import * as store from './store.js';

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

function merge(base, over) {
  if (!isObj(base) || !isObj(over)) return over === undefined ? base : over;
  const out = { ...base };
  for (const k of Object.keys(over)) out[k] = k in base ? merge(base[k], over[k]) : over[k];
  return out;
}

export async function getSettings() {
  const saved = { ...((await store.getSettingsRaw()) || {}) };
  const a = saved.analytics;
  if (a && !a.ranges) {
    const d30 = {};
    for (const p of ['instagram', 'tiktok', 'x', 'medium']) {
      const { views = 0, likes = 0, comments = 0 } = a[p] || {};
      d30[p] = { views, likes, comments, gained: 0 };
    }
    saved.analytics = { ...a, ranges: { d30 } };
  }
  return merge(structuredClone(defaultSettings), saved);
}
