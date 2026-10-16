"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JurisdictionTag } from "@/components/labels";
import { ALL, FilterSelect, SearchBox, useUrlFilters } from "@/components/capital/filter-controls";
import { filterProjectDirectory, PROJECT_RELATIONSHIP_FILTERS, UNSTATED,
  type ProjectDirectoryRow } from "@/lib/project-directory";
import { jurisdictionLabels, supplyChainStageLabels } from "@/lib/labels";
import type { SupplyChainStage } from "@/lib/types";

const relationshipLabels = {
  direct: "At least one direct finance row",
  shared: "Shared, unallocated finance association",
  designation: "Project designation recorded",
  no_finance_link: "No financing link recorded",
};
const countryNames: Record<string,string> = {
  AU:"Australia", BE:"Belgium", CA:"Canada", DE:"Germany", EE:"Estonia",
  ES:"Spain", FI:"Finland", FR:"France", GB:"United Kingdom", GL:"Greenland",
  GR:"Greece", IT:"Italy", JP:"Japan", KZ:"Kazakhstan", MG:"Madagascar",
  MW:"Malawi", NA:"Namibia", NO:"Norway", PL:"Poland", RO:"Romania",
  SE:"Sweden", UA:"Ukraine", US:"United States", ZA:"South Africa",
};
const lex = (a: string,b: string) => a < b ? -1 : a > b ? 1 : 0;

