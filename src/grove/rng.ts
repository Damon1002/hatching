export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Independent stream so adding a tree never reshuffles the egg or creature. */
export function elemSeed(base: number, index: number): number {
  let a = base ^ Math.imul(index + 1, 0x9e3779b9);
  a = Math.imul(a ^ (a >>> 16), 0x7feb352d);
  a = Math.imul(a ^ (a >>> 15), 0x846ca68b);
  return (a ^ (a >>> 16)) >>> 0;
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smooth(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

export function rr(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

export function ri(rand: () => number, min: number, max: number): number {
  return min + ((rand() * (max - min + 1)) | 0);
}

export function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[(rand() * items.length) | 0];
}

export function chance(rand: () => number, p: number): boolean {
  return rand() < p;
}

export function noiseField(seed: number, size = 64): (x: number, y: number) => number {
  const rand = mulberry32(seed);
  const table = new Float32Array(size * size);
  for (let i = 0; i < table.length; i += 1) table[i] = rand();
  const at = (ix: number, iy: number) =>
    table[(((iy % size) + size) % size) * size + (((ix % size) + size) % size)];
  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = smooth(x - xi);
    const fy = smooth(y - yi);
    return lerp(lerp(at(xi, yi), at(xi + 1, yi), fx), lerp(at(xi, yi + 1), at(xi + 1, yi + 1), fx), fy);
  };
}
