import { afterEach, expect, it, vi } from "vitest";
import { createPolling } from "./polling";
import {
  timing,
  milliseconds as ms,
} from "../../../../packages/contracts/timing";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("usa 15s visível, 60s oculta e consulta imediatamente ao voltar", async () => {
  vi.useFakeTimers();
  const doc = Object.assign(new EventTarget(), { visibilityState: "visible" });
  vi.stubGlobal("document", doc);
  const refresh = vi.fn(async () => {});
  const polling = createPolling(refresh);
  polling.start();
  await vi.advanceTimersByTimeAsync(ms(timing.liveSeconds));
  expect(refresh).toHaveBeenCalledTimes(2);
  doc.visibilityState = "hidden";
  doc.dispatchEvent(new Event("visibilitychange"));
  await vi.advanceTimersByTimeAsync(ms(timing.hiddenSeconds) - 1);
  expect(refresh).toHaveBeenCalledTimes(2);
  await vi.advanceTimersByTimeAsync(1);
  expect(refresh).toHaveBeenCalledTimes(3);
  doc.visibilityState = "visible";
  doc.dispatchEvent(new Event("visibilitychange"));
  await vi.advanceTimersByTimeAsync(0);
  expect(refresh).toHaveBeenCalledTimes(4);
  polling.stop();
  doc.dispatchEvent(new Event("visibilitychange"));
  await vi.advanceTimersByTimeAsync(120000);
  expect(refresh).toHaveBeenCalledTimes(4);
});
it("não sobrepõe consulta lenta e não agenda depois de parar", async () => {
  vi.useFakeTimers();
  let release!: () => void;
  const refresh = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  const polling = createPolling(refresh);
  polling.start();
  polling.start();
  await vi.advanceTimersByTimeAsync(90000);
  expect(refresh).toHaveBeenCalledTimes(1);
  polling.stop();
  release();
  await vi.advanceTimersByTimeAsync(90000);
  expect(refresh).toHaveBeenCalledTimes(1);
});
