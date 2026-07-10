"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FramingBadges, JurisdictionTag, StatusBadge } from "@/components/labels";
import { jurisdictionLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import type {
  FramingCategory,
  JurisdictionCode,
  Material,
  PolicyEvent,
} from "@/lib/types";

const ALL = "all";
const WINDOW_START = "2025-04-01";

const selectClass =
  "rounded-md border border-border bg-card px-2.5 py-2 font-display text-sm text-foreground focus:border-accent/50 focus:outline-none";

function TimelineNode({
  event,
  framingCategories,
}: {
  event: PolicyEvent;
  framingCategories: FramingCategory[];
}) {
  return (
    <li className="relative border-l border-border pb-8 pl-7 last:border-l-transparent last:pb-0">
      <span
        aria-hidden
        className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-accent"
      />
      <time className="tnum font-mono text-xs text-faint">
        {formatDate(event.date)}
      </time>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <JurisdictionTag code={event.jurisdiction} />
        <Link
          href={`/events/${event.id}`}
          className="text-pretty font-display font-medium leading-snug hover:text-accent"
        >
          {event.titleEn}
        </Link>
        <StatusBadge status={event.policyStatus} />
      </div>
      {/* Official-framing markers; anchored quotes only, linked to /framing */}
      {framingCategories.length > 0 ? (
        <div className="mt-2">
          <FramingBadges categories={framingCategories} linked />
        </div>
      ) : null}
    </li>
  );
}

export function TimelineView({
  events,
  materials,
  framingByEvent,
}: {
  events: PolicyEvent[];
  materials: Material[];
  /** Event id → framing categories (from getFramingCategoriesByEvent). */
  framingByEvent: Record<string, FramingCategory[]>;
}) {
  const [actor, setActor] = useState(ALL);
  const [material, setMaterial] = useState(ALL);

  const actors = useMemo(
    () => [...new Set(events.map((e) => e.jurisdiction))],
    [events],
  );
  const materialIds = useMemo(() => {
    const ids = new Set<string>();
    events.forEach((e) => e.affectedMaterialIds.forEach((m) => ids.add(m)));
    return [...ids].sort();
  }, [events]);
  const materialName = useMemo(() => {
    const map = new Map(materials.map((m) => [m.id, m.nameEn]));
    return (id: string) => map.get(id) ?? id;
  }, [materials]);

  const filtered = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.filter((e) => {
      if (actor !== ALL && e.jurisdiction !== actor) return false;
      if (material !== ALL && !e.affectedMaterialIds.includes(material)) return false;
      return true;
    });
  }, [events, actor, material]);

  const foundational = filtered.filter((e) => e.date < WINDOW_START);
  const inWindow = filtered.filter((e) => e.date >= WINDOW_START);

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <select
          aria-label="Filter by actor"
          className={selectClass}
          value={actor}
          onChange={(e) => setActor(e.target.value)}
        >
          <option value={ALL}>All actors</option>
          {actors.map((a) => (
            <option key={a} value={a}>
              {jurisdictionLabels[a as JurisdictionCode]}
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
          {materialIds.map((id) => (
            <option key={id} value={id}>
              {materialName(id)}
            </option>
          ))}
        </select>
        <span className="tnum self-center font-mono text-sm text-faint">
          {filtered.length} of {events.length}
        </span>
      </div>

      <div className="mt-10">
        {foundational.length > 0 ? (
          <div className="mb-2">
            <p className="mb-4 font-mono text-xs text-faint">
              Foundational context · before April 2025
            </p>
            <ol>
              {foundational.map((e) => (
                <TimelineNode
                  key={e.id}
                  event={e}
                  framingCategories={framingByEvent[e.id] ?? []}
                />
              ))}
            </ol>
          </div>
        ) : null}

        <div className="relative mb-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border-strong" />
          <span className="font-mono text-xs text-accent">
            April 2025 · acute phase
          </span>
          <span className="h-px flex-1 bg-border-strong" />
        </div>

        {inWindow.length > 0 ? (
          <ol>
            {inWindow.map((e) => (
              <TimelineNode
                key={e.id}
                event={e}
                framingCategories={framingByEvent[e.id] ?? []}
              />
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted">No events match these filters.</p>
        )}
      </div>

      <p className="mt-10 font-mono text-[11px] leading-relaxed text-faint">
        Framing markers show how the issuing government officially presented a
        measure — quoted, not inferred — and do not restate its legal effect.
        Events without markers have framing that is not yet coded, not framing
        that does not exist. Compare anchors on the{" "}
        <Link href="/framing" className="text-accent hover:text-accent-strong">
          framing page
        </Link>
        .
      </p>
    </div>
  );
}
