const fs = require('fs');
const path = require('path');

const SR = 22050;
const OUT = path.join(__dirname, '..', 'assets', 'sounds', 'intro.wav');

const NOTE = {
  C4: 261.63, E4: 329.63, G4: 392.00,
  C5: 523.25, E5: 659.26, G5: 783.99, A5: 880,
  C6: 1046.50, E6: 1318.51, G6: 1567.98, C7: 2093.00,
};

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

function bell(buf, startSec, freq, durSec, vol = 0.35) {
  const start = Math.floor(startSec * SR);
  const len = Math.floor(durSec * SR);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const att = Math.min(1, t / 0.005);
    const dec = Math.exp(-t * 1.8);
    const env = att * dec;
    const w =
      Math.sin(2 * Math.PI * freq * t) +
      0.45 * Math.sin(2 * Math.PI * freq * 2 * t) +
      0.20 * Math.sin(2 * Math.PI * freq * 3 * t) +
      0.08 * Math.sin(2 * Math.PI * freq * 5 * t);
    if (start + i < buf.length) buf[start + i] += (w / 1.73) * env * vol;
  }
}

// Whoosh: filtered noise sweeping up
function whoosh(buf, startSec, durSec, vol = 0.18) {
  const start = Math.floor(startSec * SR);
  const len = Math.floor(durSec * SR);
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.sin((t / durSec) * Math.PI) ** 1.5;
    const noise = (Math.random() * 2 - 1);
    // simple low-pass that rises in cutoff with time
    const k = 0.05 + 0.5 * (t / durSec);
    prev = prev + k * (noise - prev);
    if (start + i < buf.length) buf[start + i] += prev * env * vol;
  }
}

function pad(buf, startSec, freq, durSec, vol = 0.10) {
  const start = Math.floor(startSec * SR);
  const len = Math.floor(durSec * SR);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const att = Math.min(1, t / 0.1);
    const rel = Math.min(1, (len - i) / (SR * 0.3));
    const env = att * rel;
    const w = Math.sin(2 * Math.PI * freq * t);
    if (start + i < buf.length) buf[start + i] += w * env * vol * 0.6;
  }
}

const TOTAL_SEC = 3.6;
const out = new Float32Array(Math.floor(TOTAL_SEC * SR));

// Massive rising whoosh build-up (~1.5s, grows in volume)
function buildupWhoosh(buf, startSec, durSec) {
  const start = Math.floor(startSec * SR);
  const len = Math.floor(durSec * SR);
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const progress = t / durSec;
    const vol = Math.pow(progress, 1.6) * 0.42;
    const noise = Math.random() * 2 - 1;
    const k = 0.04 + 0.55 * progress;
    prev = prev + k * (noise - prev);
    if (start + i < buf.length) buf[start + i] += prev * vol;
  }
}

// Sub-bass rumble for tension
function rumble(buf, startSec, durSec, vol = 0.18) {
  const start = Math.floor(startSec * SR);
  const len = Math.floor(durSec * SR);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const progress = t / durSec;
    const env = Math.pow(progress, 1.4);
    const freq = 50 + progress * 30;
    if (start + i < buf.length)
      buf[start + i] += Math.sin(2 * Math.PI * freq * t) * env * vol;
  }
}

// Build-up phase
buildupWhoosh(out, 0.05, 1.55);
rumble(out, 0.0, 1.6, 0.22);

// Pre-impact crescendo cymbal-like white noise burst
function impactSizzle(buf, atSec, durSec, vol = 0.35) {
  const start = Math.floor(atSec * SR);
  const len = Math.floor(durSec * SR);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 8);
    if (start + i < buf.length)
      buf[start + i] += (Math.random() * 2 - 1) * env * vol;
  }
}
impactSizzle(out, 1.55, 0.5, 0.28);

// BIG IMPACT - chord stinger at 1.6s (when "TITU GAMES" lands)
['C4', 'G4', 'C5', 'E5', 'G5', 'C6'].forEach((n) =>
  bell(out, 1.6, NOTE[n], 1.9, 0.34)
);

// Sustaining pad after impact
pad(out, 1.6, NOTE.C4, 1.9, 0.18);
pad(out, 1.6, NOTE.G4, 1.9, 0.14);

// Sparkle arpeggio cascading down
const sparkle = ['C7', 'G6', 'E6', 'C6', 'G5'];
sparkle.forEach((n, i) => bell(out, 2.0 + i * 0.10, NOTE[n], 0.9, 0.26));

// Final shimmer
bell(out, 2.7, NOTE.E6, 0.7, 0.22);
bell(out, 2.85, NOTE.G6, 0.7, 0.22);
bell(out, 3.0, NOTE.C7, 0.6, 0.20);

// Fade out
const fade = Math.floor(0.35 * SR);
for (let i = 0; i < fade; i++) {
  out[out.length - fade + i] *= 1 - i / fade;
}

writeWav(OUT, out);
console.log('Wrote', OUT);
