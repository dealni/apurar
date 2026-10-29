import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const testPort = process.env.APURAR_TEST_PORT;
if (
  testPort &&
  (!/^\d+$/u.test(testPort) ||
    Number(testPort) < 1024 ||
    Number(testPort) > 65535)
)
  throw new Error("APURAR_TEST_PORT deve estar entre 1024 e 65535.");

const entry = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  root: "apps/web",
  appType: "mpa",
  plugins: [react()],
  build: {
    outDir: testPort ? `../../.artifacts/browser-${testPort}` : "../../dist",
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        principal: entry("./apps/web/index.html"),
        primeiroTurno: entry("./apps/web/1turno/index.html"),
        apurar: entry("./apps/web/apurar/index.html"),
        ...(testPort
          ? { chatTest: entry("./apps/web/__test__/chat.html") }
          : {}),
      },
    },
  },
  server: { port: 4325, strictPort: true },
  preview: { port: 4325, strictPort: true },
});
