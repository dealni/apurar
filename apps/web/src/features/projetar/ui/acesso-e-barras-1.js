export const zd = shellzd;
function shellzd() {
  try {
    const t = "apuracao-recargas",
      e = Date.now(),
      n = JSON.parse(sessionStorage.getItem(t) || "[]").filter(
        (s) => e - s < 6e5,
      );
    return n.length >= 3
      ? !1
      : (n.push(e), sessionStorage.setItem(t, JSON.stringify(n)), !0);
  } catch {
    return !1;
  }
}
