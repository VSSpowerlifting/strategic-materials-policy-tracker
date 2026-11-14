"use client";

/**
 * Announces a filtered list's result count once the reader's change has settled.
 *
 * - Nothing is announced on load: the gate opens only on the reader's own input inside the explorer (a change,
 *   input or click), so filters applied from the URL after hydration stay silent.
 * - Rapid changes (typing, stepping through a select with the arrow keys) produce one announcement, for the state
 *   the reader settles on. A state that returns to the one last announced says nothing.
 * - The region is cleared before each message, so the same wording ("12 events" after a different filter) is
 *   announced again.
 * - Focus is never moved here. `focusFirstFilter` is for a Clear control that unmounts when it is used.
 */
import { useCallback, useEffect, useRef, useState } from "react";

/** How long the filter state must hold before its count is announced. */
export const RESULT_ANNOUNCE_DELAY_MS = 600;
/** Gap between clearing the region and writing the message, so screen readers register a change. */
const CLEAR_GAP_MS = 60;

/** "No results", "1 event", "12 events" or, when every row is shown, "All 79 events". */
export function resultCountMessage(count: number, total: number, noun: { one: string; other: string }): string {
  if (count === 0) return "No results";
  if (count === total && total > 1) return `All ${total} ${noun.other}`;
  return `${count} ${count === 1 ? noun.one : noun.other}`;
}

type Timer = { cancel: () => void };
type Schedule = (fn: () => void, ms: number) => Timer;

/**
 * The announcement rules without React or the DOM, so they can be tested directly. `emit` receives the text for
 * the live region: "" to clear it, then the message.
 */
export function createResultAnnouncer(emit: (text: string) => void, schedule: Schedule, delay = RESULT_ANNOUNCE_DELAY_MS) {
  let armed = false;
  let announced: string | null = null;
  let current: { key: string; message: string } | null = null;
  let pending: Timer | null = null;

  return {
    /** The reader acted inside the explorer. The state at that moment is the baseline. */
    arm() {
      if (armed || !current) return;
      armed = true;
      announced = current.key;
    },
    /** The rendered filter state and its count message. */
    update(key: string, message: string) {
      const changed = current !== null && current.key !== key;
      current = { key, message };
      if (!armed || !changed) return;
      pending?.cancel();
      pending = schedule(() => {
        pending = null;
        if (!current || current.key === announced) return;
        announced = current.key;
        const text = current.message;
        emit("");
        pending = schedule(() => {
          pending = null;
          emit(text);
        }, CLEAR_GAP_MS);
      }, delay);
    },
    dispose() {
      pending?.cancel();
      pending = null;
    },
  };
}

const browserSchedule: Schedule = (fn, ms) => {
  const id = window.setTimeout(fn, ms);
  return { cancel: () => window.clearTimeout(id) };
};

/**
 * Wire an explorer to a polite live region. Spread `rootProps` on the element that holds the filters and the
 * list, and render `<ResultLiveRegion text={announcement} />` inside it. `stateKey` identifies the filter state;
 * `message` is its count wording (see `resultCountMessage`).
 */
export function useResultAnnouncer(stateKey: string, message: string) {
  const [announcement, setAnnouncement] = useState("");
  const gate = useRef<ReturnType<typeof createResultAnnouncer> | null>(null);
  const root = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const g = createResultAnnouncer(setAnnouncement, browserSchedule);
    gate.current = g;
    return () => {
      g.dispose();
      gate.current = null;
    };
  }, []);

  useEffect(() => {
    gate.current?.update(stateKey, message);
  }, [stateKey, message]);

  const arm = useCallback(() => gate.current?.arm(), []);

  /** Move focus to the first search box or select, for a Clear control that disappears once used. */
  const focusFirstFilter = useCallback(() => {
    root.current?.querySelector<HTMLElement>("input:not([type=hidden]), select")?.focus();
  }, []);

  return {
    announcement,
    focusFirstFilter,
    rootProps: { ref: root, onChangeCapture: arm, onInputCapture: arm, onClickCapture: arm },
  };
}

/** The visually hidden region the count is announced in. Always rendered, so it exists before the first message. */
export function ResultLiveRegion({ text }: { text: string }) {
  return (
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {text}
    </p>
  );
}
