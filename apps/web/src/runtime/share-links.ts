/** Links de composição: nenhuma publicação ou SDK de terceiros é executado aqui. */
export function shareLinks(url: string, title: string) {
  const link = encodeURIComponent(url);
  const text = encodeURIComponent(title);
  return [
    {
      name: "WhatsApp",
      icon: "whatsapp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
    },
    {
      name: "Telegram",
      icon: "telegram",
      href: `https://t.me/share/url?url=${link}&text=${text}`,
    },
    {
      name: "X",
      icon: "x",
      href: `https://x.com/intent/tweet?url=${link}&text=${text}`,
    },
    {
      name: "Facebook",
      icon: "facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${link}`,
    },
  ];
}
