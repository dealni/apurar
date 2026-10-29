export interface SiteNavigationItem {
  label: string;
  href: string;
  description: string;
}

export const siteNavigationItems: readonly SiteNavigationItem[] = [
  {
    label: "Apuração",
    href: "/",
    description: "Presidente, governadores e exterior no mesmo mapa.",
  },
  {
    label: "Primeiro turno",
    href: "/1turno/",
    description: "Explore o mapa histórico e as comparações eleitorais.",
  },
];

export function isCurrentNavigationItem(href: string, current: URL): boolean {
  const target = new URL(href, current);
  const canonicalPath = current.pathname.replace(/\/index\.html$/u, "/");
  const path = canonicalPath === "/apurar/" ? "/" : canonicalPath;
  return target.pathname === path;
}
