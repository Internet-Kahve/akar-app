/** A point in the model's space; null when a part was not found in the file. */
export type PartPoint = { x: number; y: number; z: number } | null;

/**
 * Order in which «parçaları göster» lights the part cards (Muhammed, 2 Nov 2026): random each time, and each next
 * card far from the one before it. Two neighbours lit one after the other read as one part; spread apart, every
 * flash is plainly a part of its own. Each step picks at random among the farthest third of the cards left, so the
 * order is not the same every time. Cards with no point go in random places. Returns indexes into `points`.
 */
export function spreadOrder(points: PartPoint[], random: () => number = Math.random): number[] {
  const left = points.map((_, i) => i);
  const order: number[] = [];
  const take = (at: number) => order.push(left.splice(at, 1)[0]);
  if (!left.length) return order;
  take(Math.floor(random() * left.length));
  while (left.length) {
    const last = points[order[order.length - 1]];
    if (!last) {
      take(Math.floor(random() * left.length));
      continue;
    }
    const far = left
      .map((index, at) => {
        const p = points[index];
        return { at, d: p ? (p.x - last.x) ** 2 + (p.y - last.y) ** 2 + (p.z - last.z) ** 2 : random() * 1e-6 };
      })
      .sort((a, b) => b.d - a.d);
    const pool = far.slice(0, Math.max(1, Math.ceil(far.length / 3)));
    take(pool[Math.floor(random() * pool.length)].at);
  }
  return order;
}
