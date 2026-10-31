import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { SourceCard } from "@/components/source-ref";
import { getAllSources, getSourceById } from "@/lib/data";
import {
  getSourceUses, SOURCE_USE_KINDS, SOURCE_USE_LABELS,
} from "@/lib/source-usage";

export function generateStaticParams() {
  return getAllSources().map(source => ({ id: source.id }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const source = getSourceById(id);
  if (!source) return { title: "Source not found" };
  return {
    title: source.title + " — source dossier",
    description: "Original publisher citation and directly source-linked policy, financial, control and project records in the curated SMPT corpus.",
  };
}

export default async function SourceDossierPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = getSourceById(id);
  if (!source) notFound();

  const uses = getSourceUses(id);
  const groups = SOURCE_USE_KINDS
    .map(kind => ({ kind, uses: uses.filter(use => use.kind === kind) }))
    .filter(group => group.uses.length > 0);

  return (
    <Container className="py-12">
      <PageHeading
        breadcrumbs={[
          { href: "/sources", label: "Evidence" },
          { label: source.title },
        ]}
        title="Source dossier"
        lead="Follow one registered original document back to the published records that cite it. Each link below is an explicit source reference, not an association inferred from a shared event, company, material or project."
      />

      <div className="mt-8 max-w-4xl">
        <SourceCard source={source} showDossierLink={false} />
      </div>

      <div className="mt-8 max-w-4xl rounded-md border border-dashed border-border px-4 py-3 text-sm leading-6 text-muted">
        <strong className="font-semibold text-foreground">{uses.length} directly citing record{uses.length === 1 ? "" : "s"}.</strong>{" "}
        This is a snapshot of the curated public corpus, not a live document monitor or proof that every sentence in the linked document supports every aspect of a record. Status and implementation observations are distinct from executed agreements, cash disbursements and verified physical milestones. Private research and pending editor reviews are excluded.
      </div>

      {groups.length ? (
        <div className="mt-12 space-y-12">
          {groups.map((group, i) => (
            <Section
              key={group.kind}
              index={String(i + 2).padStart(2, "0")}
              title={SOURCE_USE_LABELS[group.kind]}
              description={group.uses.length + " distinct published record" + (group.uses.length === 1 ? "" : "s") + " with an explicit reference to this source."}
            >
              <ol className="divide-y divide-border rounded-lg border border-border bg-card">
                {group.uses.map(use => (
                  <li key={use.kind + ":" + use.id} className="px-5 py-4">
                    <Link href={use.href} className="font-display font-semibold leading-6 hover:text-accent">
                      {use.title}
                    </Link>
                    <p className="mt-1 break-all font-mono text-[11px] text-faint">{use.id}</p>
                    <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs leading-5 text-muted">
                      {use.roles.map(role => <li key={role}>{role}</li>)}
                    </ul>
                  </li>
                ))}
              </ol>
            </Section>
          ))}
        </div>
      ) : (
        <p className="mt-10 max-w-prose text-sm leading-7 text-muted">
          No directly citing record is indexed for this source in the current public corpus.
          Registration is not itself evidence that a separate policy or physical event has been verified.
        </p>
      )}

      <p className="mt-12 max-w-prose text-sm leading-7 text-faint">
        Only direct references in published events, field evidence, source-linked status
        histories, quotations, legal relationships, profiles and reviewed project milestones
        are shown. These links do not assign causality. See the{" "}
        <Link href="/methodology#sources" className="text-accent hover:underline">
          source hierarchy and verification methodology
        </Link>.
      </p>
    </Container>
  );
}
