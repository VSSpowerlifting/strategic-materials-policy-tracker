import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageContents, PageHeading, Section } from "@/components/ui/container";
import { RecordList } from "@/components/ui/card";
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
    "Source-verified public money in strategic-material supply chains: equity, loans, grants, tax credits, price floors, offtake and stockpile funding, by provider, recipient, stage, material and status — in original currencies, with package-and-award overlap reconciled.",
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
        title="Capital"
        lead={
          <>
            Public financing, investment and purchase guarantees for strategic-material supply chains.
            Amounts and legal status follow the cited records.
          </>
        }
      />

      <ResearchReadingKey topic="capital" />

      <p className="tnum mt-6 font-display text-sm text-muted">
        {all.length} financing instruments · {events} events · {actors} providing governments ·{" "}
        {new Set(all.map((c) => c.instrument)).size} instrument types
      </p>

      <PageContents
        className="mt-8 border-y border-border py-4"
        items={[
          { href: "#commitments", label: "Public commitments" },
          { href: "#records", label: "All financing" },
          { href: "#stages", label: "By production stage" },
          { href: "#separate", label: "Listed separately" },
        ]}
      />

      <div className="mt-14 space-y-14">
        <Section
          id="commitments"
          title="Public commitments"
          description="Grouped by currency, instrument, amount qualifier and legal status. Parent and child amounts are counted once."
        >
          <div className="grid gap-x-8 gap-y-10 lg:grid-cols-3">
            {totals.currencies.map((t) => {
              const counted = t.countedIds.map((id) => getFinancialCommitmentById(id)!);
              const max = counted.reduce((m, c) => (compareDecimals(c.amount!.value, m) > 0 ? c.amount!.value : m), "0");
              return (
                <div key={t.currency} className="min-w-0 border-t-2 border-foreground pt-4">
                  <p className="font-display text-xs text-faint">{t.currency}</p>
                  {t.status === "withheld" ? (
                    <p className="mt-2 text-sm leading-6 text-muted">
                      <strong className="font-semibold text-foreground">Total withheld.</strong>{" "}
                      <Link href={`/capital/${t.overlap.a}`} className="link-quiet">{t.overlap.a}</Link> and{" "}
                      <Link href={`/capital/${t.overlap.b}`} className="link-quiet">{t.overlap.b}</Link> both
                      contain <Link href={`/capital/${t.overlap.shared}`} className="link-quiet">{t.overlap.shared}</Link>,
                      and share a component. The rows appear separately from aggregated totals to prevent double counting.
                    </p>
                  ) : (
                    <div className="mt-2 divide-y divide-border">
                      {t.instruments.map((inst) => (
                        <div key={inst.instrument} className="space-y-2 py-3 first:pt-1">
                          <p className="font-display text-sm font-semibold">{financialInstrumentLabels[inst.instrument]}</p>
                          {!inst.summed ? (
                            <p className="font-display text-xs leading-5 text-faint">
                              Listed separately: {inst.reason === "several_instruments" ? "instrument types are bundled without an identified split" : "the source leaves the instrument category unspecified"}.
                            </p>
                          ) : null}
                          {(inst.summed
                            ? ([
                                ["Binding", "contracted, partially disbursed or disbursed; payment tracked separately", inst.binding],
                                ["Not yet binding", "announced, authorized, allocated or decided, incl. conditional", inst.notYetBinding],
                              ] as const)
                            : []
                          ).map(([label, gloss, sums]) =>
                            QUALIFIER_ORDER.some((q) => sums[q]) ? (
                              <div key={label}>
                                <p className="font-display text-xs text-muted" title={gloss}>
                                  {label}
                                </p>
                                <dl className="mt-1 space-y-0.5">
                                  {QUALIFIER_ORDER.filter((q) => sums[q]).map((q) => (
                                    <div key={q} className="flex items-baseline justify-between gap-3">
                                      <dt className="font-display text-xs text-faint">{q === "exact" ? "Stated exactly" : valueQualifierLabels[q]}</dt>
                                      <dd className="tnum font-display text-xl font-semibold">{formatDecimalCompact(sums[q]!)}</dd>
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
                  <p className="mt-3 font-display text-xs leading-5 text-faint">
                    {FINANCIAL_STATUSES.map((s) => [s, countBy(counted, (c) => currentFinancialStatus(c)).get(s)] as const)
                      .filter(([, n]) => n)
                      .map(([s, n]) => `${financialStatusLabels[s]} ${n}`)
                      .join(" · ")}
                  </p>
                  <details className="group mt-3 border-t pt-2">
                    <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 font-display text-sm text-accent hover:text-accent-strong">
                      <span aria-hidden className="inline-block transition-transform group-open:rotate-90 motion-reduce:transition-none">›</span>
                      {counted.length} counted {counted.length === 1 ? "instrument" : "instruments"}
                    </summary>
                  <ul className="mt-2 space-y-2">
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
                            <div className="mt-1 h-1.5 bg-elevated">
                              <div
                                className="h-1.5"
                                style={{
                                  width: `${pct}%`,
                                  background: c.amount!.qualifier === "exact" ? "var(--mark-commitment)" : "color-mix(in oklab, var(--mark-commitment) 40%, transparent)",
                                }}
                              />
                            </div>
                            <p className="mt-0.5 font-display text-xs text-faint">
                              {commitmentActor(c) ? jurisdictionLabels[commitmentActor(c)!] : "No tracked government"} · {financialInstrumentLabels[c.instrument]} · {financialStatusLabels[currentFinancialStatus(c)]}
                            </p>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  </details>
                  {t.nestedIds.length ? (
                    <p className="mt-3 text-xs leading-5 text-faint">
                      Included in the package above: {t.nestedIds.length} part{t.nestedIds.length === 1 ? "" : "s"} of a counted package (
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
                </div>
              );
            })}
          </div>
          <p className="mt-4 max-w-prose text-sm leading-6 text-muted">
            Amounts stated &ldquo;up to&rdquo; are ceilings; payments are tracked separately.
            Commitments with unstated amounts or status, along with ended commitments, appear in separate rows. <Link href="/methodology#capital-counting" className="link-quiet">Counting rules</Link>.
          </p>
          <div className="mt-8 overflow-x-auto border-y border-border-strong bg-plate">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <caption className="sr-only">Public commitments by providing actor, currency and instrument</caption>
              <thead>
                <tr className="border-b bg-elevated font-display text-xs text-faint">
                  <th scope="col" className="px-3 py-2 text-left font-normal">Provider</th>
                  <th scope="col" className="px-3 py-2 text-left font-normal">By currency and instrument · “up to”, “about” and “at least” figures in separate buckets</th>
                  <th scope="col" className="px-3 py-2 text-right font-normal">Unaggregated rows (amount/status unstated or ended)</th>
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
                            <span className="tnum block font-display text-xs text-muted">
                              <span className="text-foreground">{cur.currency}</span>{" "}
                              {cur.status === "withheld"
                                ? "total withheld: counted rows overlap"
                                : cur.instruments
                                    .map((i) =>
                                      i.summed
                                        ? `${financialInstrumentLabels[i.instrument].toLowerCase()} ${QUALIFIER_ORDER.filter((q) => i.byQualifier[q])
                                            .map((q) => `${q === "exact" ? "" : `${valueQualifierLabels[q].toLowerCase()} `}${formatDecimalCompact(i.byQualifier[q]!)}`)
                                            .join(" and ")}`
                                        : `${financialInstrumentLabels[i.instrument].toLowerCase()}: ${i.countedIds.length} row${i.countedIds.length === 1 ? "" : "s"} listed separately`,
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
                        {t.currencies.length === 0 ? <span className="font-display text-xs text-faint">—</span> : null}
                      </span>
                    </td>
                    <td
                      className="tnum px-3 py-3 text-right font-display text-xs text-muted"
                      title={`${t.unquantifiedIds.length} amount unstated · ${t.statusNotStatedIds.length} status unstated · ${t.endedIds.length} ended`}
                    >
                      {t.unquantifiedIds.length + t.statusNotStatedIds.length + t.endedIds.length || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="records" title="All financing">
          <CapitalExplorer rows={summaries} materialNames={materialNames} />
          <p className="mt-4 font-display text-sm text-muted">
            Download:{" "}
            <a href="/api/export/financial-commitments.csv" className="link-quiet">CSV</a>
            {" · "}
            <Link href="/api/v1/financial-commitments" prefetch={false} className="link-quiet">JSON API</Link>
            {" · "}
            <Link href="/data" className="link-quiet">all exports</Link>
          </p>
        </Section>

        <Section
          id="stages"
          title="Finance by production stage"
        >
          <StageMatrix rows={all} />
        </Section>

        <div id="separate" className="scroll-mt-24 space-y-10">
          <p className="max-w-3xl font-display text-sm leading-6 text-muted">
            Listed apart from the amounts above: optional funding, instruments recorded by their terms rather than an
            amount, programme ceilings and non-public money. None of these rows adds to those amounts.
          </p>
        {options.length ? (
          <Section
            collapsed
            count={options.length}
            title="Funding options under executed agreements"
            description="Optional funding under signed agreements, listed separately from exercised commitments."
          >
            <div className="space-y-4">
              {options.map((c) => {
                const st = optionState(c, all);
                const step = (list: typeof st.exercises) => list.map((e) => ({ id: e.id, label: e.amount?.amountAsStated ?? e.id }));
                return (
                  <RecordList key={c.id} className="min-w-0">
                    <CommitmentRow c={bySummary.get(c.id)!} />
                    <div className="space-y-3 px-4 py-4">
                      {c.terms.filter((t) => t.kind === "other").slice(0, 1).map((t, i) => (
                        <p key={i} className="text-sm leading-6 text-muted">
                          <span className="font-display text-xs text-faint">As filed </span>“{t.asStated}”
                        </p>
                      ))}
                      <OptionLadder
                        executed={st.executed ? { date: st.executed.date, sourceId: st.executed.sourceId } : null}
                        exercises={step(st.exercises)}
                        endedExercises={step(st.endedExercises)}
                        disbursements={step(st.disbursements)}
                      />
                    </div>
                  </RecordList>
                );
              })}
            </div>
          </Section>
        ) : null}

        <Section
          collapsed
          count={unquantified.length}
          title="Other financial instruments"
          description="Price floors, offtake, tax offsets and procurement rights, recorded by their terms."
        >
          <div className="grid gap-x-8 gap-y-8 md:grid-cols-2">
            {unquantified.map((c) => (
              <div key={c.id} className="border-t border-border-strong pt-4">
                <Link href={`/capital/${c.id}`} className="font-display font-semibold hover:text-accent">
                  {financialInstrumentLabels[c.instrument]} · {c.recipient ?? c.provider}
                </Link>
                <ul className="mt-3 space-y-2">
                  {c.terms.slice(0, 3).map((t, i) => (
                    <li key={i} className="text-sm leading-6">
                      <span className="font-display text-xs text-faint">{termKindLabels[t.kind]} </span>
                      <span className="text-muted">“{t.asStated}”</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section
          collapsed
          count={envelopes.length}
          title="Envelopes, appropriations and lending authorities"
          description="Programme ceilings and appropriations, separate from recipient commitments."
        >
          <RecordList>
            {envelopes.map((c) => (
              <CommitmentRow key={c.id} c={bySummary.get(c.id)!} />
            ))}
          </RecordList>
        </Section>

        <Section
          collapsed
          count={nonPublic.length}
          title="Other financing"
          description="Private capital, recipient funds, indications and financing with an unstated public share."
        >
          <RecordList>
            {nonPublic.map((c) => (
              <CommitmentRow key={c.id} c={bySummary.get(c.id)!} />
            ))}
          </RecordList>
          <p className="mt-2 text-xs text-faint">
            Value roles here: {[...new Set(nonPublic.map((c) => valueRoleLabels[c.valueRole]))].join(", ")}.
          </p>
        </Section>

        </div>
      </div>
    </Container>
  );
}
