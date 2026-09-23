"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EventListItem } from "@/components/event-card";
import { Card } from "@/components/ui/card";
import {
  framingCategoryShort,
  jurisdictionLabels,
  mechanismLabels,
  policyStatusLabels,
} from "@/lib/labels";
import { FRAMING_CATEGORIES } from "@/lib/types";
import type {
  FramingCategory,
  JurisdictionCode,
  Material,
  Mechanism,
  PolicyEvent,
  PolicyStatus,
} from "@/lib/types";

const ALL = "all";

const selectClass =
  "w-full rounded-md border border-border bg-card px-2.5 py-2 font-display text-sm text-foreground focus:border-accent/50 focus:outline-none";

/**
 * URL parameter names for the filters.
 *
 * The explorer previously kept all filter state in `useState` only, so there
 * was no existing URL convention to follow — these names are introduced here
 * and are the contract the comparative matrix deep-links against. Values are
 * the underlying coded values, not display labels: `actor=china`,
 * `mechanism=export_control`, `status=active`, `material=gallium`
 * (material id, which equals its slug), `framing=national_security`, `q=…`.
 *
 * Params are read from `window.location.search` after mount rather than via
 * `useSearchParams()`. `useSearchParams` opts its Suspense boundary out of
 * prerendering, which stripped all fourteen events out of the statically
 * generated `/events` HTML — bad for a database whose worth is being citable
 * and indexable. Reading location after mount keeps the full list in the
 * prerendered output and needs no Suspense boundary.
 */
const PARAM = {
  query: "q",
  actor: "actor",
  mechanism: "mechanism",
  status: "status",
  material: "material",
  framing: "framing",
} as const;

