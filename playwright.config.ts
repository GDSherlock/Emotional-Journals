import { defineConfig } from "@playwright/test";
const external = process.env.E2E_BASE_URL;
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  use: {
    baseURL: external ?? "http://127.0.0.1:4175/Emotional-Journals/",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: external
    ? undefined
    : {
        command:
          "PAGES_BASE_PATH=/Emotional-Journals/ npm run build && PAGES_BASE_PATH=/Emotional-Journals/ npm run preview -- --port 4175 --strictPort",
        url: "http://127.0.0.1:4175/Emotional-Journals/",
        reuseExistingServer: false,
        timeout: 60000,
      },
});
