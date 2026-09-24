import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { JurisdictionTag } from "@/components/labels";
import { CurrencyTotals } from "@/components/intelligence/totals";
import { ProjectLink } from "@/components/intelligence/org-link";
import {
  LAYER_KEYS,
  actorPortfolio,
  actorsWithCapital,
  capitalFlows,
  coInvestments,
} from "@/lib/capital-intelligence";
import { getAllFinancialCommitments, getAllMaterials, getAllProgrammes, getJurisdictionById } from "@/lib/data";
import {
  coInvestmentKindLabels,
  financialInstrumentLabels,
  geographyLabels,
  jurisdictionShort,
  layerLabels,
  supplyChainStageLabels,
} from "@/lib/labels";
import { site } from "@/lib/site";
import { FINANCIAL_INSTRUMENTS, SUPPLY_CHAIN_STAGES } from "@/lib/types";
import type { FinancialInstrument } from "@/lib/types";

export const metadata: Metadata = {
  title: "Portfolios",
  description:
    "Each government's strategic-material capital side by side: committed public money per currency, binding and not yet binding; what it is spent through, on which stages and materials, at home or abroad; where it flows; and which projects more than one provider backs.",
};

type Row = { label: string; values: number[]; href?: (i: number) => string };

function CountTable({ actors, groups }: { actors: readonly string[]; groups: { title: string; rows: Row[] }[] }) {
  return (
    <div className="relative overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <caption className="sr-only">Record counts by government</caption>
        <thead>
          <tr className="border-b bg-card">
            <th scope="col" className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-mono text-[11px] font-normal uppercase tracking-[0.12em] text-faint">
              Records
            </th>
            {actors.map((a) => (
              <th key={a} scope="col" className="px-3 py-2 text-right font-mono text-[11px] font-normal text-muted">
                {jurisdictionShort[a as keyof typeof jurisdictionShort]}
              </th>
            ))}
          </tr>
        </thead>
        {groups.map((g) => (
          <tbody key={g.title}>
            <tr className="border-b bg-elevated/40">
              <th scope="colgroup" colSpan={actors.length + 1} className="sticky left-0 px-3 py-1.5 text-left font-mono text-[10px] font-normal uppercase tracking-[0.14em] text-faint">
                {g.title}
              </th>
            </tr>
            {g.rows.map((r) => {
              const max = Math.max(1, ...r.values);
              return (
                <tr key={r.label} className="border-b last:border-b-0">
                  <th scope="row" className="sticky left-0 z-10 bg-background px-3 py-2 text-left font-normal text-muted">{r.label}</th>
                  {r.values.map((v, i) => (
                    <td key={i} className="tnum px-3 py-2 text-right">
                      <span className="inline-flex items-center justify-end gap-2">
                        <span aria-hidden className="hidden h-1.5 rounded-sm bg-[#CBA86A]/60 sm:block" style={{ width: `${v ? Math.max(3, Math.round((v / max) * 40)) : 0}px` }} />
                        <span className={v ? "font-mono text-xs text-foreground" : "font-mono text-xs text-faint"}>{v || "·"}</span>
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}

export default function PortfoliosPage() {
  const all = getAllFinancialCommitments();
  const actors = actorsWithCapital(all);
  const portfolios = actors.map((a) => actorPortfolio(a, all));
  const materials = getAllMaterials();
  const flows = capitalFlows(all);
  const destinations = [...new Set(flows.map((f) => f.destination))].sort((a, b) => (a === "not_stated" ? 1 : b === "not_stated" ? -1 : a < b ? -1 : 1));
  const co = coInvestments(all);
  const programmes = getAllProgrammes();

  const instruments = FINANCIAL_INSTRUMENTS.filter((i) => portfolios.some((p) => p.counts.byInstrument[i]));
  const stages = SUPPLY_CHAIN_STAGES.filter((s) => portfolios.some((p) => p.counts.byStage[s]));
  const mats = materials.filter((m) => portfolios.some((p) => p.counts.byMaterial[m.id]));

  return (
    <Container className="py-12" width="wide">
      <PageHeading
        index="03"
        eyebrow="Capital intelligence"
        title="Portfolios"
        lead={
          <>
            Each government&apos;s capital, side by side, from the financial rows it provides. Money is shown only as
            per-currency totals of committed public money, binding apart from not yet binding; everything else is a count of
            records. No figure is converted between currencies, and no government is ranked.
          </>
        }
      />

      <div className="mt-12 space-y-16">
        <Section
          index="01"
          title="Committed public money, per currency"
          description="Summed under the counting rules: a part is never added to its package, ceilings and options are left out, and joint vehicles are kept apart from public money."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((p) => (
              <Card key={p.actor} className="min-w-0 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Link href={`/actors/${getJurisdictionById(p.actor)?.code.toLowerCase() ?? p.actor}`} className="hover:opacity-80">
                    <JurisdictionTag code={p.actor} withName />
                  </Link>
                  <span className="font-mono text-[11px] text-faint">{p.counts.rows} records</span>
                </div>
                <CurrencyTotals totals={p.publicTotals} compact />
                {p.jointVehicleTotals.currencies.length ? (
                  <div className="mt-3 border-t pt-3">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Joint vehicles, kept apart</p>
                    <CurrencyTotals totals={p.jointVehicleTotals} compact />
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        </Section>

        <Section
          index="02"
          title="What each portfolio is made of"
          description={`Counts of records, never money. A package with its parts counts once. At home or abroad is read from each committed row's stated location or its project's, against the provider's home territory (the member states for the EU). Data as of ${site.lastUpdated}.`}
        >
          <CountTable
            actors={actors}
            groups={[
              {
                title: "Value role",
                rows: LAYER_KEYS.filter((k) => portfolios.some((p) => p.counts.byLayer[k])).map((k) => ({
                  label: layerLabels[k],
                  values: portfolios.map((p) => p.counts.byLayer[k]),
                })),
              },
              {
                title: "Committed rows, by legal standing",
                rows: [
                  { label: "Binding (contracted or paid)", values: portfolios.map((p) => p.counts.committedBinding) },
                  { label: "Not yet binding", values: portfolios.map((p) => p.counts.committedNotYetBinding) },
                ],
              },
              {
                title: "Committed rows, where the money goes",
                rows: (["domestic", "abroad", "domestic_and_abroad", "not_stated"] as const).map((g) => ({
                  label: geographyLabels[g],
                  values: portfolios.map((p) => p.counts.byGeography[g]),
                })),
              },
              {
                title: "Instrument",
                rows: instruments.map((i: FinancialInstrument) => ({ label: financialInstrumentLabels[i], values: portfolios.map((p) => p.counts.byInstrument[i] ?? 0) })),
              },
              {
                title: "Supply-chain stage",
                rows: stages.map((s) => ({ label: supplyChainStageLabels[s], values: portfolios.map((p) => p.counts.byStage[s]) })),
              },
              {
                title: "Material",
                rows: mats.map((m) => ({ label: m.nameEn, values: portfolios.map((p) => p.counts.byMaterial[m.id] ?? 0) })),
              },
              {
                title: "Reach",
                rows: [
                  { label: "Providing organizations", values: portfolios.map((p) => p.counts.providerOrganizations) },
                  { label: "Recipient organizations", values: portfolios.map((p) => p.counts.recipientOrganizations) },
                  { label: "Projects", values: portfolios.map((p) => p.counts.projects) },
                  { label: "Programmes", values: portfolios.map((p) => p.counts.programmes) },
                ],
              },
            ]}
          />
        </Section>

        <Section
          index="03"
          title="Where the money is aimed"
          description="Committed rows from each government to each country the row or its project names. A row aimed at two countries counts under both; a package counts once."
        >
          <div className="relative overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <caption className="sr-only">Committed rows by providing government and destination country</caption>
              <thead>
                <tr className="border-b bg-card font-mono text-[11px] text-muted">
                  <th scope="col" className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-normal uppercase tracking-[0.12em] text-faint">From \ to</th>
                  {destinations.map((d) => (
                    <th key={d} scope="col" className="px-3 py-2 text-right font-normal">{d === "not_stated" ? "not stated" : d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actors.map((a) => (
                  <tr key={a} className="border-b last:border-b-0">
                    <th scope="row" className="sticky left-0 z-10 bg-background px-3 py-2 text-left font-normal">
                      <JurisdictionTag code={a} />
                    </th>
                    {destinations.map((d) => {
                      const cell = flows.find((f) => f.actor === a && f.destination === d);
                      return (
                        <td key={d} className="tnum px-3 py-2 text-right font-mono text-xs">
                          {cell ? (
                            <span title={cell.rowIds.join(", ")} className={d === "not_stated" ? "text-muted" : "text-foreground"}>
                              {cell.rowIds.length}
                            </span>
                          ) : (
                            <span className="text-faint">·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          index="04"
          title="Projects with more than one provider"
          description="Co-investment by kind. Envelopes and total project cost are not capital provided, so they do not count."
        >
          {co.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {co.map((c) => (
                <Card key={c.project.id} className="p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">{c.kinds.map((k) => coInvestmentKindLabels[k]).join(" · ")}</p>
                  <p className="mt-2 font-display font-semibold leading-snug"><ProjectLink id={c.project.id} /></p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {c.governments.map((g) => <JurisdictionTag key={g} code={g} />)}
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-faint">{c.rowIds.length} rows · {c.providerOrgIds.length} providing organizations</p>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No project has more than one provider in the corpus.</p>
          )}
        </Section>

        <Section index="05" title="Programmes" description="The named schemes each government runs.">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {actors.map((a) => {
              const list = programmes.filter((g) => g.actor === a);
              return (
                <Card key={a} className="p-4">
                  <JurisdictionTag code={a} withName />
                  <ul className="mt-3 space-y-1 text-sm">
                    {list.length ? list.map((g) => (
                      <li key={g.id}><Link href={`/programmes/${g.id}`} className="text-accent hover:text-accent-strong">{g.name}</Link></li>
                    )) : <li className="text-muted">None recorded.</li>}
                  </ul>
                </Card>
              );
            })}
          </div>
        </Section>

        <p className="text-sm text-muted">
          Machine-readable:{" "}
          <Link href="/api/v1/capital-intelligence/summary" prefetch={false} className="text-accent hover:text-accent-strong">capital-intelligence summary (JSON)</Link>
          {" · "}
          <Link href="/methodology#capital-intelligence" className="text-accent hover:text-accent-strong">how these views are derived</Link>
        </p>
      </div>
    </Container>
  );
}
