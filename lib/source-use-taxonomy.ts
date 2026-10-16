export const SOURCE_USE_KINDS = [
  "event", "capital", "control", "project", "milestone",
  "designation", "framing", "organization", "programme", "material", "actor",
] as const;
export type SourceUseKind = (typeof SOURCE_USE_KINDS)[number];

export const SOURCE_USE_LABELS: Record<SourceUseKind, string> = {
  event: "Policy events",
  capital: "Financial instruments",
  control: "Control clauses",
  project: "Projects",
  milestone: "Reviewed physical milestones",
  designation: "Project designations",
  framing: "Original-language framing",
  organization: "Organizations",
  programme: "Programmes",
  material: "Material profiles",
  actor: "Actor profiles",
};

