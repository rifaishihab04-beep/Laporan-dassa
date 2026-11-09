import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Function to create a clean RGBA PNG buffer with zlib
function createPNG(width, height, drawFn) {
  // RGBA buffer: 4 bytes per pixel
  const rowBytes = width * 4;
  const rawData = Buffer.alloc(height * (rowBytes + 1)); // +1 for PNG filter byte per row

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowBytes + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Compress IDAT data
  const compressed = zlib.deflateSync(rawData);

  // Helper to write chunk
  function makeChunk(type, data) {
    const len = data.length;
    const chunk = Buffer.alloc(12 + len);
    chunk.writeUInt32BE(len, 0);
    chunk.write(type, 4, 4, 'ascii');
    data.copy(chunk, 8);

    // CRC32 of type + data
    const crc = crc32(chunk.subarray(4, 8 + len));
    chunk.writeUInt32BE(crc >>> 0, 8 + len);
    return chunk;
  }

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // Color type 6 (RGBA)
  ihdrData[10] = 0; // Compression 0
  ihdrData[11] = 0; // Filter 0
  ihdrData[12] = 0; // Interlace 0

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 table & calculation
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ 0xffffffff;
}

// Icon drawer: Indigo gradient background with rounded card & bar chart
function drawIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Indigo gradient background #4f46e5 to #3730a3
  const bgR = Math.round(79 + (55 - 79) * ny);
  const bgG = Math.round(70 + (48 - 70) * ny);
  const bgB = Math.round(229 + (163 - 229) * ny);

  // Check if inside inner chart area
  // Bar 1: x from 0.28 to 0.40, y from 0.52 to 0.72 (cyan/light blue)
  if (nx >= 0.28 && nx <= 0.40 && ny >= 0.52 && ny <= 0.72) {
    return [56, 189, 248, 255];
  }
  // Bar 2: x from 0.44 to 0.56, y from 0.40 to 0.72 (emerald green)
  if (nx >= 0.44 && nx <= 0.56 && ny >= 0.40 && ny <= 0.72) {
    return [16, 185, 129, 255];
  }
  // Bar 3: x from 0.60 to 0.72, y from 0.28 to 0.72 (bright indigo)
  if (nx >= 0.60 && nx <= 0.72 && ny >= 0.28 && ny <= 0.72) {
    return [165, 180, 252, 255];
  }

  // Card outline (white transparent)
  if ((nx >= 0.20 && nx <= 0.80 && (Math.abs(ny - 0.20) < 0.02 || Math.abs(ny - 0.78) < 0.02)) ||
      (ny >= 0.20 && ny <= 0.78 && (Math.abs(nx - 0.20) < 0.02 || Math.abs(nx - 0.80) < 0.02))) {
    return [255, 255, 255, 120];
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate required PWA icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, drawIcon));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, drawIcon));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, drawIcon));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, drawIcon));

console.log('PWA PNG icons generated successfully in public/');
