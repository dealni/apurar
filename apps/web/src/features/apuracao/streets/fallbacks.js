import { tileClipPath } from './projection.js';

function parentTile(cache, tile) {
  for (let depth = 1; depth <= 4 && tile.z - depth >= 0; depth++) {
    const parent = cache.tiles.get(
      `${tile.z - depth}/${tile.x >> depth}/${tile.y >> depth}`,
    );
    if (parent && parent.st === 'ok') return parent;
  }
  return null;
}

function childTiles(cache, tile) {
  return [0, 1, 2, 3]
    .map((index) =>
      cache.tiles.get(
        `${tile.z + 1}/${2 * tile.x + (index & 1)}/${2 * tile.y + (index >> 1)}`,
      ),
    )
    .filter((child) => child && child.st === 'ok');
}

/** Recorta telhas de outros níveis pela área da telha ainda pendente. */
export function fallbackClips(cache, pending) {
  const clips = new Map();
  for (const tile of pending) {
    const parent = parentTile(cache, tile);
    const alternatives = parent ? [parent] : childTiles(cache, tile);
    for (const alternative of alternatives) {
      alternative.use = cache.frame;
      if (!clips.has(alternative)) clips.set(alternative, new Path2D());
      clips.get(alternative).addPath(tileClipPath(tile.z, tile.x, tile.y));
    }
  }
  return clips;
}
