/**
 * The material dossier as a record sheet: a centred title block with the material's symbol as its one
 * typographic device, the derived standfirst, the record counts as a fact grid, then the dossier's sections.
 * One template for every material, rendered on the server with no client script. Every count, row and note
 * arrives in the payload (`lib/material-dossier`); nothing is derived or added up here.
 */
import Link from "next/link";
import { CapitalControls } from "@/components/dossier/capital-controls";
import { EventsSection, RelatedSection } from "@/components/dossier/events";
import { NotesSection } from "@/components/dossier/notes";
import { RecordsByStage, SupplyChainBand } from "@/components/dossier/supply-chain";
import { TimelineSection } from "@/components/dossier/timeline";
import { MaterialBenchmarks } from "@/components/markets/material-benchmarks";
import { Container, PageContents } from "@/components/ui/container";
import { formatDate } from "@/lib/format";
import { getMarketSeriesForMaterial } from "@/lib/market-data";
import type { DossierPayload } from "@/lib/material-dossier";
import { FactNote, Qualifier, RecordFact, RecordFacts, RecordTitleBlock, StatusLine } from "./primitives";

export function MaterialRecord({ payload }: { payload: DossierPayload }) {
  const hasNotes = payload.notes.fields.length > 0 || payload.notes.downstream.length > 0;
  const hasBenchmarks = getMarketSeriesForMaterial(payload.id).length > 0;
  const contents = [
    { href: "#supply-chain", label: "Supply chain" },
    { href: "#records", label: "Activity by stage" },
    { href: "#capital-controls", label: "Capital and controls" },
    { href: "#timeline", label: "Timeline" },
    { href: "#events", label: "Events" },
    { href: "#related", label: "Cited by" },
    ...(hasBenchmarks ? [{ href: "#price-benchmarks", label: "Price benchmarks" }] : []),
    ...(hasNotes ? [{ href: "#notes", label: "Editorial notes" }] : []),
  ];

  return (
    <Container className="dossier py-12 sm:py-16" width="wide">
      <RecordTitleBlock
        breadcrumbs={[{ href: "/materials", label: "Materials" }, { label: payload.nameEn }]}
        device={
          <p className="mb-3 font-editorial text-[2.5rem] font-light leading-none text-faint sm:text-[3.25rem]" title="Symbol, for identification only">
            {payload.symbol}
          </p>
        }
        title={payload.nameEn}
        subtitle={
          <>
            {payload.nameZh ? (
              <p lang="zh" className="mt-3 font-display text-xl text-muted">
                {payload.nameZh}
              </p>
            ) : null}
            <p className="standfirst mt-6 max-w-2xl">{payload.lede}</p>
          </>
        }
        status={
          <StatusLine label="As of">
            <time dateTime={payload.asOf} className="tnum text-foreground">
              {formatDate(payload.asOf)}
            </time>
          </StatusLine>
        }
      />

      {payload.groupNote ? (
        <Qualifier className="mx-auto mt-8 text-center">
          {payload.groupNote.text}{" "}
          {payload.groupNote.href ? (
            <Link href={payload.groupNote.href} className="link-quiet text-foreground">
              {payload.groupNote.linkText}
            </Link>
          ) : null}
        </Qualifier>
      ) : null}

      <RecordFacts label={`${payload.nameEn} counts`} flush={!payload.groupNote}>
        {payload.stats.map((s) => (
          <RecordFact key={s.key} label={s.label} data-stat={s.key}>
            <span className="tnum block font-editorial text-[2rem] font-light leading-none text-foreground">{s.value}</span>
            <FactNote>{s.basis}</FactNote>
            {s.sublabel ? <FactNote>{s.sublabel}</FactNote> : null}
          </RecordFact>
        ))}
      </RecordFacts>
      <Qualifier className="mt-4">Each count covers one kind and counts are never added together.</Qualifier>

      <PageContents items={contents} className="mt-10" />

      <div className="mt-14 space-y-14 [&_[id]]:scroll-mt-32">
        <SupplyChainBand payload={payload} />
        <RecordsByStage payload={payload} />
        <CapitalControls payload={payload} />
        <TimelineSection payload={payload} />
        <EventsSection payload={payload} />
        <RelatedSection payload={payload} />
        <MaterialBenchmarks materialId={payload.id} />
        <NotesSection payload={payload} />
      </div>
    </Container>
  );
}
