import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// Critical-journey tests (test-plan.md TEST-001) against the production
// build in demo mode. Build first: `npm run build && npm run test:e2e`.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: `npx next start --port ${PORT}`,
    url: `http://localhost:${PORT}/w/atlas/overview`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // Force demo mode regardless of the developer's local .env.
    env: { NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" },
  },
});
