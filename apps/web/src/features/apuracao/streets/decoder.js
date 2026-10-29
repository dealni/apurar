import { ProtobufReader, readValue } from './protobuf.js';
import { layers, layersByName } from './styles.js';
import { tileToMap, tileTransform } from './projection.js';

function readLayer(reader) {
  const length = reader.varint();
  const layer = {
    end: reader.position + length,
    name: '',
    extent: 4096,
    keys: [],
    values: [],
    features: [],
  };
  while (reader.position < layer.end) {
    const tag = reader.varint();
    switch (tag) {
      case 10:
        layer.name = reader.text();
        break;
      case 18:
        layer.features.push(reader.range());
        break;
      case 26:
        layer.keys.push(reader.text());
        break;
      case 34:
        layer.values.push(readValue(reader));
        break;
      case 40:
        layer.extent = reader.varint();
        break;
      default:
        reader.skip(tag & 7);
    }
  }
  return layer;
}

function readFeature(reader, range) {
  reader.position = range[0];
  const feature = { type: 0, tags: null, geometry: null };
  while (reader.position < range[1]) {
    const tag = reader.varint();
    if (tag === 18) feature.tags = reader.range();
    else if (tag === 24) feature.type = reader.varint();
    else if (tag === 34) feature.geometry = reader.range();
    else reader.skip(tag & 7);
  }
  return feature;
}

function readProperties(reader, layer, range) {
  const properties = { c: null, s: null, b: null };
  if (!range) return properties;
  reader.position = range[0];
  const names = { class: 'c', subclass: 's', brunnel: 'b' };
  while (reader.position < range[1]) {
    const key = layer.keys[reader.varint()];
    const value = layer.values[reader.varint()];
    if (Object.hasOwn(names, key)) properties[names[key]] = value;
  }
  return properties;
}

function selectStyle(indices, feature, properties) {
  return indices.find((index) => {
    const style = layers[index];
    return (
      (style.fill ? feature.type === 3 : feature.type === 2) &&
      style.ok(properties)
    );
  });
}

function appendGeometry(reader, range, path, transform, origin) {
  reader.position = range[0];
  let x = 0;
  let y = 0;
  while (reader.position < range[1]) {
    const command = reader.varint();
    const operation = command & 7;
    if (operation === 7) {
      path.closePath();
      continue;
    }
    for (let index = 0; index < command >> 3; index++) {
      x += reader.signed();
      y += reader.signed();
      const mapX =
        transform[0] - origin[0] + x * transform[2] + y * transform[4];
      const mapY =
        transform[1] - origin[1] + x * transform[3] + y * transform[5];
      if (operation === 1) path.moveTo(mapX, mapY);
      else path.lineTo(mapX, mapY);
    }
  }
}

function appendLayer(reader, layer, tile, origin, paths) {
  const indices = layersByName.get(layer.name);
  if (!indices) return;
  const transform = tileTransform(...tile, layer.extent);
  for (const range of layer.features) {
    const feature = readFeature(reader, range);
    if (feature.type < 2 || !feature.geometry) continue;
    const properties = readProperties(reader, layer, feature.tags);
    const style = selectStyle(indices, feature, properties);
    if (style === undefined) continue;
    const path = paths[style] || (paths[style] = new Path2D());
    appendGeometry(reader, feature.geometry, path, transform, origin);
  }
}

export function decodeTile(buffer, zoom, x, y) {
  const reader = new ProtobufReader(buffer);
  const tile = [zoom, x, y];
  const origin = tileToMap(...tile);
  const paths = layers.map(() => null);
  while (reader.position < reader.bytes.length) {
    const tag = reader.varint();
    if (tag !== 26) {
      reader.skip(tag & 7);
      continue;
    }
    const layer = readLayer(reader);
    appendLayer(reader, layer, tile, origin, paths);
    reader.position = layer.end;
  }
  return { o: origin, paths };
}
