"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EventListItem } from "@/components/event-card";
import { getAllEvents } from "@/lib/data";
import { buildBibtexForEvent, plainCitation } from "@/lib/citation";
import { eventsCsv } from "@/lib/export";
import {
  clearSavedEvents,
  getSavedEventIds,
  subscribeSavedEvents,
  unsaveEvent,
} from "@/lib/watchlist-client";
import type { PolicyEvent } from "@/lib/types";

const buttonClass =
  "rounded-md border border-border px-3 py-1.5 font-display text-xs text-foreground transition-colors hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground";

export function SavedEventsExplorer() {
  const [ids, setIds] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setIds(getSavedEventIds());
    refresh();
    return subscribeSavedEvents(refresh);
  }, []);

  // Resolved against the live corpus, newest first, and silently drops any id
  // whose event no longer exists (a corpus edit since it was saved) rather
  // than rendering a broken row — the stored list still carries the stale
  // id until the reader removes it explicitly.
  const events = useMemo(() => {
    const byId = new Map(getAllEvents().map((e) => [e.id, e]));
    return ids.map((id) => byId.get(id)).filter((e): e is PolicyEvent => Boolean(e));
  }, [ids]);

  const staleCount = ids.length - events.length;

  async function copy(text: string, which: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      window.setTimeout(() => setCopied((c) => (c === which ? null : c)), 2000);
    } catch {
      setCopied(null);
    }
  }

  if (ids.length === 0) {
    return (
      <Card className="p-6">
        <p className="font-display font-semibold tracking-tight">Nothing saved yet</p>
        <p className="mt-2 max-w-prose text-sm leading-6 text-muted">
          Open any event and choose “Save to my list.” The list lives only in this browser
          — there is no account and nothing is sent anywhere — so it will not follow you to
          another device or survive clearing site data.
        </p>
        <Link href="/events" className="mt-4 inline-block font-display text-sm text-accent hover:text-accent-strong">
          Browse events →
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
            {events.length} saved {events.length === 1 ? "event" : "events"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={buttonClass} onClick={() => copy(JSON.stringify(events, null, 2), "json")}>
              {copied === "json" ? "Copied" : "Copy as JSON"}
            </button>
            <button type="button" className={buttonClass} onClick={() => copy(eventsCsv(events), "csv")}>
              {copied === "csv" ? "Copied" : "Copy as CSV"}
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={() => copy(events.map((e) => buildBibtexForEvent(e)).join("\n"), "bibtex")}
            >
              {copied === "bibtex" ? "Copied" : "Copy as BibTeX"}
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={() => copy(events.map(plainCitation).join("\n\n"), "plain")}
            >
              {copied === "plain" ? "Copied" : "Copy citations"}
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                clearSavedEvents();
              }}
            >
              Clear all
            </button>
          </div>
        </div>
        {staleCount > 0 ? (
          <p className="mt-2 text-xs leading-5 text-faint">
            {staleCount} saved {staleCount === 1 ? "id no longer resolves" : "ids no longer resolve"} to
            a published event and {staleCount === 1 ? "is" : "are"} hidden here.
          </p>
        ) : null}
      </Card>

      <div className="mt-4 grid gap-2">
        {events.map((e) => (
          <div key={e.id} className="flex items-stretch gap-2">
            <div className="min-w-0 flex-1">
              <Card className="overflow-hidden p-0">
                <EventListItem event={e} />
              </Card>
            </div>
            <button
              type="button"
              onClick={() => unsaveEvent(e.id)}
              aria-label={`Remove "${e.titleEn}" from my saved events`}
              className="shrink-0 self-center rounded-md border border-border px-3 py-1.5 font-display text-xs text-muted transition-colors hover:border-accent/50 hover:text-accent"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
