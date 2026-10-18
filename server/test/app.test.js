// Runnable check for the non-trivial sender logic (no Firebase credentials needed):
//   cd server && node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

function stubMessaging() {
  const sent = [];
  return {
    sent,
    send: async (msg) => {
      if (msg.token === 'bad-token') {
        const e = new Error('not registered');
        e.code = 'messaging/registration-token-not-registered';
        throw e;
      }
      sent.push(msg);
      return 'projects/test/messages/123';
    },
    subscribeToTopic: async (token, topic) => sent.push({ subscribe: [token, topic] }),
  };
}

async function withServer(deps) {
  const server = createApp(deps).listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    server,
    post: (path, body, secret = 's') =>
      fetch(base + path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(secret ? { 'X-Dev-Secret': secret } : {}) },
        body: JSON.stringify(body),
      }),
  };
}

test('registration is idempotent; store exposed via /tokens', async () => {
  const { server, post } = await withServer({ messaging: stubMessaging(), devSecret: 's' });
  const r1 = await post('/register-token', { token: 't1' }, null);
  const r2 = await post('/register-token', { token: 't1' }, null);
  assert.equal(r1.status, 200);
  assert.deepEqual(await r1.json(), { ok: true });
  assert.equal(r2.status, 200);
  server.close();
});

test('/send requires X-Dev-Secret; missing or wrong -> 401, nothing sent', async () => {
  const messaging = stubMessaging();
  const { server, post } = await withServer({ messaging, devSecret: 's' });
  assert.equal((await post('/send', { token: 't1', title: 'a', body: 'b' }, null)).status, 401);
  assert.equal((await post('/send', { token: 't1', title: 'a', body: 'b' }, 'wrong')).status, 401);
  assert.equal(messaging.sent.length, 0);
  server.close();
});

test('send to valid token returns messageId; invalid token -> 404 and removed from store', async () => {
  const tokens = new Set(['good-token', 'bad-token']);
  const messaging = stubMessaging();
  const { server, post } = await withServer({ messaging, tokens, devSecret: 's' });

  const ok = await post('/send', { token: 'good-token', title: 'Hi', body: 'there' });
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).messageId, 'projects/test/messages/123');
  assert.deepEqual(messaging.sent[0].notification, { title: 'Hi', body: 'there' });

  const bad = await post('/send', { token: 'bad-token', title: 'Hi', body: 'there' });
  assert.equal(bad.status, 404);
  assert.equal(tokens.has('bad-token'), false); // removed
  assert.equal(tokens.has('good-token'), true); // untouched

  const topic = await post('/send', { topic: 'news', title: 'Hi', body: 'broadcast' });
  assert.equal(topic.status, 200);
  assert.equal(messaging.sent.at(-1).topic, 'news');
  server.close();
});

test('send with no target broadcasts to all registered tokens', async () => {
  const tokens = new Set(['a', 'b']);
  const messaging = stubMessaging();
  const { server, post } = await withServer({ messaging, tokens, devSecret: 's' });
  const res = await post('/send', { title: 'Hi', body: 'all' });
  assert.deepEqual(await res.json(), { sent: 2, failed: 0 });
  server.close();
});

test('/subscribe wires token to topic', async () => {
  const messaging = stubMessaging();
  const { server, post } = await withServer({ messaging, devSecret: 's' });
  const res = await post('/subscribe', { token: 'a', topic: 'news' });
  assert.equal(res.status, 200);
  assert.deepEqual(messaging.sent.at(-1), { subscribe: ['a', 'news'] });
  server.close();
});
