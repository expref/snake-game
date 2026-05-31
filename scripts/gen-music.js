const fs = require('fs');
const path = require('path');

const SR = 22050;
const OUT = path.join(__dirname, '..', 'assets', 'sounds', 'music.wav');

const NOTE = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.26, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98,
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

// Bell-like tone: sine + small harmonic, with quick attack and slow exponential decay
function bell(buf, startSec, freq, durSec, vol = 0.22) {
  const start = Math.floor(startSec * SR);
  const len = Math.floor(durSec * SR);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    // attack-then-exp-decay envelope
    const att = Math.min(1, t / 0.01);
    const dec = Math.exp(-t * 2.4);
    const env = att * dec;
    const wave =
      Math.sin(2 * Math.PI * freq * t) +
      0.35 * Math.sin(2 * Math.PI * freq * 2 * t) +
      0.12 * Math.sin(2 * Math.PI * freq * 3 * t);
    const v = (wave / 1.47) * env * vol;
    if (start + i < buf.length) buf[start + i] += v;
  }
}

// Soft sine bass pad
function pad(buf, startSec, freq, durSec, vol = 0.10) {
  const start = Math.floor(startSec * SR);
  const len = Math.floor(durSec * SR);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const att = Math.min(1, t / 0.05);
    const rel = Math.min(1, (len - i) / (SR * 0.2));
    const env = att * rel;
    const w =
      Math.sin(2 * Math.PI * freq * t) * 0.7 +
      Math.sin(2 * Math.PI * freq * 2 * t) * 0.18;
    if (start + i < buf.length) buf[start + i] += w * env * vol;
  }
}

const BPM = 100;
const BEAT = 60 / BPM;
const EIGHTH = BEAT / 2;

// 4 measures of 8 eighth-notes each = 32 eighths = 16 beats = 9.6s
// Chord progression: C - F - G - C  (I - IV - V - I in C major)
const measures = [
  { chord: 'C', arp: ['C5', 'E5', 'G5', 'C6', 'E6', 'C6', 'G5', 'E5'], bass: 'C3' },
  { chord: 'F', arp: ['C5', 'F5', 'A5', 'C6', 'F6', 'C6', 'A5', 'F5'], bass: 'F3' },
  { chord: 'G', arp: ['D5', 'G5', 'B5', 'D6', 'G6', 'D6', 'B5', 'G5'], bass: 'G3' },
  { chord: 'C', arp: ['C5', 'E5', 'G5', 'C6', 'E6', 'C6', 'G5', 'E5'], bass: 'C3' },
];

// Add C3/F3/G3 frequencies (octave below C4)
NOTE.C3 = NOTE.C4 / 2;
NOTE.F3 = NOTE.F4 / 2;
NOTE.G3 = NOTE.G4 / 2;

const TOTAL_SEC = measures.length * 8 * EIGHTH;
const total = Math.floor(TOTAL_SEC * SR);
const out = new Float32Array(total);

measures.forEach((m, mi) => {
  const measureStart = mi * 8 * EIGHTH;
  // bass note for full measure
  pad(out, measureStart, NOTE[m.bass], 8 * EIGHTH, 0.12);
  // arpeggio notes
  m.arp.forEach((n, ni) => {
    bell(out, measureStart + ni * EIGHTH, NOTE[n], EIGHTH * 1.6, 0.20);
  });
});

// Soft fade at end to make loop seamless
const fadeSamples = Math.floor(0.15 * SR);
for (let i = 0; i < fadeSamples; i++) {
  const k = i / fadeSamples;
  out[total - fadeSamples + i] *= 1 - k * 0.6;
}

writeWav(OUT, out);
console.log('Wrote', OUT, '(', TOTAL_SEC.toFixed(2), 's)');
