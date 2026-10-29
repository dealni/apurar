import assert from "node:assert/strict";
import { test } from "node:test";

test("ponte oficial preserva API e renderer htm da interface recuperada", async () => {
  globalThis.window = {};
  try {
    const { default: runtime } =
      await import("../../apps/web/src/vendor/htm-preact.js");
    assert.equal(globalThis.window.htmPreact, runtime);
    for (const name of [
      "h",
      "render",
      "useState",
      "useEffect",
      "useRef",
      "useMemo",
      "useLayoutEffect",
      "useErrorBoundary",
    ])
      assert.equal(typeof runtime[name], "function", name);
    const vnode = globalThis.window.htm.bind(
      runtime.h,
    )`<button aria-label="Teste">${"Apurar"}</button>`;
    assert.equal(vnode.type, "button");
    assert.equal(vnode.props["aria-label"], "Teste");
    assert.equal(vnode.props.children, "Apurar");
  } finally {
    delete globalThis.window;
  }
});
