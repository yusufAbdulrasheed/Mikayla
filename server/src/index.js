import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { mongoOptions } from './db.js';
import { config, generated, paths } from './config.js';
import api from './routes/api.js';
import admin from './routes/admin.js';
import { cleanTemp, storageStatus } from './media.js';
import { startKeepAlive } from './keepAlive.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
const origins = (process.env.CLIENT_ORIGIN || '').split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true, maxAge: 86400 }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static(paths.uploads, { maxAge: '30d', immutable: true, index: false, fallthrough: true }));
app.use('/uploads', (_req, res) => res.sendStatus(404));

app.use('/api/admin', admin);
app.use('/api', api);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

const dist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong.' });
});

async function start() {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    try {
      await mongoose.connect(uri, mongoOptions(uri));
      console.log('MongoDB connected: content is stored in your database.');
    } catch (e) {
      console.warn('MongoDB connection failed, using the local file store instead:', e.message);
    }
  } else {
    console.log('No MONGODB_URI set: content is stored in server/data/db.json.');
  }

  const media = await storageStatus();
  if (media.provider === 'cloudinary') {
    console.log(media.connected ? 'Cloudinary connected: all photos, videos and files are stored there.' : `Cloudinary is configured but NOT reachable: ${media.error}`);
  } else {
    console.log('Media storage: local disk (server/uploads). Add Cloudinary keys to server/.env to store files in the cloud.');
  }
  cleanTemp();

  if (generated.ADMIN_PASSWORD) {
    const line = '='.repeat(58);
    console.log(`\n${line}\n  ADMIN LOGIN (first run)\n  Open  /admin   and sign in with:\n\n      ${generated.ADMIN_PASSWORD}\n\n  Saved in server/.env. You can change it inside the admin.\n${line}\n`);
  }
  app.listen(config.port, () => {
    console.log(`API running on http://localhost:${config.port}`);
    startKeepAlive();
  });
}

start();
