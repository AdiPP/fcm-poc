// Firebase Admin init. Importing this module requires a valid service account file,
// so the app factory (app.js) never imports it — only index.js does at startup.
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? './serviceAccount.json';
initializeApp({ credential: cert(JSON.parse(readFileSync(path, 'utf8'))) });

export const messaging = getMessaging();
