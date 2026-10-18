import {test} from "node:test";
import type {TestContext} from "node:test";
import assert from "node:assert/strict";
import {
  readSavedEvents, getSavedEventIds, saveEvent, unsaveEvent, clearSavedEvents,
  tryToggleSavedEvent, toggleSavedEvent, subscribeSavedEvents, SAVED_EVENTS_CHANGE,
  parseStoredIds,
} from "@/lib/watchlist-client";

const key = "smpt:saved-events:v1";
function browser(t: TestContext, initial: string[] = []) {
  const target = new EventTarget();
  let raw = JSON.stringify(initial), readsBlocked = false, writesBlocked = false, writes = 0;
  const storage = {
    getItem: () => { if (readsBlocked) throw new Error("SecurityError"); return raw; },
    setItem: (_key: string, value: string) => {
      writes++;
      if (writesBlocked) throw new Error("QuotaExceededError");
      raw = value;
    },
  };
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(target, "localStorage", {configurable: true, get: () => storage});
  Object.defineProperty(globalThis, "window", {configurable: true, value: target});
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
  });
  return {
    target, raw: () => raw, writes: () => writes,
    blockReads: () => { readsBlocked = true; },
    blockWrites: () => { writesBlocked = true; },
    restore: () => { readsBlocked = false; writesBlocked = false; },
    blockGetter: () => Object.defineProperty(target, "localStorage", {
      configurable: true, get: () => { throw new Error("SecurityError"); },
    }),
  };
}

test("blocked storage getter and read fail without overwriting an unread list", t => {
  const b = browser(t, ["evt-original"]);
  b.blockReads();
  assert.deepEqual(readSavedEvents(), {ok: false, ids: []});
  assert.deepEqual(getSavedEventIds(), []);
  assert.equal(saveEvent("evt-new").ok, false);
  assert.equal(clearSavedEvents().ok, false);
  assert.equal(b.writes(), 0);
  assert.equal(b.raw(), '["evt-original"]');
  b.blockGetter();
  assert.doesNotThrow(() => getSavedEventIds());
  assert.equal(tryToggleSavedEvent("evt-new").ok, false);
});

test("failed writes preserve confirmed IDs and never broadcast success", t => {
  const b = browser(t, ["evt-original"]);
  let changes = 0;
  const unsubscribe = subscribeSavedEvents(() => changes++);
  b.blockWrites();
  for (const result of [saveEvent("evt-new"), unsaveEvent("evt-original"),
    clearSavedEvents(), tryToggleSavedEvent("evt-new")]) {
    assert.deepEqual(result, {ok: false, ids: ["evt-original"]});
  }
  assert.equal(toggleSavedEvent("evt-new"), false);
  assert.equal(toggleSavedEvent("evt-original"), true);
  assert.equal(changes, 0);
  assert.equal(b.raw(), '["evt-original"]');
  b.restore();
  assert.deepEqual(tryToggleSavedEvent("evt-new"), {ok: true, ids: ["evt-original", "evt-new"]});
  assert.equal(changes, 1);
  unsubscribe();
});

test("successful save/remove/clear persist before same-tab notifications and unsubscribe", t => {
  const b = browser(t);
  const snapshots: string[][] = [];
  const unsubscribe = subscribeSavedEvents(() => snapshots.push(getSavedEventIds()));
  assert.equal(saveEvent("evt-a").ok, true);
  assert.equal(saveEvent("evt-b").ok, true);
  assert.deepEqual(unsaveEvent("evt-a"), {ok: true, ids: ["evt-b"]});
  assert.deepEqual(clearSavedEvents(), {ok: true, ids: []});
  assert.deepEqual(snapshots, [["evt-a"], ["evt-a", "evt-b"], ["evt-b"], []]);
  unsubscribe();
  b.target.dispatchEvent(new Event(SAVED_EVENTS_CHANGE));
  assert.equal(snapshots.length, 4);
});

test("other-tab storage events notify only for saved events or a storage clear", t => {
  const b = browser(t);
  let changes = 0;
  const unsubscribe = subscribeSavedEvents(() => changes++);
  for (const eventKey of ["different-key", key, null]) {
    const event = new Event("storage");
    Object.defineProperty(event, "key", {value: eventKey});
    b.target.dispatchEvent(event);
  }
  assert.equal(changes, 2);
  unsubscribe();
});

test("duplicate, empty and malformed saved IDs do not create duplicate research rows", () => {
  assert.deepEqual(parseStoredIds('["evt-a","evt-a","",null,3,"evt-b"]'), ["evt-a", "evt-b"]);
  assert.deepEqual(parseStoredIds("{"), []);
});

test("server imports remain harmless and cannot claim a saved change", () => {
  assert.equal(typeof window, "undefined");
  assert.deepEqual(getSavedEventIds(), []);
  assert.deepEqual(saveEvent("evt-a"), {ok: false, ids: []});
  assert.equal(toggleSavedEvent("evt-a"), false);
  assert.doesNotThrow(() => subscribeSavedEvents(() => {})());
});
