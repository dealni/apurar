/*
 * Feed preservado: archive.
 * Dependências explícitas; a fábrica mantém apenas o estado desta responsabilidade.
 */
export function createArchive({
  checkCurrent,
  checkMunicipalities,
  readCurrentSnapshot,
  fetchJson,
  isFiniteNumber,
  live,
  readMunicipalSnapshot,
  now,
  simulationAt,
  toSnapshot,
}) {
  const archiveCache = new Map();
  let archiveMinutes = null;
  let archiveUpdated = 0;
  const minutes = async () => {
    if (!archiveMinutes || now() - archiveUpdated > 6e4)
      try {
        const p = await fetchJson('arquivo/indice.json');
        p &&
          Array.isArray(p.minutos) &&
          p.minutos.every(isFiniteNumber) &&
          ((archiveMinutes = p.minutos.slice().sort((L, Q) => L - Q)),
          (archiveUpdated = now()));
      } catch (p) {
        console.warn('[feed] índice do arquivo:', p.message);
      }
    return archiveMinutes;
  };
  const load = async (p) => {
    if (!live) return simulationAt(p);
    if (readCurrentSnapshot() && p >= readCurrentSnapshot().t)
      return toSnapshot(readCurrentSnapshot(), readMunicipalSnapshot());
    const L = await minutes();
    let Q = p;
    if (L) {
      let Re = 0,
        Ie = L.length;
      for (; Re < Ie;) {
        const ln = (Re + Ie) >> 1;
        L[ln] <= p ? (Re = ln + 1) : (Ie = ln);
      }
      if (!Re) throw new Error('antes do arquivo');
      Q = L[Re - 1];
    }
    const Pt =
      String(Math.floor(Q / 60)).padStart(2, '0') +
      String(Math.floor(Q % 60)).padStart(2, '0');
    if (archiveCache.has(Pt)) return archiveCache.get(Pt);
    const dt = await fetchJson(`arquivo/${Pt}.json`, {
        cache: 'default',
      }),
      tt = checkCurrent(dt);
    if (tt) throw new Error(tt);
    let ae;
    try {
      ((ae = await fetchJson(`arquivo/${Pt}-municipios.json`, {
        cache: 'default',
      })),
        checkMunicipalities(ae) && (ae = null));
    } catch {
      ae = null;
    }
    const qt = toSnapshot(dt, ae);
    return (
      archiveCache.set(Pt, qt),
      archiveCache.size > 16 &&
        archiveCache.delete(archiveCache.keys().next().value),
      qt
    );
  };
  return {
    load,
    minutes,
  };
}
