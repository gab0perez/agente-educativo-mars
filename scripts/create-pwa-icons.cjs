const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Helper to calculate CRC32
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    crc = crc ^ byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xEDB88320);
    }
  }
  return (crc ^ -1) >>> 0;
}

// Generate PNG buffer with width, height, and pixel generator (x, y) => [r, g, b, a]
function createPng(width, height, pixelFn) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // no interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crcBuf = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crcVal = crc32(crcBuf);
  buf.writeUInt32BE(crcVal, 8 + len);
  return buf;
}

// Draw floral emblem of MAR
function marIconRenderer(x, y, w, h, isMaskable = false) {
  const nx = (x / w) * 2 - 1; // -1 to 1
  const ny = (y / h) * 2 - 1; // -1 to 1
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Background
  let bgR = 250, bgG = 240, bgB = 245; // Soft warm pink #FAF0F5
  // Gradient from top-left to bottom-right
  const grad = (nx + ny + 2) / 4;
  bgR = Math.round(255 - grad * 25);
  bgG = Math.round(242 - grad * 35);
  bgB = Math.round(246 - grad * 25);

  if (!isMaskable) {
    // Squircle rounding
    const p = Math.pow(Math.abs(nx), 4) + Math.pow(Math.abs(ny), 4);
    if (p > 0.85) {
      return [0, 0, 0, 0]; // Transparent outside squircle
    }
  }

  // Scale factor for inner flower (maskable needs safe zone)
  const scale = isMaskable ? 0.55 : 0.65;
  const fx = nx / scale;
  const fy = ny / scale;
  const fdist = Math.sqrt(fx * fx + fy * fy);
  const angle = Math.atan2(fy, fx);

  // Flower 5 petals math formula: r = 0.5 + 0.35 * cos(5 * theta)
  const petalR = 0.45 + 0.35 * Math.cos(5 * (angle - Math.PI / 2));
  
  if (fdist < petalR) {
    // Inside petals
    const petalGrad = fdist / petalR;
    // Rose pink gradient: Deep rose (#E91E63 / #D81B60) to pastel pink (#FF80AB)
    const r = Math.round(233 + (255 - 233) * (1 - petalGrad));
    const g = Math.round(30 + (128 - 30) * (1 - petalGrad));
    const b = Math.round(99 + (171 - 99) * (1 - petalGrad));
    
    // Pistil / Core center
    if (fdist < 0.18) {
      // Golden yellow core (#FFC107 / #FFD54F)
      return [255, 193, 7, 255];
    }
    if (fdist < 0.22) {
      return [255, 224, 130, 255];
    }
    return [r, g, b, 255];
  }

  // Ring around flower
  if (fdist > 0.88 && fdist < 0.94) {
    return [255, 255, 255, 200];
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate icons
const icon192 = createPng(192, 192, (x, y, w, h) => marIconRenderer(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);

const icon512 = createPng(512, 512, (x, y, w, h) => marIconRenderer(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);

const iconMaskable = createPng(512, 512, (x, y, w, h) => marIconRenderer(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), iconMaskable);

const appleTouchIcon = createPng(180, 180, (x, y, w, h) => marIconRenderer(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);

console.log('Successfully generated PWA PNG icons in public/ directory!');
