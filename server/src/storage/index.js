import { cloudinaryEnabled } from '../config.js';
import { local } from './local.js';
import { cloud } from './cloudinary.js';

export const storage = cloudinaryEnabled ? cloud : local;
