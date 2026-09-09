export interface Bounds { x: number; y: number; width: number; height: number }

export function fitBounds(bounds: Bounds, viewport: { width: number; height: number }, padding = 48) {
  const zoom = Math.max(0.1, Math.min(1,
    Math.max(1, viewport.width - padding * 2) / Math.max(1, bounds.width),
    Math.max(1, viewport.height - padding * 2) / Math.max(1, bounds.height),
  ));
  return {
    zoom,
    pan: {
      x: viewport.width / 2 - (bounds.x + bounds.width / 2) * zoom,
      y: viewport.height / 2 - (bounds.y + bounds.height / 2) * zoom,
    },
  };
}

export function combineBounds(bounds: Bounds[]): Bounds | null {
  if (!bounds.length) return null;
  let x = Infinity, y = Infinity, right = -Infinity, bottom = -Infinity;
  for (const item of bounds) {
    x = Math.min(x, item.x); y = Math.min(y, item.y);
    right = Math.max(right, item.x + item.width); bottom = Math.max(bottom, item.y + item.height);
  }
  return { x, y, width: right - x, height: bottom - y };
}
