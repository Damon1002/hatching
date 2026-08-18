import { mix, shade } from './color';
import { CRUST, WATER_Z } from './types';

export interface IsoCamera {
  tw: number;
  ox: number;
  oy: number;
}

export function fitCamera(
  bbox: { x0: number; y0: number; x1: number; y1: number },
  width: number,
  height: number
): IsoCamera {
  const span = bbox.x1 - bbox.x0 + 1 + (bbox.y1 - bbox.y0 + 1);
  const short = Math.min(width, height);
  const margin = short * 0.03;
  const crown = 1.25;
  const fall = CRUST + 0.22;
  const maxZ = 0.51;
  const fitW = (width - 2 * margin) / (span * 0.5);
  const fitH = (height - 2 * margin) / (span * 0.25 + maxZ + crown + fall);
  const tw = Math.min(fitW, fitH) * 1.15;
  const cxm = (bbox.x0 + bbox.x1 + 1) / 2;
  const cym = (bbox.y0 + bbox.y1 + 1) / 2;
  const ox = width / 2 - (cxm - cym) * tw * 0.5;
  const yTop = (bbox.x0 + bbox.y0) * tw * 0.25 - (maxZ + crown) * tw;
  const yBot = (bbox.x1 + bbox.y1 + 2) * tw * 0.25 + fall * tw;
  const oy = height * 0.53 - (yTop + yBot) / 2;
  return { tw, ox, oy };
}

export function sx(cx: number, cy: number, camera: IsoCamera): number {
  return Math.round(camera.ox + (cx - cy) * camera.tw * 0.5);
}

export function sy(cx: number, cy: number, z: number, camera: IsoCamera): number {
  return Math.round(camera.oy + (cx + cy) * camera.tw * 0.25 - z * camera.tw);
}

export function diamondPath(x: number, y: number, z: number, camera: IsoCamera): string {
  const a = `${sx(x, y, camera)},${sy(x, y, z, camera)}`;
  const b = `${sx(x + 1, y, camera)},${sy(x + 1, y, z, camera)}`;
  const c = `${sx(x + 1, y + 1, camera)},${sy(x + 1, y + 1, z, camera)}`;
  const d = `${sx(x, y + 1, camera)},${sy(x, y + 1, z, camera)}`;
  return `M${a} L${b} L${c} L${d} Z`;
}

export function facePath(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  zTop: number,
  zBot: number,
  camera: IsoCamera
): string {
  const p0 = `${sx(ax, ay, camera)},${sy(ax, ay, zTop, camera)}`;
  const p1 = `${sx(bx, by, camera)},${sy(bx, by, zTop, camera)}`;
  const p2 = `${sx(bx, by, camera)},${sy(bx, by, zBot, camera)}`;
  const p3 = `${sx(ax, ay, camera)},${sy(ax, ay, zBot, camera)}`;
  return `M${p0} L${p1} L${p2} L${p3} Z`;
}

export function aerial(color: string, x: number, y: number, bbox: { x0: number; y0: number; x1: number; y1: number }, haze: string): string {
  const span = Math.max(1, bbox.x1 + bbox.y1 - (bbox.x0 + bbox.y0));
  const k = (1 - Math.max(0, Math.min(1, (x + y - (bbox.x0 + bbox.y0)) / span))) * 0.07;
  return k > 0.004 ? mix(color, haze, k) : color;
}

export function faceColors(lid: string): { left: string; right: string } {
  return { left: shade(lid, -0.15), right: shade(lid, -0.28) };
}

export { WATER_Z, CRUST };