export function EventsExplorer({
  events,
  materials,
  framingByEvent,
}: {
  events: PolicyEvent[];
  materials: Material[];
  /** Event id → framing categories (from getFramingCategoriesByEvent). */
  framingByEvent: Record<string, FramingCategory[]>;
}) {
  // Only surface filter options that actually occur in the data.
  const options = useMemo(() => {
    const actors = new Set<JurisdictionCode>();
    const mechanisms = new Set<Mechanism>();
    const statuses = new Set<PolicyStatus>();
    const materialIds = new Set<string>();
    const framingSeen = new Set<FramingCategory>();
    for (const e of events) {
      actors.add(e.jurisdiction);
      e.mechanism.forEach((m) => mechanisms.add(m));
      statuses.add(e.policyStatus);
      e.affectedMaterialIds.forEach((m) => materialIds.add(m));
      (framingByEvent[e.id] ?? []).forEach((c) => framingSeen.add(c));
    }
    // Canonical taxonomy order, not insertion order.
    const framings = FRAMING_CATEGORIES.filter((c) => framingSeen.has(c));
    return { actors, mechanisms, statuses, materialIds, framings };
  }, [events, framingByEvent]);

  // Server render and first client render are the unfiltered list, so the
  // prerendered HTML carries every event.
  const [query, setQuery] = useState("");
  const [actor, setActor] = useState<string>(ALL);
  const [mechanism, setMechanism] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [material, setMaterial] = useState<string>(ALL);
  const [framing, setFraming] = useState<string>(ALL);
  const [showMore, setShowMore] = useState(false);
  // Guards the write-back effect so it cannot clear the incoming URL before the
  // read below has applied it.
  const [urlRead, setUrlRead] = useState(false);

  // Apply any incoming filters from the URL once, on mount, so a deep link
  // (notably from the comparative matrix) lands on the right subset. Values are
  // validated against what actually occurs in the data, so an unknown or stale
  // parameter falls back to "all" rather than silently rendering an empty list.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const take = (name: string, isValid: (v: string) => boolean) => {
      const v = p.get(name);
      return v && isValid(v) ? v : ALL;
    };

    const nextActor = take(PARAM.actor, (v) => options.actors.has(v as JurisdictionCode));
    const nextMechanism = take(PARAM.mechanism, (v) => options.mechanisms.has(v as Mechanism));
    const nextStatus = take(PARAM.status, (v) => options.statuses.has(v as PolicyStatus));
    const nextMaterial = take(PARAM.material, (v) => options.materialIds.has(v));
    const nextFraming = take(PARAM.framing, (v) =>
      options.framings.includes(v as FramingCategory),
    );

    /*
     * `window.location` is an external system read once at mount, which is a
     * sanctioned use of an effect. It deliberately runs *after* hydration:
     * deriving this during render would make the client's first tree disagree
     * with the prerendered HTML (which is, correctly, the unfiltered list) and
     * produce a hydration mismatch. Hence the scoped rule exception.
     */
    /* eslint-disable react-hooks/set-state-in-effect */
    setQuery(p.get(PARAM.query) ?? "");
    setActor(nextActor);
    setMechanism(nextMechanism);
    setStatus(nextStatus);
    setMaterial(nextMaterial);
    setFraming(nextFraming);
    // Secondary filters open when a deep link populated one of them, so an
    // arriving reader can see why the list is narrowed.
    if (nextStatus !== ALL || nextMaterial !== ALL || nextFraming !== ALL) setShowMore(true);
    setUrlRead(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // Mount-only: the URL is an entry parameter, not a live binding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const materialName = useMemo(() => {
    const map = new Map(materials.map((m) => [m.id, m.nameEn]));
    return (id: string) => map.get(id) ?? id;
  }, [materials]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (actor !== ALL && e.jurisdiction !== actor) return false;
      if (mechanism !== ALL && !e.mechanism.includes(mechanism as Mechanism))
        return false;
      if (status !== ALL && e.policyStatus !== status) return false;
      if (material !== ALL && !e.affectedMaterialIds.includes(material)) return false;
      if (
        framing !== ALL &&
        !(framingByEvent[e.id] ?? []).includes(framing as FramingCategory)
      )
        return false;
      if (q) {
        const hay = [
          e.titleEn,
          e.titleOriginal,
          e.summary,
          e.documentNumber ?? "",
          e.issuingBody,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, query, actor, mechanism, status, material, framing, framingByEvent]);

  const isFiltered =
    query.trim() !== "" ||
    actor !== ALL ||
    mechanism !== ALL ||
    status !== ALL ||
    material !== ALL ||
    framing !== ALL;

  const secondaryActive =
    (status !== ALL ? 1 : 0) + (material !== ALL ? 1 : 0) + (framing !== ALL ? 1 : 0);

  // A reader arriving from a matrix cell sees a pre-narrowed list; name the
  // active filters so the narrowing is legible rather than looking like a
  // short dataset. Labels only — no counts or claims beyond the filters.
  const activeLabels = [
    actor !== ALL ? jurisdictionLabels[actor as JurisdictionCode] : null,
    material !== ALL ? materialName(material) : null,
    mechanism !== ALL ? mechanismLabels[mechanism as Mechanism] : null,
    status !== ALL ? policyStatusLabels[status as PolicyStatus] : null,
    framing !== ALL ? framingCategoryShort[framing as FramingCategory] : null,
  ].filter(Boolean) as string[];

  // Mirror the filter state into the URL so any view is shareable and the
  // matrix deep link round-trips. `replaceState` rather than a push: typing in
  // the search box must not spray history entries, and Back should return to
  // wherever the reader came from (the matrix, typically) rather than unwinding
  // keystrokes. Using the History API directly also avoids a router navigation,
  // which would re-render the route for a purely client-side concern.
  useEffect(() => {
    if (!urlRead) return;
    const params = new URLSearchParams();
    const q = query.trim();
    if (q) params.set(PARAM.query, q);
    if (actor !== ALL) params.set(PARAM.actor, actor);
    if (mechanism !== ALL) params.set(PARAM.mechanism, mechanism);
    if (status !== ALL) params.set(PARAM.status, status);
    if (material !== ALL) params.set(PARAM.material, material);
    if (framing !== ALL) params.set(PARAM.framing, framing);
    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (next === `${window.location.pathname}${window.location.search}`) return;
    window.history.replaceState(null, "", next);
  }, [query, actor, mechanism, status, material, framing, urlRead]);

  function reset() {
    setQuery("");
    setActor(ALL);
    setMechanism(ALL);
    setStatus(ALL);
    setMaterial(ALL);
    setFraming(ALL);
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, summaries, document numbers…"
            aria-label="Search events"
            className={selectClass}
          />
        </div>
        <select
          aria-label="Filter by actor"
          className={selectClass}
          value={actor}
          onChange={(e) => setActor(e.target.value)}
        >
          <option value={ALL}>All actors</option>
          {[...options.actors].map((a) => (
            <option key={a} value={a}>
              {jurisdictionLabels[a]}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by mechanism"
          className={selectClass}
          value={mechanism}
          onChange={(e) => setMechanism(e.target.value)}
        >
          <option value={ALL}>All mechanisms</option>
          {[...options.mechanisms].map((m) => (
            <option key={m} value={m}>
              {mechanismLabels[m]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          aria-controls="more-filters"
          className="rounded font-mono text-xs text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {showMore ? "− " : "+ "}More filters
          {!showMore && secondaryActive > 0 ? (
            <span className="ml-1.5 text-accent">({secondaryActive} active)</span>
          ) : null}
        </button>
      </div>

      <div
        id="more-filters"
        hidden={!showMore}
        className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        <select
          aria-label="Filter by status"
          className={selectClass}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value={ALL}>All statuses</option>
          {[...options.statuses].map((s) => (
            <option key={s} value={s}>
              {policyStatusLabels[s]}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by material"
          className={selectClass}
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
        >
          <option value={ALL}>All materials</option>
          {[...options.materialIds].sort().map((id) => (
            <option key={id} value={id}>
              {materialName(id)}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by framing category"
          className={selectClass}
          value={framing}
          onChange={(e) => setFraming(e.target.value)}
        >
          <option value={ALL}>All framing</option>
          {options.framings.map((c) => (
            <option key={c} value={c}>
              {framingCategoryShort[c]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-sm text-faint">
        <p className="tnum" aria-live="polite">
          {filtered.length} of {events.length} events
          {activeLabels.length > 0 ? (
            <span className="text-muted"> · {activeLabels.join(" · ")}</span>
          ) : null}
        </p>
        {isFiltered ? (
          <button
            type="button"
            onClick={reset}
            className="text-accent hover:text-accent-strong"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <Card className="mt-3 overflow-hidden">
        {filtered.length > 0 ? (
          filtered.map((e) => (
            <EventListItem
              key={e.id}
              event={e}
              framingCategories={framingByEvent[e.id] ?? []}
            />
          ))
        ) : (
          <p className="px-4 py-10 text-center text-sm text-muted">
            No events match these filters.
          </p>
        )}
      </Card>

      <p className="mt-3 font-mono text-[11px] leading-relaxed text-faint">
        Framing markers show how the issuing government officially presented a
        measure — quoted, not inferred — and do not restate its legal effect.
        Compare anchors on the{" "}
        <Link href="/framing" className="text-accent hover:text-accent-strong">
          framing page
        </Link>
        .
      </p>
    </div>
  );
}
