import { defineConfig } from '@playwright/test';

// E2E against the local POC loop. Prerequisites (documented in README):
//   - sender running: cd server && uv run python -m src.main   (port 3000)
//   - web dev server:   cd web && npm run dev                  (port 5173)
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    // The push tests below build their own persistent Chrome context
    // (Playwright's default context is incognito, which blocks the Push API).
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
