import { defineConfig, devices } from "@playwright/test";
const port = Number(process.env.APURAR_TEST_PORT ?? "4326");
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("APURAR_TEST_PORT deve estar entre 1024 e 65535.");
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  forbidOnly: true,
  testDir: "./e2e",
  outputDir: `test-results/port-${port}`,
  use: { baseURL, headless: true, channel: "chrome" },
  webServer: {
    env: { APURAR_TEST_PORT: String(port) },
    command: `npm run build && npm run preview -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
});
