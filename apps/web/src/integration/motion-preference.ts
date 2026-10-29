type MotionPreference = Pick<
  MediaQueryList,
  "matches" | "addEventListener" | "removeEventListener"
>;

export function observeReducedMotion(
  update: (reduced: boolean) => void,
  preference: MotionPreference = matchMedia("(prefers-reduced-motion: reduce)"),
) {
  const sync = () => update(preference.matches);
  sync();
  preference.addEventListener("change", sync);
  return () => preference.removeEventListener("change", sync);
}
