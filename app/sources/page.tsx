import type {Metadata} from "next";
import Link from "next/link";
import {Container,PageHeading} from "@/components/ui/container";
import {SourceRegisterExplorer} from "@/components/source-register-explorer";
import {getAllSources} from "@/lib/data";
import {buildSourceUseIndex,publishedSourceRecords} from "@/lib/source-usage";
import {buildSourceDirectory} from "@/lib/source-directory";

export const metadata:Metadata={
 title:"Sources — original-document research register",
 description:"Search original sources by publisher, language, type, confidence tier and the published entries that cite them.",
};
export default function SourcesPage(){
 const rows=buildSourceDirectory(getAllSources(),buildSourceUseIndex(publishedSourceRecords()));
 return <Container className="py-12">
   <PageHeading title="Source register"
     lead="Original documents cited in SMPT research and data."/>
   <div className="mt-10"><SourceRegisterExplorer rows={rows}/></div>
   <p className="mt-12 max-w-prose border-t border-border pt-4 text-sm leading-6 text-muted">
     <Link href="/methodology#sources" className="link-quiet">Source hierarchy and verification standards</Link>.
     Each source dossier lists the published entries that cite it directly, with their own evidence limitations.
   </p>
 </Container>;
}
