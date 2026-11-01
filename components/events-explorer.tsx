"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { EventListItem } from "@/components/event-card";
import { FilterSelect, SearchBox } from "@/components/capital/filter-controls";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  framingCategoryShort,
  jurisdictionLabels,
  mechanismLabels,
  policyStatusLabels,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
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
  const wroteUrl = useRef(false);
  // Guards the write-back effect so it cannot clear the incoming URL before the
  // read below has applied it.
  const [urlRead, setUrlRead] = useState(false);

  // Read incoming filters on mount and history traversal, so a deep link
  // (notably from the comparative matrix) lands on the right subset. Values are
  // validated against what actually occurs in the data, so an unknown or stale
  // parameter falls back to "all" rather than silently rendering an empty list.
  useEffect(() => {
    const readLocation = () => {
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

      // Read after hydration to preserve the full prerendered corpus list.
      setQuery(p.get(PARAM.query) ?? "");
      setActor(nextActor);
      setMechanism(nextMechanism);
      setStatus(nextStatus);
      setMaterial(nextMaterial);
      setFraming(nextFraming);
      setUrlRead(true);
    };
    readLocation();
    window.addEventListener("popstate", readLocation);
    return () => window.removeEventListener("popstate", readLocation);
    // Public corpus facets are stable for the life of this page.
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

  // A reader arriving from a matrix cell sees a pre-narrowed list; name each
  // active filter as a chip that can be removed on its own. Labels only — no
  // counts or claims beyond the filters.
  const chips = [
    query.trim() ? { key: "query", kind: "search", label: `“${query.trim()}”`, clear: () => setQuery("") } : null,
    actor !== ALL
      ? { key: "actor", kind: "actor", label: jurisdictionLabels[actor as JurisdictionCode], clear: () => setActor(ALL) }
      : null,
    mechanism !== ALL
      ? { key: "mechanism", kind: "mechanism", label: mechanismLabels[mechanism as Mechanism], clear: () => setMechanism(ALL) }
      : null,
    status !== ALL
      ? { key: "status", kind: "status", label: policyStatusLabels[status as PolicyStatus], clear: () => setStatus(ALL) }
      : null,
    material !== ALL
      ? { key: "material", kind: "material", label: materialName(material), clear: () => setMaterial(ALL) }
      : null,
    framing !== ALL
      ? { key: "framing", kind: "framing", label: framingCategoryShort[framing as FramingCategory], clear: () => setFraming(ALL) }
      : null,
  ].filter((c): c is NonNullable<typeof c> => c !== null);

  // Facet selections create history entries; typing replaces the current entry.
  // Preserve unrelated query parameters, hash links and Next router history.
  useEffect(() => {
    if (!urlRead) return;
    const current = new URLSearchParams(window.location.search);
    const params = new URLSearchParams(current);
    for (const key of Object.values(PARAM)) params.delete(key);
    const q = query.trim();
    if (q) params.set(PARAM.query, q);
    if (actor !== ALL) params.set(PARAM.actor, actor);
    if (mechanism !== ALL) params.set(PARAM.mechanism, mechanism);
    if (status !== ALL) params.set(PARAM.status, status);
    if (material !== ALL) params.set(PARAM.material, material);
    if (framing !== ALL) params.set(PARAM.framing, framing);
    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    const facetChanged = [PARAM.actor, PARAM.material, PARAM.mechanism, PARAM.status, PARAM.framing]
      .some(key => current.get(key) !== params.get(key));
    const firstWrite = !wroteUrl.current;
    wroteUrl.current = true;
    if (next === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;
    if (!firstWrite && facetChanged) window.history.pushState(window.history.state, "", next);
    else window.history.replaceState(window.history.state, "", next);
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
      <div className="rounded border border-border-strong bg-card/40 p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <FilterSelect id="events-material" label="Material" value={material} onChange={setMaterial}
            options={[...options.materialIds].sort().map(id => ({value: id, label: materialName(id)}))} />
          <FilterSelect id="events-government" label="Government" value={actor} onChange={setActor}
            options={[...options.actors].map(a => ({value: a, label: jurisdictionLabels[a]}))} />
          <SearchBox id="events-search" value={query} onChange={setQuery} placeholder="Title, summary or document number" />
        </div>
        <details className="mt-4" open={mechanism !== ALL || status !== ALL || framing !== ALL || undefined}>
          <summary className="w-fit cursor-pointer font-display text-sm text-muted">Instrument, status and official rationale</summary>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <FilterSelect id="events-mechanism" label="Policy mechanism" value={mechanism} onChange={setMechanism}
              options={[...options.mechanisms].map(m => ({value: m, label: mechanismLabels[m]}))} />
            <FilterSelect id="events-status" label="Policy status" value={status} onChange={setStatus}
              options={[...options.statuses].map(s => ({value: s, label: policyStatusLabels[s]}))} />
            <FilterSelect id="events-framing" label="Official rationale (quoted)" value={framing} onChange={setFraming}
              options={options.framings.map(c => ({value: c, label: framingCategoryShort[c]}))} />
          </div>
        </details>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-sm text-faint">
        <p id="events-count" tabIndex={-1} className="tnum outline-none" aria-live="polite">
          {filtered.length} of {events.length} events
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

      {chips.length > 0 ? (
        <ul aria-label="Active filters" className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          {chips.map((c) => (
            <li key={c.key}>
              <Badge accent className="gap-1.5 text-xs">
                <span>{c.label}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    // The removed chip unmounts; hand focus to a neighbour (or the count) so keyboard users keep their place.
                    const li = e.currentTarget.closest("li");
                    const next = (li?.nextElementSibling ?? li?.previousElementSibling)?.querySelector("button");
                    (next ?? document.getElementById("events-count"))?.focus();
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
      ) : null}

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
            No policy events match this combination. Remove an active filter or clear all filters to widen the search.
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
