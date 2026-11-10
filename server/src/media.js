import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { config, paths } from './config.js';
import { storage } from './storage/index.js';
import * as store from './store.js';
import { localRefs } from './migrate.js';

export const KINDS = {
  image: { ext: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'], mime: /^image\/(jpeg|png|webp|gif|avif)$/ },
  video: { ext: ['.mp4', '.webm', '.mov', '.m4v'], mime: /^video\/(mp4|webm|quicktime|x-m4v)$/ },
  doc: { ext: ['.pdf', '.epub'], mime: /^application\/(pdf|epub\+zip)$/ },
};

function uploaderFor(kind) {
  const rule = KINDS[kind];
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, paths.tmp),
      filename: (_req, file, cb) => cb(null, `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
    }),
    limits: { fileSize: config.limits[kind], files: 1 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!rule.ext.includes(ext) || !rule.mime.test(file.mimetype)) {
        return cb(new Error(`That file type isn't allowed here. Use: ${rule.ext.join(', ')}`));
      }
      cb(null, true);
    },
  }).single('file');
}
const uploaders = Object.fromEntries(Object.keys(KINDS).map((k) => [k, uploaderFor(k)]));

const dropTemp = (file) => (file?.path ? fs.unlink(file.path).catch(() => {}) : Promise.resolve());

export function handleUpload(req, res) {
  const kind = String(req.query.kind || '');
  if (!uploaders[kind]) return res.status(400).json({ error: 'Unknown upload type.' });
  uploaders[kind](req, res, async (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE'
        ? `That file is too big (limit ${Math.round(config.limits[kind] / 1024 / 1024)} MB).`
        : err.message || 'Upload failed.';
      return res.status(400).json({ error: msg });
    }
    if (!req.file) return res.status(400).json({ error: 'No file received.' });
    try {
      const saved = await storage.save(req.file, kind);
      res.status(201).json({ url: saved.url, id: saved.id, name: path.basename(saved.id), kind, size: saved.size });
    } catch (e) {
      res.status(502).json({ error: e.message || 'Upload failed.' });
    } finally {
      await dropTemp(req.file);
    }
  });
}

export async function listMedia() {
  const used = await store.allContentJson();
  const files = await storage.list();
  return files.map((f) => ({ ...f, inUse: used.includes(f.url) })).sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)));
}

export const deleteMedia = (kind, id) => storage.remove(kind, id);

export async function storageStatus() {
  const state = await storage.ready();
  const limits = Object.fromEntries(Object.entries(config.limits).map(([k, v]) => [k, Math.round(v / 1024 / 1024)]));
  const localFiles = storage.provider === 'cloudinary' ? (await localRefs()).length : 0;
  return { provider: storage.provider, ...state, limits, localFiles };
}

export async function cleanTemp() {
  for (const name of await fs.readdir(paths.tmp).catch(() => [])) {
    const file = path.join(paths.tmp, name);
    const st = await fs.stat(file).catch(() => null);
    if (st?.isFile() && Date.now() - st.mtimeMs > 60 * 60 * 1000) await fs.unlink(file).catch(() => {});
  }
}
