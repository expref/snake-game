// Derives the full app icon set from the approved v6 art (assets/icon-v6-1024.png).
// The v6 design is a flat PNG (gradient baked in), so every variant is produced
// from those pixels rather than re-drawing the art. Run: node scripts/gen-icons-v6.js
const sharp = require('sharp');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');
const SRC = path.join(ASSETS, 'icon-v6-1024.png');
const S = 1024;

// Foreground art is scaled into Android's ~safe zone so the wordmark is never
// clipped by the circular/squircle adaptive mask.
const FG_SCALE = 0.74;

async function writeMainIcon() {
  await sharp(SRC).resize(S, S).png().toFile(path.join(ASSETS, 'icon.png'));
  console.log('wrote icon.png');
}

async function writeFavicon() {
  await sharp(SRC).resize(64, 64).png().toFile(path.join(ASSETS, 'favicon.png'));
  console.log('wrote favicon.png');
}

// Background = the v6 art blurred + zoomed to fill, so the adaptive surround is
// colour-matched to the foreground and the seam at the foreground edge vanishes.
async function writeBackground() {
  const zoom = Math.round(S * 1.18);
  await sharp(SRC)
    .resize(zoom, zoom)
    .extract({ left: (zoom - S) >> 1, top: (zoom - S) >> 1, width: S, height: S })
    .blur(48)
    .png()
    .toFile(path.join(ASSETS, 'android-icon-background.png'));
  console.log('wrote android-icon-background.png');
}

// A soft-edged alpha mask: rounded square at FG_SCALE, feathered so the sharp
// foreground melts into the blurred background.
function featherMask() {
  const inner = Math.round(S * FG_SCALE);
  const off = (S - inner) >> 1;
  const r = Math.round(inner * 0.16);
  const svg = `<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${off}" y="${off}" width="${inner}" height="${inner}" rx="${r}" ry="${r}" fill="#fff"/>
  </svg>`;
  return sharp(Buffer.from(svg)).blur(22).flatten({ background: '#000' }).toColourspace('b-w').raw().toBuffer();
}

// Foreground = sharp v6 scaled into the safe zone, edges feathered to transparent.
async function writeForeground() {
  const inner = Math.round(S * FG_SCALE);
  const off = (S - inner) >> 1;
  const art = await sharp(SRC)
    .resize(inner, inner)
    .extend({ top: off, bottom: S - inner - off, left: off, right: S - inner - off, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const mask = await featherMask();
  // Multiply existing alpha by the feather mask (dest-in).
  for (let i = 0; i < S * S; i++) {
    art[i * 4 + 3] = Math.round((art[i * 4 + 3] * mask[i]) / 255);
  }
  await sharp(art, { raw: { width: S, height: S, channels: 4 } })
    .png()
    .toFile(path.join(ASSETS, 'android-icon-foreground.png'));
  console.log('wrote android-icon-foreground.png');
}

// Splash reuses the framed foreground composited on the matching background.
async function writeSplash() {
  const bg = await sharp(path.join(ASSETS, 'android-icon-background.png')).toBuffer();
  const fg = await sharp(path.join(ASSETS, 'android-icon-foreground.png')).toBuffer();
  await sharp(bg).composite([{ input: fg }]).png().toFile(path.join(ASSETS, 'splash-icon.png'));
  console.log('wrote splash-icon.png');
}

// Monochrome (Android themed icons): keep the white "Learn Maths" wordmark as a
// white-on-transparent silhouette. White text = high lightness + low saturation;
// the saturated orange bg and green snake drop out.
async function writeMonochrome() {
  const { data } = await sharp(SRC).resize(S, S).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(S * S * 4, 0);
  for (let i = 0; i < S * S; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const light = (max + min) / 2;
    const sat = max === 0 ? 0 : (max - min) / max;
    // Keep the white wordmark AND the green snake (which forms the L and the S),
    // dropping only the orange background so "Learn Maths" stays whole.
    const isWhiteText = light > 200 && sat < 0.18;
    const isSnake = g >= r && g >= b && sat > 0.15;
    if (isWhiteText || isSnake) {
      out[i * 4] = 255; out[i * 4 + 1] = 255; out[i * 4 + 2] = 255; out[i * 4 + 3] = 255;
    }
  }
  // Scale the wordmark into the safe zone and soften jaggies.
  const mono = await sharp(out, { raw: { width: S, height: S, channels: 4 } })
    .resize(Math.round(S * FG_SCALE), Math.round(S * FG_SCALE))
    .blur(1.2)
    .png()
    .toBuffer();
  const off = (S - Math.round(S * FG_SCALE)) >> 1;
  await sharp({ create: { width: S, height: S, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: mono, left: off, top: off }])
    .png()
    .toFile(path.join(ASSETS, 'android-icon-monochrome.png'));
  console.log('wrote android-icon-monochrome.png');
}

(async () => {
  await writeMainIcon();
  await writeFavicon();
  await writeBackground();
  await writeForeground();
  await writeSplash();
  await writeMonochrome();
  console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });
