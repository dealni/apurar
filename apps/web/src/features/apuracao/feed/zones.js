import { createZoneValidation } from './zones-validation.js';
import { Geo } from '../geography.js';
/*
 * Feed preservado: zones.
 * Dependências explícitas; a fábrica mantém apenas o estado desta responsabilidade.
 */
export function createZones({
  config,
  readCurrentSnapshot,
  emit,
  fetchJson,
  isNonNegative,
  isOffline,
  live,
  now,
  presidentialCandidates,
}) {
  const zoneCache = new Map();
  const zoneRequests = new Map();
  const zoneFailures = new Map();
  const checkZones = createZoneValidation(config, isNonNegative, Geo.zones);
  const loadZones = (p) => {
    const L = String(Geo.munis[p].id);
    (zoneRequests.set(p, now()),
      fetchJson(`zonas/${L}.json`)
        .then((Q) => {
          const Pt = checkZones(Q, L);
          if (Pt) throw new Error('zonas inválidas: ' + Pt);
          if (
            readCurrentSnapshot() &&
            Q.seq > readCurrentSnapshot().seq + 86400
          )
            throw new Error('zonas inválidas: seq');
          const dt = zoneCache.get(p);
          if (dt && Q.seq < dt.seq) return;
          const tt = new Map();
          (Q.zonas.forEach((ae, qt) => {
            const Re = presidentialCandidates.map(
              (ln) => +((Q.votos[ln.n] || [])[qt] || 0),
            );
            let Ie = 0;
            for (const ln in Q.votos) Ie += +Q.votos[ln][qt] || 0;
            tt.set(ae, {
              secoes: Q.secoes[qt],
              totalizadas: Q.totalizadas[qt],
              eleitorado: Q.eleitorado[qt],
              apurado: Q.apurado[qt],
              comparecimento: Q.comparecimento[qt],
              brancos: Q.brancos[qt],
              nulos: Q.nulos[qt],
              votos: Re,
              validos: Ie,
            });
          }),
            zoneFailures.delete(p),
            zoneCache.set(p, {
              at: now(),
              seq: Q.seq,
              rows: tt,
            }),
            emit('detail', 'z' + L));
        })
        .catch((Q) => {
          const Pt =
              (
                zoneFailures.get(p) || {
                  k: 0,
                }
              ).k + 1,
            dt = !zoneFailures.has(p);
          (zoneFailures.set(p, {
            k: Pt,
            wait: Q.retry || Math.min(6e4, 1e4 * Math.pow(2, Pt - 1)),
          }),
            console.warn('[feed] zonas', L, Q.message),
            dt && !zoneCache.has(p) && emit('detail', 'z' + L));
        }));
  };
  const zones = (p) => {
    const L = zoneCache.get(p) || null,
      Q = zoneFailures.get(p),
      Pt = now() - (zoneRequests.get(p) || 0);
    return (
      live &&
        !isOffline() &&
        Pt > (Q ? Q.wait : 1e4) &&
        (!L || now() - L.at > 45e3) &&
        loadZones(p),
      L ? L.rows : Q ? !1 : null
    );
  };
  return {
    checkZones,
    zoneCache,
    zones,
  };
}
