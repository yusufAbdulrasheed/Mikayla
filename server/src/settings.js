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
  const saved = await store.getSettingsRaw();
  return merge(structuredClone(defaultSettings), saved || {});
}
