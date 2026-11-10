import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { paths } from './config.js';
import { mongoOptions } from './db.js';
import Doc from './models/Doc.js';

const apply = process.argv.includes('--yes');
const force = process.argv.includes('--force');
const file = path.join(paths.data, 'db.json');
const hide = (s) => String(s).replace(/mongodb(\+srv)?:\/\/[^\s'"]+/gi, '<uri hidden>');

if (!process.env.MONGODB_URI) { console.error('Set MONGODB_URI in server/.env first.'); process.exit(1); }
if (!fs.existsSync(file)) { console.error(`No local content file at ${file}. Nothing to copy.`); process.exit(1); }
const local = JSON.parse(fs.readFileSync(file, 'utf8'));

const docs = [];
for (const [col, items] of Object.entries(local.cols || {})) {
  for (const { id, order, createdAt, updatedAt, ...data } of items) {
    docs.push({ col, id, order: order ?? 0, data, ...(createdAt && { createdAt: new Date(createdAt) }), ...(updatedAt && { updatedAt: new Date(updatedAt) }) });
  }
}
if (local.settings) docs.push({ col: 'settings', id: 'main', order: 0, data: local.settings });
for (const [key, value] of Object.entries(local.meta || {})) docs.push({ col: 'meta', id: key, order: 0, data: { value } });

const counts = docs.reduce((n, d) => ({ ...n, [d.col]: (n[d.col] || 0) + 1 }), {});
console.log('Local file contains:', JSON.stringify(counts));

try {
  await mongoose.connect(process.env.MONGODB_URI, mongoOptions());
  console.log(`Connected to MongoDB (database "${mongoose.connection.name}").`);
  const existing = await Doc.countDocuments();
  console.log(`Documents already in MongoDB: ${existing}`);

  if (!apply) {
    console.log('\nDry run only. Re-run with --yes to copy.');
  } else if (existing && !force) {
    console.error('\nMongoDB already has content, so I stopped to avoid mixing the two. Re-run with --yes --force to REPLACE it with the local file.');
    process.exitCode = 1;
  } else {
    if (existing) await Doc.deleteMany({});
    await Doc.insertMany(docs, { ordered: true });
    const after = await Doc.aggregate([{ $group: { _id: '$col', n: { $sum: 1 } } }]);
    console.log('Copied. MongoDB now contains:', JSON.stringify(Object.fromEntries(after.map((c) => [c._id, c.n]))));
  }
} catch (e) {
  console.error('Failed:', hide(e.message));
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
process.exit(process.exitCode || 0);
