import { html } from "./formatacao-e-acessibilidade-1.js";

export function renderPlayButton(i, u) {
  return i
    ? html`<button
        class=${"icon play" + (u ? " on" : "")}
        aria-label=${u ? "Pausar o histórico" : "Reproduzir as observações do histórico (espaço)"}
        title=${u ? "Pausar (espaço)" : "Reproduzir o histórico (espaço)"}
        onClick=${i}
      >
        ${
          u
            ? html`<svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                aria-hidden="true"
              >
                <rect
                  x="2"
                  y="1.5"
                  width="3"
                  height="9"
                  rx=".8"
                  fill="currentColor"
                />
                <rect
                  x="7"
                  y="1.5"
                  width="3"
                  height="9"
                  rx=".8"
                  fill="currentColor"
                />
              </svg>`
            : html`<svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                aria-hidden="true"
              >
                <path
                  d="M3 1.8v8.4a.6.6 0 0 0 .9.5l6.6-4.2a.6.6 0 0 0 0-1L3.9 1.3a.6.6 0 0 0-.9.5z"
                  fill="currentColor"
                />
              </svg>`
        }
      </button>`
    : null;
}
