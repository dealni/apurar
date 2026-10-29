import { expect, it, vi } from "vitest";
import { observeReducedMotion } from "./motion-preference";

it("respeita a preferência inicial e mudanças do sistema sem recarregar", () => {
  let changed: (() => void) | undefined;
  const preference = {
    matches: true,
    addEventListener: vi.fn((_type: string, listener: () => void) => {
      changed = listener;
    }),
    removeEventListener: vi.fn(),
  };
  const update = vi.fn();
  const stop = observeReducedMotion(update, preference);
  expect(update).toHaveBeenLastCalledWith(true);
  preference.matches = false;
  changed!();
  expect(update).toHaveBeenLastCalledWith(false);
  preference.matches = true;
  changed!();
  expect(update).toHaveBeenLastCalledWith(true);
  stop();
  expect(preference.removeEventListener).toHaveBeenCalledWith(
    "change",
    changed,
  );
});
