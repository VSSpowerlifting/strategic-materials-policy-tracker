import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { ResearchReadingKey } from "@/components/capital/reading-guide";
import { CapitalExplorer } from "@/components/capital/capital-explorer";
import { StageMatrix } from "@/components/capital/charts";
import { CommitmentRow, InlineAmount } from "@/components/capital/rows";
import { JurisdictionTag } from "@/components/labels";
import { OptionLadder } from "@/components/capital/primitives";
import { AmountBasisNotes } from "@/components/intelligence/totals";
import {
  LISTED_NOT_SUMMED_ROLES,
  PUBLIC_CAPITAL_SOURCES,
  commitmentActor,
  countBy,
  currentFinancialStatus,
  compareDecimals,
  formatDecimalCompact,
  optionState,
  publicCommitmentRows,
  rowsByValueRole,
  summarizeCommitment,
  totalCommitments,
} from "@/lib/capital-control";
import { getAllFinancialCommitments, getAllMaterials, getFinancialCommitmentById } from "@/lib/data";
import {
  financialInstrumentLabels,
  financialStatusLabels,
  jurisdictionLabels,
  termKindLabels,
  valueQualifierLabels,
  valueRoleLabels,
} from "@/lib/labels";
import { FINANCIAL_STATUSES, JURISDICTIONS } from "@/lib/types";
import type { ValueQualifier } from "@/lib/types";

export const metadata: Metadata = {
  title: "Capital",
  description:
    "Source-verified public money in strategic-material supply chains: equity, loans, grants, tax credits, price floors, offtake and stockpile funding, by provider, recipient, stage, material and status — in original currencies, with parent envelopes and child awards never double-counted.",
};

const QUALIFIER_ORDER: ValueQualifier[] = ["exact", "approximately", "at_least", "up_to"];

