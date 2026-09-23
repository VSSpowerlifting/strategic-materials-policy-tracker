"use client";

/**
 * Shared filter plumbing for the capital and controls explorers: labelled
 * selects, a search box, and URL-parameter sync. Parameters are read from
 * `window.location` after mount (never `useSearchParams`), so the prerendered
 * HTML always carries the full, unfiltered list — the same contract as the
 * events explorer.
 */
import { useEffect, useRef } from "react";

export const ALL = "all";

export const selectClass =
  "w-full rounded-md border border-border bg-card px-2.5 py-2 font-display text-sm text-foreground focus:border-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

export function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; count?: number }[];
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-faint">{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        <option value={ALL}>All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
            {o.count !== undefined ? ` (${o.count})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SearchBox({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-faint">Search</span>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={selectClass}
      />
    </label>
  );
}

/**
 * Two-way URL sync. `state` maps parameter names to values; `apply` receives
 * the validated incoming values once after mount. Values equal to ALL (or
 * empty) are omitted from the URL.
 */
export function useUrlFilters(
  state: Record<string, string>,
  apply: (incoming: Record<string, string>) => void,
) {
  const read = useRef(false);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const incoming: Record<string, string> = {};
    for (const k of Object.keys(state)) {
      const v = p.get(k);
      if (v) incoming[k] = v;
    }
    apply(incoming);
    read.current = true;
    // Mount-only read of an external system; see the events explorer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const key = JSON.stringify(state);
  useEffect(() => {
    if (!read.current) return;
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(state)) if (v && v !== ALL) p.set(k, v);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

export function countOptions<T extends string>(values: T[], labels: Record<T, string>, order: readonly T[]) {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return order.filter((v) => counts.has(v)).map((v) => ({ value: v, label: labels[v], count: counts.get(v) }));
}

export function normalize(s: string): string {
  return s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
