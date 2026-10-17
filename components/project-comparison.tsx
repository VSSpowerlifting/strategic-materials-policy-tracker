"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ALL, selectClass, useUrlFilters } from "@/components/capital/filter-controls";
import { jurisdictionLabels, supplyChainStageLabels } from "@/lib/labels";
import type { JurisdictionCode, SupplyChainStage } from "@/lib/types";
import type { ProjectComparisonRow } from "@/lib/project-comparison";

type Props = { rows: ProjectComparisonRow[]; materialNames: Record<string,string>; revision: string };

function EvidenceLinks({ids, kind}: {ids: readonly string[]; kind: "capital" | "source"}) {
  if (!ids.length) return <span className="text-muted">No linked records in this category.</span>;
  return <ul className="space-y-1.5">
    {ids.map(id => <li key={id} className="min-w-0 break-words">
      <Link href={`/${kind}/${id}`} className="font-mono text-xs text-accent hover:underline">{id}</Link>
    </li>)}
  </ul>;
}

function ComparisonCard({row,materialNames,revision}:{
  row:ProjectComparisonRow;materialNames:Record<string,string>;revision:string;
}) {
  const text = (values: readonly string[], fallback = "Not stated in the project record") =>
    values.length ? values.join(", ") : fallback;
  return <Card className="min-w-0 p-5 sm:p-6" >
    <h2 className="break-words font-display text-xl font-semibold tracking-tight">{row.name}</h2>
    <p className="mt-2 break-all font-mono text-xs text-faint">{row.id}</p>
    <Link href={`/projects/${row.id}`} className="mt-3 inline-flex min-h-11 items-center font-display text-sm text-accent hover:underline">
      Inspect the full project record and its evidence →
    </Link>
    <dl className="mt-3 space-y-5 text-sm leading-6">
      <div><dt className="font-display font-semibold text-foreground">Recorded location</dt>
        <dd className="mt-1 text-muted">{text(row.locations.map(l => l.asStated || l.subnational || l.countryCode || "").filter(Boolean))}</dd></div>
      <div><dt className="font-display font-semibold text-foreground">Registered sponsors</dt>
        <dd className="mt-1 text-muted">{row.sponsors.length ? row.sponsors.map((s,i) =>
          <span key={s.id}>{i ? ", " : ""}<Link href={`/organizations/${s.id}`} className="text-accent hover:underline">{s.name}</Link></span>)
          : "Not stated in the registry"}</dd></div>
      <div><dt className="font-display font-semibold text-foreground">Tracked materials</dt>
        <dd className="mt-1 text-muted">{text([
          ...row.materialIds.map(id => materialNames[id] ?? id), ...row.untrackedMaterialsAsStated,
        ])}</dd></div>
      <div><dt className="font-display font-semibold text-foreground">Recorded stages</dt>
        <dd className="mt-1 text-muted">{text(row.stages.map(s => supplyChainStageLabels[s as SupplyChainStage] ?? s))}</dd></div>
      <div className="border-t border-border pt-4"><dt className="font-display font-semibold text-foreground">Directly linked financial instruments</dt>
        <dd className="mt-1 text-muted">{row.directFinanceIds.length} instrument {row.directFinanceIds.length === 1 ? "record" : "records"}; different value roles and statuses, not an amount or a payment total.</dd>
        <dd className="mt-2"><EvidenceLinks ids={row.directFinanceIds} kind="capital"/></dd></div>
      <div><dt className="font-display font-semibold text-foreground">Shared or unallocated associations</dt>
        <dd className="mt-1 text-muted">{row.sharedUnallocatedFinanceIds.length} linked financial {row.sharedUnallocatedFinanceIds.length === 1 ? "record" : "records"}; none allocates a project-specific share.</dd>
        <dd className="mt-2"><EvidenceLinks ids={row.sharedUnallocatedFinanceIds} kind="capital"/></dd></div>
      <div><dt className="font-display font-semibold text-foreground">Government commitment evidenced by {revision}</dt>
        <dd className="mt-1 text-muted">{row.governmentCommitmentEvidenced
          ? `A directly linked, non-ended government commitment is recorded (provider: ${row.governmentCommitmentProviders.map(id => jurisdictionLabels[id as JurisdictionCode] ?? id).join(", ")}). This does not establish disbursement.`
          : "No qualifying direct government commitment is recorded in the curated corpus. This does not establish that no support exists."}</dd></div>
      <div><dt className="font-display font-semibold text-foreground">Project designations</dt>
        <dd className="mt-1 text-muted">{row.designationIds.length
          ? `${row.designationIds.length} source-linked designation ${row.designationIds.length === 1 ? "record" : "records"} — standing or priority, not money.`
          : "No designation in the published registry."}</dd>
        {row.designationIds.length ? <dd className="mt-2 space-y-1 text-xs text-faint">
          {row.designationIds.map(id => <span key={id} className="block break-all font-mono">{id}</span>)}
          <Link href={`/projects/${row.id}`} className="block text-accent hover:underline">Review their source-backed details on the project page</Link>
        </dd> : null}</div>
      <div className="border-t border-border pt-4"><dt className="font-display font-semibold text-foreground">Independently reviewed, published physical milestones</dt>
        <dd className="mt-1 text-muted">{row.publishedMilestones.length
          ? `${row.publishedMilestones.length} reviewed project-native milestone ${row.publishedMilestones.length === 1 ? "entry" : "entries"}. These are reported source claims, not verified policy effects.`
          : "No project-native physical milestone has been published after editorial review. This is not evidence of inactivity."}</dd>
        {row.publishedMilestones.length ? <dd className="mt-2 space-y-2">
          {row.publishedMilestones.map(m => <div key={m.id} className="rounded border border-border p-3 text-xs text-muted">
            <span className="font-semibold text-foreground">{m.kind.replaceAll("_"," ")}</span>
            <span className="block">Claim mode: {m.claimMode.replaceAll("_"," ")} · Scope: {m.scopeAsStated || m.scope.replaceAll("_"," ")}</span>
            <span className="block">Occurred: {m.occurredOn ?? "date not established"} · Target: {m.targetOn ?? "none stated"}</span>
            <Link href={`/sources/${m.sourceId}`} className="break-all text-accent hover:underline">Inspect milestone source</Link>
          </div>)}
        </dd> : null}</div>
      <div><dt className="font-display font-semibold text-foreground">Original sources for project registry facts</dt>
        <dd className="mt-1 text-muted">{row.projectSources.length} distinct registered {row.projectSources.length === 1 ? "source" : "sources"}; a count is not a corroboration score. Finance and designation records have additional citations on their own pages.</dd>
        <dd className="mt-2"><ul className="space-y-2">{row.projectSources.map(s =>
          <li key={s.id} className="min-w-0">
            <Link href={`/sources/${s.id}`} className="break-words text-accent hover:underline">{s.publisher} · {s.title}</Link>
          </li>)}</ul></dd></div>
    </dl>
  </Card>;
}

