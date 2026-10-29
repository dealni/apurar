/** Cursor protobuf compartilhado pelos campos de uma única telha vetorial. */
export class ProtobufReader {
  constructor(buffer) {
    this.bytes = new Uint8Array(buffer);
    this.view = new DataView(buffer);
    this.decoder = new TextDecoder();
    this.position = 0;
  }

  varint() {
    let value = 0;
    let factor = 1;
    let byte;
    do {
      byte = this.bytes[this.position++];
      value += (byte & 127) * factor;
      factor *= 128;
    } while (byte & 128 && this.position < this.bytes.length);
    return value;
  }

  signed() {
    const value = this.varint();
    return value % 2 ? -(value + 1) / 2 : value / 2;
  }

  skip(wireType) {
    switch (wireType) {
      case 0:
        this.varint();
        break;
      case 1:
        this.position += 8;
        break;
      case 2: {
        const length = this.varint();
        this.position += length;
        break;
      }
      case 5:
        this.position += 4;
        break;
      default:
        throw new Error('protobuf');
    }
  }

  text() {
    const length = this.varint();
    const value = this.decoder.decode(
      this.bytes.subarray(this.position, this.position + length),
    );
    this.position += length;
    return value;
  }

  float(bytes) {
    const value =
      bytes === 4
        ? this.view.getFloat32(this.position, true)
        : this.view.getFloat64(this.position, true);
    this.position += bytes;
    return value;
  }

  range() {
    const length = this.varint();
    const start = this.position;
    this.position += length;
    return [start, this.position];
  }
}

function readValueField(reader, tag) {
  switch (tag) {
    case 10:
      return reader.text();
    case 21:
      return reader.float(4);
    case 25:
      return reader.float(8);
    case 32:
    case 40:
      return reader.varint();
    case 48:
      return reader.signed();
    case 56:
      return reader.varint() !== 0;
    default:
      reader.skip(tag & 7);
      return undefined;
  }
}

export function readValue(reader) {
  const length = reader.varint();
  const end = reader.position + length;
  let value = null;
  while (reader.position < end) {
    const field = readValueField(reader, reader.varint());
    if (field !== undefined) value = field;
  }
  reader.position = end;
  return value;
}
