"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type FilterChip = { key: string; kind: string; label: string; clear: () => void };

/**
 * Removable active-filter chips. Same markup and behaviour as the /events
 * chips; on removal, focus moves to a neighbouring chip, else to `fallbackId`.
 */
export function FilterChips({ chips, fallbackId }: { chips: FilterChip[]; fallbackId: string }) {
  if (chips.length === 0) return null;
  return (
    <ul aria-label="Active filters" className="flex flex-wrap gap-x-4 gap-y-2">
      {chips.map((c) => (
        <li key={c.key}>
          <Badge accent className="gap-1.5 text-xs">
            <span>{c.label}</span>
            <button
              type="button"
              onClick={(e) => {
                // The removed chip unmounts; hand focus to a neighbour (or the fallback) so keyboard users keep their place.
                const li = e.currentTarget.closest("li");
                const next = (li?.nextElementSibling ?? li?.previousElementSibling)?.querySelector("button");
                (next ?? document.getElementById(fallbackId))?.focus();
                c.clear();
              }}
              aria-label={`Remove ${c.kind} filter: ${c.label}`}
              className={cn(
                "-my-1 -mr-1 rounded px-2 py-1 text-muted transition-colors hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              <span aria-hidden>×</span>
            </button>
          </Badge>
        </li>
      ))}
    </ul>
  );
}