export function ProjectComparison({rows,materialNames,revision}: Props) {
  const [left,setLeft] = useState(ALL);
  const [right,setRight] = useState(ALL);
  useUrlFilters({left,right}, incoming => {
    const valid = (id: string | undefined) => id && rows.some(r => r.id === id) ? id : ALL;
    setLeft(valid(incoming.left));
    setRight(valid(incoming.right));
  });
  const a = rows.find(r => r.id === left);
  const b = rows.find(r => r.id === right);
  const sharedMaterials = a && b && a.id !== b.id ? a.materialIds.filter(id => b.materialIds.includes(id)) : [];
  const sharedStages = a && b && a.id !== b.id ? a.stages.filter(id => b.stages.includes(id)) : [];
  return <div>
    <Card className="p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {([{id:"left",label:"First project",value:left,onChange:setLeft},
          {id:"right",label:"Second project",value:right,onChange:setRight}] as const).map(control=>
          <label htmlFor={control.id} key={control.id} className="min-w-0">
            <span className="mb-1.5 block font-display text-sm font-semibold">{control.label}</span>
            <select id={control.id} data-testid={`compare-${control.id}`} value={control.value}
              onChange={e=>control.onChange(e.target.value)} className={selectClass}>
              <option value={ALL}>Choose a registered project</option>
              {rows.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>)}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button type="button" onClick={()=>{setLeft(right);setRight(left);}}
          disabled={!a && !b} className="inline-flex min-h-11 items-center text-sm text-accent hover:underline disabled:cursor-not-allowed disabled:text-faint">Swap projects</button>
        <button type="button" onClick={()=>{setLeft(ALL);setRight(ALL);}}
          disabled={!a && !b} className="inline-flex min-h-11 items-center text-sm text-accent hover:underline disabled:cursor-not-allowed disabled:text-faint">Clear comparison</button>
      </div>
      <p className="mt-3 text-xs leading-6 text-muted">
        Selections appear in the page URL so a comparison can be shared. There is no ranking:
        record counts reflect what SMPT has documented as of {revision}, not investment,
        construction completion, economic impact or causal effectiveness.
      </p>
    </Card>
    {!a || !b ? <p role="status" className="mt-6 text-sm text-muted">Choose two projects to compare their published evidence. No private review findings are shown.</p> :
      a.id === b.id ? <p role="status" className="mt-6 text-sm text-muted">Choose two different projects to make a comparison.</p> :
      <div data-testid="project-comparison-results">
        <div className="mt-6 rounded-lg border border-border bg-card p-4">
          <h2 className="font-display text-base font-semibold">Recorded characteristics in common</h2>
          <p className="mt-2 text-sm text-muted">
            Tracked materials: {sharedMaterials.length ? sharedMaterials.map(id => materialNames[id] ?? id).join(", ") : "none listed in both records"}.
            {" "}Stages: {sharedStages.length ? sharedStages.map(id => supplyChainStageLabels[id as SupplyChainStage] ?? id).join(", ") : "none listed in both records"}.
          </p>
          <p className="mt-2 text-xs leading-5 text-faint">Shared categories do not establish a supply agreement, ownership link or policy effect between the projects.</p>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <ComparisonCard row={a} materialNames={materialNames} revision={revision}/>
          <ComparisonCard row={b} materialNames={materialNames} revision={revision}/>
        </div>
      </div>}
  </div>;
}
