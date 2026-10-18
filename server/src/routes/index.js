import { Router } from 'express';

export function createRoutes({ tokenController, subscriptionController, sendController, devAuth }) {
  const router = Router();
  router.post('/register-token', tokenController.registerToken);
  router.post('/subscribe', devAuth, subscriptionController.subscribe);
  router.post('/send', devAuth, sendController.send);
  router.get('/tokens', tokenController.getTokens);
  return router;
}

export default createRoutes;
