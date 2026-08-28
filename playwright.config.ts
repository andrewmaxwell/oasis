import {defineConfig, devices} from '@playwright/test';

/**
 * E2E config. Supabase is mocked at the network boundary (see e2e/fixtures/supabaseMock.ts),
 * so this needs no Docker, no credentials, and no test project — it runs the same on a
 * laptop and in CI.
 *
 * The dev server runs in `e2e` mode so it picks up .env.e2e's placeholder credentials:
 * createClient() needs a syntactically valid URL and key to construct, but nothing ever
 * reaches that host — the mock intercepts it, and any request that escapes fails the test.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    // The app is served under /oasis/ and routes through a hash router (see CLAUDE.md §2).
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
  webServer: {
    // `--mode e2e` loads .env.e2e, whose placeholder credentials outrank a developer's
    // real .env. Never reuse an existing server and never use the normal dev port: a
    // hand-started `npm run dev` is pointed at the real project, and reusing it would aim
    // this suite at production data.
    command: 'npm run dev -- --mode e2e --port 5174 --strictPort',
    url: 'http://localhost:5174/oasis/',
    reuseExistingServer: false,
    stdout: 'ignore',
  },
});
