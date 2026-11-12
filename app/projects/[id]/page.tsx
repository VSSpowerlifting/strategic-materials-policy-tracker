import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ControlStatusBadge, EvidenceTable, SourceMention } from "@/components/capital/primitives";
import { OrgList, ProgrammeLink } from "@/components/intelligence/org-link";
import { JurisdictionTag } from "@/components/labels";
import {
  ProjectFinancialRecord,
  ProjectOverview,
  ProjectPolicyContext,
  ProjectUnknowns,
} from "@/components/projects/project-investigation";
import { ReviewedProjectMilestones } from "@/components/projects/reviewed-project-milestones";
import {
  FactNote,
  IdentityItem,
  Qualifier,
  RailBlock,
  RecordFact,
  RecordFacts,
  RecordId,
  RecordLayout,
  RecordList,
  RecordTitleBlock,
  StatusLine,
  Unknown,
} from "@/components/record/primitives";
import { DesignationLine, LayerList } from "@/components/record/rows";
import { Container, Section } from "@/components/ui/container";
import { controlIssuer, isEnded } from "@/lib/capital-control";
import { coInvestments, controlsAtProjectStages } from "@/lib/capital-intelligence";
import { getAllProjects, getEventById, getMaterialsByIds, getProjectById } from "@/lib/data";
import { formatDate } from "@/lib/format";
import {
  coInvestmentKindLabels,
  controlMeasureTypeLabels,
  implementationStatusLabels,
  materialAttributionLabels,
  projectEvidenceFieldLabels,
  supplyChainStageLabels,
} from "@/lib/labels";
import { getPublicProjectInvestigation } from "@/lib/research-experience";
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
    title: `${p.name} — project investigation`,
    description: `Who backs ${p.name}, through which instruments and at what status, by value role and in original currencies.`,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const investigation = getPublicProjectInvestigation(id);
  if (!investigation) notFound();
  const { stack, packet } = investigation;
  const { project: p } = stack;
  const materials = getMaterialsByIds(p.materialIds);
  const reviewedMilestones = packet.nativeMilestones;
  const co = coInvestments().find((c) => c.project.id === id);
  const controls = controlsAtProjectStages(p, site.lastUpdated);
  const ended = stack.rows.filter(isEnded);
  const options = stack.rows.filter((c) => !isEnded(c) && c.valueRole === "funding_option");
  const indications = stack.rows.filter((c) => !isEnded(c) && c.valueRole === "indication");
  const programmes = [...new Set(stack.rows.flatMap((c) => (c.programmeId ? [c.programmeId] : [])))];
  const latest = stack.latestImplementation;

  const contents = [
    { href: "#project-finance", label: "Financial evidence" },
    { href: "#capital-stack", label: "Capital stack" },
    { href: "#project-industrial", label: "Industrial observations" },
    { href: "#project-policy", label: "Policy context" },
    ...(stack.associatedRows.length ? [{ href: "#shared-financing", label: "Shared financing" }] : []),
    ...(stack.designations.length ? [{ href: "#designations", label: "Designations" }] : []),
    { href: "#stage-controls", label: "Control clauses" },
    { href: "#project-unknowns", label: "Unknowns" },
    { href: "#project-sources", label: "Evidence" },
  ];

  return (
    <Container className="py-12 sm:py-16">
      <RecordTitleBlock
        breadcrumbs={[{ href: "/projects", label: "Projects" }, { label: p.name }]}
        title={p.name}
        identity={
          <>
            {stack.governments.map((g) => (
              <IdentityItem key={g}>
                <JurisdictionTag code={g} withName />
              </IdentityItem>
            ))}
            <IdentityItem>
              <RecordId id={p.id} />
            </IdentityItem>
          </>
        }
        status={
          // An attributed report carried by a financing row, so the line names what it is before the status.
          latest ? (
            <StatusLine
              prefix="Latest financing-row activity report"
              label={implementationStatusLabels[latest.status as ImplementationStatus]}
            >
              {latest.date ? (
                <time dateTime={latest.date} className="tnum">
                  {formatDate(latest.date)}
                </time>
              ) : (
                <span>Date not stated</span>
              )}
              <SourceMention sourceId={latest.sourceId} />
            </StatusLine>
          ) : (
            <StatusLine prefix="Latest financing-row activity report" label="No physical status recorded" />
          )
        }
      >
        <a href={`/api/v1/projects/${p.id}/investigation`} download className="research-button-secondary">
          Download investigation JSON
        </a>
        <span className="font-display text-sm text-muted">
          Last revised{" "}
          <time dateTime={packet.corpus.revision} className="tnum">
            {formatDate(packet.corpus.revision)}
          </time>
        </span>
      </RecordTitleBlock>

      <RecordFacts label="Key facts" flush>
        <RecordFact label="Sponsors">
          <OrgList ids={p.sponsorOrgIds} showKind empty="Not stated" />
        </RecordFact>
        <RecordFact label="Location">
          {p.locations.length ? (
            p.locations.map((l, i) => (
              <span key={i} className="block">
                {l.asStated ?? l.subnational}
                {l.countryCode ? <span className="ml-2 text-[0.8125rem] text-faint">{l.countryCode}</span> : null}
              </span>
            ))
          ) : (
            <Unknown>Location not stated in the sources.</Unknown>
          )}
        </RecordFact>
        <RecordFact label="Stages">
          {p.stages.length ? p.stages.map((s) => supplyChainStageLabels[s]).join(", ") : <Unknown />}
        </RecordFact>
        <RecordFact label="Programmes">
          {programmes.length ? (
            programmes.map((g) => (
              <span key={g} className="block">
                <ProgrammeLink id={g} />
              </span>
            ))
          ) : (
            <Unknown>None recorded</Unknown>
          )}
        </RecordFact>
        <RecordFact label="Materials" wide>
          {materials.length ? (
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              {materials.map((m) => (
                <Link key={m.id} href={`/materials/${m.slug}`} className="link-quiet">
                  {m.nameEn}
                </Link>
              ))}
            </span>
          ) : null}
          {p.untrackedMaterialsAsStated.length ? (
            <span className="mt-1 block text-muted">Also names: {p.untrackedMaterialsAsStated.join("; ")}</span>
          ) : null}
          <FactNote>{materialAttributionLabels[p.materialAttribution]}</FactNote>
        </RecordFact>
        {co ? <RecordFact label="Co-investment">{co.kinds.map((k) => coInvestmentKindLabels[k]).join(", ")}</RecordFact> : null}
      </RecordFacts>

      {/* The overview carries its own links to the five evidence sections, so the body skips the small-screen contents line. */}
      <ProjectOverview investigation={investigation} />

      <RecordLayout
        contents={contents}
        mobileContents={false}
        rail={
          <>
            <RailBlock title="Providers">
              <OrgList ids={stack.providerOrgIds} showKind empty="No provider of committed capital is named" />
            </RailBlock>
            <RailBlock title="Investigation JSON">
              <p className="text-[0.8125rem] leading-6 text-muted">
                Separate financial and industrial evidence, original amounts, conditions, source URLs and field locators.
                Projection {packet.projectionVersion}; corpus revised {formatDate(packet.corpus.revision)}.
              </p>
            </RailBlock>
          </>
        }
      >
        <div id="project-finance" className="scroll-mt-24">
          <ProjectFinancialRecord investigation={investigation} />
        </div>

        <Section
          id="capital-stack"
          title="Capital stack"
          description="One layer per value role. Public commitments and joint-vehicle capital are reported separately by currency. Other categories appear as individual records."
        >
          {ended.length || options.length || indications.length ? (
            <Qualifier className="mb-8 border-l border-border-strong pl-4">
              {ended.length
                ? `${ended.length} row${ended.length === 1 ? " has" : "s have"} ended (withdrawn or lapsed) and no longer back${ended.length === 1 ? "s" : ""} this project; ${ended.length === 1 ? "it stays" : "they stay"} listed with ${ended.length === 1 ? "its" : "their"} status. `
                : ""}
              {options.length
                ? `${options.length} funding option${options.length === 1 ? " is" : "s are"} a right to call on money, not money that moved, and ${options.length === 1 ? "is" : "are"} not counted as backing; an exercise would be a commitment of its own. `
                : ""}
              {indications.length
                ? `${indications.length} non-binding indication${indications.length === 1 ? " is a letter" : "s are letters"} of intent or interest, possible support and not a commitment, and ${indications.length === 1 ? "is" : "are"} not counted as backing; one that became binding would be recorded as a commitment.`
                : ""}
            </Qualifier>
          ) : null}
          {stack.layers.length ? (
            <LayerList layers={stack.layers} />
          ) : (
            <Qualifier>No financial row is attributable to this project yet.</Qualifier>
          )}
        </Section>

        <div id="project-industrial" className="scroll-mt-24">
          {reviewedMilestones.length ? (
            <Section
              title="Source-reviewed industrial observations"
              description="Original-source claims independently assessed by a human reviewer. Reported industrial activity and financial standing have separate evidence trails. Causal attribution requires further support."
            >
              <ReviewedProjectMilestones milestones={reviewedMilestones} />
            </Section>
          ) : (
            <Section title="Source-reviewed industrial observations">
              <Qualifier>
                This undertaking currently lacks a published source-reviewed industrial milestone. Any activity described in
                financing records remains attributed to its publisher. Its operational status requires further source review.
              </Qualifier>
            </Section>
          )}
        </div>

        <div id="project-policy" className="scroll-mt-24">
          <ProjectPolicyContext investigation={investigation} />
        </div>

        {stack.associatedRows.length ? (
          <Section
            id="shared-financing"
            title="Shared / unallocated financing"
            description="The source associates these financing rows with several projects while leaving the amount unallocated. They appear for provenance and remain outside individual project stacks and co-investment totals."
          >
            <RecordList>
              {stack.associatedRows.map((c) => (
                <li key={c.id} className="grid gap-x-8 gap-y-1 border-b border-border py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <h3 className="text-pretty font-display text-base font-medium leading-snug">
                      <Link href={`/capital/${c.id}`} className="link-quiet">
                        {c.project ?? c.recipient ?? c.id}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted">{c.amount?.amountAsStated ?? "Amount not stated"}</p>
                  </div>
                  <p className="font-display text-[0.8125rem] leading-6 text-faint">Shared, unallocated</p>
                </li>
              ))}
            </RecordList>
          </Section>
        ) : null}

        {stack.designations.length ? (
          <Section
            id="designations"
            title="Designations"
            description="Scheme recognition records standing; capital support requires a separate financial instrument."
          >
            <RecordList>
              {stack.designations.map((d) => (
                <DesignationLine key={d.id} d={d} />
              ))}
            </RecordList>
          </Section>
        ) : null}

        <Section
          id="stage-controls"
          title="Control clauses on the same materials and stages"
          description={`Clauses whose covered items share a material and a supply-chain stage with this project, with their legal status on ${formatDate(site.lastUpdated)}. The overlap is a shared material and stage; project-level effects require separate evidence.`}
        >
          {controls.length ? (
            <RecordList>
              {controls.map(({ measure: m, status }) => {
                const e = getEventById(m.eventId)!;
                return (
                  <li key={m.id} className="grid gap-x-8 gap-y-1.5 border-b border-border py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                      <h3 className="text-pretty font-display text-base font-medium leading-snug">
                        <Link href={`/controls/${m.id}`} className="link-quiet">
                          {controlMeasureTypeLabels[m.measureType]}
                        </Link>
                        {m.clause ? <span className="font-normal text-muted">, {m.clause}</span> : null}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-muted">{e.documentNumber ?? e.titleEn}</p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 font-display text-[0.8125rem] leading-5 text-muted">
                        <JurisdictionTag code={controlIssuer(m)} />
                        <span>
                          {m.controlledStages
                            .filter((s) => p.stages.includes(s))
                            .map((s) => supplyChainStageLabels[s])
                            .join(", ")}
                        </span>
                      </p>
                    </div>
                    <div className="text-[0.8125rem]">
                      {status ? <ControlStatusBadge status={status} /> : <Unknown>Not yet announced</Unknown>}
                    </div>
                  </li>
                );
              })}
            </RecordList>
          ) : (
            <Qualifier>No coded control clause covers items at this project&apos;s materials and stages.</Qualifier>
          )}
        </Section>

        <div id="project-unknowns" className="scroll-mt-24">
          <ProjectUnknowns investigation={investigation} />
        </div>

        <div id="project-sources" className="scroll-mt-24">
          <Section title="Evidence">
            <EvidenceTable evidence={p.evidence} fieldLabels={projectEvidenceFieldLabels} />
            <Qualifier className="mt-6">
              For citations, open a parent{" "}
              <a href="#project-policy" className="link-quiet">
                policy record
              </a>{" "}
              for BibTeX, RIS and CSL formats. Cite original documents for claims about government action.
            </Qualifier>
            <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-2 font-display text-sm">
              <li>
                <a href={`/api/v1/projects/${p.id}`} className="link-quiet">
                  Project registry JSON with sources
                </a>
              </li>
              <li>
                <Link href="/data" className="link-quiet">
                  Full dataset and download guide
                </Link>
              </li>
            </ul>
          </Section>
        </div>
      </RecordLayout>
    </Container>
  );
}
