"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { searchDocs, SEARCH_KINDS } from "@/lib/search";
import type { SearchDoc, SearchKind } from "@/lib/search";
import { jurisdictionLabels, mechanismLabels } from "@/lib/labels";
import { JURISDICTIONS, MECHANISMS } from "@/lib/types";
import type { JurisdictionCode, Mechanism } from "@/lib/types";
import { site } from "@/lib/site";

const ALL = "all";

const KIND_LABEL: Record<SearchKind, string> = {
  event: "Events",
  capital: "Financial commitments",
  control: "Control clauses",
  project: "Projects",
  organization: "Organizations",
  programme: "Programmes",
  material: "Materials",
  actor: "Actors",
  framing: "Framing claims",
  source: "Sources",
  watched: "Watchlist",
};

const selectClass =
  "w-full rounded-md border border-border bg-card px-2.5 py-2 font-display text-sm text-foreground focus:border-accent/50 focus:outline-none";

/**
 * URL parameter names, matching the convention the events explorer already
 * established (`actor=china`, `mechanism=export_control`) so a param means
 * the same thing everywhere on the site. Read from `window.location.search`
 * after mount rather than `useSearchParams()` for the same reason as the
 * events explorer: `useSearchParams` opts the route out of static
 * prerendering, and this page's prerendered HTML is the empty-query state.
 */
const PARAM = { query: "q", kind: "kind", actor: "actor", mechanism: "mechanism" } as const;

