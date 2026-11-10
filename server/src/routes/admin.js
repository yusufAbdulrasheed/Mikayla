import { Router } from 'express';
import * as store from '../store.js';
import { getSettings } from '../settings.js';
import { settingsSchema, collections, clean, slugify, ValidationError } from '../schemas.js';
import { endSession, rateLimiter, requireAdmin, setPassword, startSession, verifyPassword } from '../auth.js';
import { deleteMedia, handleUpload, listMedia, storageStatus } from '../media.js';
import { broadcast } from '../events.js';
import { migrateLocalToCloud } from '../migrate.js';

const router = Router();

router.post('/login', rateLimiter(8, 10 * 60 * 1000), async (req, res, next) => {
  try {
    const pw = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!pw || !(await verifyPassword(pw))) return res.status(401).json({ error: 'That password isn’t right.' });
    const token = startSession(req, res);
    res.json({ ok: true, token });
  } catch (e) { next(e); }
});
router.post('/logout', (_req, res) => { endSession(res); res.json({ ok: true }); });

router.use(requireAdmin);

router.get('/me', (_req, res) => res.json({ ok: true }));

router.post('/password', async (req, res, next) => {
  try {
    const { current, next: next1 } = req.body || {};
    if (typeof next1 !== 'string' || next1.length < 10) return res.status(400).json({ error: 'Use at least 10 characters for the new password.' });
    if (!(await verifyPassword(String(current || '')))) return res.status(401).json({ error: 'Your current password isn’t right.' });
    await setPassword(next1);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/stats', async (_req, res, next) => {
  try {
    const [posts, services, gallery, videos, books, messages] = await Promise.all(
      ['posts', 'services', 'gallery', 'videos', 'books', 'messages'].map((c) => store.list(c))
    );
    res.json({
      posts: posts.length, services: services.length, gallery: gallery.length, videos: videos.length, books: books.length,
      messages: messages.length, unread: messages.filter((m) => !m.read).length,
    });
  } catch (e) { next(e); }
});

router.get('/settings', async (_req, res, next) => {
  try { res.json(await getSettings()); } catch (e) { next(e); }
});
router.put('/settings', async (req, res, next) => {
  try {
    await store.saveSettings(clean(settingsSchema, req.body));
    broadcast('site');
    res.json(await getSettings());
  } catch (e) { next(e); }
});

const knownCollection = (req, res, next) => (collections[req.params.col] ? next() : res.status(404).json({ error: 'Unknown section.' }));

async function uniqueSlug(base, ignoreId) {
  const taken = new Set((await store.list('posts')).filter((p) => p.id !== ignoreId).map((p) => p.slug));
  let slug = slugify(base);
  for (let n = 2; taken.has(slug); n += 1) slug = `${slugify(base)}-${n}`;
  return slug;
}

function prepare(col, body) {
  const { schema, required } = collections[col];
  const data = clean(schema, body);
  const missing = required.filter((k) => !data[k]);
  if (missing.length) throw new ValidationError(`Please fill in: ${missing.join(', ')}.`);
  return data;
}

router.get('/c/:col', knownCollection, async (req, res, next) => {
  try {
    const items = await store.list(req.params.col);
    if (req.params.col === 'posts') items.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    res.json(items);
  } catch (e) { next(e); }
});

router.post('/c/:col', knownCollection, async (req, res, next) => {
  try {
    const { col } = req.params;
    const data = prepare(col, req.body);
    if (col === 'posts') data.slug = await uniqueSlug(data.slug || data.title);
    const item = await store.create(col, data);
    broadcast(col);
    res.status(201).json(item);
  } catch (e) { next(e); }
});

router.put('/c/:col/order', knownCollection, async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    await store.reorder(req.params.col, ids);
    broadcast(req.params.col);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.put('/c/:col/:id', knownCollection, async (req, res, next) => {
  try {
    const { col, id } = req.params;
    const data = prepare(col, req.body);
    if (col === 'posts') data.slug = await uniqueSlug(data.slug || data.title, id);
    const item = await store.update(col, id, data);
    if (!item) return res.status(404).json({ error: 'Not found.' });
    broadcast(col);
    res.json(item);
  } catch (e) { next(e); }
});

router.delete('/c/:col/:id', knownCollection, async (req, res, next) => {
  try {
    const ok = await store.remove(req.params.col, req.params.id);
    if (ok) broadcast(req.params.col);
    res.status(ok ? 200 : 404).json({ ok });
  } catch (e) { next(e); }
});

router.get('/messages', async (_req, res, next) => {
  try {
    const items = await store.list('messages');
    res.json(items.sort((a, b) => String(b.sentAt || b.createdAt).localeCompare(String(a.sentAt || a.createdAt))));
  } catch (e) { next(e); }
});
router.patch('/messages/:id', async (req, res, next) => {
  try {
    const item = await store.update('messages', req.params.id, { read: !!req.body?.read });
    res.status(item ? 200 : 404).json(item || { error: 'Not found.' });
  } catch (e) { next(e); }
});
router.delete('/messages/:id', async (req, res, next) => {
  try {
    const ok = await store.remove('messages', req.params.id);
    res.status(ok ? 200 : 404).json({ ok });
  } catch (e) { next(e); }
});

router.post('/upload', handleUpload);
router.get('/media', async (_req, res) => {
  try { res.json(await listMedia()); } catch (e) { res.status(502).json({ error: e.message }); }
});
router.delete('/media', async (req, res, next) => {
  try {
    const ok = await deleteMedia(String(req.query.kind || ''), String(req.query.id || ''));
    res.status(ok ? 200 : 404).json({ ok });
  } catch (e) { res.status(502).json({ error: e.message }); }
});
router.post('/migrate-media', async (_req, res) => {
  try {
    const result = await migrateLocalToCloud();
    if (result.moved) broadcast('all');
    res.json(result);
  } catch (e) { res.status(400).json({ error: e.message }); }
});
router.get('/storage', async (_req, res, next) => {
  try { res.json(await storageStatus()); } catch (e) { next(e); }
});

router.use((err, _req, res, next) => {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  next(err);
});

export default router;
