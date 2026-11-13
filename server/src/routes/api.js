import { Router } from 'express';
import mongoose from 'mongoose';
import * as store from '../store.js';
import { getSettings } from '../settings.js';
import { rateLimiter } from '../auth.js';
import { currentRev, eventsHandler } from '../events.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const live = (items) => items.filter((i) => i.published !== false);
const byDateDesc = (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt);

router.get('/health', (_req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));

router.get('/events', eventsHandler);
router.get('/version', (_req, res) => res.json({ rev: currentRev() }));

router.get('/site', async (_req, res, next) => {
  try { res.json(await getSettings()); } catch (e) { next(e); }
});

router.get('/posts', async (_req, res, next) => {
  try {
    const posts = live(await store.list('posts')).sort(byDateDesc);
    res.json(posts.map(({ body, ...rest }) => rest));
  } catch (e) { next(e); }
});

router.get('/posts/:slug', async (req, res, next) => {
  try {
    const post = live(await store.list('posts')).find((p) => p.slug === req.params.slug);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (e) { next(e); }
});

router.get('/services', async (_req, res, next) => {
  try { res.json(await store.list('services')); } catch (e) { next(e); }
});
router.get('/gallery', async (_req, res, next) => {
  try { res.json(live(await store.list('gallery'))); } catch (e) { next(e); }
});
router.get('/videos', async (_req, res, next) => {
  try { res.json(live(await store.list('videos'))); } catch (e) { next(e); }
});
router.get('/books', async (_req, res, next) => {
  try { res.json(live(await store.list('books'))); } catch (e) { next(e); }
});

router.get('/reviews', async (_req, res, next) => {
  try {
    res.json(live(await store.list('reviews')).sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt)));
  } catch (e) { next(e); }
});

router.post('/contact', rateLimiter(5, 10 * 60 * 1000), async (req, res, next) => {
  try {
    const { name, email, subject, message, website } = req.body || {};
    if (website) return res.json({ ok: true });
    if (![name, email, message].every((v) => typeof v === 'string' && v.trim())) {
      return res.status(400).json({ error: 'Name, email and message are required.' });
    }
    if (!EMAIL_RE.test(email.trim())) return res.status(400).json({ error: 'Please enter a valid email.' });
    await store.create('messages', {
      name: name.trim().slice(0, 100),
      email: email.trim().toLowerCase().slice(0, 200),
      subject: typeof subject === 'string' ? subject.trim().slice(0, 150) : '',
      message: message.trim().slice(0, 4000),
      read: false,
      sentAt: new Date().toISOString(),
    });
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
