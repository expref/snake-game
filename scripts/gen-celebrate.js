// Generates celebration audio as WAV files:
//   win.wav — a triumphant brass fanfare layered with a big crowd cheer
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

// Gentle tanh saturation rounds off any remaining peaks so the mix never
// clips hard (hard clipping is a big part of the "old speaker" harshness).
function softClip(buf, drive = 1.1) {
  for (let i = 0; i < buf.length; i++) buf[i] = Math.tanh(buf[i] * drive);
}

// Linear fade in/out at the ends so the clip starts and stops smoothly.
function fadeEnds(buf, ms = 60) {
  const f = Math.floor((SAMPLE_RATE * ms) / 1000);
  for (let i = 0; i < f && i < buf.length; i++) {
    buf[i] *= i / f;
    buf[buf.length - 1 - i] *= i / f;
  }
}

// One hand-clap: a band-passed noise burst with a sharp attack. Two one-pole
// low-passes are subtracted to band-limit the noise (~300 Hz–4 kHz) so it reads
// as a crisp clap instead of the harsh broadband hiss a raw-noise burst makes.
function addClap(buf, startSample, amp, lenMs) {
  const len = Math.floor((SAMPLE_RATE * lenMs) / 1000);
  const attack = Math.max(1, Math.floor(len * 0.04));
  let lpFast = 0; // rolls off the harsh top end (hiss)
  let lpSlow = 0; // reference for removing low rumble
  for (let i = 0; i < len; i++) {
    const idx = startSample + i;
    if (idx < 0 || idx >= buf.length) break;
    const white = Math.random() * 2 - 1;
    lpFast += 0.5 * (white - lpFast);
    lpSlow += 0.035 * (white - lpSlow);
    const band = lpFast - lpSlow; // band-passed clap body
    const a = i < attack ? i / attack : 1; // fast attack
    const env = a * Math.exp(-i / (len * 0.22)); // quick exponential decay
    buf[idx] += band * amp * env;
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

  // Clapping/applause removed — win sound is now just the musical fanfare.

  normalize(buf, 0.92);
  softClip(buf, 1.1);
  fadeEnds(buf, 70);
  writeWav(path.join(__dirname, '..', 'assets', 'sounds', 'win.wav'), buf);
}

winSound();
console.log('done');
