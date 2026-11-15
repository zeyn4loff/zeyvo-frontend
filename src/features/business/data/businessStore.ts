import { useCallback, useEffect, useSyncExternalStore } from "react";
import { errorText } from "./collections";

/** One cache entry per resource, session and business. */
interface Snapshot<T> {
  data: T;
  loaded: boolean;
  error: string;
}

interface Entry {
  data: unknown;
  loaded: boolean;
  error: string;
  pending: Promise<void> | null;
  snapshot: Snapshot<unknown>;
}

export const dataKeys = {
  businesses: "businesses",
  staff: "staff",
  services: "services",
  resources: "resources",
  clients: "clients",
  inventory: "inventory",
  loyalty: "loyalty",
  marketing: "marketing",
} as const;

export type DataKey = (typeof dataKeys)[keyof typeof dataKeys];

const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();
const emptySnapshots = new WeakMap<object, Snapshot<unknown>>();

function notify(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function cacheKey(resource: DataKey, sessionId: string, businessId: string): string {
  return `${resource}:${sessionId}:${businessId}`;
}

/** Keeps one stable snapshot per empty value so React does not re-render in a loop. */
function emptySnapshot<T>(empty: T): Snapshot<T> {
  const holder = empty as unknown as object;
  let snapshot = emptySnapshots.get(holder) as Snapshot<T> | undefined;
  if (!snapshot) {
    snapshot = { data: empty, loaded: false, error: "" };
    emptySnapshots.set(holder, snapshot);
  }
  return snapshot;
}

function entryFor<T>(key: string, empty: T): Entry {
  let entry = entries.get(key);
  if (!entry) {
    entry = { data: empty, loaded: false, error: "", pending: null, snapshot: emptySnapshot(empty) };
    entries.set(key, entry);
  }
  return entry;
}

function publish(entry: Entry): void {
  entry.snapshot = { data: entry.data, loaded: entry.loaded, error: entry.error };
  notify();
}

function load<T>(key: string, empty: T, fetcher: () => Promise<T>, failureMessage: string, force: boolean): Promise<void> {
  const entry = entryFor(key, empty);
  if (entry.pending && !force) return entry.pending;
  const pending = fetcher().then((data) => {
    if (entry.pending !== pending) return;
    entry.data = data;
    entry.loaded = true;
    entry.error = "";
    entry.pending = null;
    publish(entry);
  }).catch((cause: unknown) => {
    if (entry.pending !== pending) return;
    entry.loaded = true;
    entry.error = errorText(cause, failureMessage);
    entry.pending = null;
    publish(entry);
  });
  entry.pending = pending;
  return pending;
}

export interface BusinessData<T> {
  data: T;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  mutate: (next: T) => void;
}

export interface BusinessDataOptions<T> {
  resource: DataKey;
  sessionId: string;
  businessId: string | undefined;
  /** Must be a module-level constant so the empty state keeps one identity. */
  empty: T;
  failureMessage: string;
  load: (businessId: string) => Promise<T>;
  /** Window events that make this resource reload, such as a completed sale. */
  refreshOn?: readonly string[];
}

/**
 * Shared loader for every tenant-scoped partner resource. Components asking for the
 * same resource and business read one cache entry and one in-flight request.
 */
export function useBusinessData<T>(options: BusinessDataOptions<T>): BusinessData<T> {
  const { resource, sessionId, businessId, empty, failureMessage, refreshOn } = options;
  const fetcher = options.load;
  const key = businessId ? cacheKey(resource, sessionId, businessId) : "";

  const snapshot = useSyncExternalStore(
    subscribe,
    () => (key ? entries.get(key)?.snapshot ?? emptySnapshot(empty) : emptySnapshot(empty)) as Snapshot<T>,
    () => emptySnapshot(empty) as Snapshot<T>,
  );

  const refresh = useCallback(async (): Promise<void> => {
    if (!businessId) return;
    await load(cacheKey(resource, sessionId, businessId), empty, () => fetcher(businessId), failureMessage, true);
  }, [resource, sessionId, businessId, empty, failureMessage, fetcher]);

  const mutate = useCallback((next: T): void => {
    if (!businessId) return;
    const entry = entryFor(cacheKey(resource, sessionId, businessId), empty);
    entry.data = next;
    entry.loaded = true;
    entry.error = "";
    publish(entry);
  }, [resource, sessionId, businessId, empty]);

  useEffect(() => {
    if (!businessId) return;
    void load(cacheKey(resource, sessionId, businessId), empty, () => fetcher(businessId), failureMessage, false);
  }, [resource, sessionId, businessId, empty, failureMessage, fetcher]);

  useEffect(() => {
    if (!businessId || !refreshOn?.length) return;
    const reload = () => { void refresh(); };
    for (const event of refreshOn) window.addEventListener(event, reload);
    return () => { for (const event of refreshOn) window.removeEventListener(event, reload); };
  }, [businessId, refreshOn, refresh]);

  return {
    data: snapshot.data,
    loading: Boolean(businessId) && !snapshot.loaded,
    error: snapshot.error,
    refresh,
    mutate,
  };
}

/**
 * Reads already-loaded data outside React, for the local-only calendar and sidebar
 * counters that cannot await a request.
 */
export function cachedBusinessData<T>(resource: DataKey, sessionId: string, businessId: string | undefined, empty: T): T {
  if (!businessId) return empty;
  const entry = entries.get(cacheKey(resource, sessionId, businessId));
  return entry?.loaded ? entry.data as T : empty;
}

/** Writes loaded data into the cache from outside a component. */
export function setCachedBusinessData<T>(resource: DataKey, sessionId: string, businessId: string, data: T): void {
  const entry = entryFor(cacheKey(resource, sessionId, businessId), data);
  entry.data = data;
  entry.loaded = true;
  entry.error = "";
  publish(entry);
}

/** Drops every cache entry for a session, used when the partner signs out. */
export function clearBusinessData(sessionId: string): void {
  for (const key of [...entries.keys()]) {
    if (key.includes(`:${sessionId}:`)) entries.delete(key);
  }
  notify();
}
