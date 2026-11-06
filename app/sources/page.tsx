import type {Metadata} from "next";
import Link from "next/link";
import {Container,PageHeading} from "@/components/ui/container";
import {SourceRegisterExplorer} from "@/components/source-register-explorer";
import {getAllSources} from "@/lib/data";
import {buildSourceUseIndex,publishedSourceRecords} from "@/lib/source-usage";
import {buildSourceDirectory} from "@/lib/source-directory";

export const metadata:Metadata={
 title:"Sources — original-document research register",
 description:"Search original sources by publisher, language, type, confidence tier and directly citing published records.",
};
export default function SourcesPage(){
 const rows=buildSourceDirectory(getAllSources(),buildSourceUseIndex(publishedSourceRecords()));
 return <Container className="py-12">
   <PageHeading title="Sources"
     lead="Original documents cited in SMPT research and database records."/>
   <div className="mt-10"><SourceRegisterExplorer rows={rows}/></div>
   <p className="mt-12 max-w-prose text-sm leading-7 text-muted">
     Learn more about the <Link href="/methodology#sources" className="text-accent hover:underline">
     source hierarchy and verification standards</Link>. Individual source dossiers list directly
     citing published records with their own evidence limitations.
   </p>
 </Container>;
}
