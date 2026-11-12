import type {Metadata} from "next";
import Link from "next/link";
import {Container,PageHeading} from "@/components/ui/container";
import {OrganizationsExplorer} from "@/components/organizations-explorer";
import {getAllOrganizations} from "@/lib/data";
import {organizationRoles} from "@/lib/capital-intelligence";
import {buildOrganizationDirectory} from "@/lib/organization-directory";

export const metadata:Metadata={
 title:"Organizations — economic-security relationships",
 description:"Explore the published provider, recipient, sponsor, programme-administrator and designation-holder registry by original name, geography, organization type and official affiliations.",
};
export default function OrganizationsPage(){
 const orgs=getAllOrganizations();
 const rows=buildOrganizationDirectory(orgs,orgs.map(o=>({id:o.id,roles:organizationRoles(o.id)})));
 return <Container className="py-12">
  <PageHeading title="Organizations"
   lead="Bodies named in the capital and project records. Financing status and payment evidence sit in the linked financial records."/>
  <div className="mt-10"><OrganizationsExplorer rows={rows}/></div>
  <p className="mt-8 text-sm text-muted">
   Download: <a href="/api/export/organizations.csv" className="text-accent hover:underline">Organization CSV</a>
   {" · "}<Link href="/api/v1/organizations" prefetch={false} className="text-accent hover:underline">JSON API</Link>
   {" · "}<Link href="/portfolios" className="text-accent hover:underline">Government capital portfolios</Link>
  </p>
 </Container>;
}
