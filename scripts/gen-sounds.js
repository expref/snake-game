const fs = require('fs');
const path = require('path');

const SR = 22050;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'sounds');

function writeWav(filename, samples) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (SR * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);

  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(numChannels, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(bitsPerSample, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filename, buf);
}

function genEat() {
  const duration = 0.12;
  const n = Math.floor(SR * duration);
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const freq = 880 + (1760 - 880) * (t / duration);
    const env = Math.exp(-t * 18);
    const tri = 2 * Math.abs(2 * ((freq * t) % 1) - 1) - 1;
    out[i] = tri * env * 0.45;
  }
  return out;
}

function genDead() {
  const duration = 0.55;
  const n = Math.floor(SR * duration);
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const freq = 360 * Math.pow(0.35, t * 1.6);
    const env = Math.exp(-t * 3.2);
    const sq = Math.sin(2 * Math.PI * freq * t) >= 0 ? 1 : -1;
    const sine = Math.sin(2 * Math.PI * freq * t);
    out[i] = (sq * 0.35 + sine * 0.65) * env * 0.45;
  }
  return out;
}

writeWav(path.join(OUT_DIR, 'eat.wav'), genEat());
writeWav(path.join(OUT_DIR, 'dead.wav'), genDead());
console.log('Generated eat.wav and dead.wav in', OUT_DIR);
