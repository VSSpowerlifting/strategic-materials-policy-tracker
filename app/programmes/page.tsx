import type {Metadata} from "next";
import Link from "next/link";
import {Container,PageHeading} from "@/components/ui/container";
import {ProgrammesExplorer} from "@/components/programmes-explorer";
import {ResearchReadingKey} from "@/components/capital/reading-guide";
import {programmeLedger} from "@/lib/capital-intelligence";
import {buildProgrammeDirectory} from "@/lib/programme-directory";
import {getAllOrganizations,getAllProgrammes} from "@/lib/data";

export const metadata:Metadata={
 title:"Programmes — research directory",
 description:"Filter government strategic-material programmes by jurisdiction, scheme type, source-named administrators and distinct recorded financing/designation relationships.",
};
export default function ProgrammesPage(){
 const programmes=getAllProgrammes();
 const rows=buildProgrammeDirectory(
  programmes,
  programmes.map(p=>{const ledger=programmeLedger(p.id);if(!ledger)throw new Error("Missing programme ledger "+p.id);return {id:p.id,ledger}}),
  new Map(getAllOrganizations().map(o=>[o.id,o.name])),
 );
 return <Container className="py-12">
  <PageHeading index="06" eyebrow="Capital intelligence" title="Programmes"
   lead="Explore the government schemes through which financing, incentives and project designations are recorded. A named ceiling or lending authority is not an amount spent; the tracker records selected financial rows, not complete programme utilization."/>
  <ResearchReadingKey topic="programmes" />
  <div className="mt-10"><ProgrammesExplorer rows={rows}/></div>
  <p className="mt-8 text-sm text-muted">
   Download: <a href="/api/export/programmes.csv" className="text-accent hover:underline">Programme CSV</a>
   {" · "}<Link href="/api/v1/programmes" prefetch={false} className="text-accent hover:underline">JSON API</Link>
   {" · "}<Link href="/portfolios" className="text-accent hover:underline">Government portfolios</Link>
  </p>
 </Container>;
}
