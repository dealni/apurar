import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { unstable_dev } from "wrangler";

test(
  "entrypoint inicia no workerd com R2 e preserva HTML e API",
  {
    timeout: 30_000,
  },
  async () => {
    const directory = await mkdtemp(join(tmpdir(), "apurar-worker-runtime-"));
    const assets = join(directory, "assets");
    let worker;
    try {
      await mkdir(assets);
      await cp("apps/web/public/_headers", join(assets, "_headers"));
      for (const route of ["", "apurar", "1turno"]) {
        const target = join(assets, route);
        await mkdir(target, { recursive: true });
        await writeFile(
          join(target, "index.html"),
          "<!doctype html><title>Apurar</title>",
        );
      }
      worker = await unstable_dev("apps/edge/src/worker.ts", {
        config: "wrangler.jsonc",
        assets,
        local: true,
        ip: "127.0.0.1",
        port: 0,
        inspectorPort: 0,
        persist: false,
        logLevel: "error",
        experimental: {
          disableExperimentalWarning: true,
          disableDevRegistry: true,
          watch: false,
        },
      });
      for (const route of ["/", "/apurar/", "/1turno/"]) {
        const response = await worker.fetch(route);
        assert.equal(response.status, 200, route);
        assert.match(response.headers.get("content-type"), /text\/html/u);
        assert.match(response.headers.get("cache-control"), /no-transform/u);
        assert.match(
          response.headers.get("content-security-policy"),
          /script-src 'self';/u,
        );
        assert.match(await response.text(), /<title>Apurar<\/title>/u);
      }
      for (const method of ["GET", "HEAD"]) {
        const response = await worker.fetch("/api/snapshot", { method });
        assert.equal(response.status, 503);
        assert.equal(response.headers.get("cache-control"), "no-store");
        assert.equal(
          await response.text(),
          method === "HEAD" ? "" : '{"error":"feed_unavailable"}',
        );
      }
    } finally {
      await worker?.stop();
      await rm(directory, { recursive: true, force: true });
    }
  },
);
