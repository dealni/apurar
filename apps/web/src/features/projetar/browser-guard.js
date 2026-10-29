(function () {
  var d = !1,
    s = !1,
    c = document.getElementById("app");
  window.APURACAO_OK = function () {
    d = !0;
  };
  var o = function (a) {
    if (!(d || s || !c)) {
      ((s = !0), (c.textContent = ""));
      var e = document.createElement("div"),
        i = document.createElement("p"),
        p = document.createElement("p"),
        r = document.createElement("div"),
        t = document.createElement("button"),
        n = document.createElement("a");
      ((e.className = "guard"),
        (i.className = "gt"),
        (r.className = "gr"),
        (i.textContent = "Apuração 2026"),
        (p.textContent = a),
        (t.className = "btn"),
        (t.type = "button"),
        (t.textContent = "Tentar de novo"),
        (t.onclick = function () {
          location.reload();
        }),
        (n.className = "btn"),
        (n.href = "https://resultados.tse.jus.br/"),
        (n.rel = "noopener noreferrer"),
        (n.textContent = "Resultados no site do TSE"),
        r.appendChild(t),
        r.appendChild(n),
        e.appendChild(i),
        e.appendChild(p),
        e.appendChild(r),
        c.appendChild(e));
    }
  };
  window.APURACAO_FALHA = o;
  var u = document.createElement("canvas"),
    l = u.getContext && u.getContext("2d"),
    m =
      typeof Promise == "function" &&
      typeof window.fetch == "function" &&
      typeof window.Path2D == "function" &&
      !!l &&
      !!(window.CSS && CSS.supports) &&
      typeof Float32Array == "function";
  if (!m) {
    ((window.APURACAO_SEM_SUPORTE = !0),
      o(
        "Este navegador não consegue mostrar a apuração. Atualize o navegador ou acompanhe os resultados no site do TSE.",
      ));
    return;
  }
  (window.addEventListener("error", function (a) {
    !d &&
      a &&
      /SyntaxError|ReferenceError|htmPreact|Unexpected/.test(
        String(a.message),
      ) &&
      o("A página não conseguiu abrir neste navegador.");
  }),
    setTimeout(function () {
      o(
        "A página está demorando para abrir. Verifique a conexão e tente de novo.",
      );
    }, 3e4));
})();
