// Sender HTTP layer. messaging is injected so tests can stub FCM without credentials.
import express from 'express';

// Tokens FCM has told us are dead. Remove them from the store (spec: invalid-token handling).
const INVALID_TOKEN_ERRORS = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

export function createApp({ messaging, tokens = new Set(), devSecret = process.env.DEV_SECRET }) {
  const app = express();
  app.use(express.json());

  // In-memory token store: a Set, so re-registering the same token is a no-op (idempotent).
  app.post('/register-token', (req, res) => {
    const { token } = req.body ?? {};
    if (!token) return res.status(400).json({ error: 'token required' });
    tokens.add(token);
    res.json({ ok: true });
  });

  // D6: shared dev secret. An unset DEV_SECRET denies everything — never an open relay.
  const devAuth = (req, res, next) => {
    if (!devSecret || req.get('X-Dev-Secret') !== devSecret) {
      return res.status(401).json({ error: 'missing or wrong X-Dev-Secret' });
    }
    next();
  };

  // Stretch: subscribe a token to a topic so /send can broadcast to it.
  app.post('/subscribe', devAuth, async (req, res) => {
    const { token, topic } = req.body ?? {};
    if (!token || !topic) return res.status(400).json({ error: 'token and topic required' });
    try {
      await messaging.subscribeToTopic(token, topic);
      res.json({ ok: true });
    } catch (e) {
      res.status(502).json({ error: e.code ?? e.message });
    }
  });

  app.post('/send', devAuth, async (req, res) => {
    const { token, topic, title, body } = req.body ?? {};
    if (!title || !body) return res.status(400).json({ error: 'title and body required' });

    // No explicit target -> proposal: "or all registered tokens".
    if (!token && !topic) {
      const results = await Promise.allSettled(
        [...tokens].map((t) => messaging.send({ notification: { title, body }, token: t })),
      );
      return res.json({
        sent: results.filter((r) => r.status === 'fulfilled').length,
        failed: results.filter((r) => r.status === 'rejected').length,
      });
    }

    try {
      const messageId = await messaging.send({ notification: { title, body }, ...(topic ? { topic } : { token }) });
      res.json({ messageId });
    } catch (e) {
      if (token && INVALID_TOKEN_ERRORS.has(e.code)) {
        tokens.delete(token);
        return res.status(404).json({ error: `token invalid, removed from store (${e.code})` });
      }
      res.status(502).json({ error: e.code ?? e.message });
    }
  });

  app.get('/tokens', (req, res) => res.json({ count: tokens.size })); // debug peek for manual tests

  return app;
}
