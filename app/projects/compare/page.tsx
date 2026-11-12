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
    "Compare two registered strategic-material projects by their stated materials, sponsors, financing relationships, source citations and publicly reviewed milestones—with finance and physical milestones evaluated separately.",
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
    <PageHeading title="Compare project evidence"
      breadcrumbs={[{ href: "/projects", label: "Projects" }, { label: "Compare" }]}
      lead="Two registered projects side by side. Financing and delivered industrial capacity are documented through distinct sources." />
    <div className="mt-8">
      <ProjectComparison rows={rows} materialNames={materialNames} revision={site.lastUpdated} />
    </div>
    <p className="mt-8 max-w-prose text-sm leading-7 text-muted">
      This comparison draws on the published SMPT project register. It is not
      a causal policy evaluation or a dollar ranking. Open the linked project, financing and
      source pages to check what each original publisher establishes.{" "}
      <Link href="/methodology" className="link-quiet">Methodology</Link>.
    </p>
  </Container>;
}
