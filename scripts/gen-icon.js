const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SIZE = 1024;
const ASSETS = path.join(__dirname, '..', 'assets');

// Helper: a bead (small circle) along the snake body
function bead(cx, cy, r, c1, c2) {
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#snakeGrad)" stroke="#fff" stroke-width="3" stroke-opacity="0.5"/>
  `;
}

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1a0b2e"/>
      <stop offset="0.5" stop-color="#3b1578"/>
      <stop offset="1" stop-color="#0f0c29"/>
    </linearGradient>
    <linearGradient id="snakeGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd166"/>
      <stop offset="0.4" stop-color="#ee0979"/>
      <stop offset="1" stop-color="#5b86e5"/>
    </linearGradient>
    <linearGradient id="badge2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#36d1dc"/>
      <stop offset="1" stop-color="#5b86e5"/>
    </linearGradient>
    <linearGradient id="badge4" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#56ab2f"/>
      <stop offset="1" stop-color="#a8e063"/>
    </linearGradient>
    <linearGradient id="badge6" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f7b733"/>
      <stop offset="1" stop-color="#fc4a1a"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.6">
      <stop offset="0" stop-color="rgba(255,200,255,0.45)"/>
      <stop offset="1" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>

  <!-- background -->
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
  <!-- soft glow behind snake -->
  <circle cx="512" cy="512" r="430" fill="url(#glow)"/>

  <!-- decorative orbits / sparkles -->
  <circle cx="160" cy="180" r="6" fill="#fff" opacity="0.6"/>
  <circle cx="280" cy="120" r="4" fill="#fff" opacity="0.5"/>
  <circle cx="880" cy="840" r="6" fill="#fff" opacity="0.6"/>
  <circle cx="760" cy="920" r="4" fill="#fff" opacity="0.5"/>
  <circle cx="900" cy="200" r="5" fill="#fff" opacity="0.5"/>
  <circle cx="120" cy="820" r="5" fill="#fff" opacity="0.5"/>

  <!-- Snake body: a sequence of beads in an S-curve -->
  <!-- Beads laid along a sinusoidal path from (220, 760) to (804, 264) -->
  <g>
    ${(() => {
      const start = { x: 240, y: 770 };
      const end = { x: 790, y: 270 };
      const beads = [];
      const N = 14;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        // base linear interpolation
        const x = start.x + (end.x - start.x) * t;
        const y = start.y + (end.y - start.y) * t;
        // sinusoidal offset perpendicular to the line for S-curve
        const ox = Math.sin(t * Math.PI * 2) * 95;
        const oy = -Math.sin(t * Math.PI * 2) * 95;
        // size grows toward the head
        const r = 38 + t * 30;
        beads.push(bead(x + ox, y + oy, r));
      }
      return beads.join('');
    })()}
  </g>

  <!-- Head -->
  <circle cx="855" cy="240" r="92" fill="url(#snakeGrad)" stroke="#fff" stroke-width="5" stroke-opacity="0.7"/>
  <!-- Eye -->
  <circle cx="880" cy="220" r="22" fill="#fff"/>
  <circle cx="886" cy="220" r="12" fill="#0f0c29"/>
  <!-- Tongue -->
  <path d="M 940 280 Q 985 295, 990 320 M 990 320 L 1005 305 M 990 320 L 1005 335"
        stroke="#ff416c" stroke-width="9" fill="none" stroke-linecap="round"/>

  <!-- Number badges -->
  <g>
    <circle cx="200" cy="320" r="68" fill="url(#badge2)" stroke="#fff" stroke-width="6"/>
    <text x="200" y="358" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="86" font-weight="900" fill="#fff">2</text>
  </g>
  <g>
    <circle cx="820" cy="630" r="68" fill="url(#badge4)" stroke="#fff" stroke-width="6"/>
    <text x="820" y="668" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="86" font-weight="900" fill="#fff">4</text>
  </g>
  <g>
    <circle cx="320" cy="850" r="68" fill="url(#badge6)" stroke="#fff" stroke-width="6"/>
    <text x="320" y="888" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="86" font-weight="900" fill="#fff">6</text>
  </g>
</svg>
`;

async function build() {
  const png = await sharp(Buffer.from(svg))
    .resize(SIZE, SIZE)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(ASSETS, 'icon.png'), png);
  console.log('Wrote', path.join(ASSETS, 'icon.png'));

  // Adaptive android background = solid gradient bg only (no transparent edges)
  const bgSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#1a0b2e"/>
          <stop offset="0.5" stop-color="#3b1578"/>
          <stop offset="1" stop-color="#0f0c29"/>
        </linearGradient>
      </defs>
      <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
    </svg>
  `;
  const bgPng = await sharp(Buffer.from(bgSvg)).resize(SIZE, SIZE).png().toBuffer();
  fs.writeFileSync(path.join(ASSETS, 'android-icon-background.png'), bgPng);

  // Adaptive foreground: same as icon but on transparent bg
  const fgSvg = svg.replace(
    /<rect width="\$\{SIZE\}" height="\$\{SIZE\}" fill="url\(#bg\)"\/>/,
    ''
  ).replace(
    `<rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>`,
    ''
  );
  const fgPng = await sharp(Buffer.from(fgSvg)).resize(SIZE, SIZE).png().toBuffer();
  fs.writeFileSync(path.join(ASSETS, 'android-icon-foreground.png'), fgPng);

  // Monochrome variant: black on transparent (just outlines)
  const monoSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
      <!-- simplified snake outline -->
      <circle cx="855" cy="240" r="92" fill="#000"/>
      <g fill="#000">
        ${(() => {
          const beads = [];
          const N = 14;
          const start = { x: 240, y: 770 };
          const end = { x: 790, y: 270 };
          for (let i = 0; i <= N; i++) {
            const t = i / N;
            const x = start.x + (end.x - start.x) * t;
            const y = start.y + (end.y - start.y) * t;
            const ox = Math.sin(t * Math.PI * 2) * 95;
            const oy = -Math.sin(t * Math.PI * 2) * 95;
            const r = 38 + t * 30;
            beads.push(`<circle cx="${x + ox}" cy="${y + oy}" r="${r}"/>`);
          }
          return beads.join('');
        })()}
      </g>
    </svg>
  `;
  const monoPng = await sharp(Buffer.from(monoSvg)).resize(SIZE, SIZE).png().toBuffer();
  fs.writeFileSync(path.join(ASSETS, 'android-icon-monochrome.png'), monoPng);

  console.log('Wrote all icon variants');
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
