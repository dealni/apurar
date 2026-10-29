export const implementar = (t) =>
  String(t || "")
    .split(" ")
    .filter((e) => e.length > 2)
    .slice(0, 2)
    .map((e) => e[0])
    .join("")
    .toUpperCase();
