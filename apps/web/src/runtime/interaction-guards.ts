/** Mantém atalhos do painel fora de controles e diálogos que recebem a tecla. */
export function hasOpenModal(): boolean {
  return !!document.querySelector(
    'dialog[open],[role="dialog"][aria-modal="true"]:not([hidden]):not([aria-hidden="true"])',
  );
}

export function blocksPanelShortcut(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || hasOpenModal()) return true;
  const target =
    event.target instanceof Element ? event.target : document.activeElement;
  return !!target?.closest(
    'input,textarea,select,button,summary,a[href],[contenteditable]:not([contenteditable="false"]),dialog,[role="dialog"],[role="button"],[role="link"],[role="textbox"],[role="combobox"],[role="listbox"],[role="slider"],[role="spinbutton"],[role="menuitem"],[role="option"],[role="checkbox"],[role="radio"],[role="switch"],[role="tab"]',
  );
}

/** A busca global continua acessível com o foco em ações simples do painel. */
export function blocksSearchShortcut(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || hasOpenModal()) return true;
  const target =
    event.target instanceof Element ? event.target : document.activeElement;
  return !!target?.closest(
    'input,textarea,select,[contenteditable]:not([contenteditable="false"]),dialog,[role="dialog"],[role="textbox"],[role="combobox"],[role="listbox"],[role="slider"],[role="spinbutton"]',
  );
}
