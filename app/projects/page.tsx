import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { ProjectsExplorer } from "@/components/projects-explorer";
import { ResearchReadingKey } from "@/components/capital/reading-guide";
import { buildProjectDirectory } from "@/lib/project-directory";
import {
  getAllFinancialCommitments, getAllMaterials, getAllOrganizations,
  getAllProjectDesignations, getAllProjects,
} from "@/lib/data";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Projects — research directory",
  description: "Explore recorded mines, refineries, magnet plants and recycling undertakings by material, country, stage and evidence relationship, with explicit financing and source boundaries.",
};

export default function ProjectsPage() {
  const projects = getAllProjects();
  const rows = buildProjectDirectory(
    projects, getAllFinancialCommitments(), getAllProjectDesignations(),
    getAllOrganizations(), site.lastUpdated,
  );
  const materialNames = Object.fromEntries(getAllMaterials().map(m=>[m.id,m.nameEn]));
  return <Container className="py-12">
    <PageHeading index="04" eyebrow="Capital intelligence" title="Projects"
      lead={<>Explore the physical undertakings named in the policy and financing record.
        Filter by material, supply-chain stage, country or type of documented relationship.
        A project record describes the undertaking; associated money and independently
        verified industrial progress are different questions.</>} />
    <ResearchReadingKey topic="projects" />
    <Section index="01" className="mt-10" title="Project research directory"
      description={`${rows.length} distinct registered undertakings, not an exhaustive census of industrial projects.`}>
      <ProjectsExplorer rows={rows} materialNames={materialNames}/>
      <p className="mt-6 text-sm text-muted">
        Download: <a href="/api/export/projects.csv" className="text-accent hover:text-accent-strong">Project CSV</a>
        {" · "}<Link href="/api/v1/projects" prefetch={false} className="text-accent hover:text-accent-strong">Project JSON API</Link>
        {" · "}<Link href="/response" className="text-accent hover:text-accent-strong">Government financing and reported physical status</Link>
      </p>
    </Section>
  </Container>;
}
