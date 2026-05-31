// Generates Google Play store graphics into ./store:
//   play-icon-512.png  — 512x512 hi-res app icon (no transparency)
//   feature-graphic.png — 1024x500 feature banner
// Run: node scripts/gen-store-graphics.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PURPLE = '#7C3AED';
const PINK = '#EC4899';
const ORANGE = '#F97316';
const OUT = path.join(__dirname, '..', 'store');
const ICON = path.join(__dirname, '..', 'assets', 'icon.png');

// A rounded-corner tile cut from the real app icon.
async function iconTile(size, radius) {
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${radius}" fill="#fff"/>
    </svg>`
  );
  return sharp(ICON)
    .resize(size, size)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

// 512x512 hi-res icon: the real app icon, flattened (Play wants no transparency).
async function playIcon() {
  await sharp(ICON)
    .resize(512, 512)
    .flatten({ background: PURPLE })
    .png()
    .toFile(path.join(OUT, 'play-icon-512.png'));
  console.log('wrote play-icon-512.png (512x512)');
}

// 1024x500 feature graphic: app-style dark gradient, icon tile, title, shapes.
async function featureGraphic() {
  const W = 1024;
  const H = 500;
  const svg = `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#0f0c29"/>
        <stop offset="0.55" stop-color="#302b63"/>
        <stop offset="1" stop-color="#24243e"/>
      </linearGradient>
      <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${PURPLE}"/>
        <stop offset="0.55" stop-color="${PINK}"/>
        <stop offset="1" stop-color="${ORANGE}"/>
      </linearGradient>
      <linearGradient id="pill" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#36d1dc"/>
        <stop offset="1" stop-color="#5b86e5"/>
      </linearGradient>
    </defs>

    <rect width="${W}" height="${H}" fill="url(#bg)"/>

    <!-- faint decorative shapes -->
    <g opacity="0.10" fill="#ffffff">
      <circle cx="880" cy="120" r="70"/>
      <polygon points="780,360 840,460 720,460"/>
      <polygon points="980,330 1000,392 965,430 935,392"/>
    </g>

    <!-- number food pills -->
    <g font-family="Segoe UI, Arial, sans-serif" font-weight="800" font-size="34" fill="#ffffff" text-anchor="middle">
      <rect x="690" y="70" width="74" height="74" rx="18" fill="url(#pill)"/>
      <text x="727" y="118">2</text>
      <rect x="820" y="380" width="74" height="74" rx="18" fill="url(#tile)"/>
      <text x="857" y="428">12</text>
    </g>

    <!-- title + tagline -->
    <g font-family="Segoe UI, Arial, Helvetica, sans-serif" fill="#ffffff">
      <text x="372" y="210" font-size="74" font-weight="800">Snake &amp;</text>
      <text x="372" y="290" font-size="74" font-weight="800">Multiply</text>
      <text x="374" y="344" font-size="30" font-weight="600" fill="#a8b0ff">Times tables, the fun way — ×2 to ×12</text>
      <text x="374" y="392" font-size="26" font-weight="700" fill="#ffd200">Eat · Multiply · Reveal · Win</text>
    </g>
  </svg>`;

  const tile = await iconTile(260, 58);
  // First pass: render + composite the icon tile.
  const composited = await sharp(Buffer.from(svg))
    .composite([{ input: tile, left: 70, top: 120 }])
    .png()
    .toBuffer();
  // Second pass: strip the alpha channel (Play forbids transparency).
  await sharp(composited)
    .removeAlpha()
    .png()
    .toFile(path.join(OUT, 'feature-graphic.png'));
  console.log('wrote feature-graphic.png (1024x500)');
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  await playIcon();
  await featureGraphic();
  console.log('done →', OUT);
}
main();
