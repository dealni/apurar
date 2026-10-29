/** Navegação de menus/listas preserva a ativação explícita por Enter ou Espaço. */
export function navigatePicker(event: KeyboardEvent): void {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  const container = event.currentTarget as HTMLElement;
  const options = Array.from(
    container.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
  ).filter(
    (option) =>
      option.getClientRects().length > 0 && !option.closest("[inert]"),
  );
  if (!options.length) return;
  const current = options.indexOf(document.activeElement as HTMLButtonElement);
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? options.length - 1
        : event.key === "ArrowDown"
          ? (current + 1) % options.length
          : current < 0
            ? options.length - 1
            : (current - 1 + options.length) % options.length;
  event.preventDefault();
  event.stopPropagation();
  options[next]?.focus();
}
