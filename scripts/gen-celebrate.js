// Generates celebration audio as WAV files:
//   claps.wav — a warm round of applause (for losing past level 1)
//   win.wav   — a triumphant brass fanfare layered with a big crowd cheer
// Run: node scripts/gen-celebrate.js
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

function writeWav(filename, samples) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);
  for (let i = 0; i < numSamples; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE((s * 32767) | 0, 44 + i * 2);
  }
  fs.writeFileSync(filename, buffer);
  console.log('wrote', filename, (buffer.length / 1024).toFixed(1) + ' KB');
}

function normalize(buf, peak = 0.85) {
  let max = 0;
  for (let i = 0; i < buf.length; i++) max = Math.max(max, Math.abs(buf[i]));
  if (max < 1e-6) return;
  const g = peak / max;
  for (let i = 0; i < buf.length; i++) buf[i] *= g;
}

// One hand-clap: a short burst of decaying filtered noise.
function addClap(buf, startSample, amp, lenMs) {
  const len = Math.floor((SAMPLE_RATE * lenMs) / 1000);
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const idx = startSample + i;
    if (idx < 0 || idx >= buf.length) break;
    const env = Math.exp(-i / (len * 0.28));
    // light low-pass on the noise so it reads as a clap, not static.
    const white = Math.random() * 2 - 1;
    prev = prev * 0.55 + white * 0.45;
    buf[idx] += prev * amp * env;
  }
}

// Lay a crowd of overlapping claps across the buffer with a swell envelope.
function addApplause(buf, startT, endT, density, baseAmp) {
  const startS = Math.floor(startT * SAMPLE_RATE);
  const endS = Math.floor(endT * SAMPLE_RATE);
  const span = endS - startS;
  const count = Math.floor((endT - startT) * density);
  for (let c = 0; c < count; c++) {
    const at = startS + Math.floor(Math.random() * span);
    // swell in over the first 25%, hold, fade over the last 30%.
    const p = (at - startS) / span;
    let swell = 1;
    if (p < 0.25) swell = p / 0.25;
    else if (p > 0.7) swell = 1 - (p - 0.7) / 0.3;
    const amp = baseAmp * (0.5 + Math.random() * 0.5) * swell;
    addClap(buf, at, amp, 18 + Math.random() * 34);
  }
}

function clapsSound() {
  const dur = 3.0;
  const n = Math.floor(SAMPLE_RATE * dur);
  const buf = new Float32Array(n);
  addApplause(buf, 0.0, dur, 220, 0.16);
  normalize(buf, 0.8);
  writeWav(path.join(__dirname, '..', 'assets', 'sounds', 'claps.wav'), buf);
}

// Brass-ish tone: a few harmonics with gentle vibrato.
function brass(freq, t) {
  const vib = 1 + 0.006 * Math.sin(2 * Math.PI * 6 * t);
  const f = freq * vib;
  return (
    Math.sin(2 * Math.PI * f * t) +
    0.5 * Math.sin(2 * Math.PI * 2 * f * t) +
    0.28 * Math.sin(2 * Math.PI * 3 * f * t)
  );
}

function addNote(buf, freq, startT, durT, amp) {
  const startS = Math.floor(startT * SAMPLE_RATE);
  const len = Math.floor(durT * SAMPLE_RATE);
  for (let i = 0; i < len; i++) {
    const idx = startS + i;
    if (idx >= buf.length) break;
    const t = i / SAMPLE_RATE;
    // quick attack, long release.
    const a = Math.min(1, i / (SAMPLE_RATE * 0.02));
    const r = 1 - i / len;
    const env = a * r * r;
    buf[idx] += brass(freq, startT + t) * amp * env;
  }
}

const N = {
  C5: 523.25, E5: 659.25, G5: 783.99,
  C6: 1046.5, E6: 1318.5, G6: 1567.98,
};

function winSound() {
  const dur = 3.2;
  const n = Math.floor(SAMPLE_RATE * dur);
  const buf = new Float32Array(n);

  // Rising fanfare arpeggio.
  addNote(buf, N.C5, 0.0, 0.45, 0.32);
  addNote(buf, N.E5, 0.15, 0.45, 0.32);
  addNote(buf, N.G5, 0.3, 0.5, 0.34);
  addNote(buf, N.C6, 0.46, 0.7, 0.36);
  // Held triumphant chord.
  addNote(buf, N.C6, 0.7, 1.5, 0.26);
  addNote(buf, N.E6, 0.72, 1.5, 0.22);
  addNote(buf, N.G6, 0.74, 1.5, 0.2);

  // Crowd erupts once the chord lands.
  addApplause(buf, 0.55, dur, 240, 0.13);

  normalize(buf, 0.9);
  writeWav(path.join(__dirname, '..', 'assets', 'sounds', 'win.wav'), buf);
}

clapsSound();
winSound();
console.log('done');
