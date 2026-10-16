"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {Badge} from "@/components/ui/badge";
import {Card} from "@/components/ui/card";
import {ALL,FilterSelect,SearchBox,useUrlFilters} from "@/components/capital/filter-controls";
import {filterProgrammeDirectory,PROGRAMME_EVIDENCE_FILTERS,type ProgrammeDirectoryRow} from "@/lib/programme-directory";
import {jurisdictionLabels,programmeKindLabels} from "@/lib/labels";
import {JURISDICTIONS,PROGRAMME_KINDS} from "@/lib/types";

const evidenceLabels={
 ceiling:"Stated ceiling/envelope",
 public_commitment:"Public-commitment row recorded",
 designation:"Project designation recorded",
 other:"Other financing record",
 none:"No financing or designation recorded",
};
const lex=(a:string,b:string)=>a<b?-1:a>b?1:0;
export function ProgrammesExplorer({rows}:{rows:ProgrammeDirectoryRow[]}){
 const [q,setQ]=useState("");
 const [actor,setActor]=useState(ALL);
 const [kind,setKind]=useState(ALL);
 const [evidence,setEvidence]=useState(ALL);
 const [administrator,setAdministrator]=useState(ALL);
 const options=useMemo(()=>{
  const count=(p:(r:ProgrammeDirectoryRow)=>boolean)=>rows.filter(p).length;
  return {
   actor:JURISDICTIONS.filter(a=>rows.some(r=>r.actor===a))
    .map(a=>({value:a,label:jurisdictionLabels[a],count:count(r=>r.actor===a)})),
   kind:PROGRAMME_KINDS.filter(k=>rows.some(r=>r.kind===k))
    .map(k=>({value:k,label:programmeKindLabels[k],count:count(r=>r.kind===k)})),
   evidence:PROGRAMME_EVIDENCE_FILTERS.map(k=>({value:k,label:evidenceLabels[k],count:count(r=>
    k==="ceiling"?r.envelopeCount>0:
    k==="public_commitment"?r.publicCommitmentCount>0:
    k==="designation"?r.designationCount>0:
    k==="other"?r.otherFinanceCount>0:
    !r.envelopeCount&&!r.publicCommitmentCount&&!r.otherFinanceCount&&!r.designationCount)})),
   administrator:[
    {value:"named",label:"Administrator named",count:count(r=>r.hasNamedAdministrator)},
    {value:"unstated",label:"Administrator not stated",count:count(r=>!r.hasNamedAdministrator)},
   ],
  };
 },[rows]);
 useUrlFilters({q,actor,kind,evidence,administrator},incoming=>{
  const valid=(key:keyof typeof options,v:string|undefined)=>v&&options[key].some(o=>o.value===v)?v:ALL;
  setQ((incoming.q??"").slice(0,256));
  setActor(valid("actor",incoming.actor));
  setKind(valid("kind",incoming.kind));
  setEvidence(valid("evidence",incoming.evidence));
  setAdministrator(valid("administrator",incoming.administrator));
 });
 const visible=useMemo(()=>filterProgrammeDirectory(rows,{q,actor,kind,evidence,administrator}),
  [rows,q,actor,kind,evidence,administrator]);
 const active=!!q.trim()||[actor,kind,evidence,administrator].some(x=>x!==ALL);
 const clear=()=>{setQ("");setActor(ALL);setKind(ALL);setEvidence(ALL);setAdministrator(ALL)};
 const grouped=useMemo(()=>JURISDICTIONS.flatMap(a=>{
  const list=visible.filter(p=>p.actor===a).sort((x,y)=>lex(x.name,y.name));
  return list.length?[{actor:a,list}]:[];
 }),[visible]);
 return <div>
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
   <div className="sm:col-span-2 lg:col-span-2">
    <SearchBox id="programmes-query" value={q} onChange={setQ} placeholder="Programme, legal authority, administrator or identifier…"/>
   </div>
   <FilterSelect id="programmes-actor" label="Government" value={actor} onChange={setActor} options={options.actor}/>
   <FilterSelect id="programmes-kind" label="Programme type" value={kind} onChange={setKind} options={options.kind}/>
   <FilterSelect id="programmes-evidence" label="Recorded relationship" value={evidence} onChange={setEvidence} options={options.evidence}/>
   <FilterSelect id="programmes-administrator" label="Administration evidence" value={administrator} onChange={setAdministrator} options={options.administrator}/>
  </div>
  <div className="mt-4 flex flex-wrap items-center gap-3">
   <p role="status" aria-live="polite" className="font-mono text-xs text-muted">
    <span data-testid="programme-result-count" className="tnum text-foreground">{visible.length}</span> of {rows.length} registered programmes
   </p>
   {active?<button type="button" onClick={clear} className="font-mono text-xs text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Clear filters</button>:null}
  </div>
  <p className="mt-2 max-w-4xl text-xs leading-5 text-faint">
   One result is one registered scheme, not one award or a complete government budget.
   Parent programmes include recorded rows from their child schemes; those inherited rows must not be added again across results.
   Ceilings are stated authorities, not paid capital, and are never divided into recorded public-commitment rows.
   Designations confer recognition, not money. Empty counts mean no row registered here, not no activity outside SMPT.
  </p>
  <div className="mt-9 space-y-10">
   {grouped.map((group,i)=><section key={group.actor} aria-labelledby={"programme-actor-"+group.actor}>
    <div className="mb-4 flex items-baseline gap-3 border-b border-border pb-3">
     <span className="font-mono text-xs text-faint">{String(i+1).padStart(2,"0")}</span>
     <h2 id={"programme-actor-"+group.actor} className="font-display text-xl font-semibold">
      {jurisdictionLabels[group.actor]} <span className="font-mono text-xs font-normal text-muted">({group.list.length})</span>
     </h2>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
     {group.list.map(p=><div key={p.id} data-testid="programme-record" className="min-w-0">
      <Card className="flex h-full min-w-0 flex-col p-5">
       <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <Link href={"/programmes/"+p.id} className="min-w-0 flex-1 font-display text-lg font-semibold leading-snug hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{p.name}</Link>
        <Badge>{programmeKindLabels[p.kind]}</Badge>
       </div>
       {p.nameOriginal?<p lang="und" className="mt-1 text-sm text-muted">{p.nameOriginal}</p>:null}
       {p.parentName?<p className="mt-2 text-xs text-muted">Part of <Link href={"/programmes/"+p.parentId} className="text-accent hover:underline">{p.parentName}</Link></p>:null}
       <p className="mt-2 text-xs leading-5 text-muted">
        {p.administers.length?"Administered by "+p.administers.join(", "):"Administrator not named in registered sources"}
       </p>
       <div className="mt-3 space-y-1 font-mono text-[11px] leading-5 text-faint">
        {p.envelopeLabels.length?<p>Stated ceilings: {p.envelopeLabels.join(" · ")}</p>:<p>No ceiling row recorded</p>}
        <p>
         {p.publicCommitmentCount} public-commitment row{p.publicCommitmentCount===1?"":"s"}
         {" · "}{p.otherFinanceCount} other financing row{p.otherFinanceCount===1?"":"s"}
         {" · "}{p.designationCount} designation{p.designationCount===1?"":"s"}
        </p>
        {p.includesDescendants?<p>Counts include registered child-programme rows</p>:null}
       </div>
      </Card>
     </div>)}
    </div>
   </section>)}
  </div>
  {!visible.length?<Card className="mt-8 p-8 text-center text-sm text-muted">
   No registered programme matches these filters.
   <button type="button" onClick={clear} className="ml-2 text-accent hover:underline">Show all programmes</button>
  </Card>:null}
 </div>;
}
