// Composition root. Keeps createApp({ messaging, tokens, devSecret }) contract.
import express from 'express';
import { createTokenStore } from './models/tokenStore.js';
import { createDevAuth } from './middlewares/devAuth.js';
import { createNotificationService } from './services/notificationService.js';
import { createTokenController } from './controllers/tokenController.js';
import { createSubscriptionController } from './controllers/subscriptionController.js';
import { createSendController } from './controllers/sendController.js';
import { createRoutes } from './routes/index.js';
import { env } from './config/env.js';

export function createApp({ messaging, tokens = createTokenStore(), devSecret = env.devSecret }) {
  const app = express();
  app.use(express.json());

  const service = createNotificationService({ messaging, tokens });
  const devAuth = createDevAuth(devSecret);
  const tokenController = createTokenController(service);
  const subscriptionController = createSubscriptionController(service);
  const sendController = createSendController(service);

  app.use(createRoutes({ tokenController, subscriptionController, sendController, devAuth }));

  return app;
}

export default createApp;
