/**
 * A personal, local list of events a reader wants to keep track of.
 *
 * This is deliberately unrelated to the published `/watchlist` (the project's
 * own registry of official *sources* under standing review, in
 * `data/seed/watchlist.json`). That one is a transparency page describing
 * this project's research routine; this one is a convenience for a reader's
 * own workflow. Naming both "watchlist" would conflate a site feature with a
 * personal one, so this file and its page are named "saved" throughout.
 *
 * No account, no server, no new dependency: the list is a plain array of
 * event ids in `localStorage`, scoped to the browser it was saved in. It is
 * never sent anywhere and never read by any server component — every
 * function here is safe to call only from the client (each guards against
 * running where `window` does not exist, so an accidental server-side import
 * degrades to a no-op rather than throwing).
 */

const STORAGE_KEY = "smpt:saved-events:v1";

/** Fires on `window` whenever the saved list changes, for same-tab listeners
 *  (the native `storage` event only fires in *other* tabs). */
export const SAVED_EVENTS_CHANGE = "smpt:saved-events-change";

/** Pure list operations, unit-testable without a browser or localStorage. */
export function addId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids : [...ids, id];
}

export function removeId(ids: string[], id: string): string[] {
  return ids.filter((x) => x !== id);
}

export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? removeId(ids, id) : addId(ids, id);
}

/** Parse whatever is actually in storage defensively: a corrupted or
 *  hand-edited value degrades to an empty list rather than throwing. */
export function parseStoredIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function getSavedEventIds(): string[] {
  if (typeof window === "undefined") return [];
  return parseStoredIds(window.localStorage.getItem(STORAGE_KEY));
}

function writeSavedEventIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage can be unavailable (private browsing, quota, disabled) — the
    // save silently no-ops rather than throwing on a reader's click.
    return;
  }
  window.dispatchEvent(new Event(SAVED_EVENTS_CHANGE));
}

export function isEventSaved(id: string): boolean {
  return getSavedEventIds().includes(id);
}

export function saveEvent(id: string): void {
  writeSavedEventIds(addId(getSavedEventIds(), id));
}

export function unsaveEvent(id: string): void {
  writeSavedEventIds(removeId(getSavedEventIds(), id));
}

export function toggleSavedEvent(id: string): boolean {
  const ids = getSavedEventIds();
  const wasSaved = ids.includes(id);
  writeSavedEventIds(wasSaved ? removeId(ids, id) : addId(ids, id));
  return !wasSaved;
}

export function clearSavedEvents(): void {
  writeSavedEventIds([]);
}

/** Subscribe to changes from any source: this tab's own writes (the custom
 *  event) and another tab's writes (the native `storage` event). Returns an
 *  unsubscribe function. */
export function subscribeSavedEvents(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener(SAVED_EVENTS_CHANGE, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SAVED_EVENTS_CHANGE, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
