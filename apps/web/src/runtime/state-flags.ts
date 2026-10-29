import "./state-flags.css";

const assets = import.meta.glob<string>("./assets/flags/*.svg", {
  eager: true,
  query: "?url&no-inline",
  import: "default",
});
export const stateFlags: Record<string, string> = Object.fromEntries(
  Object.entries(assets).map(([path, url]) => [
    path.split("/").at(-1)!.replace(".svg", "").toUpperCase(),
    url,
  ]),
);
