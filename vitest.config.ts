import { defineConfig } from "vitest/config";
export default defineConfig({
  envDir: false,
  test: {
    allowOnly: false,
    include: [
      "packages/**/*.{test,spec}.{ts,tsx,js,jsx,mts,mjs}",
      "apps/edge/**/*.{test,spec}.{ts,tsx,js,jsx,mts,mjs}",
      "apps/web/src/**/*.{test,spec}.{ts,tsx,js,jsx,mts,mjs}",
    ],
    environment: "node",
  },
});
