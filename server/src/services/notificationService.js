// Service: FCM orchestration + dead-token pruning. Owns INVALID_TOKEN_ERRORS.
import { createTokenRepository } from '../repositories/tokenRepository.js';

export const INVALID_TOKEN_ERRORS = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

export function createNotificationService({ messaging, tokens }) {
  const repo = createTokenRepository(tokens);

  return {
    registerToken(token) {
      repo.add(token);
    },

    async subscribeToTopic(token, topic) {
      await messaging.subscribeToTopic(token, topic);
    },

    async sendToToken({ token, title, body }) {
      try {
        const messageId = await messaging.send({ notification: { title, body }, token });
        return messageId;
      } catch (e) {
        if (INVALID_TOKEN_ERRORS.has(e.code)) {
          repo.delete(token);
          const err = new Error(`token invalid, removed from store (${e.code})`);
          err.status = 404;
          err.code = e.code;
          throw err;
        }
        const err = new Error(e.code ?? e.message);
        err.status = 502;
        err.code = e.code;
        throw err;
      }
    },

    async sendToTopic({ topic, title, body }) {
      try {
        const messageId = await messaging.send({ notification: { title, body }, topic });
        return messageId;
      } catch (e) {
        const err = new Error(e.code ?? e.message);
        err.status = 502;
        err.code = e.code;
        throw err;
      }
    },

    async sendBroadcast({ title, body }) {
      const list = repo.values();
      const results = await Promise.allSettled(
        list.map((t) => messaging.send({ notification: { title, body }, token: t })),
      );
      // prune dead tokens, mirroring the single-token rule
      list.forEach((t, i) => {
        const r = results[i];
        if (r.status === 'rejected' && INVALID_TOKEN_ERRORS.has(r.reason?.code)) {
          repo.delete(t);
        }
      });
      return {
        sent: results.filter((r) => r.status === 'fulfilled').length,
        failed: results.filter((r) => r.status === 'rejected').length,
      };
    },

    getTokenCount() {
      return repo.size();
    },
  };
}

export default createNotificationService;
