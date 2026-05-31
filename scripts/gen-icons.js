// Generates the app icon set for "Snake & Multiply" from SVG using sharp.
// Run with: node scripts/gen-icons.js
const sharp = require('sharp');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');
const S = 1024;

// ---- gradient / paint defs ----
const DEFS = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7C3AED"/>
      <stop offset="0.52" stop-color="#DB2777"/>
      <stop offset="1" stop-color="#FB923C"/>
    </linearGradient>
    <radialGradient id="bgGlow" cx="50%" cy="34%" r="62%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="xGlow">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="snake" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6EE7B7"/>
      <stop offset="1" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="xg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FEF08A"/>
      <stop offset="1" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>`;

// ---- the snake + multiply artwork (no background) ----
function artwork({ mono = false } = {}) {
  const snakeFill = mono ? '#ffffff' : 'url(#snake)';
  const snakeDark = mono ? '#ffffff' : '#047857';
  const xFill = mono ? '#ffffff' : 'url(#xg)';
  const xRim = mono ? '#ffffff' : '#B45309';
  return `
    ${mono ? '' : '<circle cx="512" cy="452" r="232" fill="url(#xGlow)"/>'}

    <!-- multiply "x" hero (rim + fill) -->
    <g transform="rotate(45 512 452)">
      <rect x="462" y="294" width="100" height="316" rx="50" fill="${xRim}"/>
      <rect x="354" y="402" width="316" height="100" rx="50" fill="${xRim}"/>
      <rect x="472" y="302" width="80"  height="300" rx="40" fill="${xFill}"/>
      <rect x="362" y="412" width="300" height="80"  rx="40" fill="${xFill}"/>
    </g>

    <!-- snake body (dark underlay + bright top) sitting under the x -->
    <path d="M 360 654 Q 512 772 664 654" fill="none"
          stroke="${snakeDark}" stroke-width="104" stroke-linecap="round"/>
    <path d="M 360 654 Q 512 772 664 654" fill="none"
          stroke="${snakeFill}" stroke-width="86" stroke-linecap="round"/>

    <!-- head -->
    <circle cx="664" cy="652" r="66" fill="${snakeDark}"/>
    <circle cx="664" cy="652" r="58" fill="${snakeFill}"/>
    ${
      mono
        ? ''
        : `
      <circle cx="652" cy="636" r="15" fill="#ffffff"/>
      <circle cx="684" cy="648" r="15" fill="#ffffff"/>
      <circle cx="656" cy="639" r="7" fill="#0f172a"/>
      <circle cx="688" cy="651" r="7" fill="#0f172a"/>
      <path d="M 706 636 L 744 616 M 744 616 L 768 612 M 744 616 L 756 592"
            stroke="#EF4444" stroke-width="11" stroke-linecap="round" fill="none"/>`
    }`;
}

// The artwork's natural visual centre (the x sits above, snake below).
const ART_CX = 512;
const ART_CY = 553;

// Scale + recentre the artwork to fill the icon. `scale` 1 = natural size.
function placed(inner, scale) {
  return `<g transform="translate(${ART_CX} 512) scale(${scale}) translate(-${ART_CX} -${ART_CY})">${inner}</g>`;
}

function svgFull() {
  return `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
    ${DEFS}
    <rect width="${S}" height="${S}" fill="url(#bg)"/>
    <rect width="${S}" height="${S}" fill="url(#bgGlow)"/>
    ${placed(artwork(), 1.5)}
  </svg>`;
}

function svgBackground() {
  return `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
    ${DEFS}
    <rect width="${S}" height="${S}" fill="url(#bg)"/>
    <rect width="${S}" height="${S}" fill="url(#bgGlow)"/>
  </svg>`;
}

// Foreground / monochrome keep art inside Android's ~66% safe zone.
function svgForeground({ mono = false } = {}) {
  return `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
    ${DEFS}
    ${placed(artwork({ mono }), 1.12)}
  </svg>`;
}

async function render(svg, file, size = S) {
  let img = sharp(Buffer.from(svg)).resize(size, size);
  await img.png().toFile(path.join(ASSETS, file));
  console.log('wrote', file, size + 'px');
}

(async () => {
  await render(svgFull(), 'icon.png');
  await render(svgBackground(), 'android-icon-background.png');
  await render(svgForeground(), 'android-icon-foreground.png');
  await render(svgForeground({ mono: true }), 'android-icon-monochrome.png');
  await render(svgForeground(), 'splash-icon.png');
  await render(svgFull(), 'favicon.png', 64);
  console.log('done');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
