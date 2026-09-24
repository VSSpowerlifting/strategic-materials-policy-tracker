/**
 * The stage response map: for each tracked material and supply-chain stage,
 * the government capital aimed there, the projects designated there (standing,
 * not money) and the control clauses whose covered items sit there. Record counts only. A control's stage says where its items
 * belong, never that it restricts that stage, and nothing here draws a causal
 * line between a clause and a financing.
 */
import Link from "next/link";
import { JurisdictionTag } from "@/components/labels";
import { stageResponseMap, type ResponseCell } from "@/lib/capital-intelligence";
import { getAllMaterials } from "@/lib/data";
import { controlStatusLabels, jurisdictionShort, supplyChainStageLabels } from "@/lib/labels";
import { SUPPLY_CHAIN_STAGES } from "@/lib/types";
import type { ControlStatus, JurisdictionCode } from "@/lib/types";

function statusLine(cell: ResponseCell): string {
  return (Object.entries(cell.controlStatuses) as [ControlStatus, number][])
    .map(([s, n]) => `${n} ${controlStatusLabels[s].toLowerCase()}`)
    .join(", ");
}

function Cell({ cell }: { cell: ResponseCell | undefined }) {
  if (!cell) return <span className="font-mono text-xs text-faint">·</span>;
  const issuers = Object.keys(cell.controlsByIssuer) as JurisdictionCode[];
  return (
    <span className="flex flex-col items-start gap-1">
      {cell.capitalIds.length ? (
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px]" title={cell.capitalIds.join(", ")}>
          <span aria-hidden className="h-2 w-2 rounded-full bg-[#CBA86A]" />
          <span className="text-foreground">{cell.capitalIds.length}</span>
          <span className="text-faint">{cell.capitalActors.map((a) => jurisdictionShort[a]).join(" ")}</span>
          <span className="sr-only">capital rows</span>
        </span>
      ) : null}
      {cell.designationIds.length ? (
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px]" title={cell.designationIds.join(", ")}>
          <span aria-hidden className="h-2 w-2 rotate-45 border border-[#4fb59e]" />
          <span className="text-foreground">{cell.designationIds.length}</span>
          <span className="text-faint">{cell.designationActors.map((a) => jurisdictionShort[a]).join(" ")}</span>
          <span className="sr-only">project designations</span>
        </span>
      ) : null}
      {cell.controlIds.length ? (
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px]" title={`${cell.controlIds.join(", ")} (${statusLine(cell)})`}>
          <span aria-hidden className="h-2 w-2 rounded-[1px] bg-[#C77B7B]" />
          <span className="text-foreground">{cell.controlIds.length}</span>
          <span className="text-faint">{issuers.map((a) => jurisdictionShort[a]).join(" ")}</span>
          <span className="sr-only">control clauses: {statusLine(cell)}</span>
        </span>
      ) : null}
    </span>
  );
}

export function StageResponseMap({ asOf }: { asOf: string }) {
  const map = stageResponseMap(asOf);
  const materials = getAllMaterials().filter((m) => map.has(m.id));
  const stages = SUPPLY_CHAIN_STAGES.filter((s) => [...map.values()].some((row) => row.has(s)));
  return (
    <div>
      <div className="relative overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[44rem] border-collapse text-sm">
          <caption className="sr-only">Capital rows and control clauses by material and supply-chain stage</caption>
          <thead>
            <tr className="border-b bg-card">
              <th scope="col" className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-mono text-[11px] font-normal uppercase tracking-[0.12em] text-faint">
                Material
              </th>
              {stages.map((s) => (
                <th key={s} scope="col" className="px-3 py-2 text-left font-mono text-[11px] font-normal text-muted">
                  {supplyChainStageLabels[s]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id} className="border-b align-top last:border-b-0">
                <th scope="row" className="sticky left-0 z-10 bg-background px-3 py-2 text-left font-normal">
                  <Link href={`/materials/${m.slug}`} className="font-display hover:text-accent">{m.nameEn}</Link>
                </th>
                {stages.map((s) => (
                  <td key={s} className="px-3 py-2">
                    <Cell cell={map.get(m.id)?.get(s)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] text-faint">
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2 w-2 rounded-full bg-[#CBA86A]" /> government capital rows (committed or option), a package once</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2 w-2 rotate-45 border border-[#4fb59e]" /> project designations (standing, not money)</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2 w-2 rounded-[1px] bg-[#C77B7B]" /> control clauses whose covered items sit here</span>
        <span>Letters: the governments providing or issuing. Hover or focus a count for record ids and statuses.</span>
      </p>
    </div>
  );
}

/** One material's stages as a list, for the material page. */
export function MaterialStageResponse({ materialId, asOf }: { materialId: string; asOf: string }) {
  const row = stageResponseMap(asOf).get(materialId);
  if (!row) return <p className="text-sm text-muted">No capital row, designation or control clause is coded to a stage for this material.</p>;
  const stages = SUPPLY_CHAIN_STAGES.filter((s) => row.has(s));
  return (
    <ul className="divide-y rounded-lg border">
      {stages.map((s) => {
        const cell = row.get(s)!;
        return (
          <li key={s} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:gap-4">
            <span className="font-display font-semibold sm:w-44 sm:shrink-0">{supplyChainStageLabels[s]}</span>
            <span className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
              {cell.capitalIds.length ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-[#CBA86A]" />
                  <span className="text-muted">{cell.capitalIds.length} capital row{cell.capitalIds.length === 1 ? "" : "s"} from</span>
                  {cell.capitalActors.map((a) => <JurisdictionTag key={a} code={a} />)}
                </span>
              ) : (
                <span className="text-faint">No government capital row coded here</span>
              )}
              {cell.designationIds.length ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span aria-hidden className="h-2 w-2 rotate-45 border border-[#4fb59e]" />
                  <span className="text-muted">{cell.designationIds.length} project designation{cell.designationIds.length === 1 ? "" : "s"} from</span>
                  {cell.designationActors.map((a) => <JurisdictionTag key={a} code={a} />)}
                </span>
              ) : null}
              {cell.controlIds.length ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span aria-hidden className="h-2 w-2 rounded-[1px] bg-[#C77B7B]" />
                  <span className="text-muted">
                    {cell.controlIds.length} control clause{cell.controlIds.length === 1 ? "" : "s"} ({statusLine(cell)}) from
                  </span>
                  {(Object.keys(cell.controlsByIssuer) as JurisdictionCode[]).map((a) => <JurisdictionTag key={a} code={a} />)}
                </span>
              ) : (
                <span className="text-faint">No control clause covers items here</span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
