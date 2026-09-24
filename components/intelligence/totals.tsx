/**
 * Per-currency totals from `totalCommitments`, as the v0.5 counting rules
 * produce them: binding apart from not yet binding, each split by how the
 * source qualifies its figures, or a withheld total when counted rows share a
 * descendant. Pure presentation with no data imports.
 */
import Link from "next/link";
import { formatDecimalCompact } from "@/lib/decimal";
import { valueQualifierLabels } from "@/lib/labels";
import type { CommitmentTotals } from "@/lib/capital-control";
import type { ValueQualifier } from "@/lib/types";

const ORDER: ValueQualifier[] = ["exact", "approximately", "at_least", "up_to"];

function Sums({ label, sums }: { label: string; sums: Partial<Record<ValueQualifier, string>> }) {
  const present = ORDER.filter((q) => sums[q]);
  if (!present.length) return null;
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{label}</p>
      <dl className="mt-0.5">
        {present.map((q) => (
          <div key={q} className="flex items-baseline justify-between gap-3">
            <dt className="font-mono text-[11px] text-faint">{q === "exact" ? "Stated exactly" : valueQualifierLabels[q]}</dt>
            <dd className="tnum font-display text-lg font-semibold">{formatDecimalCompact(sums[q]!)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function CurrencyTotals({ totals, compact = false }: { totals: CommitmentTotals; compact?: boolean }) {
  if (!totals.currencies.length)
    return (
      <p className="font-mono text-xs text-faint">
        {totals.unquantifiedIds.length ? `No amount stated on ${totals.unquantifiedIds.length === 1 ? "the row" : `any of ${totals.unquantifiedIds.length} rows`}` : "Nothing to sum"}
      </p>
    );
  return (
    <div className={compact ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>
      {totals.currencies.map((t) => (
        <div key={t.currency} className="min-w-0 rounded-md border bg-background/40 px-3 py-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{t.currency}</p>
          {t.status === "withheld" ? (
            <p className="mt-1 text-sm leading-6 text-muted">
              <strong className="font-semibold text-foreground">Total withheld.</strong>{" "}
              <Link href={`/capital/${t.overlap.a}`} className="text-accent hover:text-accent-strong">{t.overlap.a}</Link> and{" "}
              <Link href={`/capital/${t.overlap.b}`} className="text-accent hover:text-accent-strong">{t.overlap.b}</Link> share{" "}
              <Link href={`/capital/${t.overlap.shared}`} className="text-accent hover:text-accent-strong">{t.overlap.shared}</Link>.
            </p>
          ) : (
            <div className="mt-1 space-y-2">
              <Sums label="Binding" sums={t.binding} />
              <Sums label="Not yet binding" sums={t.notYetBinding} />
            </div>
          )}
          <p className="mt-2 font-mono text-[10px] leading-4 text-faint">
            {t.countedIds.length} counted{t.nestedIds.length ? ` · ${t.nestedIds.length} part${t.nestedIds.length === 1 ? "" : "s"} not added again` : ""}
          </p>
        </div>
      ))}
      {totals.unquantifiedIds.length ? (
        <p className="font-mono text-[11px] text-faint sm:col-span-2">
          {totals.unquantifiedIds.length} row{totals.unquantifiedIds.length === 1 ? " states" : "s state"} no amount and {totals.unquantifiedIds.length === 1 ? "is" : "are"} listed, not valued.
        </p>
      ) : null}
    </div>
  );
}
