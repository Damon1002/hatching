const HEX = /^#([0-9a-f]{6})$/i;

function rgb(hex: string): [number, number, number] {
  const match = HEX.exec(hex);
  if (!match) return [0, 0, 0];
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  const pack = (v: number) => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, '0');
  return `#${pack(r)}${pack(g)}${pack(b)}`;
}

export function shade(hex: string, k: number): string {
  const [r, g, b] = rgb(hex);
  if (k > 0) return toHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k);
  return toHex(r * (1 + k), g * (1 + k), b * (1 + k));
}

export function mix(a: string, b: string, t: number): string {
  const A = rgb(a);
  const B = rgb(b);
  return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function hslToHex(h: number, sat: number, lig: number): string {
  const hue = ((h % 1) + 1) % 1;
  const a = sat * Math.min(lig, 1 - lig);
  const channel = (n: number) => {
    const k = (n + hue * 12) % 12;
    return Math.round(255 * (lig - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))));
  };
  return toHex(channel(0), channel(8), channel(4));
}
