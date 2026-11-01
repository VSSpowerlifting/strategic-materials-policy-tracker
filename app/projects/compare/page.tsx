import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading } from "@/components/ui/container";
import { ProjectComparison } from "@/components/project-comparison";
import { buildProjectComparison } from "@/lib/project-comparison";
import { buildProjectDirectory } from "@/lib/project-directory";
import {
  getAllFinancialCommitments, getAllMaterials, getAllOrganizations,
  getAllProjectDesignations, getAllProjectMilestones, getAllProjects,
  getAllSources,
} from "@/lib/data";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Compare project evidence",
  description:
    "Compare two registered strategic-material projects by their stated materials, sponsors, financing relationships, source citations and publicly reviewed milestones—without treating support as output.",
};

export default function ProjectComparisonPage() {
  const projects = getAllProjects();
  const directory = buildProjectDirectory(
    projects, getAllFinancialCommitments(), getAllProjectDesignations(),
    getAllOrganizations(), site.lastUpdated,
  );
  const rows = buildProjectComparison(directory, projects, getAllSources(), getAllProjectMilestones());
  const materialNames = Object.fromEntries(getAllMaterials().map(m => [m.id, m.nameEn]));
  return <Container className="py-12">
    <Link href="/projects" className="font-display text-sm text-muted hover:text-foreground">
      ← Project directory
    </Link>
    <PageHeading index="04" eyebrow="Capital intelligence" title="Compare project evidence"
      lead="Place two registered undertakings side by side. Compare the facts actually recorded—sponsors, materials, locations, financing relationships, project citations and reviewed physical milestones—without mistaking a financial commitment, project association or designation for delivered industrial capacity." />
    <div className="mt-8">
      <ProjectComparison rows={rows} materialNames={materialNames} revision={site.lastUpdated} />
    </div>
    <p className="mt-8 max-w-prose text-sm leading-7 text-muted">
      This is a comparison of curated published records, not an exhaustive project census,
      a causal policy evaluation or a dollar ranking. Open the linked project, financial and
      source records to check what each original publisher establishes.{" "}
      <Link href="/methodology" className="text-accent hover:underline">Read the methodology.</Link>
    </p>
  </Container>;
}
