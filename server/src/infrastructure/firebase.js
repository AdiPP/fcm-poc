// Infrastructure: Firebase Admin init. Only this module (and the re-export in fcm.js) touches Admin SDK.
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { env } from '../config/env.js';

const path = env.firebaseServiceAccountPath;
initializeApp({ credential: cert(JSON.parse(readFileSync(path, 'utf8'))) });

export const messaging = getMessaging();

export default { messaging };
