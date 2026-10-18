import { createApp } from './app.js';
import { messaging } from './fcm.js';
import { env } from './config/env.js';

const port = env.port;
createApp({ messaging }).listen(port, () => console.log(`FCM sender listening on :${port}`));
