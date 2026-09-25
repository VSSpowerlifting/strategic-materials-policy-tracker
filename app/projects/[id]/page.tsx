import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JurisdictionTag } from "@/components/labels";
import { ControlStatusBadge, EvidenceTable, Fact, ImplementationStatusBadge, NotStated, SourceMention } from "@/components/capital/primitives";
import { LayerStack } from "@/components/intelligence/layers";
import { OrgList, ProgrammeLink } from "@/components/intelligence/org-link";
import { DesignationRow } from "@/components/intelligence/designation-row";
import { coInvestments, controlsAtProjectStages, projectStack } from "@/lib/capital-intelligence";
import { controlIssuer, isEnded } from "@/lib/capital-control";
import { getAllProjects, getEventById, getMaterialsByIds, getProjectById } from "@/lib/data";
import {
  coInvestmentKindLabels,
  controlMeasureTypeLabels,
  materialAttributionLabels,
  projectEvidenceFieldLabels,
  supplyChainStageLabels,
} from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { site } from "@/lib/site";
import type { ImplementationStatus } from "@/lib/types";

export function generateStaticParams() {
  return getAllProjects().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = getProjectById(id);
  if (!p) return { title: "Project not found" };
  return {
    title: `${p.name} — capital stack`,
    description: `Who backs ${p.name}, through which instruments and at what status, by value role and in original currencies.`,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stack = projectStack(id);
  if (!stack) notFound();
  const { project: p } = stack;
  const materials = getMaterialsByIds(p.materialIds);
  const co = coInvestments().find((c) => c.project.id === id);
  const controls = controlsAtProjectStages(p, site.lastUpdated);
  const ended = stack.rows.filter(isEnded);
  const options = stack.rows.filter((c) => !isEnded(c) && c.valueRole === "funding_option");
  const indications = stack.rows.filter((c) => !isEnded(c) && c.valueRole === "indication");
  const programmes = [...new Set(stack.rows.flatMap((c) => (c.programmeId ? [c.programmeId] : [])))];
  let n = 0;
  const next = () => String(++n).padStart(2, "0");

  return (
    <Container className="py-12">
      <Link href="/projects" className="font-display text-sm text-muted hover:text-foreground">
        ← Projects
      </Link>
      <header className="mt-6 max-w-4xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {stack.governments.map((g) => (
            <JurisdictionTag key={g} code={g} withName />
          ))}
          {co ? <Badge accent>{co.kinds.map((k) => coInvestmentKindLabels[k]).join(" · ")}</Badge> : null}
        </div>
        <h1 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight">{p.name}</h1>
        <p className="mt-2 max-w-prose text-lg leading-8 text-muted">
          {p.locations.length ? p.locations.map((l) => l.asStated ?? l.subnational).join("; ") : "Location not stated in the sources."}
        </p>
        <p className="mt-3 font-mono text-xs text-faint">{p.id}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-12">
          <Section
            index={next()}
            title="Capital stack"
            description="One layer per value role. Only committed public money, and joint-vehicle money apart from it, is summed, per currency; everything else is listed. There is no total across layers."
          >
            {ended.length || options.length || indications.length ? (
              <p className="mb-6 max-w-prose rounded-md border border-dashed px-4 py-3 text-sm leading-6 text-muted">
                {ended.length
                  ? `${ended.length} row${ended.length === 1 ? " has" : "s have"} ended (withdrawn or lapsed) and no longer back${ended.length === 1 ? "s" : ""} this project; ${ended.length === 1 ? "it stays" : "they stay"} listed with ${ended.length === 1 ? "its" : "their"} status. `
                  : ""}
                {options.length
                  ? `${options.length} funding option${options.length === 1 ? " is" : "s are"} a right to call on money, not money that moved, and ${options.length === 1 ? "is" : "are"} not counted as backing; an exercise would be a commitment of its own. `
                  : ""}
                {indications.length
                  ? `${indications.length} non-binding indication${indications.length === 1 ? " is a letter" : "s are letters"} of intent or interest, possible support and not a commitment, and ${indications.length === 1 ? "is" : "are"} not counted as backing; one that became binding would be recorded as a commitment.`
                  : ""}
              </p>
            ) : null}
            {stack.layers.length ? <LayerStack layers={stack.layers} /> : <p className="text-sm text-muted">No financial row points to this project yet.</p>}
          </Section>

          {stack.designations.length ? (
            <Section index={next()} title="Designations" description="Recognition under a scheme confers standing, not money, and is never counted as capital.">
              <Card className="overflow-hidden">
                {stack.designations.map((d) => (
                  <DesignationRow key={d.id} d={d} />
                ))}
              </Card>
            </Section>
          ) : null}

          <Section
            index={next()}
            title="Control clauses on the same materials and stages"
            description={`Clauses whose covered items share a material and a supply-chain stage with this project, with their legal status on ${formatDate(site.lastUpdated)}. An overlap of items, not a finding that the project is affected.`}
          >
            {controls.length ? (
              <Card className="overflow-hidden">
                {controls.map(({ measure: m, status }) => {
                  const e = getEventById(m.eventId)!;
                  return (
                    <Link key={m.id} href={`/controls/${m.id}`} className="group flex flex-col gap-1 border-b px-4 py-3 last:border-b-0 hover:bg-elevated sm:flex-row sm:items-center sm:gap-4">
                      <span className="sm:w-28 sm:shrink-0"><JurisdictionTag code={controlIssuer(m)} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="font-display font-semibold group-hover:text-accent">
                          {controlMeasureTypeLabels[m.measureType]}
                          {m.clause ? <span className="font-normal text-muted"> · {m.clause}</span> : null}
                        </span>
                        <span className="block text-sm text-muted">{e.documentNumber ?? e.titleEn}</span>
                        <span className="block font-mono text-[11px] text-faint">
                          {m.controlledStages.filter((s) => p.stages.includes(s)).map((s) => supplyChainStageLabels[s]).join(" · ")}
                        </span>
                      </span>
                      {status ? <ControlStatusBadge status={status} /> : <NotStated>Not yet announced</NotStated>}
                    </Link>
                  );
                })}
              </Card>
            ) : (
              <p className="text-sm text-muted">No coded control clause covers items at this project&apos;s materials and stages.</p>
            )}
          </Section>

          <Section index={next()} title="Record">
            <Card className="px-5 py-1">
              <dl>
                <Fact label="Sponsors"><OrgList ids={p.sponsorOrgIds} showKind empty="Not stated" /></Fact>
                <Fact label="Location">
                  {p.locations.length
                    ? p.locations.map((l, i) => (
                        <span key={i} className="block">
                          {l.asStated ?? l.subnational}
                          {l.countryCode ? <span className="ml-2 font-mono text-xs text-faint">{l.countryCode}</span> : null}
                        </span>
                      ))
                    : <NotStated />}
                </Fact>
                <Fact label="Stages">{p.stages.length ? p.stages.map((s) => supplyChainStageLabels[s]).join(", ") : <NotStated />}</Fact>
                <Fact label="Materials">
                  {materials.length ? (
                    <span className="flex flex-wrap gap-x-3 gap-y-1">
                      {materials.map((m) => (
                        <Link key={m.id} href={`/materials/${m.slug}`} className="text-accent hover:text-accent-strong">{m.nameEn}</Link>
                      ))}
                    </span>
                  ) : null}
                  {p.untrackedMaterialsAsStated.length ? <span className="mt-1 block text-muted">Also names: {p.untrackedMaterialsAsStated.join("; ")}</span> : null}
                  <span className="mt-1 block font-mono text-[11px] text-faint">{materialAttributionLabels[p.materialAttribution]}</span>
                </Fact>
                <Fact label="Programmes">
                  {programmes.length ? programmes.map((g) => <span key={g} className="block"><ProgrammeLink id={g} /></span>) : <NotStated>None recorded</NotStated>}
                </Fact>
                <Fact label="Latest physical status">
                  {stack.latestImplementation ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <ImplementationStatusBadge status={stack.latestImplementation.status as ImplementationStatus} />
                      <span className="font-mono text-xs text-faint">
                        {stack.latestImplementation.date ? formatDate(stack.latestImplementation.date) : "Date not stated"}
                      </span>
                      <SourceMention sourceId={stack.latestImplementation.sourceId} />
                    </span>
                  ) : (
                    <NotStated>No physical status recorded</NotStated>
                  )}
                </Fact>
              </dl>
            </Card>
          </Section>

          {p.notes ? (
            <Section index={next()} title="Notes">
              <p className="max-w-prose text-pretty text-lg leading-8 text-foreground/90">{p.notes}</p>
            </Section>
          ) : null}

          <Section index={next()} title="Evidence" description="Every project fact names the source that states it.">
            <EvidenceTable evidence={p.evidence} fieldLabels={projectEvidenceFieldLabels} />
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-4 text-sm">
            <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Providers</h2>
            <OrgList ids={stack.providerOrgIds} showKind empty="No provider of committed capital is named" />
          </Card>
          <Card className="p-4 text-sm">
            <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Machine-readable</h2>
            <a href={`/api/v1/projects/${p.id}`} className="text-accent hover:text-accent-strong">JSON stack with sources</a>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
