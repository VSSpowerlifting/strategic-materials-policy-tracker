"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { ActorMonogram } from "@/components/actor-monogram";
import { jurisdictionLabels, jurisdictionShort, mechanismLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MatrixRow } from "@/lib/data";
import type { JurisdictionCode } from "@/lib/types";

const PANEL_ID = "matrix-cell-detail";

type Selection = { materialId: string; jurisdiction: JurisdictionCode };

const keyOf = (materialId: string, j: JurisdictionCode) => `${materialId}:${j}`;

/**
 * The comparative control matrix, as an instrument rather than a report.
 *
 * Every populated cell is a real button that discloses what the aggregate is
 * made of — actor, material, event count, mechanisms, latest date — and offers
 * a deep link into the filtered event list. The disclosure deliberately renders
 * *outside* the horizontally scrolling table: a popover anchored inside the
 * scroll container would be clipped by `overflow-x-auto` and would fight the
 * sticky first column's stacking context. Rendering below the table keeps the
 * panel fully visible at every width, which matters most at 375px where an
 * anchored popover would sit off-screen.
 *
 * Aggregation is unchanged — this reads `getControlMatrix()` output only.
 */
export function CompareMatrix({
  jurisdictions,
  rows,
  columnTotals,
}: {
  jurisdictions: JurisdictionCode[];
  rows: MatrixRow[];
  columnTotals: Record<JurisdictionCode, number>;
}) {
  const [selected, setSelected] = useState<Selection | null>(null);
  const cellRefs = useRef(new Map<string, HTMLButtonElement | null>());
  const panelRef = useRef<HTMLDivElement | null>(null);

  const grandTotal = jurisdictions.reduce((s, j) => s + columnTotals[j], 0);

  const selectedRow = selected
    ? rows.find((r) => r.material.id === selected.materialId)
    : undefined;
  const selectedCell =
    selectedRow && selected ? selectedRow.byJurisdiction[selected.jurisdiction] : undefined;

  function close() {
    if (!selected) return;
    const trigger = cellRefs.current.get(keyOf(selected.materialId, selected.jurisdiction));
    setSelected(null);
    // Focus must land back on the cell that opened the panel.
    trigger?.focus();
  }

  function toggle(materialId: string, jurisdiction: JurisdictionCode) {
    setSelected((prev) =>
      prev && prev.materialId === materialId && prev.jurisdiction === jurisdiction
        ? null
        : { materialId, jurisdiction },
    );
  }

  // Bring the panel into view only when it is not already visible, and respect
  // reduced-motion. `block: "nearest"` keeps an in-view panel from jumping.
  useEffect(() => {
    if (!selected || !panelRef.current) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panelRef.current.scrollIntoView({
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    });
  }, [selected]);

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Escape" && selected) {
          e.stopPropagation();
          close();
        }
      }}
    >
      <div className="overflow-x-auto rounded-lg border border-border-strong plate">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Tracked materials (rows) by jurisdiction (columns). Each cell is the number of coded
            policy events in which that jurisdiction acted on that material. Cells with events are
            buttons that reveal the mechanisms, the latest date and a link to those events.
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="sticky left-0 z-10 bg-plate px-4 py-3 text-left align-bottom">
                <span className="rail">Material</span>
              </th>
              {jurisdictions.map((j) => (
                <th key={j} scope="col" className="px-3 py-3 text-center align-bottom">
                  <Link
                    href={`/actors/${jurisdictionShort[j].toLowerCase()}`}
                    className="inline-flex flex-col items-center gap-1.5 rounded hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-plate"
                    aria-label={jurisdictionLabels[j]}
                  >
                    <ActorMonogram code={jurisdictionShort[j]} size="sm" />
                  </Link>
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-right align-bottom">
                <span className="rail">Total</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.material.id} className="border-b border-border/60 last:border-b-0">
                <th scope="row" className="sticky left-0 z-10 bg-plate px-4 py-2.5 text-left font-normal">
                  <Link
                    href={`/materials/${r.material.slug}`}
                    className="text-foreground hover:text-accent"
                  >
                    {r.material.nameEn}
                  </Link>
                  {r.material.grouping ? (
                    <span className="ml-2 text-xs text-faint">{r.material.grouping}</span>
                  ) : null}
                </th>
                {jurisdictions.map((j) => {
                  const cell = r.byJurisdiction[j];
                  if (cell.count === 0)
                    return (
                      <td key={j} className="px-3 py-2.5 text-center text-faint">
                        <span aria-hidden>·</span>
                        <span className="sr-only">
                          No coded event for {r.material.nameEn} by {jurisdictionLabels[j]} — not a
                          claim that no measure exists.
                        </span>
                      </td>
                    );

                  const isOpen =
                    selected?.materialId === r.material.id && selected?.jurisdiction === j;

                  return (
                    <td key={j} className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        ref={(el) => {
                          cellRefs.current.set(keyOf(r.material.id, j), el);
                        }}
                        onClick={() => toggle(r.material.id, j)}
                        aria-expanded={isOpen}
                        aria-controls={PANEL_ID}
                        aria-label={`${jurisdictionLabels[j]}, ${r.material.nameEn}: ${cell.count} coded ${
                          cell.count === 1 ? "event" : "events"
                        }. Show details.`}
                        className={cn(
                          "tnum inline-flex h-7 min-w-7 cursor-pointer items-center justify-center rounded border px-1.5 font-display text-sm font-semibold text-foreground transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-plate",
                          isOpen
                            ? "border-accent bg-accent/25"
                            : "border-accent/30 bg-accent/10 hover:border-accent hover:bg-accent/20",
                        )}
                      >
                        {cell.count}
                      </button>
                    </td>
                  );
                })}
                <td className="px-4 py-2.5 text-right">
                  <span className="tnum font-display font-semibold text-foreground">{r.total}</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border-strong">
              <th scope="row" className="sticky left-0 z-10 bg-plate px-4 py-3 text-left">
                <span className="rail">Events per actor</span>
              </th>
              {jurisdictions.map((j) => (
                <td key={j} className="px-3 py-3 text-center">
                  <span className="tnum font-display font-semibold text-accent">
                    {columnTotals[j]}
                  </span>
                </td>
              ))}
              <td className="px-4 py-3 text-right">
                <span className="tnum font-display font-semibold text-accent">{grandTotal}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Disclosure — outside the scroll container so nothing is ever clipped. */}
      <div
        id={PANEL_ID}
        ref={panelRef}
        role="region"
        aria-live="polite"
        aria-label="Selected cell detail"
        className="mt-3 scroll-mt-24"
      >
        {selectedRow && selectedCell && selected ? (
          <div className="rounded-lg border border-accent/40 bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <ActorMonogram code={jurisdictionShort[selected.jurisdiction]} size="sm" />
                <div>
                  <h3 className="font-display font-semibold leading-snug tracking-tight text-foreground">
                    {jurisdictionLabels[selected.jurisdiction]} · {selectedRow.material.nameEn}
                  </h3>
                  <p className="tnum mt-0.5 font-mono text-xs text-faint">
                    {selectedCell.count} coded {selectedCell.count === 1 ? "event" : "events"}
                    {selectedCell.latestDate
                      ? ` · latest ${formatDate(selectedCell.latestDate)}`
                      : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded font-mono text-xs text-faint transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                Close
              </button>
            </div>

            <div className="mt-3">
              <span className="rail">Mechanisms</span>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                {selectedCell.mechanisms.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center border-l-2 border-border-strong pl-1.5 font-mono text-[11px] leading-none text-muted"
                  >
                    {mechanismLabels[m]}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href={`/events?actor=${selected.jurisdiction}&material=${selectedRow.material.id}`}
              className="mt-4 inline-block font-display text-sm text-accent hover:text-accent-strong"
            >
              View matching {selectedCell.count === 1 ? "event" : "events"} →
            </Link>
          </div>
        ) : (
          <p className="font-mono text-[11px] leading-relaxed text-faint">
            Select a cell to see its mechanisms, most recent measure and the events behind the
            count.
          </p>
        )}
      </div>
    </div>
  );
}
