import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { CapitalExplorer } from "@/components/capital/capital-explorer";
import { StageMatrix } from "@/components/capital/charts";
import { CommitmentRow, InlineAmount } from "@/components/capital/rows";
import { JurisdictionTag } from "@/components/labels";
import {
  PUBLIC_CAPITAL_SOURCES,
  commitmentActor,
  countBy,
  currentFinancialStatus,
  compareDecimals,
  formatDecimalCompact,
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
import { site } from "@/lib/site";
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
  const envelopeRoles = ["program_envelope", "budget_appropriation", "lending_authority"] as const;
  const envelopes = envelopeRoles.flatMap((r) => byRole.get(r) ?? []);
  const nonPublic = all.filter(
    (c) =>
      ["private_financing", "recipient_own_funds", "expected_co_investment", "total_project_cost"].includes(c.valueRole) ||
      (c.valueRole === "commitment" && !PUBLIC_CAPITAL_SOURCES.includes(c.capitalSource)),
  );
  const unquantified = all.filter((c) => !c.amount && c.valueRole === "commitment");
  const events = new Set(all.map((c) => c.eventId)).size;
  const actors = new Set(summaries.map((s) => s.actor).filter(Boolean)).size;
  const bySummary = new Map(summaries.map((s) => [s.id, s]));
  const actorTotals = JURISDICTIONS.map((j) => ({ j, t: totalCommitments(publicRows.filter((c) => commitmentActor(c) === j), all) })).filter(
    (x) => x.t.currencies.length || x.t.unquantifiedIds.length,
  );

  return (
    <Container className="py-12">
      <PageHeading
        index="01"
        eyebrow="Money as policy"
        title="Capital"
        lead={
          <>
            How governments put money, ownership and purchase guarantees behind strategic-material supply chains.
            Each row is one instrument from an official source or binding filing, in the currency the source uses.
            Envelopes, private capital and figures stated as ceilings are kept apart from money committed to a recipient,
            and a part is never counted alongside the package it belongs to.
          </>
        }
      />

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
          title="Public commitments to recipients, binding and not yet binding"
          description="Rows with the value role “commitment” and public or public-enterprise capital. Summed per currency only; parts of a counted package are left out; money under a binding agreement is shown apart from money announced, decided or conditionally committed; ceilings and approximations are shown apart from exact figures."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {totals.currencies.map((t) => {
              const counted = t.countedIds.map((id) => getFinancialCommitmentById(id)!);
              const max = counted.reduce((m, c) => (compareDecimals(c.amount!.value, m) > 0 ? c.amount!.value : m), "0");
              return (
                <Card key={t.currency} className="min-w-0 p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">{t.currency}</p>
                  {t.overlap ? (
                    <p className="mt-2 text-sm text-muted">
                      No total: {t.overlap.a} and {t.overlap.b} share {t.overlap.shared}, so adding them would double-count.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-3">
                      {([
                        ["Binding", "contracted, partly or fully paid", t.binding],
                        ["Not yet binding", "announced, authorized, allocated or decided, incl. conditional", t.notYetBinding],
                      ] as const).map(([label, gloss, sums]) =>
                        QUALIFIER_ORDER.some((q) => sums[q]) ? (
                          <div key={label}>
                            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted" title={gloss}>
                              {label}
                            </p>
                            <dl className="mt-1 space-y-0.5">
                              {QUALIFIER_ORDER.filter((q) => sums[q]).map((q) => (
                                <div key={q} className="flex items-baseline justify-between gap-3">
                                  <dt className="font-mono text-[11px] text-faint">{q === "exact" ? "Stated exactly" : valueQualifierLabels[q]}</dt>
                                  <dd className="tnum font-display text-2xl font-bold">{formatDecimalCompact(sums[q]!)}</dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        ) : null,
                      )}
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
                              {commitmentActor(c) ? jurisdictionLabels[commitmentActor(c)!] : "Not government capital"} · {financialInstrumentLabels[c.instrument]} · {financialStatusLabels[currentFinancialStatus(c)]}
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
            Totals are never converted between currencies or across rows of different value roles, and a paler bar marks a figure the source gives as a ceiling or an approximation.
            {" "}
            {totals.unquantifiedIds.length} public commitments state no amount at all — a price floor, an offtake, a tax offset, a procurement right — and are listed below rather than valued.
            {" "}Binding means a contract has been executed or money paid; everything earlier, including conditional loan commitments and non-binding letters of intent, is shown as not yet binding.
            {" "}See the <Link href="/methodology#capital-counting" className="text-accent hover:text-accent-strong">counting rules</Link>.
          </p>
          <div className="mt-6 overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <caption className="sr-only">Public commitments by providing actor and currency</caption>
              <thead>
                <tr className="border-b bg-card font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
                  <th scope="col" className="px-3 py-2 text-left font-normal">Provider</th>
                  <th scope="col" className="px-3 py-2 text-left font-normal">By currency, exact · ceilings and approximations kept apart</th>
                  <th scope="col" className="px-3 py-2 text-right font-normal">Rows without a sum</th>
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
                          <span key={cur.currency} className="tnum font-mono text-xs text-muted">
                            <span className="text-foreground">{cur.currency}</span>{" "}
                            {QUALIFIER_ORDER.filter((q) => cur.byQualifier[q])
                              .map((q) => `${q === "exact" ? "" : `${valueQualifierLabels[q].toLowerCase()} `}${formatDecimalCompact(cur.byQualifier[q]!)}`)
                              .join(" + ")}
                          </span>
                        ))}
                        {t.currencies.length === 0 ? <span className="font-mono text-xs text-faint">—</span> : null}
                      </span>
                    </td>
                    <td className="tnum px-3 py-3 text-right font-mono text-xs text-muted">{t.unquantifiedIds.length || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          index="02"
          title="Instruments that carry terms, not a sum"
          description="Price floors, offtake, tax offsets and procurement rights change incentives without a stated total. Their operative terms are the finding."
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
          index="03"
          title="Envelopes, appropriations and lending authorities"
          description="Ceilings that awards are drawn from. Listed, never summed: two envelopes can share a drawdown, and an envelope is not money committed to anyone."
        >
          <Card className="overflow-hidden">
            {envelopes.map((c) => (
              <CommitmentRow key={c.id} c={bySummary.get(c.id)!} />
            ))}
          </Card>
        </Section>

        <Section
          index="04"
          title="Kept apart from public support"
          description="Private financing, a recipient's own funds, money governments expect others to invest, joint vehicles whose public share is not stated, and rows whose capital source the source does not state."
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
          index="05"
          title="Where the money is aimed"
          description="Financial rows by providing actor and supply-chain stage. Counts of records, not of money."
        >
          <StageMatrix rows={all} />
        </Section>

        <Section index="06" title="All financial rows" description={`Every row, filterable. Data as of ${site.lastUpdated}.`}>
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
