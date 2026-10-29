import {
  isCurrentNavigationItem,
  siteNavigationItems,
} from "../navigation/catalog";
import "./site-navigation.css";

let dialog: HTMLDialogElement | null = null;
let opener: HTMLElement | null = null;
let previousBodyOverflow = "";
let previousRootOverflow = "";

function closeNavigation() {
  dialog?.close();
}

function createNavigation(): HTMLDialogElement {
  const panel = document.createElement("dialog");
  panel.id = "site-navigation-dialog";
  panel.className = "site-navigation-dialog";
  panel.setAttribute("aria-labelledby", "site-navigation-title");
  const heading = document.createElement("h2");
  heading.id = "site-navigation-title";
  heading.textContent = "Explore o Apurar";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "site-navigation-close";
  close.textContent = "Fechar";
  close.setAttribute("aria-label", "Fechar navegação");
  close.addEventListener("click", closeNavigation);
  const header = document.createElement("div");
  header.className = "site-navigation-header";
  const title = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "site-navigation-eyebrow";
  eyebrow.textContent = "ELEIÇÕES 2026";
  title.append(eyebrow, heading);
  header.append(title, close);
  const nav = document.createElement("nav");
  nav.setAttribute("aria-label", "Áreas do Apurar");
  for (const item of siteNavigationItems) {
    const link = document.createElement("a");
    link.href = item.href;
    link.dataset.navigationHref = item.href;
    const label = document.createElement("strong");
    label.textContent = item.label;
    const description = document.createElement("span");
    description.textContent = item.description;
    link.append(label, description);
    nav.append(link);
  }
  nav.addEventListener("click", (event) => {
    if ((event.target as Element).closest("a")) closeNavigation();
  });
  panel.append(header, nav);
  panel.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const controls = Array.from(
      panel.querySelectorAll<HTMLElement>("button, a[href]"),
    );
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
  panel.addEventListener("click", (event) => {
    if (event.target !== panel) return;
    const bounds = panel.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      closeNavigation();
  });
  panel.addEventListener("close", () => {
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousRootOverflow;
    opener?.setAttribute("aria-expanded", "false");
    if (opener?.isConnected) opener.focus();
  });
  document.body.append(panel);
  return panel;
}

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const trigger = event.target.closest<HTMLElement>("[data-site-navigation]");
  if (!trigger) return;
  event.preventDefault();
  dialog ??= createNavigation();
  if (dialog.open) return;
  opener = trigger;
  trigger.setAttribute("aria-expanded", "true");
  const current = new URL(location.href);
  for (const link of dialog.querySelectorAll<HTMLAnchorElement>("a")) {
    const active = isCurrentNavigationItem(link.getAttribute("href")!, current);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  previousBodyOverflow = document.body.style.overflow;
  previousRootOverflow = document.documentElement.style.overflow;
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";
  dialog.showModal();
});
