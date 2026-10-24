/** Percentual visível de cada estrela (índice baseado em zero), sem APIs livres ao Pi. */
export function ratingStarFillPercent(value: number, index: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isInteger(index) || !Number.isInteger(max) || max < 1) return 0;
  const bounded = Math.max(0, Math.min(max, value));
  return Math.round(100 * Math.max(0, Math.min(1, bounded - index)));
}
