import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import * as store from './store.js';

const COOKIE = 'mk_admin';
const WEEK = 7 * 24 * 60 * 60 * 1000;

const sha = (s) => crypto.createHash('sha256').update(s).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}
function checkHash(pw, stored) {
  const [, salt, hash] = String(stored).split('$');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(pw, salt, 64);
  const real = Buffer.from(hash, 'hex');
  return test.length === real.length && crypto.timingSafeEqual(test, real);
}

export async function verifyPassword(pw) {
  const stored = await store.getMeta('adminPasswordHash');
  return stored ? checkHash(pw, stored) : safeEqual(pw, config.adminPassword);
}
export async function setPassword(pw) {
  await store.setMeta('adminPasswordHash', hashPassword(pw));
}

export function startSession(req, res) {
  const token = jwt.sign({ role: 'admin' }, config.sessionSecret, { expiresIn: '7d' });
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: req.secure, maxAge: WEEK, path: '/' });
  return token;
}
export const endSession = (res) => res.clearCookie(COOKIE, { path: '/' });

export function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.[COOKIE] || '';
    jwt.verify(token, config.sessionSecret);
    next();
  } catch {
    res.status(401).json({ error: 'Please sign in.' });
  }
}

export function rateLimiter(max, windowMs) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const recent = (hits.get(req.ip) || []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(req.ip, recent);
    if (recent.length > max) return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
    next();
  };
}
