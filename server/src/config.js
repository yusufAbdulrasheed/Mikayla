import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const envFile = path.join(root, '.env');
dotenv.config({ path: envFile });

const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(root, 'data');
export const paths = {
  root,
  data: dataDir,
  tmp: path.join(dataDir, 'tmp'),
  uploads: process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.join(root, 'uploads'),
  env: envFile,
};
fs.mkdirSync(paths.data, { recursive: true });
fs.mkdirSync(paths.tmp, { recursive: true });
for (const k of ['image', 'video', 'doc']) fs.mkdirSync(path.join(paths.uploads, k), { recursive: true });

export const generated = {};
function ensureSecret(name, make) {
  if (process.env[name]) return;
  const value = make();
  process.env[name] = value;
  generated[name] = value;
  try { fs.appendFileSync(paths.env, `${fs.existsSync(paths.env) ? '\n' : ''}${name}=${value}\n`); } catch { }
}
ensureSecret('SESSION_SECRET', () => crypto.randomBytes(32).toString('hex'));
ensureSecret('ADMIN_PASSWORD', () => {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const group = () => Array.from({ length: 4 }, () => chars[crypto.randomInt(chars.length)]).join('');
  return `${group()}-${group()}-${group()}-${group()}`;
});

const e = process.env;
export const cloudinaryEnabled = Boolean(e.CLOUDINARY_URL || (e.CLOUDINARY_CLOUD_NAME && e.CLOUDINARY_API_KEY && e.CLOUDINARY_API_SECRET));

const mb = (name, local, cloud) => Number(e[name] || (cloudinaryEnabled ? cloud : local)) * 1024 * 1024;

export const config = {
  port: Number(e.PORT) || 5001,
  sessionSecret: e.SESSION_SECRET,
  adminPassword: e.ADMIN_PASSWORD,
  limits: {
    image: mb('MAX_IMAGE_MB', 15, 10),
    video: mb('MAX_VIDEO_MB', 500, 100),
    doc: mb('MAX_DOC_MB', 80, 10),
  },
};
