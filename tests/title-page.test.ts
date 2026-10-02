import assert from "node:assert/strict";
import { test } from "node:test";
import { playTitlePage } from "../components/title-page";

test("the title is optional, dismissible, once per session, and cleans up its timers and scroll lock", (t) => {
  const storage = new Map<string, string>();
  const timers = new Map<number, { run: () => void; delay: number }>();
  let nextTimer = 0;
  let reduced = false;
  let blockedStorage = false;
  const root = { style: { overflow: "clip" } };
  const location = { pathname: "/", hash: "", search: "" };
  const windowMock = {
    location,
    matchMedia: () => ({ matches: reduced }),
    sessionStorage: {
      getItem: (key: string) => { if (blockedStorage) throw new Error("denied"); return storage.get(key); },
      setItem: (key: string, value: string) => { if (blockedStorage) throw new Error("denied"); storage.set(key, value); },
    },
    setTimeout: (run: () => void, delay: number) => { timers.set(++nextTimer, { run, delay }); return nextTimer; },
    clearTimeout: (id: number) => timers.delete(id),
  };
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "window", { configurable: true, value: windowMock });
  Object.defineProperty(globalThis, "document", { configurable: true, value: { documentElement: root } });
  t.after(() => {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow); else Reflect.deleteProperty(globalThis, "window");
    if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument); else Reflect.deleteProperty(globalThis, "document");
  });

  const closeEvents: Array<() => void> = [];
  const listeners = new Set<() => void>();
  const fakeDialog = {
    open: false,
    dataset: {} as Record<string, string>,
    showModal() { this.open = true; },
    close() { this.open = false; closeEvents.push(() => listeners.forEach((fn) => fn())); },
    addEventListener: (_event: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_event: string, fn: () => void) => listeners.delete(fn),
  };
  const dialog = fakeDialog as unknown as HTMLDialogElement;
  const flushClose = () => { closeEvents.splice(0).forEach((run) => run()); };
  const runTimer = (delay: number) => [...timers.values()].find((timer) => timer.delay === delay)!.run();

  for (const [field, value] of [["pathname", "/materials/tungsten"], ["hash", "#tungsten:processing"], ["search", "?q=tungsten"]] as const) {
    const original = location[field];
    location[field] = value;
    assert.equal(playTitlePage(dialog), undefined);
    assert.equal(dialog.open, false);
    location[field] = original;
  }
  reduced = true;
  assert.equal(playTitlePage(dialog), undefined);
  reduced = false;

  // React's development setup → cleanup → setup must still show the title.
  playTitlePage(dialog)!();
  assert.equal(root.style.overflow, "clip");
  assert.equal(timers.size, 0);
  const cleanup = playTitlePage(dialog)!;
  flushClose();
  assert.equal(dialog.open, true);
  assert.equal(root.style.overflow, "hidden");
  assert.equal(storage.size, 0);
  runTimer(3600);
  assert.equal(dialog.dataset.leaving, "true");
  runTimer(4200);
  flushClose();
  assert.equal(dialog.open, false);
  assert.equal(root.style.overflow, "clip");
  assert.equal(timers.size, 0);
  assert.equal(playTitlePage(dialog), undefined);
  cleanup();
  flushClose();

  // Enter and native Escape both close the dialog before the automatic timer.
  storage.clear();
  blockedStorage = true;
  const cleanupBlocked = playTitlePage(dialog)!;
  assert.equal(dialog.open, true);
  assert.equal(dialog.dataset.leaving, undefined);
  dialog.close();
  flushClose();
  assert.equal(root.style.overflow, "clip");
  assert.equal(timers.size, 0);
  cleanupBlocked();
});
