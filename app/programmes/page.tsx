import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InlineAmount } from "@/components/capital/rows";
import { programmeLedger } from "@/lib/capital-intelligence";
import { getAllProgrammes } from "@/lib/data";
import { jurisdictionLabels, programmeKindLabels } from "@/lib/labels";
import { JURISDICTIONS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Programmes",
  description:
    "The named schemes behind strategic-material capital: facilities, grant programmes, tax incentives, strategic reserves and designation schemes, with their ceilings listed beside the awards the corpus records under them.",
};

export default function ProgrammesPage() {
  const programmes = getAllProgrammes();
  return (
    <Container className="py-12">
      <PageHeading
        index="06"
        eyebrow="Capital intelligence"
        title="Programmes"
        lead={
          <>
            The schemes money and recognition flow through. Each programme&apos;s ceilings are listed beside the awards
            recorded under it, and never divided into them: the corpus records some awards, not a programme&apos;s spend, so
            no utilisation rate is shown.
          </>
        }
      />
      <div className="mt-10 space-y-12">
        {JURISDICTIONS.map((j, i) => {
          const list = programmes.filter((g) => g.actor === j);
          if (!list.length) return null;
          return (
            <Section key={j} index={String(i + 1).padStart(2, "0")} title={jurisdictionLabels[j]} description={list.length === 1 ? "1 programme" : `${list.length} programmes`}>
              <Card className="overflow-hidden">
                {list.map((g) => {
                  const l = programmeLedger(g.id)!;
                  return (
                    <Link key={g.id} href={`/programmes/${g.id}`} className="group flex flex-col gap-2 border-b px-4 py-3 last:border-b-0 hover:bg-elevated sm:flex-row sm:items-start sm:gap-4">
                      <span className="min-w-0 flex-1">
                        <span className="font-display font-semibold group-hover:text-accent">{g.name}</span>
                        {g.parentProgrammeId ? <span className="block font-mono text-[11px] text-faint">part of {programmes.find((x) => x.id === g.parentProgrammeId)?.name}</span> : null}
                        <span className="mt-1 flex flex-wrap gap-2"><Badge>{programmeKindLabels[g.kind]}</Badge></span>
                      </span>
                      <span className="flex flex-col items-start gap-1 sm:items-end">
                        {l.envelopes.map((c) => (
                          <span key={c.id} className="text-sm"><InlineAmount amount={c.amount} /></span>
                        ))}
                        <span className="font-mono text-[11px] text-faint">
                          {l.recordedAwards ? `${l.recordedAwards.rows.length} recorded award row${l.recordedAwards.rows.length === 1 ? "" : "s"}` : "no award recorded"}
                          {l.designations.length ? ` · ${l.designations.length} designations` : ""}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </Card>
            </Section>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted">
        Download: <a href="/api/export/programmes.csv" className="text-accent hover:text-accent-strong">CSV</a>
        {" · "}
        <Link href="/api/v1/programmes" prefetch={false} className="text-accent hover:text-accent-strong">JSON API</Link>
      </p>
    </Container>
  );
}
