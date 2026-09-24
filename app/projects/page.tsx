import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JurisdictionTag } from "@/components/labels";
import { OrgList } from "@/components/intelligence/org-link";
import { isEnded } from "@/lib/capital-control";
import { coInvestments, projectStack } from "@/lib/capital-intelligence";
import { getAllMaterials, getAllProjects } from "@/lib/data";
import { coInvestmentKindLabels, supplyChainStageLabels } from "@/lib/labels";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "The mines, refineries, magnet plants and recycling plants that public money and strategic-project designations are aimed at: each project's capital stack by value role, the governments and bodies behind it, and whether more than one provider backs it.",
};

export default function ProjectsPage() {
  const projects = getAllProjects();
  const materialNames = Object.fromEntries(getAllMaterials().map((m) => [m.id, m.nameEn]));
  const co = new Map(coInvestments().map((c) => [c.project.id, c]));

  return (
    <Container className="py-12">
      <PageHeading
        index="04"
        eyebrow="Capital intelligence"
        title="Projects"
        lead={
          <>
            The physical undertakings capital and designations are aimed at. A project record says what the undertaking is,
            where, and who develops it, from the sources; the money stays on the financial rows that point to it, so a
            project&apos;s stack is read one value role at a time and never added into one figure.
          </>
        }
      />

      <Section index="01" title="Every project" description={`${projects.length} projects. Location, stages and materials as the sources state them.`} className="mt-10">
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => {
            const s = projectStack(p.id)!;
            const c = co.get(p.id);
            return (
              <Card key={p.id} className="flex min-w-0 flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {s.governments.map((g) => (
                    <JurisdictionTag key={g} code={g} />
                  ))}
                  {p.locations.map((l, i) => (
                    <span key={i} className="font-mono text-[11px] text-muted">
                      {l.countryCode ?? "—"}
                      {l.subnational ? ` · ${l.subnational}` : ""}
                    </span>
                  ))}
                  {!p.locations.length ? <span className="font-mono text-[11px] text-faint">Location not stated</span> : null}
                </div>
                <Link href={`/projects/${p.id}`} className="mt-3 font-display text-lg font-semibold leading-snug hover:text-accent">
                  {p.name}
                </Link>
                <div className="mt-2 text-sm text-muted">
                  <OrgList ids={p.sponsorOrgIds} empty="Sponsor not stated" />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
                  {p.stages.map((st) => (
                    <Badge key={st}>{supplyChainStageLabels[st]}</Badge>
                  ))}
                  {p.materialIds.map((m) => (
                    <span key={m} className="font-mono text-[11px] text-muted">{materialNames[m] ?? m}</span>
                  ))}
                  {p.untrackedMaterialsAsStated.map((m) => (
                    <span key={m} className="font-mono text-[11px] text-faint">{m}</span>
                  ))}
                </div>
                <p className="mt-auto pt-4 font-mono text-[11px] text-faint">
                  {s.rows.length} financial row{s.rows.length === 1 ? "" : "s"}
                  {s.rows.some(isEnded) ? ` (${s.rows.filter(isEnded).length} ended)` : ""}
                  {s.designations.length ? ` · ${s.designations.length} designation${s.designations.length === 1 ? "" : "s"}` : ""}
                  {c ? ` · ${c.kinds.map((k) => coInvestmentKindLabels[k].toLowerCase()).join("; ")}` : ""}
                </p>
              </Card>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-muted">
          Download: <a href="/api/export/projects.csv" className="text-accent hover:text-accent-strong">CSV</a>
          {" · "}
          <Link href="/api/v1/projects" prefetch={false} className="text-accent hover:text-accent-strong">JSON API</Link>
        </p>
      </Section>
    </Container>
  );
}
