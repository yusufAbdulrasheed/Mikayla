import fs from 'node:fs/promises';
import path from 'node:path';
import { paths } from './config.js';
import * as store from './store.js';
import { storage } from './storage/index.js';

const LOCAL = /^\/uploads\/(image|video|doc)\/([\w.-]+)$/;
const COLLECTIONS = ['posts', 'services', 'gallery', 'videos', 'books'];
const META = new Set(['id', 'order', 'createdAt', 'updatedAt']);

function collect(value, out) {
  if (typeof value === 'string') { if (LOCAL.test(value)) out.add(value); }
  else if (Array.isArray(value)) value.forEach((v) => collect(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collect(v, out));
  return out;
}

function swap(value, map) {
  if (typeof value === 'string') return map.get(value) ?? value;
  if (Array.isArray(value)) return value.map((v) => swap(v, map));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, swap(v, map)]));
  return value;
}

export async function localRefs() {
  const refs = new Set();
  collect(await store.getSettingsRaw(), refs);
  for (const col of COLLECTIONS) collect(await store.list(col), refs);
  return [...refs];
}

export async function migrateLocalToCloud() {
  if (storage.provider !== 'cloudinary') throw new Error('Cloudinary isn’t set up yet. Add the keys to server/.env first.');
  const map = new Map();
  const failed = [];

  for (const url of await localRefs()) {
    const [, kind, name] = url.match(LOCAL);
    try {
      const file = path.join(paths.uploads, kind, name);
      const { size } = await fs.stat(file);
      const original = name.replace(/^[a-z0-9]+-[a-f0-9]{8}-/, '');
      const saved = await storage.save({ path: file, originalname: original, size }, kind);
      map.set(url, saved.url);
    } catch (e) {
      failed.push({ file: name, error: e.code === 'ENOENT' ? 'file is missing on this computer' : e.message });
    }
  }

  if (map.size) {
    const settings = await store.getSettingsRaw();
    if (settings) await store.saveSettings(swap(settings, map));
    for (const col of COLLECTIONS) {
      for (const item of await store.list(col)) {
        const patch = {};
        for (const [k, v] of Object.entries(item)) {
          if (META.has(k)) continue;
          const next = swap(v, map);
          if (JSON.stringify(next) !== JSON.stringify(v)) patch[k] = next;
        }
        if (Object.keys(patch).length) await store.update(col, item.id, patch);
      }
    }
  }
  return { moved: map.size, failed };
}
