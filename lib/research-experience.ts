/** Public research composition. Explicit public loaders are the entire evidence boundary. */
import {
  getAllControlMeasures,
  getAllEvents,
  getAllFinancialCommitments,
  getAllProjectDesignations,
  getAllProjectMilestones,
  getAllProjects,
  getAllOrganizations,
  getAllSources,
  getEventById,
  getProjectById,
  getSourceById,
} from "./data";
import { buildPublicInvestigationPacket } from "./investigation-packet";
import { site } from "./site";
import { projectStack } from "./capital-intelligence";
import { buildProjectEvidencePathway } from "./project-evidence-pathway";
import type { PolicyEvent, Project, Source } from "./types";

export function getPublicProjectInvestigation(id: string) {
  const stack = projectStack(id);
  if (!stack) return null;
  const input = {
    events: getAllEvents(),
    finances: getAllFinancialCommitments(),
    controls: getAllControlMeasures(),
    projects: getAllProjects(),
    designations: getAllProjectDesignations(),
    milestones: getAllProjectMilestones(),
    sources: getAllSources(),
  };
  const pathway = buildProjectEvidencePathway(id, input);
  const packet = buildPublicInvestigationPacket(id, input, getAllOrganizations(), site.lastUpdated, pathway)!;
  return { stack, pathway, packet };
}

const entries = [
  {
    kind: "project",
    id: "prj-au-alcoa-sojitz-gallium",
    question: "What separates a financing announcement from construction?",
    description:
      "Follow the Alcoa–Sojitz gallium project from its government support records to the available industrial evidence.",
  },
  {
    kind: "event",
    id: "evt-cn-gage-2023",
    question: "What does an export control actually require?",
    description:
      "Inspect the gallium and germanium licensing clause, its legal-status history and the original Chinese text.",
  },
  {
    kind: "project",
    id: "prj-us-stibnite",
    question: "What has a lender approved, and what remains conditional?",
    description:
      "Separate the Stibnite project's financial instruments, their source-stated conditions and its implementation evidence.",
  },
] as const;

/** Injectable public lookups make removal and missing-reference behavior testable. */
export function getInvestigationEntries(
  lookup: {
    project: (id: string) => Project | undefined;
    event: (id: string) => PolicyEvent | undefined;
    source: (id: string) => Source | undefined;
  } = { project: getProjectById, event: getEventById, source: getSourceById },
) {
  return entries.flatMap((entry) => {
    const record =
      entry.kind === "project"
        ? lookup.project(entry.id)
        : lookup.event(entry.id);
    if (!record) return [];
    const sourceIds =
      "sourceIds" in record
        ? record.sourceIds
        : record.evidence.map((e) => e.sourceId);
    if (!sourceIds.length || sourceIds.some((id) => !lookup.source(id)))
      return [];
    return [
      {
        ...entry,
        name: "name" in record ? record.name : record.titleEn,
        href: `/${entry.kind === "project" ? "projects" : "events"}/${record.id}`,
      },
    ];
  });
}
