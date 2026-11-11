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
  description: "Search industrial projects by material, location, production stage and financing relationship.",
};

export default function ProjectsPage() {
  const projects = getAllProjects();
  const rows = buildProjectDirectory(
    projects, getAllFinancialCommitments(), getAllProjectDesignations(),
    getAllOrganizations(), site.lastUpdated,
  );
  const materialNames = Object.fromEntries(getAllMaterials().map(m=>[m.id,m.nameEn]));
  return <Container className="py-12">
    <PageHeading title="Projects" lead="Search mines, processing facilities and manufacturing projects by material, location and financing." />
    <Section className="mt-10" title="Find a project">
      <ProjectsExplorer rows={rows} materialNames={materialNames}/>
      <nav aria-label="Project tools" className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm">
        <Link href="/projects/compare" className="text-accent underline underline-offset-2">Compare projects</Link>
        <a href="/api/export/projects.csv" className="text-accent underline underline-offset-2">Download CSV</a>
        <Link href="/api/v1/projects" prefetch={false} className="text-accent underline underline-offset-2">JSON API</Link>
      </nav>
    </Section>
    <div className="mt-10">
      <ResearchReadingKey topic="projects" />
    </div>
  </Container>;
}
