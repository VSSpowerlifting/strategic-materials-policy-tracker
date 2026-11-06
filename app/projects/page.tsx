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
    <PageHeading title="Projects" lead="Industrial projects, searchable by material, country, production stage and financial relationship." />
    <ResearchReadingKey topic="projects" />
    <Section className="mt-10" title="Project directory">
      <ProjectsExplorer rows={rows} materialNames={materialNames}/>
      <p className="mt-6 text-sm text-muted">
        <Link href="/projects/compare" className="text-accent hover:text-accent-strong">Compare projects</Link>
        {" · "}Downloads: <a href="/api/export/projects.csv" className="text-accent hover:text-accent-strong">Project CSV</a>
        {" · "}<Link href="/api/v1/projects" prefetch={false} className="text-accent hover:text-accent-strong">Project JSON API</Link>
        {" · "}<Link href="/response" className="text-accent hover:text-accent-strong">Government financing and reported physical status</Link>
      </p>
    </Section>
  </Container>;
}