export default function CapitalPage() {
  const all = getAllFinancialCommitments();
  const summaries = all.map(summarizeCommitment);
  const materialNames = Object.fromEntries(getAllMaterials().map((m) => [m.id, m.nameEn]));
  const publicRows = publicCommitmentRows(all);
  const totals = totalCommitments(publicRows, all);
  const byRole = rowsByValueRole(all);
  const envelopes = LISTED_NOT_SUMMED_ROLES.flatMap((r) => byRole.get(r) ?? []);
  const options = byRole.get("funding_option") ?? [];
  const nonPublic = all.filter(
    (c) =>
      ["private_financing", "recipient_own_funds", "expected_co_investment", "total_project_cost", "indication"].includes(c.valueRole) ||
      (c.valueRole === "commitment" && !PUBLIC_CAPITAL_SOURCES.includes(c.capitalSource)),
  );
  const unquantified = all.filter((c) => !c.amount && c.valueRole === "commitment");
  const events = new Set(all.map((c) => c.eventId)).size;
  const actors = new Set(summaries.map((s) => s.actor).filter(Boolean)).size;
  const bySummary = new Map(summaries.map((s) => [s.id, s]));
  const actorTotals = JURISDICTIONS.map((j) => ({ j, t: totalCommitments(publicRows.filter((c) => commitmentActor(c) === j), all) })).filter(
    (x) => x.t.currencies.length || x.t.unquantifiedIds.length || x.t.statusNotStatedIds.length || x.t.endedIds.length,
  );

  return (
    <Container className="py-12">
      <PageHeading
        index="01"
        title="Capital"
        lead={
          <>
            Public financing, investment and purchase guarantees for strategic-material supply chains.
            Amounts and legal status follow the cited records.
          </>
        }
      />

      <ResearchReadingKey topic="capital" />

      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4">
        {[
          ["Financial rows", all.length],
          ["Events", events],
          ["Providing governments", actors],
          ["Instruments", new Set(all.map((c) => c.instrument)).size],
        ].map(([k, v]) => (
          <div key={k} className="bg-card px-4 py-4">
            <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">{k}</dt>
            <dd className="tnum mt-1 font-display text-3xl font-bold">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-14 space-y-14">
        <Section
          index="01"
          title="Public commitments"
          description="Grouped by currency, instrument, amount qualifier and legal status. Parent and child amounts are counted once."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {totals.currencies.map((t) => {
              const counted = t.countedIds.map((id) => getFinancialCommitmentById(id)!);
              const max = counted.reduce((m, c) => (compareDecimals(c.amount!.value, m) > 0 ? c.amount!.value : m), "0");
              return (
                <Card key={t.currency} className="min-w-0 p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">{t.currency}</p>
                  {t.status === "withheld" ? (
                    <p className="mt-2 text-sm leading-6 text-muted">
                      <strong className="font-semibold text-foreground">Total withheld.</strong>{" "}
                      <Link href={`/capital/${t.overlap.a}`} className="text-accent hover:text-accent-strong">{t.overlap.a}</Link> and{" "}
                      <Link href={`/capital/${t.overlap.b}`} className="text-accent hover:text-accent-strong">{t.overlap.b}</Link> both
                      contain <Link href={`/capital/${t.overlap.shared}`} className="text-accent hover:text-accent-strong">{t.overlap.shared}</Link>,
                      so adding them would double-count. The rows are listed below without a sum.
                    </p>
                  ) : (
                    <div className="mt-2 divide-y divide-border/60">
                      {t.instruments.map((inst) => (
                        <div key={inst.instrument} className="space-y-2 py-3 first:pt-1">
                          <p className="font-display text-sm font-semibold">{financialInstrumentLabels[inst.instrument]}</p>
                          {!inst.summed ? (
                            <p className="font-mono text-[11px] leading-5 text-faint">
                              Listed below, not summed: {inst.reason === "several_instruments" ? "each row combines instruments without a split" : "the sources name no instrument the tracker's vocabulary covers"}.
                            </p>
                          ) : null}
                          {(inst.summed
                            ? ([
                                ["Binding", "contracted, partly or fully paid", inst.binding],
                                ["Not yet binding", "announced, authorized, allocated or decided, incl. conditional", inst.notYetBinding],
                              ] as const)
                            : []
                          ).map(([label, gloss, sums]) =>
                            QUALIFIER_ORDER.some((q) => sums[q]) ? (
                              <div key={label}>
                                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted" title={gloss}>
                                  {label}
                                </p>
                                <dl className="mt-1 space-y-0.5">
                                  {QUALIFIER_ORDER.filter((q) => sums[q]).map((q) => (
                                    <div key={q} className="flex items-baseline justify-between gap-3">
                                      <dt className="font-mono text-[11px] text-faint">{q === "exact" ? "Stated exactly" : valueQualifierLabels[q]}</dt>
                                      <dd className="tnum font-display text-xl font-bold">{formatDecimalCompact(sums[q]!)}</dd>
                                    </div>
                                  ))}
                                </dl>
                              </div>
                            ) : null,
                          )}
                          {inst.summed ? <AmountBasisNotes entries={inst.amountBasis} /> : null}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 font-mono text-[11px] leading-5 text-faint">
                    {FINANCIAL_STATUSES.map((s) => [s, countBy(counted, (c) => currentFinancialStatus(c)).get(s)] as const)
                      .filter(([, n]) => n)
                      .map(([s, n]) => `${financialStatusLabels[s]} ${n}`)
                      .join(" · ")}
                  </p>
                  <ul className="mt-3 space-y-2 border-t pt-3">
                    {counted.map((c) => {
                      // Bar length is relative within this currency only. Number() is
                      // used for this display ratio alone; totals are exact decimals.
                      const pct = Math.max(4, Math.round((Number(c.amount!.value) / Number(max)) * 100));
                      return (
                        <li key={c.id}>
                          <Link href={`/capital/${c.id}`} className="group block">
                            <div className="flex items-baseline justify-between gap-2 text-sm">
                              <span className="min-w-0 truncate font-display group-hover:text-accent">{c.recipient ?? c.provider}</span>
                              <InlineAmount amount={c.amount} />
                            </div>
                            <div className="mt-1 h-1.5 rounded-sm bg-elevated">
                              <div
                                className="h-1.5 rounded-sm"
                                style={{
                                  width: `${pct}%`,
                                  background: c.amount!.qualifier === "exact" ? "#CBA86A" : "color-mix(in oklab, #CBA86A 40%, transparent)",
                                }}
                              />
                            </div>
                            <p className="mt-0.5 font-mono text-[10px] text-faint">
                              {commitmentActor(c) ? jurisdictionLabels[commitmentActor(c)!] : "No tracked government"} · {financialInstrumentLabels[c.instrument]} · {financialStatusLabels[currentFinancialStatus(c)]}
                            </p>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  {t.nestedIds.length ? (
                    <p className="mt-3 text-xs leading-5 text-faint">
                      Not added again: {t.nestedIds.length} part{t.nestedIds.length === 1 ? "" : "s"} of a counted package (
                      {t.nestedIds.map((id, i) => (
                        <span key={id}>
                          {i ? ", " : ""}
                          <Link href={`/capital/${id}`} className="hover:text-accent">
                            {bySummary.get(id) ? `${financialInstrumentLabels[bySummary.get(id)!.instrument].toLowerCase()}, ${bySummary.get(id)!.recipient}` : id}
                          </Link>
                        </span>
                      ))}
                      ).
                    </p>
                  ) : null}
                </Card>
              );
            })}
          </div>
          <p className="mt-4 max-w-prose text-sm leading-6 text-muted">
            Amounts stated &ldquo;up to&rdquo; are ceilings, not payments. Unquantified, inactive and unsupported
            commitments are listed separately. <Link href="/methodology#capital-counting" className="text-accent hover:text-accent-strong">Counting rules</Link>.
          </p>
          <div className="mt-6 overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <caption className="sr-only">Public commitments by providing actor, currency and instrument</caption>
              <thead>
                <tr className="border-b bg-card font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
                  <th scope="col" className="px-3 py-2 text-left font-normal">Provider</th>
                  <th scope="col" className="px-3 py-2 text-left font-normal">By currency and instrument · “up to”, “about” and “at least” figures in separate buckets</th>
                  <th scope="col" className="px-3 py-2 text-right font-normal">Rows without a sum (no amount, no status, or ended)</th>
                </tr>
              </thead>
              <tbody>
                {actorTotals.map(({ j, t }) => (
                  <tr key={j} className="border-b align-top last:border-b-0">
                    <th scope="row" className="px-3 py-3 text-left font-normal">
                      <Link href={`/capital?actor=${j}&role=commitment`} className="hover:opacity-80">
                        <JurisdictionTag code={j} withName />
                      </Link>
                    </th>
                    <td className="px-3 py-3">
                      <span className="flex flex-col gap-1">
                        {t.currencies.map((cur) => (
                          <span key={cur.currency} className="space-y-1">
                            <span className="tnum block font-mono text-xs text-muted">
                              <span className="text-foreground">{cur.currency}</span>{" "}
                              {cur.status === "withheld"
                                ? "total withheld: counted rows overlap"
                                : cur.instruments
                                    .map((i) =>
                                      i.summed
                                        ? `${financialInstrumentLabels[i.instrument].toLowerCase()} ${QUALIFIER_ORDER.filter((q) => i.byQualifier[q])
                                            .map((q) => `${q === "exact" ? "" : `${valueQualifierLabels[q].toLowerCase()} `}${formatDecimalCompact(i.byQualifier[q]!)}`)
                                            .join(" and ")}`
                                        : `${financialInstrumentLabels[i.instrument].toLowerCase()}: ${i.countedIds.length} row${i.countedIds.length === 1 ? "" : "s"} listed, not summed`,
                                    )
                                    .join("; ")}
                            </span>
                            {cur.status === "summed"
                              ? cur.instruments.map((i) =>
                                  i.summed ? <AmountBasisNotes key={i.instrument} entries={i.amountBasis} /> : null,
                                )
                              : null}
                          </span>
                        ))}
                        {t.currencies.length === 0 ? <span className="font-mono text-xs text-faint">—</span> : null}
                      </span>
                    </td>
                    <td
                      className="tnum px-3 py-3 text-right font-mono text-xs text-muted"
                      title={`${t.unquantifiedIds.length} no amount · ${t.statusNotStatedIds.length} no status stated · ${t.endedIds.length} ended`}
                    >
                      {t.unquantifiedIds.length + t.statusNotStatedIds.length + t.endedIds.length || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {options.length ? (
          <Section
            index="02"
            title="Funding options under executed agreements"
            description="Optional funding under signed agreements, listed separately from exercised commitments."
          >
            <div className="space-y-4">
              {options.map((c) => {
                const st = optionState(c, all);
                const step = (list: typeof st.exercises) => list.map((e) => ({ id: e.id, label: e.amount?.amountAsStated ?? e.id }));
                return (
                  <Card key={c.id} className="min-w-0 overflow-hidden">
                    <CommitmentRow c={bySummary.get(c.id)!} />
                    <div className="space-y-3 border-t px-4 py-4">
                      {c.terms.filter((t) => t.kind === "other").slice(0, 1).map((t, i) => (
                        <p key={i} className="text-sm leading-6 text-muted">
                          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-faint">As filed </span>“{t.asStated}”
                        </p>
                      ))}
                      <OptionLadder
                        executed={st.executed ? { date: st.executed.date, sourceId: st.executed.sourceId } : null}
                        exercises={step(st.exercises)}
                        endedExercises={step(st.endedExercises)}
                        disbursements={step(st.disbursements)}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </Section>
        ) : null}

        <Section
          index={options.length ? "03" : "02"}
          title="Other financial instruments"
          description="Price floors, offtake, tax offsets and procurement rights, recorded by their terms."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {unquantified.map((c) => (
              <Card key={c.id} className="p-5">
                <Link href={`/capital/${c.id}`} className="font-display font-semibold hover:text-accent">
                  {financialInstrumentLabels[c.instrument]} · {c.recipient ?? c.provider}
                </Link>
                <ul className="mt-3 space-y-2">
                  {c.terms.slice(0, 3).map((t, i) => (
                    <li key={i} className="text-sm leading-6">
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-faint">{termKindLabels[t.kind]} </span>
                      <span className="text-muted">“{t.asStated}”</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          index={options.length ? "04" : "03"}
          title="Envelopes, appropriations and lending authorities"
          description="Programme ceilings and appropriations, separate from recipient commitments."
        >
          <Card className="overflow-hidden">
            {envelopes.map((c) => (
              <CommitmentRow key={c.id} c={bySummary.get(c.id)!} />
            ))}
          </Card>
        </Section>

        <Section
          index={options.length ? "05" : "04"}
          title="Other financing"
          description="Private capital, recipient funds, indications and financing without a stated public share."
        >
          <Card className="overflow-hidden">
            {nonPublic.map((c) => (
              <CommitmentRow key={c.id} c={bySummary.get(c.id)!} />
            ))}
          </Card>
          <p className="mt-2 text-xs text-faint">
            Value roles here: {[...new Set(nonPublic.map((c) => valueRoleLabels[c.valueRole]))].join(", ")}.
          </p>
        </Section>

        <Section
          index={options.length ? "06" : "05"}
          title="Finance by production stage"
          description="Financial records by government and supply-chain stage."
        >
          <StageMatrix rows={all} />
        </Section>

        <Section index={options.length ? "07" : "06"} title="All financial records">
          <CapitalExplorer rows={summaries} materialNames={materialNames} />
          <p className="mt-4 text-sm text-muted">
            Download:{" "}
            <a href="/api/export/financial-commitments.csv" className="text-accent hover:text-accent-strong">CSV</a>
            {" · "}
            <Link href="/api/v1/financial-commitments" prefetch={false} className="text-accent hover:text-accent-strong">JSON API</Link>
            {" · "}
            <Link href="/data" className="text-accent hover:text-accent-strong">all exports</Link>
          </p>
        </Section>
      </div>
    </Container>
  );
}
