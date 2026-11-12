import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { RecordList } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JurisdictionTag } from "@/components/labels";
import { EvidenceTable, Fact, NotStated } from "@/components/capital/primitives";
import { CommitmentRow } from "@/components/capital/rows";
import { CurrencyTotals } from "@/components/intelligence/totals";
import { LayerStack } from "@/components/intelligence/layers";
import { OrgList } from "@/components/intelligence/org-link";
import { DesignationRow } from "@/components/intelligence/designation-row";
import { ProgrammeResearchTrail } from "@/components/programme-research-trail";
import { buildProgrammeTrail } from "@/lib/programme-research-trail";
import { getSourceUses } from "@/lib/source-usage";
import { summarizeCommitment } from "@/lib/capital-control";
import { programmeLedger } from "@/lib/capital-intelligence";
import { getAllOrganizations, getAllProjects, getAllProgrammes, getAllSources, getProgrammeById } from "@/lib/data";
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
    description: `The ceilings of ${g.name} and the awards recorded under it, shown separately in their original currencies.`,
  };
}

export default async function ProgrammePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = programmeLedger(id);
  if (!l) notFound();
  const g = l.programme;
  const trail = buildProgrammeTrail(l, {
    organisations: getAllOrganizations(), projects: getAllProjects(),
    programmes: getAllProgrammes(),
    sourceEntries: getAllSources().map(source => ({source, uses: getSourceUses(source.id)})),
  });

  return (
    <Container className="py-12">
      <Breadcrumbs
        items={[
          { href: "/capital", label: "Public capital" },
          { href: "/programmes", label: "Programmes" },
          { label: g.name },
        ]}
      />
      <header className="mt-6 max-w-4xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <JurisdictionTag code={g.actor} withName />
          <Badge>{programmeKindLabels[g.kind]}</Badge>
        </div>
        <h1 className="mt-3 page-title">{g.name}</h1>
        {g.nameOriginal ? <p lang="und" className="mt-1 text-lg text-muted">{g.nameOriginal}</p> : null}
        <p className="mt-3 font-mono text-xs text-faint">{g.id}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-12">
          <ProgrammeResearchTrail trail={trail} />
          {l.envelopes.length ? (
            <Section title="Ceilings" description="Envelopes, appropriations and lending authority are listed separately from recipient awards.">
              <RecordList>
                {l.envelopes.map((c) => <CommitmentRow key={c.id} c={summarizeCommitment(c)} />)}
              </RecordList>
            </Section>
          ) : null}

          <Section
            title="Awards recorded under the programme"
            description="Recorded public commitments under this programme or its children, summed by currency after reconciling package components. Actual programme expenditure requires separate payment evidence."
          >
            {l.recordedAwards ? (
              <>
                <div className="mb-4"><CurrencyTotals totals={l.recordedAwards.totals!} /></div>
                <RecordList>
                  {l.recordedAwards.rows.map((c) => <CommitmentRow key={c.id} c={summarizeCommitment(c)} />)}
                </RecordList>
              </>
            ) : (
              <p className="text-sm text-muted">No award to a recipient is recorded under this programme in the corpus.</p>
            )}
          </Section>

          {l.otherLayers.length ? (
            <Section title="Other rows under the programme" description="Kept apart from committed public money.">
              <LayerStack layers={l.otherLayers} />
            </Section>
          ) : null}

          {l.designations.length ? (
            <Section title="Projects recognized" description="Recognition standing is recorded separately from financial support.">
              <RecordList>
                {l.designations.map((d) => <DesignationRow key={d.id} d={d} showProject />)}
              </RecordList>
            </Section>
          ) : null}

          <Section title="Record">
            <div className="border-y border-border-strong">
              <dl>
                <Fact label="Kind">{programmeKindLabels[g.kind]}</Fact>
                <Fact label="Administered by"><OrgList ids={g.administeringOrgIds} showKind empty="Not stated in the cited sources" /></Fact>
                <Fact label="Part of">{l.parent ? <Link href={`/programmes/${l.parent.id}`} className="link-quiet">{l.parent.name}</Link> : <NotStated>None</NotStated>}</Fact>
                {l.children.length ? (
                  <Fact label="Includes">
                    {l.children.map((c) => <Link key={c.id} href={`/programmes/${c.id}`} className="block link-quiet">{c.name}</Link>)}
                  </Fact>
                ) : null}
                <Fact label="Legal authority">{g.legalAuthorityAsStated ?? <NotStated />}</Fact>
              </dl>
            </div>
          </Section>

          {g.notes ? (
            <Section title="Notes">
              <p className="max-w-prose text-pretty text-lg leading-8 text-foreground">{g.notes}</p>
            </Section>
          ) : null}

          <Section title="Evidence">
            <EvidenceTable evidence={g.evidence} fieldLabels={programmeEvidenceFieldLabels} />
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="border-t border-border-strong pt-3 text-sm">
            <h2 className="mb-2 font-display text-xs text-faint">Machine-readable</h2>
            <a href={`/api/v1/programmes/${g.id}`} className="link-quiet">JSON ledger with sources</a>
          </div>
        </aside>
      </div>
    </Container>
  );
}
