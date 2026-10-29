import { timing, milliseconds } from "../../../../packages/contracts/timing";

// Uma única requisição em andamento; abas ocultas reduzem tráfego.
export function createPolling(refresh: () => Promise<void>) {
  let active = false,
    busy = false,
    again = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const visible = () =>
    typeof document === "undefined" || document.visibilityState !== "hidden";
  const tick = async () => {
    if (!active) return;
    clearTimeout(timer);
    if (busy) {
      again = true;
      return;
    }
    busy = true;
    try {
      await refresh();
    } finally {
      busy = false;
      if (active) {
        const delay = again
          ? 0
          : milliseconds(visible() ? timing.liveSeconds : timing.hiddenSeconds);
        again = false;
        timer = setTimeout(() => void tick(), delay);
      }
    }
  };
  const changed = () => {
    if (visible()) void tick();
    else if (!busy) {
      clearTimeout(timer);
      timer = setTimeout(() => void tick(), milliseconds(timing.hiddenSeconds));
    }
  };
  return {
    start() {
      if (active) return;
      active = true;
      if (typeof document !== "undefined")
        document.addEventListener("visibilitychange", changed);
      void tick();
    },
    stop() {
      active = false;
      again = false;
      clearTimeout(timer);
      if (typeof document !== "undefined")
        document.removeEventListener("visibilitychange", changed);
    },
  };
}
