/**
 * Public-only, server-rendered source trail. Navigational links represent
 * recorded relationships; layout deliberately avoids suggesting cash flow.
 */
import Link from "next/link";
import {Card} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {
 financialInstrumentLabels,financialStatusLabels,valueRoleLabels,
} from "@/lib/labels";
import type {
 ProgrammeTrail,TrailEntity,TrailSource,
} from "@/lib/programme-research-trail";

function LinkedEntities({items,empty}:{items:TrailEntity[];empty:string}){
 if(!items.length)return <span className="text-faint">{empty}</span>;
 return <span>{items.map((item,i)=><span key={item.id}>
  {i>0?", ":""}<Link href={item.href} className="text-accent hover:underline">{item.name}</Link>
 </span>)}</span>;
}
function SourceLinks({sources}:{sources:TrailSource[]}){
 if(!sources.length)return <p className="text-xs text-faint">No direct original-source reference indexed.</p>;
 return <details className="mt-3 rounded-md border border-border px-3 py-2">
  <summary className="cursor-pointer font-mono text-xs text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
   {sources.length} directly citing document{sources.length===1?"":"s"} · show precise citation roles
  </summary>
  <ol className="mt-3 space-y-3">
   {sources.map(s=><li key={s.id} className="text-xs leading-5">
    <Link href={"/sources/"+s.id} className="font-medium text-accent hover:underline">{s.title}</Link>
    <span className="mt-1 block text-faint">{s.publisher} · {s.datePublished??"Publication date not stated"}</span>
    <span className="mt-1 block font-mono text-[11px] text-muted">
     {s.roles.join(" · ")}
    </span>
   </li>)}
  </ol>
 </details>;
}
export function ProgrammeResearchTrail({trail}:{trail:ProgrammeTrail}){
 return <div id="research-pathway" data-testid="programme-research-pathway" className="scroll-mt-24 space-y-6">
  <div>
   <h2 className="font-display text-2xl font-semibold">Trace the evidence</h2>
   <p className="mt-2 max-w-4xl text-sm leading-6 text-muted">
    Follow this scheme to each independently recorded financial or designation row, named bodies,
    project references, and the documents cited by that exact row. Connections are navigational
    registry references, not a claim that capital was disbursed, a company obtained funding,
    or physical work occurred. Records under a child scheme appear in parent views as the
    same underlying IDs, never as additional commitments.
   </p>
  </div>
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
   {[
    {label:"Financial rows",value:trail.finance.length},
    {label:"Designations",value:trail.designations.length},
    {label:"Distinct linked projects",value:trail.distinctProjectIds.length},
    {label:"Distinct citing sources",value:trail.distinctSourceIds.length},
   ].map(item=><Card key={item.label} className="min-w-0 p-3">
    <p className="font-display text-2xl font-semibold tabular-nums">{item.value}</p>
    <p className="mt-1 font-mono text-[11px] leading-4 text-muted">{item.label}</p>
   </Card>)}
  </div>
  <Card className="p-4">
   <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">Programme identity</p>
   <p className="mt-2 text-sm text-muted">
    Source-named administrator: <LinkedEntities items={trail.administrators} empty="Not named in registered source records"/>
   </p>
   <div className="mt-2"><SourceLinks sources={trail.programmeSources}/></div>
  </Card>
  <div>
   <h3 className="font-display text-xl font-semibold">Financial record pathways</h3>
   <p className="mt-1 text-xs leading-5 text-muted">
    All value roles are included, including ceilings, prospective commitments, options, and ended records.
    No numbers are added here; legal standing belongs to each underlying instrument.
   </p>
   {trail.finance.length?<ol className="mt-3 space-y-3">
    {trail.finance.map(row=><li key={row.id} data-testid="programme-finance-path" className="min-w-0">
     <Card className="min-w-0 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
       <Link href={row.link} className="min-w-0 font-display font-semibold leading-6 text-accent hover:underline">
        {row.title}
       </Link>
       <Badge>{valueRoleLabels[row.valueRole]}</Badge>
      </div>
      <p className="mt-1 text-xs text-muted">
       {financialInstrumentLabels[row.instrument]} · Reported financial standing: {financialStatusLabels[row.financialStatus]}
      </p>
      <p className="mt-1 text-sm text-foreground">{row.amountAsStated??"Amount not stated"}</p>
      {row.inheritedFromChild?<p className="mt-2 text-xs text-muted">
       Recorded under child programme: <Link href={row.programme.href} className="text-accent hover:underline">{row.programme.name}</Link>
       {" "}· identical record, not additional funding
      </p>:null}
      <dl className="mt-3 grid gap-x-4 gap-y-2 text-xs leading-5 sm:grid-cols-2">
       <div>
        <dt className="font-mono text-[11px] text-faint">Named provider organizations</dt>
        <dd><LinkedEntities items={row.providers} empty={row.providerAsStated??"Not stated"}/></dd>
       </div>
       <div>
        <dt className="font-mono text-[11px] text-faint">Named recipient organizations</dt>
        <dd><LinkedEntities items={row.recipients} empty={row.recipientAsStated??"Not stated"}/></dd>
       </div>
      </dl>
      {row.project?<p className="mt-3 text-xs leading-5">
       <strong className="font-medium">Directly linked project:</strong>{" "}
       <Link href={row.project.href} className="text-accent hover:underline">{row.project.name}</Link>
       <span className="text-muted"> (a row reference; assess its value role and status before treating it as backing)</span>
      </p>:null}
      {row.sharedProjects.length?<p className="mt-3 text-xs leading-5">
       <strong className="font-medium">Shared, unallocated project association:</strong>{" "}
       <LinkedEntities items={row.sharedProjects} empty="None"/>
       <span className="text-muted"> · No portion of this row can be assigned to an individual project.</span>
      </p>:null}
      <SourceLinks sources={row.sources}/>
     </Card>
    </li>)}
   </ol>:<p className="mt-3 text-sm text-muted">No financial rows are directly registered under this programme or its descendants.</p>}
  </div>
  <div>
   <h3 className="font-display text-xl font-semibold">Project designation pathways</h3>
   <p className="mt-1 text-xs leading-5 text-muted">
    Designation confers recorded recognition or standing, not money or evidence of actual production.
   </p>
   {trail.designations.length?<ol className="mt-3 grid gap-3">
    {trail.designations.map(d=><li key={d.id} data-testid="programme-designation-path" className="min-w-0">
     <Card className="min-w-0 p-4">
      <p className="font-display font-semibold">
       <Link href={d.project.href} className="text-accent hover:underline">{d.name}</Link>
      </p>
      <p className="mt-1 font-mono text-[11px] text-faint">{d.id}</p>
      <p className="mt-2 text-xs leading-5 text-muted">
       Registered project: <Link href={d.project.href} className="text-accent hover:underline">{d.project.name}</Link>
       {" · "}Named holder: <LinkedEntities items={d.holders} empty="Not recorded" />
      </p>
      {d.programme.id!==trail.id?<p className="mt-2 text-xs leading-5 text-muted">
       Under child scheme: <Link href={d.programme.href} className="text-accent hover:underline">{d.programme.name}</Link>
      </p>:null}
      <SourceLinks sources={d.sources}/>
     </Card>
    </li>)}
   </ol>:<p className="mt-3 text-sm text-muted">No project designations registered under this scheme.</p>}
  </div>
  <p className="text-xs leading-5 text-faint">
   Source links identify explicit citations to the displayed programme, financial row or designation,
   not proof that a source independently validates every claim about its project or recipients.
   For financial allocations, see each instrument&apos;s record and the existing capital-stack counting rules.
  </p>
 </div>;
}