export function SearchExplorer({ docs }: { docs: SearchDoc[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<string>(ALL);
  const [actor, setActor] = useState<string>(ALL);
  const [mechanism, setMechanism] = useState<string>(ALL);
  // Guards the write-back effect so it cannot clear an incoming URL before the
  // read below has applied it (same reasoning as the events explorer).
  const [urlRead, setUrlRead] = useState(false);

  // Only offer filter values that actually occur in the index, in canonical
  // taxonomy order rather than insertion order.
  const options = useMemo(() => {
    const actors = new Set<JurisdictionCode>();
    const mechanisms = new Set<Mechanism>();
    for (const d of docs) {
      if (d.jurisdiction) actors.add(d.jurisdiction);
      for (const m of d.mechanisms ?? []) mechanisms.add(m);
    }
    return {
      actors: JURISDICTIONS.filter((j) => actors.has(j)) as JurisdictionCode[],
      mechanisms: MECHANISMS.filter((m) => mechanisms.has(m)),
    };
  }, [docs]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const q = p.get(PARAM.query);
    const k = p.get(PARAM.kind);
    const a = p.get(PARAM.actor);
    const m = p.get(PARAM.mechanism);
    /*
     * `window.location` is read once at mount, which is a sanctioned use of an
     * effect, and reading ?q= via useSearchParams would opt this page's
     * Suspense boundary out of prerendering. Deriving it during render would
     * make the client's first tree disagree with the prerendered HTML (which
     * is, correctly, the empty-query state) and produce a hydration mismatch.
     * Same reasoning and same scoped exception as the events explorer.
     */
    /* eslint-disable react-hooks/set-state-in-effect */
    if (q) setQuery(q);
    if (k && (SEARCH_KINDS as readonly string[]).includes(k)) setKind(k);
    if (a && options.actors.includes(a as JurisdictionCode)) setActor(a);
    if (m && options.mechanisms.includes(m as Mechanism)) setMechanism(m);
    setUrlRead(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // Mount-only: the URL is an entry parameter, not a live binding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror filter state into the URL so any view is shareable, exactly as the
  // events explorer does: `replaceState`, not a push, so typing does not spray
  // history entries.
  useEffect(() => {
    if (!urlRead) return;
    const params = new URLSearchParams();
    const q = query.trim();
    if (q) params.set(PARAM.query, q);
    if (kind !== ALL) params.set(PARAM.kind, kind);
    if (actor !== ALL) params.set(PARAM.actor, actor);
    if (mechanism !== ALL) params.set(PARAM.mechanism, mechanism);
    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (next === `${window.location.pathname}${window.location.search}`) return;
    window.history.replaceState(null, "", next);
  }, [query, kind, actor, mechanism, urlRead]);

  const hasActiveFilter = kind !== ALL || actor !== ALL || mechanism !== ALL;
  const hasQuery = query.trim() !== "";

  // Filters compose with the text query: an empty query with an active filter
  // browses the filtered set rather than showing nothing, so "all China
  // records" is a valid search on its own.
  const preKind = useMemo(() => {
    const base = hasQuery ? searchDocs(docs, query) : docs;
    return base.filter(
      (d) =>
        (actor === ALL || d.jurisdiction === actor) &&
        (mechanism === ALL || (d.mechanisms ?? []).includes(mechanism as Mechanism)),
    );
  }, [docs, query, hasQuery, actor, mechanism]);

  const results = useMemo(
    () => (kind === ALL ? preKind : preKind.filter((d) => d.kind === kind)),
    [preKind, kind],
  );

  // Per-kind counts are over the filters other than kind itself, so the kind
  // dropdown shows what selecting it would reveal.
  const counts = useMemo(() => {
    const out = {} as Record<SearchKind, number>;
    for (const k of SEARCH_KINDS) out[k] = preKind.filter((d) => d.kind === k).length;
    return out;
  }, [preKind]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const active = hasQuery || hasActiveFilter;

  function reset() {
    setQuery("");
    setKind(ALL);
    setActor(ALL);
    setMechanism(ALL);
  }

  return (
    <div>
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="q" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
              Search the corpus
            </label>
            <input
              id="q"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Announcement No. 61, 稀土, gallium, Section 232…"
              className={selectClass}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="kind" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
              Record type
            </label>
            <select id="kind" value={kind} onChange={(e) => setKind(e.target.value)} className={selectClass}>
              <option value={ALL}>All types{active ? ` (${total})` : ""}</option>
              {SEARCH_KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                  {active ? ` (${counts[k]})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="actor" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
              Actor
            </label>
            <select id="actor" value={actor} onChange={(e) => setActor(e.target.value)} className={selectClass}>
              <option value={ALL}>All actors</option>
              {options.actors.map((a) => (
                <option key={a} value={a}>
                  {jurisdictionLabels[a]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="mechanism" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
              Mechanism
            </label>
            <select
              id="mechanism"
              value={mechanism}
              onChange={(e) => setMechanism(e.target.value)}
              className={selectClass}
            >
              <option value={ALL}>All mechanisms</option>
              {options.mechanisms.map((m) => (
                <option key={m} value={m}>
                  {mechanismLabels[m]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="text-xs leading-5 text-faint">
            Matching is exact substring, not fuzzy — <span className="font-mono">No. 61</span> and{" "}
            <span className="font-mono">No. 62</span> are different instruments, so a near-miss is
            worse than no match. Original-language text is indexed in its own script; searching{" "}
            <span className="font-mono">稀土</span> works. Actor and mechanism filters apply
            to every record type that carries one, not only events.
          </p>
          {active ? (
            <button
              type="button"
              onClick={reset}
              className="shrink-0 font-mono text-xs text-accent hover:text-accent-strong"
            >
              Clear
            </button>
          ) : null}
        </div>
      </Card>

      <div className="mt-6">
        {!active ? (
          <p className="text-sm leading-7 text-faint">
            {docs.length} records indexed — events, materials, actors, framing claims, sources and
            watchlist entries.
          </p>
        ) : results.length === 0 ? (
          <Card className="p-6">
            <p className="font-display font-semibold tracking-tight">No matches</p>
            <p className="mt-2 max-w-prose text-sm leading-6 text-muted">
              Nothing in the corpus satisfies every term and filter together. This is a bounded
              database — a fixed set of actors, a rare-earth-centred material set, and instruments
              from {site.scopeStart} forward — so an absence here means the record has not been
              coded, not that no such measure exists.
            </p>
          </Card>
        ) : (
          <>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
              {results.length} {results.length === 1 ? "result" : "results"}
              {kind !== ALL ? ` in ${KIND_LABEL[kind as SearchKind]}` : ""}
              {actor !== ALL ? ` · ${jurisdictionLabels[actor as JurisdictionCode]}` : ""}
              {mechanism !== ALL ? ` · ${mechanismLabels[mechanism as Mechanism]}` : ""}
            </p>
            <ul className="grid gap-2">
              {results.map((d) => (
                <li key={`${d.kind}:${d.id}`}>
                  <Link
                    href={d.href}
                    className="block rounded-lg border bg-card p-4 transition-colors hover:border-accent/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="font-display font-semibold leading-snug tracking-tight">
                        {d.title}
                      </span>
                      <Badge>{KIND_LABEL[d.kind]}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted">{d.subtitle}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
