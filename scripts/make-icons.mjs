// Generates the PWA/notification PNG icons (no image libraries needed).
// Usage: node scripts/make-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

let crcTable = null;
function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

function crc32(buf) {
  if (!crcTable) crcTable = makeCrcTable();
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function encodePng(size, pixelAt) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y += 1) {
    raw[y * stride] = 0; // filter: none
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = pixelAt(x, y);
      const offset = y * stride + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const GREEN = [18, 64, 47, 255]; // #12402F
const WHITE = [255, 255, 255, 255];

// Stylised rupee glyph in unit coordinates (0..1 of canvas).
function glyph(nx, ny) {
  const bar1 = ny >= 0.3 && ny <= 0.375 && nx >= 0.32 && nx <= 0.68;
  const bar2 = ny >= 0.44 && ny <= 0.515 && nx >= 0.32 && nx <= 0.68;
  const stem = nx >= 0.4 && nx <= 0.475 && ny >= 0.3 && ny <= 0.6;
  const legStart = ny >= 0.58 && ny <= 0.75;
  const legX = 0.44 + (ny - 0.58) * 1.06;
  const leg = legStart && nx >= legX && nx <= legX + 0.075;
  return bar1 || bar2 || stem || leg;
}

function roundedRectInside(x, y, size, radius) {
  const dx = Math.max(radius - x, x - (size - radius), 0);
  const dy = Math.max(radius - y, y - (size - radius), 0);
  return Math.hypot(dx, dy) <= radius;
}

function makeIcon(size, { maskable = false, transparent = false } = {}) {
  const glyphScale = maskable ? 0.62 : 0.78;
  const radius = maskable ? 0 : size * 0.2;
  return encodePng(size, (x, y) => {
    if (!transparent && !roundedRectInside(x, y, size, radius)) return [0, 0, 0, 0];
    if (transparent) {
      // badge icons are white glyph on transparent background
      const nx = 0.5 + (x / size - 0.5) / glyphScale;
      const ny = 0.5 + (y / size - 0.5) / glyphScale;
      return glyph(nx, ny) ? WHITE : [0, 0, 0, 0];
    }
    const nx = 0.5 + (x / size - 0.5) / glyphScale;
    const ny = 0.5 + (y / size - 0.5) / glyphScale;
    return glyph(nx, ny) ? WHITE : GREEN;
  });
}

fs.mkdirSync(publicDir, { recursive: true });
const icons = [
  ['icon-192.png', makeIcon(192)],
  ['icon-512.png', makeIcon(512)],
  ['icon-maskable-512.png', makeIcon(512, { maskable: true })],
  ['badge-72.png', makeIcon(72, { transparent: true })],
];
for (const [name, buffer] of icons) {
  fs.writeFileSync(path.join(publicDir, name), buffer);
  console.log(`wrote public/${name} (${buffer.length} bytes)`);
}
