// @ts-check
import { test as base, chromium, expect } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';

// Committed E2E for the web push loop: enable -> register -> token/topic/
// broadcast sends -> foreground toast. Requires the sender (:3000) and the
// dev server (:5173) running, plus valid Firebase config in the root .env
// and a matching VAPID key.
//
// Two environment constraints drive the setup below (see repo AGENTS gotchas):
// 1. Playwright's default contexts are incognito, and Chrome refuses the
//    Push API in incognito -> use a persistent profile instead.
// 2. Only real Chrome (channel 'chrome') both reports Notification.permission
//    as granted under automation and carries a working push client -> the
//    E2E_CHANNEL env var can override the channel if your setup differs.

const userDataDir =
  process.env.E2E_PROFILE_DIR ??
  path.join(os.tmpdir(), 'fcm-poc-e2e-profile');

export const test = base.extend({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext(userDataDir, {
      channel: process.env.E2E_CHANNEL ?? 'chrome',
      headless: true,
      permissions: ['notifications'], // pre-grant; per gotcha, before getToken runs
      baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    });
    await use(context);
    await context.close();
  },
  page: async ({ context }, use) => {
    const page = context.pages()[0] ?? (await context.newPage());
    await use(page);
  },
});

test.describe.configure({ mode: 'serial' });

async function enableAndRegister(page) {
  await page.goto('/');
  await expect(page.getByTestId('test-token')).toBeVisible(); // always-visible test card
  await page.getByRole('button', { name: 'Enable notifications' }).click();
  // A real FCM registration token: long, no spaces (error strings have spaces).
  await expect(page.locator('#token')).toHaveText(/^[A-Za-z0-9:_-]{20,}$/u, {
    timeout: 45_000,
  });
}

test('enable -> register obtains and registers an FCM token', async ({ page }) => {
  await enableAndRegister(page);
});

test('token send shows a foreground toast', async ({ page }) => {
  await enableAndRegister(page);

  await page.getByTestId('test-token').click();
  await expect(page.getByTestId('token-result')).toContainText(/token: 200 .*messageId/, {
    timeout: 30_000,
  });
  // Foreground delivery -> onMessage toast renders title + body in-page.
  await expect(page.locator('#toast.show')).toContainText('test-token', {
    timeout: 45_000,
  });
});

test('topic send (subscribe + send) returns 2xx', async ({ page }) => {
  await enableAndRegister(page);

  await page.getByTestId('test-topic').click();
  await expect(page.getByTestId('topic-result')).toContainText(/send poc-test: 200 .*messageId/, {
    timeout: 30_000,
  });
});

test('broadcast send returns 2xx with counts', async ({ page }) => {
  await enableAndRegister(page);

  await page.getByTestId('test-broadcast').click();
  await expect(page.getByTestId('broadcast-result')).toContainText(
    /broadcast: 200 \{"sent":\d+,"failed":\d+\}/,
    { timeout: 30_000 },
  );
});

test('background smoke: permission granted and SW registered at root scope', async ({
  page,
}) => {
  // Background OS-notification capture is flaky in headless (design decision),
  // so this is a smoke check of the preconditions the service worker needs:
  // granted permission + registered root-scope messaging SW that would call
  // showNotification for background messages.
  await enableAndRegister(page);

  const state = await page.evaluate(async () => ({
    permission: Notification.permission,
    scope: (await navigator.serviceWorker.getRegistration())?.scope ?? null,
  }));
  expect(state.permission).toBe('granted');
  expect(state.scope, 'SW registered at site root scope').toMatch(/\/$/);
});
