import mongoose from 'mongoose';
import { mongoOptions } from './db.js';
import './config.js';
import { resetToDefaults } from './store.js';

if (!process.argv.includes('--yes')) {
  console.error('This overwrites everything you have edited in /admin with the starter content.\nRun again with --yes to confirm:  npm run seed -- --yes');
  process.exit(1);
}

if (process.env.MONGODB_URI) await mongoose.connect(process.env.MONGODB_URI, mongoOptions());
await resetToDefaults();
console.log('Content reset to the starter defaults.');
if (mongoose.connection.readyState === 1) await mongoose.disconnect();
setTimeout(() => process.exit(0), 300);
