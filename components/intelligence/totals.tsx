/**
 * Per-currency totals from `totalCommitments`, one block per instrument
 * (unlike instruments are never added): binding apart from not yet binding,
 * each split by how the source qualifies its figures, or a withheld total when
 * counted rows share a descendant. Pure presentation with no data imports.
 */
import Link from "next/link";
import { formatDecimalCompact } from "@/lib/decimal";
import { financialInstrumentLabels, valueQualifierLabels } from "@/lib/labels";
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
        {totals.unquantifiedIds.length
          ? `No amount stated on ${totals.unquantifiedIds.length === 1 ? "the row" : `any of ${totals.unquantifiedIds.length} rows`}`
          : totals.statusNotStatedIds.length
            ? `Nothing to sum: no status is stated on ${totals.statusNotStatedIds.length === 1 ? "the row" : `any of ${totals.statusNotStatedIds.length} rows`}`
            : totals.endedIds.length
              ? "Nothing to sum: the commitment has ended"
              : "Nothing to sum"}
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
            <div className="mt-1 divide-y divide-border/60">
              {t.instruments.map((i) => (
                <div key={i.instrument} className="space-y-1.5 py-2 first:pt-1 last:pb-0">
                  <p className="font-display text-sm font-semibold">
                    {financialInstrumentLabels[i.instrument]}
                    <span className="ml-2 font-mono text-[10px] font-normal text-faint">{i.countedIds.length} row{i.countedIds.length === 1 ? "" : "s"}</span>
                  </p>
                  {i.summed ? (
                    <>
                      <Sums label="Binding" sums={i.binding} />
                      <Sums label="Not yet binding" sums={i.notYetBinding} />
                    </>
                  ) : (
                    <p className="font-mono text-[11px] leading-5 text-faint">
                      Listed, not summed: {i.reason === "several_instruments" ? "each row combines instruments without a split" : "the sources name no instrument the tracker's vocabulary covers"}.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 font-mono text-[10px] leading-4 text-faint">
            {t.countedIds.length} counted{t.nestedIds.length ? ` · ${t.nestedIds.length} part${t.nestedIds.length === 1 ? "" : "s"} not added again` : ""}
          </p>
        </div>
      ))}
      {totals.endedIds.length ? (
        <p className="font-mono text-[11px] text-faint sm:col-span-2">
          {totals.endedIds.length} row{totals.endedIds.length === 1 ? " has" : "s have"} ended (withdrawn or lapsed) and {totals.endedIds.length === 1 ? "is" : "are"} not summed.
        </p>
      ) : null}
      {totals.statusNotStatedIds.length ? (
        <p className="font-mono text-[11px] text-faint sm:col-span-2">
          {totals.statusNotStatedIds.length} row{totals.statusNotStatedIds.length === 1 ? " states" : "s state"} an amount but no status, so {totals.statusNotStatedIds.length === 1 ? "it is" : "they are"} neither binding nor not yet binding and {totals.statusNotStatedIds.length === 1 ? "is" : "are"} listed, not summed.
        </p>
      ) : null}
      {totals.unquantifiedIds.length ? (
        <p className="font-mono text-[11px] text-faint sm:col-span-2">
          {totals.unquantifiedIds.length} row{totals.unquantifiedIds.length === 1 ? " states" : "s state"} no amount and {totals.unquantifiedIds.length === 1 ? "is" : "are"} listed, not valued.
        </p>
      ) : null}
    </div>
  );
}
