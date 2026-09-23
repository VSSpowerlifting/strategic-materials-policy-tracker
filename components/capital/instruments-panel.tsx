import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CommitmentRow, ControlRow } from "@/components/capital/rows";
import { summarizeCommitment, summarizeControl } from "@/lib/capital-control";
import { financialRelationshipTypeLabels } from "@/lib/labels";
import type { ControlMeasure, FinancialCommitment } from "@/lib/types";

/**
 * The Capital & Control rows attached to an event, a material or an actor.
 * Financial rows are nested under a package or envelope that is also in the
 * list, so a reader sees which figures sit inside which before adding
 * anything up.
 */
export function InstrumentsPanel({
  commitments,
  controls,
  capitalHref,
  controlsHref,
}: {
  commitments: FinancialCommitment[];
  controls: ControlMeasure[];
  /** Link to the filtered /capital view, when this panel is a subset. */
  capitalHref?: string;
  controlsHref?: string;
}) {
  const ids = new Set(commitments.map((c) => c.id));
  const parentIn = (c: FinancialCommitment) => c.relationships.find((r) => ids.has(r.commitmentId));
  const ordered: { c: FinancialCommitment; depth: number; rel?: string }[] = [];
  const place = (c: FinancialCommitment, depth: number) => {
    const p = parentIn(c);
    ordered.push({
      c,
      depth,
      rel: depth && p ? `${financialRelationshipTypeLabels[p.relationship].toLowerCase()} the row above` : undefined,
    });
    commitments.filter((k) => parentIn(k)?.commitmentId === c.id).forEach((k) => place(k, depth + 1));
  };
  commitments.filter((c) => !parentIn(c)).forEach((c) => place(c, 0));

  return (
    <div className="space-y-6">
      {commitments.length ? (
        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
              Financial instruments ({commitments.length})
            </h3>
            {capitalHref ? (
              <Link href={capitalHref} className="font-mono text-[11px] text-accent hover:text-accent-strong">
                Open in Capital →
              </Link>
            ) : null}
          </div>
          <Card className="overflow-hidden">
            {ordered.map(({ c, depth, rel }) => (
              <CommitmentRow key={c.id} c={summarizeCommitment(c)} indent={depth} relationLabel={rel} />
            ))}
          </Card>
        </div>
      ) : null}
      {controls.length ? (
        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
              Control clauses ({controls.length})
            </h3>
            {controlsHref ? (
              <Link href={controlsHref} className="font-mono text-[11px] text-accent hover:text-accent-strong">
                Open in Controls →
              </Link>
            ) : null}
          </div>
          <Card className="overflow-hidden">
            {controls.map((m) => (
              <ControlRow key={m.id} m={summarizeControl(m)} />
            ))}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