export function ProjectsExplorer({rows, materialNames}:{
  rows: ProjectDirectoryRow[];
  materialNames: Record<string,string>;
}) {
  const [q,setQ]=useState("");
  const [material,setMaterial]=useState(ALL);
  const [stage,setStage]=useState(ALL);
  const [country,setCountry]=useState(ALL);
  const [government,setGovernment]=useState(ALL);
  const [relationship,setRelationship]=useState(ALL);
  const options=useMemo(()=>{
    const count=(predicate:(r:ProjectDirectoryRow)=>boolean)=>rows.filter(predicate).length;
    return {
      material: [
        ...Object.keys(materialNames).filter(id=>rows.some(r=>r.materialIds.includes(id)))
          .map(id=>({value:id,label:materialNames[id],count:count(r=>r.materialIds.includes(id))}))
          .sort((a,b)=>lex(a.label,b.label)),
        ...(rows.some(r=>!r.materialIds.length)?[{value:UNSTATED,label:"Material not stated",count:count(r=>!r.materialIds.length)}]:[]),
      ],
      stage: [
        ...Object.entries(supplyChainStageLabels).filter(([id])=>rows.some(r=>r.stages.includes(id as SupplyChainStage)))
          .map(([id,label])=>({value:id,label,count:count(r=>r.stages.includes(id as SupplyChainStage))})),
        ...(rows.some(r=>!r.stages.length)?[{value:UNSTATED,label:"Stage not stated",count:count(r=>!r.stages.length)}]:[]),
      ],
      country: [
        ...[...new Set(rows.flatMap(r=>r.countryCodes))].sort(lex)
          .map(code=>({value:code,label:countryNames[code] ?? code,count:count(r=>r.countryCodes.includes(code))})),
        ...(rows.some(r=>!r.countryCodes.length)?[{value:UNSTATED,label:"Country not stated",count:count(r=>!r.countryCodes.length)}]:[]),
      ],
      government: [
        {value:"yes",label:"Direct government commitment evidenced",count:count(r=>r.governmentCommitmentEvidenced)},
        {value:"no",label:"No qualifying commitment recorded",count:count(r=>!r.governmentCommitmentEvidenced)},
      ],
      relationship: PROJECT_RELATIONSHIP_FILTERS.map(id=>({
        value:id,label:relationshipLabels[id],count:count(r=>
          id==="direct"?r.directFinanceIds.length>0:
          id==="shared"?r.sharedUnallocatedFinanceIds.length>0:
          id==="designation"?r.designationIds.length>0:
          !r.directFinanceIds.length && !r.sharedUnallocatedFinanceIds.length),
      })),
    };
  },[rows,materialNames]);
  useUrlFilters({q,material,stage,country,government,relationship}, incoming=>{
    const valid=(key:keyof typeof options,value:string|undefined)=>
      value && options[key].some(o=>o.value===value)?value:ALL;
    setQ((incoming.q??"").slice(0,256));
    setMaterial(valid("material",incoming.material));
    setStage(valid("stage",incoming.stage));
    setCountry(valid("country",incoming.country));
    setGovernment(valid("government",incoming.government));
    setRelationship(valid("relationship",incoming.relationship));
  });
  const visible=useMemo(()=>filterProjectDirectory(rows,{
    q,material,stage,country,government,relationship,
  },materialNames),[rows,q,material,stage,country,government,relationship,materialNames]);
  const active=!!q.trim()||[material,stage,country,government,relationship].some(x=>x!==ALL);
  const reset=()=>{
    setQ("");setMaterial(ALL);setStage(ALL);setCountry(ALL);
    setGovernment(ALL);setRelationship(ALL);
  };
  return <div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className="sm:col-span-2 lg:col-span-2">
        <SearchBox id="projects-search" value={q} onChange={setQ} placeholder="Project, sponsor, material or location…" />
      </div>
      <FilterSelect id="projects-material" label="Material" value={material} onChange={setMaterial} options={options.material}/>
      <FilterSelect id="projects-stage" label="Supply-chain stage" value={stage} onChange={setStage} options={options.stage}/>
      <FilterSelect id="projects-country" label="Project country" value={country} onChange={setCountry} options={options.country}/>
      <FilterSelect id="projects-government" label="Government commitment as of corpus date" value={government} onChange={setGovernment} options={options.government}/>
      <FilterSelect id="projects-relationship" label="Evidence relationship" value={relationship} onChange={setRelationship} options={options.relationship}/>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <p className="font-mono text-xs text-muted" role="status" aria-live="polite">
        <span data-testid="project-result-count" className="tnum text-foreground">{visible.length}</span> of {rows.length} registered projects
      </p>
      {active?<button type="button" onClick={reset} className="font-mono text-xs text-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Clear filters</button>:null}
    </div>
    <p className="mt-2 max-w-4xl text-xs leading-5 text-faint">
      One result is one registered project. Direct financing, shared unallocated associations and designations are
      separate evidence relationships, not additive capital or proof of construction. Missing records do not prove inactivity.
      Government commitment means a directly linked, non-ended commitment evidenced as of the corpus date.
    </p>
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {visible.map(p=><Card key={p.id} data-testid="project-record" className="flex min-w-0 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          {p.governmentCommitmentProviders.map(code=><JurisdictionTag key={code} code={code}/>)}
          {p.countryCodes.length?p.countryCodes.map(code=><span key={code} className="font-mono text-[11px] text-muted">{countryNames[code]??code}</span>):
            <span className="font-mono text-[11px] text-faint">Country not stated</span>}
        </div>
        <Link href={`/projects/${p.id}`} className="mt-3 font-display text-lg font-semibold leading-snug hover:text-accent focus-visible:outline-2 focus-visible:outline-accent">{p.name}</Link>
        <div className="mt-2 text-sm text-muted">
          {p.sponsors.length?p.sponsors.map((s,i)=><span key={s.id}>
            {i>0?", ":""}<Link href={`/organizations/${s.id}`} className="hover:text-accent">{s.name}</Link>
          </span>):"Sponsor not stated"}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
          {p.stages.length?p.stages.map(s=><Badge key={s}>{supplyChainStageLabels[s]}</Badge>):
            <span className="font-mono text-[11px] text-faint">Stage not stated</span>}
          {p.materialIds.length?p.materialIds.map(id=><span key={id} className="font-mono text-[11px] text-muted">{materialNames[id]??id}</span>):
            <span className="font-mono text-[11px] text-faint">Material not stated</span>}
          {p.untrackedMaterialsAsStated.map((s,i)=><span key={i} className="font-mono text-[11px] text-faint">{s}</span>)}
        </div>
        <p className="mt-auto pt-4 font-mono text-[11px] leading-5 text-faint">
          {p.directFinanceIds.length} directly linked financial row{p.directFinanceIds.length===1?"":"s"}
          {p.sharedUnallocatedFinanceIds.length?` · ${p.sharedUnallocatedFinanceIds.length} shared/unallocated`:""}
          {p.designationIds.length?` · ${p.designationIds.length} designation${p.designationIds.length===1?"":"s"}`:""}
        </p>
      </Card>)}
    </div>
    {!visible.length?<Card className="mt-5 p-8 text-center text-sm text-muted">
      No registered project matches these filters. Try another material, country or evidence relationship.
      <button type="button" onClick={reset} className="ml-2 text-accent hover:underline">Show all projects</button>
    </Card>:null}
  </div>;
}
