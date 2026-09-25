import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JurisdictionTag } from "@/components/labels";
import { EvidenceTable, Fact, NotStated } from "@/components/capital/primitives";
import { CommitmentRow } from "@/components/capital/rows";
import { CurrencyTotals } from "@/components/intelligence/totals";
import { LayerStack } from "@/components/intelligence/layers";
import { OrgList } from "@/components/intelligence/org-link";
import { DesignationRow } from "@/components/intelligence/designation-row";
import { summarizeCommitment } from "@/lib/capital-control";
import { programmeLedger } from "@/lib/capital-intelligence";
import { getAllProgrammes, getProgrammeById } from "@/lib/data";
import { programmeEvidenceFieldLabels, programmeKindLabels } from "@/lib/labels";

export function generateStaticParams() {
  return getAllProgrammes().map((g) => ({ id: g.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const g = getProgrammeById(id);
  if (!g) return { title: "Programme not found" };
  return {
    title: `${g.name} — ${programmeKindLabels[g.kind]}`,
    description: `The ceilings of ${g.name} and the awards recorded under it, in original currencies, never divided into a utilisation rate.`,
  };
}

export default async function ProgrammePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = programmeLedger(id);
  if (!l) notFound();
  const g = l.programme;
  let n = 0;
  const next = () => String(++n).padStart(2, "0");

  return (
    <Container className="py-12">
      <Link href="/programmes" className="font-display text-sm text-muted hover:text-foreground">
        ← Programmes
      </Link>
      <header className="mt-6 max-w-4xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <JurisdictionTag code={g.actor} withName />
          <Badge>{programmeKindLabels[g.kind]}</Badge>
        </div>
        <h1 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight">{g.name}</h1>
        {g.nameOriginal ? <p lang="und" className="mt-1 text-lg text-muted">{g.nameOriginal}</p> : null}
        <p className="mt-3 font-mono text-xs text-faint">{g.id}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-12">
          {l.envelopes.length ? (
            <Section index={next()} title="Ceilings" description="Envelopes, appropriations and lending authorities. Listed, never summed, and never divided into the awards below.">
              <Card className="overflow-hidden">
                {l.envelopes.map((c) => <CommitmentRow key={c.id} c={summarizeCommitment(c)} />)}
              </Card>
            </Section>
          ) : null}

          <Section
            index={next()}
            title="Awards recorded under the programme"
            description="Committed public money the corpus records under this programme or one beneath it, summed per currency; a part is not added to its package. What the corpus records, not the programme's spend."
          >
            {l.recordedAwards ? (
              <>
                <div className="mb-4"><CurrencyTotals totals={l.recordedAwards.totals!} /></div>
                <Card className="overflow-hidden">
                  {l.recordedAwards.rows.map((c) => <CommitmentRow key={c.id} c={summarizeCommitment(c)} />)}
                </Card>
              </>
            ) : (
              <p className="text-sm text-muted">No award to a recipient is recorded under this programme in the corpus.</p>
            )}
          </Section>

          {l.otherLayers.length ? (
            <Section index={next()} title="Other rows under the programme" description="Kept apart from committed public money.">
              <LayerStack layers={l.otherLayers} />
            </Section>
          ) : null}

          {l.designations.length ? (
            <Section index={next()} title="Projects recognized" description="Standing, not money; never counted as capital.">
              <Card className="overflow-hidden">
                {l.designations.map((d) => <DesignationRow key={d.id} d={d} showProject />)}
              </Card>
            </Section>
          ) : null}

          <Section index={next()} title="Record">
            <Card className="px-5 py-1">
              <dl>
                <Fact label="Kind">{programmeKindLabels[g.kind]}</Fact>
                <Fact label="Administered by"><OrgList ids={g.administeringOrgIds} showKind empty="Not stated in the cited sources" /></Fact>
                <Fact label="Part of">{l.parent ? <Link href={`/programmes/${l.parent.id}`} className="text-accent hover:text-accent-strong">{l.parent.name}</Link> : <NotStated>None</NotStated>}</Fact>
                {l.children.length ? (
                  <Fact label="Includes">
                    {l.children.map((c) => <Link key={c.id} href={`/programmes/${c.id}`} className="block text-accent hover:text-accent-strong">{c.name}</Link>)}
                  </Fact>
                ) : null}
                <Fact label="Legal authority">{g.legalAuthorityAsStated ?? <NotStated />}</Fact>
              </dl>
            </Card>
          </Section>

          {g.notes ? (
            <Section index={next()} title="Notes">
              <p className="max-w-prose text-pretty text-lg leading-8 text-foreground/90">{g.notes}</p>
            </Section>
          ) : null}

          <Section index={next()} title="Evidence">
            <EvidenceTable evidence={g.evidence} fieldLabels={programmeEvidenceFieldLabels} />
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-4 text-sm">
            <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Machine-readable</h2>
            <a href={`/api/v1/programmes/${g.id}`} className="text-accent hover:text-accent-strong">JSON ledger with sources</a>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
