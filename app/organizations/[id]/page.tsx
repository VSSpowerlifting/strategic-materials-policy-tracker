import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JurisdictionTag } from "@/components/labels";
import { EvidenceTable, Fact, NotStated } from "@/components/capital/primitives";
import { LayerStack } from "@/components/intelligence/layers";
import { OrgLink, ProjectLink } from "@/components/intelligence/org-link";
import { DesignationRow } from "@/components/intelligence/designation-row";
import { isEnded } from "@/lib/capital-control";
import { childOrganizations, isBackingRow, layers, organizationRoles, parentOrganizations } from "@/lib/capital-intelligence";
import { getAllFinancialCommitments, getAllOrganizations, getOrganizationById } from "@/lib/data";
import {
  jurisdictionLabels,
  organizationEvidenceFieldLabels,
  organizationKindLabels,
  organizationLinkTypeLabels,
  programmeKindLabels,
} from "@/lib/labels";

export function generateStaticParams() {
  return getAllOrganizations().map((o) => ({ id: o.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const o = getOrganizationById(id);
  if (!o) return { title: "Organization not found" };
  return {
    title: `${o.name} — ${organizationKindLabels[o.kind]}`,
    description: `What ${o.name} provides and receives in strategic-material supply chains, by value role and in original currencies.`,
  };
}

export default async function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = getOrganizationById(id);
  if (!o) notFound();
  const all = getAllFinancialCommitments();
  const roles = organizationRoles(id, all);
  const parents = parentOrganizations(o);
  const children = childOrganizations(id);
  const rolledUp = roles.rolledUpIds.slice(1);
  // Other providers on the same projects or recipients as this body's own rows, and who funds it.
  // Only rows that back (have not ended, are not a bare funding option) make an organization a co-provider or a
  // funder: a lapsed commitment letter does not put its banks behind the project.
  const backingProvided = roles.provided.filter(isBackingRow);
  const myProjects = new Set(backingProvided.flatMap((c) => (c.projectId ? [c.projectId] : [])));
  const myRecipients = new Set(backingProvided.flatMap((c) => c.recipientOrgIds));
  const coProviders = [
    ...new Set(
      all
        .filter(isBackingRow)
        .filter((c) => (c.projectId !== null && myProjects.has(c.projectId)) || c.recipientOrgIds.some((r) => myRecipients.has(r)))
        .flatMap((c) => c.providerOrgIds)
        .filter((p) => !roles.rolledUpIds.includes(p)),
    ),
  ].sort();
  const funders = [...new Set(roles.received.filter(isBackingRow).flatMap((c) => c.providerOrgIds))].sort();
  const endedRows = [...roles.provided, ...roles.received].filter(isEnded);
  let n = 0;
  const next = () => String(++n).padStart(2, "0");

  return (
    <Container className="py-12">
      <Link href="/organizations" className="font-display text-sm text-muted hover:text-foreground">
        ← Organizations
      </Link>
      <header className="mt-6 max-w-4xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {o.actor ? <JurisdictionTag code={o.actor} withName /> : null}
          <Badge>{organizationKindLabels[o.kind]}</Badge>
          {o.countryCode ? <span className="font-mono text-xs text-muted">{o.countryCode}</span> : null}
        </div>
        <h1 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight">{o.name}</h1>
        {o.nameOriginal ? <p lang="und" className="mt-1 text-lg text-muted">{o.nameOriginal}</p> : null}
        {o.aliases.length ? <p className="mt-2 font-mono text-xs text-faint">Also named: {o.aliases.join(" · ")}</p> : null}
        <p className="mt-3 font-mono text-xs text-faint">{o.id}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-12">
          {roles.provided.length ? (
            <Section
              index={next()}
              title="Capital provided"
              description={
                rolledUp.length
                  ? `Includes the rows of ${rolledUp.length === 1 ? "an office" : "offices"} that ${rolledUp.length === 1 ? "is" : "are"} part of it. By value role; only committed money is summed, per currency.`
                  : "By value role; only committed money is summed, per currency."
              }
            >
              {rolledUp.length ? (
                <p className="mb-4 text-sm text-muted">
                  Rolled up: {rolledUp.map((r, i) => <span key={r}>{i ? ", " : ""}<OrgLink id={r} /></span>)}
                </p>
              ) : null}
              {endedRows.length ? (
                <p className="mb-4 max-w-prose text-sm text-muted">
                  {endedRows.length} row{endedRows.length === 1 ? " has" : "s have"} ended (withdrawn or lapsed): listed with {endedRows.length === 1 ? "its" : "their"} status, and not counted as capital behind any project.
                </p>
              ) : null}
              <LayerStack layers={layers(roles.provided, all)} />
            </Section>
          ) : null}

          {roles.received.length ? (
            <Section index={next()} title="Capital received" description="Every row naming this organization as its recipient, by value role.">
              <LayerStack layers={layers(roles.received, all)} />
            </Section>
          ) : null}

          {roles.sponsoredProjects.length || roles.administeredProgrammes.length || roles.heldDesignations.length ? (
            <Section index={next()} title="Projects, programmes and designations">
              <div className="space-y-4">
                {roles.sponsoredProjects.length ? (
                  <Card className="p-4">
                    <h3 className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">Sponsors</h3>
                    {roles.sponsoredProjects.map((p) => <span key={p.id} className="block"><ProjectLink id={p.id} /></span>)}
                  </Card>
                ) : null}
                {roles.administeredProgrammes.length ? (
                  <Card className="p-4">
                    <h3 className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">Administers</h3>
                    {roles.administeredProgrammes.map((g) => (
                      <span key={g.id} className="block">
                        <Link href={`/programmes/${g.id}`} className="text-accent hover:text-accent-strong">{g.name}</Link>
                        <span className="ml-2 font-mono text-[11px] text-faint">{programmeKindLabels[g.kind]}</span>
                      </span>
                    ))}
                  </Card>
                ) : null}
                {roles.heldDesignations.length ? (
                  <Card className="overflow-hidden">
                    {roles.heldDesignations.map((d) => <DesignationRow key={d.id} d={d} showProject />)}
                  </Card>
                ) : null}
              </div>
            </Section>
          ) : null}

          <Section index={next()} title="Record">
            <Card className="px-5 py-1">
              <dl>
                <Fact label="Kind">{organizationKindLabels[o.kind]}</Fact>
                <Fact label="Country">{o.countryCode ?? <NotStated>Not stated in the cited sources</NotStated>}</Fact>
                <Fact label="Government">{o.actor ? jurisdictionLabels[o.actor] : <NotStated>None: its money is not a government&apos;s</NotStated>}</Fact>
                <Fact label="Parent bodies">
                  {parents.length
                    ? parents.map((p) => (
                        <span key={p.organization.id} className="block">
                          <span className="font-mono text-[11px] text-faint">{organizationLinkTypeLabels[p.relationship]} </span>
                          <OrgLink id={p.organization.id} />
                        </span>
                      ))
                    : <NotStated>None recorded</NotStated>}
                </Fact>
                {children.length ? (
                  <Fact label="Linked bodies">
                    {children.map((c) => (
                      <span key={c.organization.id} className="block">
                        <OrgLink id={c.organization.id} />
                        <span className="ml-2 font-mono text-[11px] text-faint">{organizationLinkTypeLabels[c.relationship].toLowerCase()} this body</span>
                      </span>
                    ))}
                  </Fact>
                ) : null}
              </dl>
            </Card>
          </Section>

          {o.notes ? (
            <Section index={next()} title="Notes">
              <p className="max-w-prose text-pretty text-lg leading-8 text-foreground/90">{o.notes}</p>
            </Section>
          ) : null}

          <Section index={next()} title="Evidence" description="Name, kind, country, government and parent links each name their source.">
            <EvidenceTable evidence={o.evidence} fieldLabels={organizationEvidenceFieldLabels} />
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {roles.provided.length ? (
            <Card className="p-4 text-sm">
              <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Other providers on the same projects or recipients</h2>
              {coProviders.length ? coProviders.map((p) => <span key={p} className="block"><OrgLink id={p} /></span>) : <p className="text-muted">None recorded.</p>}
            </Card>
          ) : null}
          {roles.received.length ? (
            <Card className="p-4 text-sm">
              <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Funded by</h2>
              {funders.length ? funders.map((p) => <span key={p} className="block"><OrgLink id={p} /></span>) : <p className="text-muted">No provider of committed capital is named.</p>}
            </Card>
          ) : null}
          <Card className="p-4 text-sm">
            <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Machine-readable</h2>
            <a href={`/api/v1/organizations/${o.id}`} className="text-accent hover:text-accent-strong">JSON record with sources</a>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
