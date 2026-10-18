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

test('broadcast prunes dead tokens and reports counts', async () => {
  const tokens = new Set(['live-token', 'bad-token']);
  const messaging = stubMessaging();
  const { server, post } = await withServer({ messaging, tokens, devSecret: 's' });
  const res = await post('/send', { title: 'Hi', body: 'all' });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { sent: 1, failed: 1 });
  assert.equal(tokens.has('bad-token'), false);
  assert.equal(tokens.has('live-token'), true);
  server.close();
});
