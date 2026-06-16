"use client";

import { useMemo, useState } from "react";
import { EventListItem } from "@/components/event-card";
import { Card } from "@/components/ui/card";
import {
  jurisdictionLabels,
  mechanismLabels,
  policyStatusLabels,
} from "@/lib/labels";
import type {
  JurisdictionCode,
  Material,
  Mechanism,
  PolicyEvent,
  PolicyStatus,
} from "@/lib/types";

const ALL = "all";

const selectClass =
  "w-full rounded-md border border-border bg-card px-2.5 py-2 font-display text-sm text-foreground focus:border-accent/50 focus:outline-none";

export function EventsExplorer({
  events,
  materials,
}: {
  events: PolicyEvent[];
  materials: Material[];
}) {
  const [query, setQuery] = useState("");
  const [actor, setActor] = useState<string>(ALL);
  const [mechanism, setMechanism] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [material, setMaterial] = useState<string>(ALL);

  // Only surface filter options that actually occur in the data.
  const options = useMemo(() => {
    const actors = new Set<JurisdictionCode>();
    const mechanisms = new Set<Mechanism>();
    const statuses = new Set<PolicyStatus>();
    const materialIds = new Set<string>();
    for (const e of events) {
      actors.add(e.jurisdiction);
      e.mechanism.forEach((m) => mechanisms.add(m));
      statuses.add(e.policyStatus);
      e.affectedMaterialIds.forEach((m) => materialIds.add(m));
    }
    return { actors, mechanisms, statuses, materialIds };
  }, [events]);

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
  }, [events, query, actor, mechanism, status, material]);

  const isFiltered =
    query.trim() !== "" ||
    actor !== ALL ||
    mechanism !== ALL ||
    status !== ALL ||
    material !== ALL;

  function reset() {
    setQuery("");
    setActor(ALL);
    setMechanism(ALL);
    setStatus(ALL);
    setMaterial(ALL);
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
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
      </div>

      <div className="mt-4 flex items-center justify-between font-mono text-sm text-faint">
        <p className="tnum">
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

      <Card className="mt-3 overflow-hidden">
        {filtered.length > 0 ? (
          filtered.map((e) => <EventListItem key={e.id} event={e} />)
        ) : (
          <p className="px-4 py-10 text-center text-sm text-muted">
            No events match these filters.
          </p>
        )}
      </Card>
    </div>
  );
}
