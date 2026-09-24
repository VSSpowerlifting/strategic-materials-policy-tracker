/**
 * Registry links: an organization, project or programme by name, resolved
 * from its id. Server components (they read the registries).
 */
import Link from "next/link";
import { getOrganizationById, getProgrammeById, getProjectById } from "@/lib/data";
import { organizationKindLabels } from "@/lib/labels";

export function OrgLink({ id, showKind = false }: { id: string; showKind?: boolean }) {
  const o = getOrganizationById(id);
  if (!o) return <span className="font-mono text-xs text-faint">{id}</span>;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <Link href={`/organizations/${o.id}`} className="text-accent hover:text-accent-strong">
        {o.name}
      </Link>
      {showKind ? <span className="font-mono text-[11px] text-faint">{organizationKindLabels[o.kind]}</span> : null}
    </span>
  );
}

export function OrgList({ ids, showKind = false, empty = "None named" }: { ids: readonly string[]; showKind?: boolean; empty?: string }) {
  if (!ids.length) return <span className="font-mono text-xs text-faint">{empty}</span>;
  return (
    <span className="flex flex-col gap-1">
      {ids.map((id) => (
        <OrgLink key={id} id={id} showKind={showKind} />
      ))}
    </span>
  );
}

export function ProjectLink({ id }: { id: string }) {
  const p = getProjectById(id);
  if (!p) return <span className="font-mono text-xs text-faint">{id}</span>;
  return (
    <Link href={`/projects/${p.id}`} className="text-accent hover:text-accent-strong">
      {p.name}
    </Link>
  );
}

export function ProgrammeLink({ id }: { id: string }) {
  const g = getProgrammeById(id);
  if (!g) return <span className="font-mono text-xs text-faint">{id}</span>;
  return (
    <Link href={`/programmes/${g.id}`} className="text-accent hover:text-accent-strong">
      {g.name}
    </Link>
  );
}
