import type { Page } from '../types';

/** Legacy documents receive a repeatable identity until their next save writes it. */
export function projectIdentity(data: { id?: string; name: string; pages: Page[]; filePath?: string | null }): string {
  if (typeof data.id === 'string' && data.id.trim()) return data.id;
  const source = data.filePath || JSON.stringify({ name: data.name, pages: data.pages });
  let hash = 2166136261;
  for (let index = 0; index < source.length; index++) hash = Math.imul(hash ^ source.charCodeAt(index), 16777619);
  return `legacy-${(hash >>> 0).toString(36)}`;
}
