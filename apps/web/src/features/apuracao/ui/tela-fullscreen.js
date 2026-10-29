import { useEffect } from './formatacao-e-acessibilidade-1.js';
export function useFullscreenEWakeLock({ ls, g, On, E }) {
  (useEffect(() => {
    const I = () => {
      !ls() && g && On();
    };
    return (
      document.addEventListener('fullscreenchange', I),
      document.addEventListener('webkitfullscreenchange', I),
      () => {
        (document.removeEventListener('fullscreenchange', I),
          document.removeEventListener('webkitfullscreenchange', I));
      }
    );
  }, [g]),
    useEffect(() => {
      if (!g) return;
      let active = true;
      let pending = false;
      let sentinel = null;
      const I = () => {
        if (!(
          !active ||
          pending ||
          E.current ||
          document.visibilityState !== 'visible' ||
          !navigator.wakeLock
        ))
          try {
            pending = true;
            navigator.wakeLock
              .request('screen')
              .then((K) => {
                pending = false;
                if (!active || document.visibilityState !== 'visible') {
                  K.release().catch(() => {});
                  return;
                }
                sentinel = K;
                ((E.current = K),
                  K.addEventListener &&
                    K.addEventListener('release', () => {
                      E.current === K && (E.current = null);
                    }));
              })
              .catch(() => { pending = false; });
          } catch {
            pending = false;
            /* Fallback opcional preservado da captura; a interface continua disponível. */
          }
      };
      return (
        I(),
        document.addEventListener('visibilitychange', I),
        () => {
          active = false;
          document.removeEventListener('visibilitychange', I);
          if (sentinel && E.current === sentinel) {
            E.current = null;
            sentinel.release().catch(() => {});
          }
        }
      );
    }, [g]));
}
