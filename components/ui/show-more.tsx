"use client";

import { useState } from "react";

/**
 * Incremental rendering for long result lists. Returns how many items to draw now, resetting to the first `step`
 * whenever `resetKey` changes (a filter or search changed), without an effect. The full list stays available
 * through `showAll`, so nothing is hidden for good.
 */
export function useIncremental(resetKey: string, step = 25) {
  const [state, setState] = useState({ key: resetKey, limit: step });
  const limit = state.key === resetKey ? state.limit : step;
  return {
    limit,
    more: () => setState({ key: resetKey, limit: limit + step }),
    all: () => setState({ key: resetKey, limit: Number.POSITIVE_INFINITY }),
  };
}

/** The control under a truncated list: a count of what is shown, then "Show N more" and "Show all". */
export function ShowMore({
  shown,
  total,
  step = 25,
  noun = "rows",
  onMore,
  onAll,
}: {
  shown: number;
  total: number;
  step?: number;
  noun?: string;
  onMore: () => void;
  onAll: () => void;
}) {
  if (shown >= total) return null;
  const next = Math.min(step, total - shown);
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-4 py-3 font-display text-sm">
      <span className="tnum text-muted">
        Showing {shown} of {total} {noun}
      </span>
      <button type="button" onClick={onMore} className="min-h-10 font-medium text-accent hover:text-accent-strong">
        Show {next} more
      </button>
      <button type="button" onClick={onAll} className="min-h-10 text-muted underline underline-offset-4 hover:text-accent">
        Show all
      </button>
    </div>
  );
}
