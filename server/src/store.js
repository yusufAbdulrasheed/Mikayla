import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Doc from './models/Doc.js';
import { paths } from './config.js';
import { defaultSettings, defaultCollections } from './data/defaults.js';

const FILE = path.join(paths.data, 'db.json');
const useDb = () => mongoose.connection.readyState === 1;
const newId = () => crypto.randomUUID();

let mem = null;
function load() {
  if (mem) return mem;
  try { mem = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { mem = {}; }
  mem.cols ||= {};
  mem.meta ||= {};
  mem.settings ||= null;
  return mem;
}
let writing = Promise.resolve();
function persist() {
  writing = writing
    .then(async () => {
      const tmp = `${FILE}.tmp`;
      await fsp.writeFile(tmp, JSON.stringify(mem, null, 2));
      await fsp.rename(tmp, FILE);
    })
    .catch((e) => console.error('Could not save content:', e.message));
  return writing;
}

const flat = (d) => ({ ...d.data, id: d.id, order: d.order, createdAt: d.createdAt, updatedAt: d.updatedAt });
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

async function seedIfNeeded(col) {
  if (!(col in defaultCollections)) return;
  const metaKey = `seeded:${col}`;
  if (await getMeta(metaKey)) return;
  await setMeta(metaKey, true);
  if ((await rawList(col)).length) return;
  for (const item of defaultCollections[col]) await create(col, structuredClone(item), { skipSeed: true });
}

async function rawList(col) {
  if (useDb()) {
    const docs = await Doc.find({ col }).sort({ order: 1, createdAt: 1 }).lean();
    return docs.map(flat);
  }
  return [...(load().cols[col] || [])].sort(byOrder);
}

export async function list(col) {
  await seedIfNeeded(col);
  return rawList(col);
}

export async function get(col, id) {
  await seedIfNeeded(col);
  if (useDb()) {
    const d = await Doc.findOne({ col, id }).lean();
    return d ? flat(d) : null;
  }
  return (load().cols[col] || []).find((x) => x.id === id) || null;
}

export async function create(col, data, opts = {}) {
  if (!opts.skipSeed) await seedIfNeeded(col);
  const items = await rawList(col);
  const order = items.length ? Math.max(...items.map((i) => i.order ?? 0)) + 1 : 0;
  const id = newId();
  const now = new Date().toISOString();
  if (useDb()) {
    const d = await Doc.create({ col, id, order, data });
    return flat(d.toObject());
  }
  const item = { ...data, id, order, createdAt: now, updatedAt: now };
  (load().cols[col] ||= []).push(item);
  await persist();
  return item;
}

export async function update(col, id, patch) {
  if (useDb()) {
    const d = await Doc.findOne({ col, id });
    if (!d) return null;
    d.data = { ...d.data, ...patch };
    d.markModified('data');
    await d.save();
    return flat(d.toObject());
  }
  const item = (load().cols[col] || []).find((x) => x.id === id);
  if (!item) return null;
  Object.assign(item, patch, { updatedAt: new Date().toISOString() });
  await persist();
  return item;
}

export async function remove(col, id) {
  if (useDb()) return (await Doc.deleteOne({ col, id })).deletedCount > 0;
  const arr = load().cols[col] || [];
  const i = arr.findIndex((x) => x.id === id);
  if (i < 0) return false;
  arr.splice(i, 1);
  await persist();
  return true;
}

export async function reorder(col, ids) {
  if (useDb()) {
    await Promise.all(ids.map((id, i) => Doc.updateOne({ col, id }, { order: i })));
    return;
  }
  const arr = load().cols[col] || [];
  ids.forEach((id, i) => { const it = arr.find((x) => x.id === id); if (it) it.order = i; });
  await persist();
}

export async function getSettingsRaw() {
  if (useDb()) {
    const d = await Doc.findOne({ col: 'settings', id: 'main' }).lean();
    return d?.data || null;
  }
  return load().settings;
}

export async function saveSettings(data) {
  if (useDb()) {
    await Doc.updateOne({ col: 'settings', id: 'main' }, { $set: { data }, $setOnInsert: { order: 0 } }, { upsert: true });
    return;
  }
  load().settings = data;
  await persist();
}

export async function getMeta(key) {
  if (useDb()) {
    const d = await Doc.findOne({ col: 'meta', id: key }).lean();
    return d?.data?.value ?? null;
  }
  return load().meta[key] ?? null;
}

export async function setMeta(key, value) {
  if (useDb()) {
    await Doc.updateOne({ col: 'meta', id: key }, { $set: { data: { value } }, $setOnInsert: { order: 0 } }, { upsert: true });
    return;
  }
  load().meta[key] = value;
  await persist();
}

export async function allContentJson() {
  const parts = [JSON.stringify(await getSettingsRaw())];
  for (const col of Object.keys(defaultCollections)) if (col !== 'messages') parts.push(JSON.stringify(await rawList(col)));
  return parts.join('\n');
}

export async function resetToDefaults() {
  for (const col of Object.keys(defaultCollections)) {
    if (col === 'messages') continue;
    if (useDb()) await Doc.deleteMany({ col });
    else load().cols[col] = [];
    await setMeta(`seeded:${col}`, false);
  }
  await saveSettings(structuredClone(defaultSettings));
  if (!useDb()) await persist();
}
