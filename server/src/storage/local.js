import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { paths } from '../config.js';

const KINDS = ['image', 'video', 'doc'];
const safeBase = (name) =>
  path.basename(name, path.extname(name)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'file';

export const local = {
  provider: 'local',

  async ready() { return { connected: true }; },

  async save(file, kind) {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}-${safeBase(file.originalname)}${ext}`;
    await fs.rename(file.path, path.join(paths.uploads, kind, name));
    return { url: `/uploads/${kind}/${name}`, id: name, size: file.size };
  },

  async list() {
    const out = [];
    for (const kind of KINDS) {
      const dir = path.join(paths.uploads, kind);
      for (const name of await fs.readdir(dir).catch(() => [])) {
        const st = await fs.stat(path.join(dir, name)).catch(() => null);
        if (!st?.isFile()) continue;
        out.push({ kind, id: name, name, url: `/uploads/${kind}/${name}`, size: st.size, uploadedAt: st.mtime.toISOString() });
      }
    }
    return out;
  },

  async remove(kind, id) {
    if (!KINDS.includes(kind) || id !== path.basename(id)) return false;
    try { await fs.unlink(path.join(paths.uploads, kind, id)); return true; } catch { return false; }
  },
};
