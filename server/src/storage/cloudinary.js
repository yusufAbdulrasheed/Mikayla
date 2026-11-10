import path from 'node:path';
import crypto from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';

const e = process.env;
if (!e.CLOUDINARY_URL) {
  cloudinary.config({ cloud_name: e.CLOUDINARY_CLOUD_NAME, api_key: e.CLOUDINARY_API_KEY, api_secret: e.CLOUDINARY_API_SECRET });
}
cloudinary.config({ secure: true });

const ROOT = e.CLOUDINARY_FOLDER || 'mikayla';
const RESOURCE = { image: 'image', video: 'video', doc: 'raw' };

const safeBase = (name) =>
  path.basename(name, path.extname(name)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'file';

const promisify = (fn) => new Promise((resolve, reject) => fn((err, res) => (err ? reject(err) : resolve(res))));

function friendly(err) {
  const inner = err?.error && typeof err.error === 'object' ? err.error : err;
  const text = typeof inner?.message === 'string' ? inner.message : typeof err === 'string' ? err : '';
  const code = inner?.http_code ?? err?.http_code;
  const probe = `${text} ${inner?.code || err?.code || ''}`;
  if (code === 401 || code === 403 || /invalid (api[_ ]?key|signature|cloud)|api_secret|must supply|cloud_name|api_key|unknown api key/i.test(probe)) {
    return new Error('Cloudinary rejected the login. Check the API keys in server/.env.');
  }
  if (/file size too large|too large|maximum is/i.test(probe)) {
    return new Error('That file is bigger than your Cloudinary plan allows. Try a smaller file, or upload a video to YouTube and paste the link.');
  }
  if (code === 420 || /rate limit/i.test(probe)) return new Error('Cloudinary is busy right now. Please try again in a minute.');
  if (/ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|network|socket/i.test(probe)) return new Error('Could not reach Cloudinary. Check the internet connection and try again.');
  return new Error(text ? `Cloudinary upload failed: ${text.slice(0, 200)}` : 'Cloudinary upload failed. Please try again.');
}

export const cloud = {
  provider: 'cloudinary',

  async ready() {
    try { await cloudinary.api.ping(); return { connected: true }; } catch (err) { return { connected: false, error: friendly(err).message }; }
  },

  async save(file, kind) {
    const resource_type = RESOURCE[kind];
    const base = `${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}-${safeBase(file.originalname)}`;
    const public_id = `${ROOT}/${kind}/${base}${kind === 'doc' ? path.extname(file.originalname).toLowerCase() : ''}`;
    const options = { resource_type, public_id, overwrite: false, unique_filename: false, use_filename: false };
    try {
      const res = await promisify((cb) => (file.size > 20 * 1024 * 1024
        ? cloudinary.uploader.upload_large(file.path, { ...options, chunk_size: 6 * 1024 * 1024 }, cb)
        : cloudinary.uploader.upload(file.path, options, cb)));
      return { url: res.secure_url, id: res.public_id, size: res.bytes ?? file.size };
    } catch (err) {
      throw friendly(err);
    }
  },

  async list() {
    const out = [];
    try {
      for (const [kind, resource_type] of Object.entries(RESOURCE)) {
        let next;
        do {
          const page = await cloudinary.api.resources({ resource_type, type: 'upload', prefix: `${ROOT}/${kind}/`, max_results: 100, next_cursor: next });
          for (const r of page.resources) {
            out.push({
              kind,
              id: r.public_id,
              name: r.public_id.split('/').pop(),
              url: r.secure_url,
              size: r.bytes,
              uploadedAt: r.created_at,
            });
          }
          next = page.next_cursor;
        } while (next && out.length < 2000);
      }
    } catch (err) {
      throw friendly(err);
    }
    return out;
  },

  async remove(kind, id) {
    if (!RESOURCE[kind] || !String(id).startsWith(`${ROOT}/${kind}/`)) return false;
    try {
      const res = await cloudinary.uploader.destroy(id, { resource_type: RESOURCE[kind], invalidate: true });
      return res.result === 'ok';
    } catch (err) {
      throw friendly(err);
    }
  },
};

