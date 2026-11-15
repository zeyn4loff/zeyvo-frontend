export interface Identified {
  id: string;
}

/** Replaces the matching record, or appends it when it is new. */
export function upsertById<T extends Identified>(items: readonly T[], item: T): T[] {
  return items.some((entry) => entry.id === item.id)
    ? items.map((entry) => entry.id === item.id ? item : entry)
    : [...items, item];
}

/** Replaces the matching record, or puts it first when it is new. */
export function prependById<T extends Identified>(items: readonly T[], item: T): T[] {
  return items.some((entry) => entry.id === item.id)
    ? items.map((entry) => entry.id === item.id ? item : entry)
    : [item, ...items];
}

export function removeById<T extends Identified>(items: readonly T[], id: string): T[] {
  return items.filter((entry) => entry.id !== id);
}

export function hasId(items: readonly Identified[], id: string): boolean {
  return items.some((entry) => entry.id === id);
}

/** Turns a rejected request into a message the partner can read. */
export function errorText(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}
