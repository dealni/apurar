import manifest from "./emotes-manifest.json";

const assets = import.meta.glob<string>("./assets/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});
export const emotes = manifest.map(({ name, label, file }) => {
  const src = assets[`./assets/${file}`];
  if (!src) throw new Error(`Asset de meme ausente: ${file}`);
  return { name, label, token: `:${name}:`, src };
});
const byToken = new Map(emotes.map((emote) => [emote.token, emote]));

/** Apenas códigos conhecidos viram imagens locais; o restante continua texto. */
export function renderMessageText(container: HTMLElement, value: string) {
  for (const part of value.split(/(:[A-Za-z0-9]+:)/u)) {
    const emote = byToken.get(part);
    if (!emote) {
      container.append(document.createTextNode(part));
      continue;
    }
    const image = document.createElement("img");
    image.className = "live-chat-emote";
    image.src = emote.src;
    image.alt = emote.token;
    image.title = `${emote.name} · ${emote.label}`;
    image.width = 32;
    image.height = 32;
    container.append(image);
  }
}
