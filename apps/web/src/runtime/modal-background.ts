/** Isola o diálogo do topo e restaura o fundo mesmo com fechamentos fora de ordem. */
const dialogs: HTMLElement[] = [];
const originalInert = new Map<HTMLElement, boolean>();
let originalOverflow = "";

function updateIsolation(): void {
  for (const [element, inert] of originalInert) element.inert = inert;
  const top = dialogs.at(-1);
  if (!top) {
    originalInert.clear();
    document.body.style.overflow = originalOverflow;
    return;
  }
  let branch = top;
  while (branch.parentElement) {
    for (const sibling of branch.parentElement.children) {
      if (sibling === branch || !(sibling instanceof HTMLElement)) continue;
      if (!originalInert.has(sibling))
        originalInert.set(sibling, sibling.inert);
      sibling.inert = true;
    }
    if (branch.parentElement === document.body) break;
    branch = branch.parentElement;
  }
  document.body.style.overflow = "hidden";
}

export function isolateModalBackground(dialog: HTMLElement): () => void {
  if (!dialogs.length) originalOverflow = document.body.style.overflow;
  dialogs.push(dialog);
  updateIsolation();
  let restored = false;
  return () => {
    if (restored) return;
    restored = true;
    dialogs.splice(dialogs.lastIndexOf(dialog), 1);
    updateIsolation();
  };
}
