export interface EditHistory<T> {
  snapshots: T[];
  index: number;
}

export function createHistory<T>(snapshot: T): EditHistory<T> {
  return { snapshots: [snapshot], index: 0 };
}

// Editor updates are immutable, so unchanged subtrees can be shared between snapshots.
export function appendHistory<T>(history: EditHistory<T>, snapshot: T, limit = 50): EditHistory<T> {
  if (history.snapshots[history.index] === snapshot) return history;
  const snapshots = [...history.snapshots.slice(0, history.index + 1), snapshot]
    .slice(-Math.max(2, limit));
  return { snapshots, index: snapshots.length - 1 };
}

export function moveHistory<T>(history: EditHistory<T>, direction: -1 | 1): EditHistory<T> {
  const index = Math.max(0, Math.min(history.snapshots.length - 1, history.index + direction));
  return index === history.index ? history : { ...history, index };
}
