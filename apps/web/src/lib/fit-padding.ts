export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Padding for MapLibre's `fitBounds` that leaves room on the canvas. A phone's open sheet can make top + bottom taller
 * than the map, and MapLibre then refuses the fit (only a console warning) and the route is not framed at all. Each
 * axis is scaled down to leave at least `room` pixels (or a third of the side) for the bounds themselves.
 */
export function fitPadding(padding: Padding, width: number, height: number, room = 120): Padding {
  const squeeze = (a: number, b: number, side: number) => {
    const free = Math.max(0, side - Math.min(room, side / 3));
    const scale = a + b > free ? free / (a + b) : 1;
    return [Math.floor(a * scale), Math.floor(b * scale)] as const;
  };
  const [top, bottom] = squeeze(padding.top, padding.bottom, height);
  const [left, right] = squeeze(padding.left, padding.right, width);
  return { top, right, bottom, left };
}
