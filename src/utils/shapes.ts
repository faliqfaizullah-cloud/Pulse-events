/**
 * Polar-curve path generators for the organic "sticker" shapes.
 * r(θ) = base · (1 + Σ amp_k · cos(k·θ + phase_k))
 */
function polarPath(
  size: number,
  harmonics: { k: number; amp: number; phase?: number }[],
  samples = 180,
): string {
  const c = size / 2;
  const total = harmonics.reduce((s, h) => s + Math.abs(h.amp), 0);
  const base = c / (1 + total);
  let d = '';
  for (let i = 0; i <= samples; i++) {
    const th = (i / samples) * Math.PI * 2;
    let r = 1;
    for (const h of harmonics) r += h.amp * Math.cos(h.k * th + (h.phase ?? 0));
    const x = c + base * r * Math.cos(th);
    const y = c + base * r * Math.sin(th);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return d + 'Z';
}

/** Scalloped starburst used for the pink "Festival" sticker and the date/time badges. */
export const starburstPath = (size: number, points = 10, amp = 0.09) =>
  polarPath(size, [{ k: points, amp }]);

/** Irregular wavy blob used for the green shape at the top of the Activities screen. */
export const blobPath = (size: number) =>
  polarPath(size, [
    { k: 5, amp: 0.1 },
    { k: 3, amp: 0.06, phase: 1.2 },
    { k: 7, amp: 0.03, phase: 0.4 },
  ]);
