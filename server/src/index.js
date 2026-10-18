import { createApp } from './app.js';
import { messaging } from './fcm.js';

const port = Number(process.env.PORT ?? 3000);
createApp({ messaging }).listen(port, () => console.log(`FCM sender listening on :${port}`));
