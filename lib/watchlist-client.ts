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
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter((x): x is string => typeof x === "string" && x.length > 0))]
      : [];
  } catch {
    return [];
  }
}

/** A failed operation never claims that a requested change was persisted. */
export type SavedEventsResult = { ok: boolean; ids: string[] };

export function readSavedEvents(): SavedEventsResult {
  if (typeof window === "undefined") return { ok: false, ids: [] };
  try {
    // Access to the localStorage getter itself may throw a SecurityError.
    return { ok: true, ids: parseStoredIds(window.localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return { ok: false, ids: [] };
  }
}

export function getSavedEventIds(): string[] {
  return readSavedEvents().ids;
}

function changeSavedEvents(change: (ids: string[]) => string[]): SavedEventsResult {
  const previous = readSavedEvents();
  // Never overwrite a list we could not read, including when clearing it.
  if (!previous.ok) return previous;
  const ids = change(previous.ids);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    return { ok: false, ids: previous.ids };
  }
  window.dispatchEvent(new Event(SAVED_EVENTS_CHANGE));
  return { ok: true, ids };
}

export function isEventSaved(id: string): boolean {
  return getSavedEventIds().includes(id);
}

export function saveEvent(id: string): SavedEventsResult {
  return changeSavedEvents(ids => addId(ids, id));
}

export function unsaveEvent(id: string): SavedEventsResult {
  return changeSavedEvents(ids => removeId(ids, id));
}

export function tryToggleSavedEvent(id: string): SavedEventsResult {
  return changeSavedEvents(ids => toggleId(ids, id));
}

/** Compatibility helper: returns the confirmed state, never an optimistic toggle. */
export function toggleSavedEvent(id: string): boolean {
  return tryToggleSavedEvent(id).ids.includes(id);
}

export function clearSavedEvents(): SavedEventsResult {
  return changeSavedEvents(() => []);
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
