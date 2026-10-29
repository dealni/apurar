(function () {
  var d = innerWidth,
    t = innerHeight,
    p = location.hash,
    r = /tv/.test(p),
    m = /governadores/.test(p) ? 1 : /senado/.test(p) ? 2 : 0,
    y = document.getElementById('app'),
    a = function (n, c, i) {
      var g = document.createElement(n);
      return (c && (g.className = c), i && (g.textContent = i), g);
    };
  var S = a('div', 'frame');
  var { h, l, o, e } = criarMarca(a, p, m);
  ajustarLayout({ a, d, t, r, h, l, o, e });
  (S.appendChild(e), y.appendChild(S));
})();

function ajustarLayout({ a, d, t, r, h, l, o, e }) {
  var b = !r && d < 600 && t >= d;
  if ((b && document.documentElement.classList.add('flow'), !r && d < 1e3)) {
    if (
      ((e.className = 'hud phone' + (b ? ' flow' : '')),
      (e.style.width = d + 'px'),
      (e.style.height = t + 'px'),
      t >= d)
    ) {
      var B = a('span', 'sbtn'),
        v = a('div', 'status'),
        N = a('span', 'btn shb');
      (v.appendChild(a('span', 'expill', 'Exterior')),
        v.appendChild(N),
        o.appendChild(B),
        o.appendChild(v),
        [B, v].forEach(function (n) {
          n.style.visibility = 'hidden';
        }));
    }
    var f = b ? a('div', 'swbar') : null;
    (f && f.appendChild(l), e.appendChild(o), e.appendChild(f || l));
  } else {
    ajustarDesktop({ d, t, r, l, o, e });
  }
}

function criarMarca(a, p, m) {
  var h = a('div', 'brand'),
    l = a('div', 'switch'),
    o = a('header', 'hudtop'),
    e = a('div', 'hud'),
    M = window.APURACAO || {},
    U = p;
  try {
    U = decodeURIComponent(p);
  } catch {
    /* Fallback opcional preservado da captura; a interface continua disponível. */
  }
  var A =
    M.turno === 2 ||
    (M.modo !== 'ao-vivo' && /(^|[#~-])2t(?=$|[~-])/.test(U.toLowerCase()));
  (A && m === 2 && (m = 0),
    h.appendChild(a('b', '', 'Apuração 2026')),
    h.appendChild(
      a('span', '', A ? '2º turno · 25 de outubro' : '1º turno · 4 de outubro'),
    ),
    (A
      ? ['Presidente', 'Governadores']
      : ['Presidente', 'Governadores', 'Senado']
    ).forEach(function (n, c) {
      var i = a('button', '', n);
      ((i.tabIndex = -1),
        i.setAttribute('aria-pressed', String(c === m)),
        l.appendChild(i));
    }),
    o.appendChild(h));
  return { h, l, o, e };
}

function ajustarDesktop({ d, t, r, l, o, e }) {
  var O = window.CSS && CSS.supports && CSS.supports('zoom', '2'),
    C = O
      ? r
        ? Math.min(4, Math.max(0.5, Math.min(d / 1280, t / 720)))
        : Math.min(3, Math.max(1, Math.min(d / 1600, t / 900)))
      : 1;
  ((e.className = 'hud' + (r ? ' tv' : '')),
    (e.style.width = d / C + 'px'),
    (e.style.height = t / C + 'px'),
    C !== 1 && (e.style.zoom = C),
    o.appendChild(l),
    e.appendChild(o));
}
