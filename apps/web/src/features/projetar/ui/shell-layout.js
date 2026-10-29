export function layoutDoPainel({ width, height, tv, shell }) {
  const portrait = height >= width;
  const mobile = width < 1000 && (portrait || height < 640);
  const landscape = mobile && !portrait && width >= 700;
  const tablet = mobile && portrait && width >= 700;
  const tabs = !!shell && mobile && !landscape && !tablet && !tv;
  const flow = mobile && !landscape && !tablet && !tv && !tabs;
  return { mobile, landscape, tablet, tabs, flow };
}
