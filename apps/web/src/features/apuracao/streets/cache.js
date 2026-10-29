import { decodeTile } from './decoder.js';

/** Fila limitada, tentativas espaçadas e descarte LRU das telhas decodificadas. */
export class TileCache {
  constructor(config) {
    this.config = config;
    this.origin = new URL(config.url, location.href).origin;
    this.template = /\{z\}/.test(config.url) ? config.url : null;
    this.maxZoom = 14;
    this.metadataAttempt = -1e9;
    this.tiles = new Map();
    this.listeners = new Set();
    this.queue = [];
    this.loading = 0;
    this.frame = 0;
    this.revision = 0;
    this.timer = 0;
  }

  notify() {
    this.revision++;
    clearTimeout(this.timer);
    this.timer = setTimeout(
      () => this.listeners.forEach((listener) => listener()),
      250,
    );
  }

  async readMetadata() {
    try {
      const response = await fetch(this.config.url, { credentials: 'omit' });
      if (!response.ok) return;
      const metadata = await response.json();
      if (
        !metadata ||
        !Array.isArray(metadata.tiles) ||
        typeof metadata.tiles[0] !== 'string'
      )
        return;
      const tileUrl = new URL(metadata.tiles[0], this.config.url);
      if (tileUrl.origin !== this.origin) return;
      this.template = tileUrl.href.replace(/%7B/g, '{').replace(/%7D/g, '}');
      if (metadata.maxzoom > 0 && metadata.maxzoom <= 16)
        this.maxZoom = metadata.maxzoom;
      this.pump();
    } catch {
      // Uma captura pode não oferecer metadados; a próxima tentativa respeita o intervalo.
    }
  }

  getTemplate() {
    if (this.template || Date.now() - this.metadataAttempt < 30000)
      return this.template;
    this.metadataAttempt = Date.now();
    void this.readMetadata();
    return null;
  }

  prune() {
    for (const tile of this.tiles.values()) {
      if (
        (tile.st === 'wait' || tile.st === 'fail') &&
        tile.use < this.frame - 50
      )
        this.tiles.delete(tile.k);
    }
    const ready = [...this.tiles.values()].filter((tile) => tile.st === 'ok');
    if (ready.length <= 64) return;
    ready.sort((left, right) => left.use - right.use);
    for (const tile of ready.slice(0, ready.length - 64)) {
      if (tile.use < this.frame) this.tiles.delete(tile.k);
    }
  }

  async load(tile, template) {
    try {
      const url = template
        .replace('{z}', tile.z)
        .replace('{x}', tile.x)
        .replace('{y}', tile.y);
      const response = await fetch(url, { credentials: 'omit' });
      const buffer = await this.readBuffer(response);
      await new Promise((resolve) => setTimeout(resolve));
      const decoded = decodeTile(buffer, tile.z, tile.x, tile.y);
      tile.o = decoded.o;
      tile.paths = decoded.paths;
      tile.st = 'ok';
      this.prune();
      this.notify();
    } catch {
      tile.st = 'fail';
      tile.at = Date.now();
    } finally {
      this.loading--;
      this.pump();
    }
  }

  readBuffer(response) {
    if (response.ok) return response.arrayBuffer();
    if (response.status === 404 || response.status === 204)
      return new ArrayBuffer(0);
    throw new Error(String(response.status));
  }

  pump() {
    const template = this.getTemplate();
    if (!template) return;
    while (this.loading < 6 && this.queue.length) {
      const tile = this.tiles.get(this.queue.shift());
      if (!tile || tile.st !== 'wait') continue;
      tile.st = 'load';
      this.loading++;
      void this.load(tile, template);
    }
  }

  get(zoom, x, y) {
    const key = `${zoom}/${x}/${y}`;
    if (!this.tiles.has(key)) {
      this.tiles.set(key, {
        k: key,
        z: zoom,
        x,
        y,
        st: 'wait',
        o: null,
        paths: null,
        use: 0,
        at: 0,
      });
    }
    return this.tiles.get(key);
  }

  request(coordinates) {
    this.frame++;
    const ready = [];
    const pending = [];
    for (const coordinate of coordinates) {
      const tile = this.get(...coordinate);
      tile.use = this.frame;
      if (tile.st === 'fail' && Date.now() - tile.at > 30000) tile.st = 'wait';
      (tile.st === 'ok' ? ready : pending).push(tile);
    }
    this.queue = pending
      .filter((tile) => tile.st === 'wait')
      .map((tile) => tile.k);
    this.pump();
    return { ready, pending };
  }
}
