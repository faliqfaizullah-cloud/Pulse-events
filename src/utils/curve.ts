/**
 * Catmull-Rom → cubic Bézier helpers for the audience curve.
 * Functions marked 'worklet' also run on the UI thread inside Reanimated animated props.
 * Arrays are linearly extended at both ends so every segment has uniform tangents.
 */
export const PAD_X = 14;
export const TOP = 56;
export const PLOT_H = 160;

export function yOf(v: number): number {
  'worklet';
  return TOP + (1 - v / 100) * PLOT_H;
}

export function extend(a: number[]): number[] {
  'worklet';
  const n = a.length;
  return [2 * a[0] - a[1]].concat(a, [2 * a[n - 1] - a[n - 2]]);
}

/** SVG path through the points from index `from` to `to` (inclusive). */
export function smoothPath(xs: number[], ys: number[], from: number, to: number): string {
  'worklet';
  const ex = extend(xs);
  const ey = extend(ys);
  let d = 'M' + xs[from] + ' ' + ys[from];
  for (let i = from; i < to; i++) {
    const x0 = ex[i], x1 = ex[i + 1], x2 = ex[i + 2], x3 = ex[i + 3];
    const y0 = ey[i], y1 = ey[i + 1], y2 = ey[i + 2], y3 = ey[i + 3];
    d +=
      ' C' + (x1 + (x2 - x0) / 6) + ' ' + (y1 + (y2 - y0) / 6) +
      ' ' + (x2 - (x3 - x1) / 6) + ' ' + (y2 - (y3 - y1) / 6) +
      ' ' + x2 + ' ' + y2;
  }
  return d;
}

/** Value of the smoothed curve on segment i at t ∈ [0,1] (value space, not pixels). */
export function sampleValue(values: number[], i: number, t: number): number {
  const e = extend(values);
  const v0 = e[i], v1 = e[i + 1], v2 = e[i + 2], v3 = e[i + 3];
  const c1 = v1 + (v2 - v0) / 6;
  const c2 = v2 - (v3 - v1) / 6;
  const u = 1 - t;
  return u * u * u * v1 + 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t * v2;
}

/** Highest point of the whole curve. Returns pixel position plus the % value. */
export function findPeak(values: number[], xs: number[]) {
  let best = { x: xs[0], y: yOf(values[0]), value: values[0] };
  for (let i = 0; i < values.length - 1; i++) {
    for (let s = 0; s <= 50; s++) {
      const t = s / 50;
      const v = Math.min(100, sampleValue(values, i, t));
      if (v > best.value) best = { x: xs[i] + (xs[i + 1] - xs[i]) * t, y: yOf(v), value: v };
    }
  }
  return best;
}

/** Mean of the curve between slot indices a and b. */
export function windowAverage(values: number[], a: number, b: number): number {
  let sum = 0;
  let n = 0;
  for (let i = a; i < b; i++) {
    for (let s = 0; s < 20; s++) {
      sum += sampleValue(values, i, s / 20);
      n++;
    }
  }
  return n ? Math.round(sum / n) : Math.round(values[a]);
}
