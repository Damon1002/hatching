import { elemSeed, mulberry32, pick } from '../grove/rng';
import { GROVE_LOOP_MS } from '../grove/types';

const SAMPLE_RATE = 22050;
const ROOTS = [53, 55, 57, 58, 60];

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function renderGroveWav(seed: number): Uint8Array {
  const rand = mulberry32(elemSeed(seed, 0xa11d));
  const root = pick(rand, ROOTS);
  const fifth = root + 7;
  const octave = root + 12;
  const duration = GROVE_LOOP_MS / 1000;
  const n = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(n);
  const fade = Math.floor(SAMPLE_RATE * 0.08);
  const f0 = midiToFreq(root);
  const f1 = midiToFreq(fifth);
  const f2 = midiToFreq(octave);

  for (let i = 0; i < n; i += 1) {
    const t = i / SAMPLE_RATE;
    const pad =
      0.42 * Math.sin(2 * Math.PI * f0 * t) +
      0.28 * Math.sin(2 * Math.PI * f1 * t + 0.15) +
      0.16 * Math.sin(2 * Math.PI * f2 * t);
    const trem = 0.82 + 0.18 * Math.sin((2 * Math.PI * t) / duration);
    let env = 1;
    if (i < fade) env = i / fade;
    else if (i > n - fade) env = (n - i) / fade;
    samples[i] = pad * trem * env * 0.11;
  }

  return encodeWav(samples, SAMPLE_RATE);
}

function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Uint8Array(buffer);
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
}
