"use client";

import {useMemo,useState} from "react";
import Link from "next/link";
import {Card} from "@/components/ui/card";
import {JurisdictionTag} from "@/components/labels";
import {ALL,FilterSelect,SearchBox,useUrlFilters} from "@/components/capital/filter-controls";
import {ORGANIZATION_ROLES,NO_GOVERNMENT,UNSTATED_COUNTRY,filterOrganizationDirectory,
 type OrganizationDirectoryRow} from "@/lib/organization-directory";
import {organizationKindLabels,jurisdictionLabels} from "@/lib/labels";
import {JURISDICTIONS,ORGANIZATION_KINDS} from "@/lib/types";

const roleLabels={
 provider:"Named provider on a financial row",
 recipient:"Named recipient on a financial row",
 sponsor:"Recorded project sponsor",
 administrator:"Programme administrator",
 designation_holder:"Project designation holder",
 unlinked:"No listed finance/project/programme/designation role",
};
const countries:Record<string,string>={
 AU:"Australia",BE:"Belgium",CA:"Canada",DE:"Germany",EE:"Estonia",
 ES:"Spain",FI:"Finland",FR:"France",GB:"United Kingdom",GR:"Greece",
 IN:"India",IT:"Italy",JP:"Japan",LU:"Luxembourg",RO:"Romania",
 SE:"Sweden",UA:"Ukraine",US:"United States",
};
const lex=(a:string,b:string)=>a<b?-1:a>b?1:0;
const nonempty=(n:number,label:string)=>n?String(n)+" "+label+(n===1?"":"s"):"";

export function OrganizationsExplorer({rows}:{rows:OrganizationDirectoryRow[]}){
 const [q,setQ]=useState("");
 const [kind,setKind]=useState(ALL);
 const [country,setCountry]=useState(ALL);
 const [actor,setActor]=useState(ALL);
 const [role,setRole]=useState(ALL);
 const options=useMemo(()=>{
   const count=(p:(r:OrganizationDirectoryRow)=>boolean)=>rows.filter(p).length;
   return {
     kind:ORGANIZATION_KINDS.filter(k=>rows.some(r=>r.kind===k))
       .map(k=>({value:k,label:organizationKindLabels[k],count:count(r=>r.kind===k)})),
     country:[
       ...[...new Set(rows.flatMap(r=>r.countryCode?[r.countryCode]:[]))].sort(lex)
         .map(cc=>({value:cc,label:countries[cc]??cc,count:count(r=>r.countryCode===cc)})),
       ...(rows.some(r=>r.countryCode===null)?[{
         value:UNSTATED_COUNTRY,label:"No country code assigned",count:count(r=>r.countryCode===null)}]:[]),
     ],
     actor:[
       ...JURISDICTIONS.filter(a=>rows.some(r=>r.actor===a))
         .map(a=>({value:a,label:jurisdictionLabels[a],count:count(r=>r.actor===a)})),
       {value:NO_GOVERNMENT,label:"No tracked government affiliation",count:count(r=>r.actor===null)},
     ],
     role:ORGANIZATION_ROLES.map(id=>({value:id,label:roleLabels[id],
       count:count(r=>id==="unlinked"?r.roles.length===0:r.roles.includes(id))})),
   };
 },[rows]);
 useUrlFilters({q,kind,country,actor,role},incoming=>{
   const validated=(key:keyof typeof options,value:string|undefined)=>
     value&&options[key].some(o=>o.value===value)?value:ALL;
   setQ((incoming.q??"").slice(0,256));
   setKind(validated("kind",incoming.kind));
   setCountry(validated("country",incoming.country));
   setActor(validated("actor",incoming.actor));
   setRole(validated("role",incoming.role));
 });
 const visible=useMemo(()=>filterOrganizationDirectory(rows,{q,kind,country,actor,role}),
   [rows,q,kind,country,actor,role]);
 const active=!!q.trim()||[kind,country,actor,role].some(x=>x!==ALL);
 const clear=()=>{setQ("");setKind(ALL);setCountry(ALL);setActor(ALL);setRole(ALL)};
 return <div>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
     <div className="sm:col-span-2 lg:col-span-2">
       <SearchBox id="organizations-query" value={q} onChange={setQ}
         placeholder="Organization, alias, original name, location or ID…"/>
     </div>
     <FilterSelect id="organizations-kind" label="Organization type" value={kind} onChange={setKind} options={options.kind}/>
     <FilterSelect id="organizations-country" label="Country of organization" value={country} onChange={setCountry} options={options.country}/>
     <FilterSelect id="organizations-actor" label="Tracked government affiliation" value={actor} onChange={setActor} options={options.actor}/>
     <FilterSelect id="organizations-role" label="Recorded relationship" value={role} onChange={setRole} options={options.role}/>
   </div>
   <div className="mt-4 flex flex-wrap items-center gap-3">
     <p className="font-mono text-xs text-muted" role="status" aria-live="polite">
       <span data-testid="organization-result-count" className="tnum text-foreground">{visible.length}</span> of {rows.length} registered organizations
     </p>
     {active?<button type="button" onClick={clear}
       className="font-mono text-xs text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
       Clear filters</button>:null}
   </div>
   <p className="mt-2 max-w-4xl text-xs leading-5 text-faint">
     Relationships denote explicit registry links, not verified cash disbursements or operational outcomes.
     Provider/recipient links may be nonbinding, ended or non-government; individual instrument statuses determine what money counts.
     Government affiliation belongs only to bodies recorded as such; joint vehicles remain separate.
     Country code not assigned may include supranational organizations.
   </p>
   <div className="mt-9 space-y-10">
     {ORGANIZATION_KINDS.map((category,index)=>{
       const section=visible.filter(o=>o.kind===category);
       if(!section.length)return null;
       return <section key={category} aria-labelledby={"organization-kind-"+category}>
         <div className="mb-4 flex items-baseline gap-3 border-b border-border pb-3">
           <span className="font-mono text-xs text-faint">{String(index+1).padStart(2,"0")}</span>
           <h2 id={"organization-kind-"+category} className="font-display text-xl font-semibold">
             {organizationKindLabels[category]} <span className="font-mono text-xs font-normal text-muted">({section.length})</span>
           </h2>
         </div>
         <Card className="overflow-hidden">
           {section.map(o=><div data-testid="organization-record" key={o.id}
             className="border-b border-border px-4 py-4 last:border-b-0 sm:px-5">
             <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
               <span className="min-w-0 flex-1">
                 <Link href={"/organizations/"+o.id}
                   className="font-display font-semibold leading-6 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                   {o.name}
                 </Link>
                 {o.nameOriginal?<span lang="und" className="ml-2 text-sm text-muted [overflow-wrap:anywhere]">{o.nameOriginal}</span>:null}
                 {o.aliases.length?<span className="mt-1 block text-xs leading-5 text-faint">Also: {o.aliases.join(" · ")}</span>:null}
               </span>
               <span className="flex shrink-0 items-center gap-2">
                 {o.actor?<JurisdictionTag code={o.actor}/>:null}
                 <span className="font-mono text-xs text-muted">{o.countryCode??"Country —"}</span>
               </span>
             </div>
             <p className="mt-2 font-mono text-[11px] leading-5 text-faint">
               {[
                 nonempty(o.providedRows,"provider record"),
                 nonempty(o.receivedRows,"recipient record"),
                 nonempty(o.sponsoredProjects,"sponsored project"),
                 nonempty(o.administeredProgrammes,"administered programme"),
                 nonempty(o.heldDesignations,"designation held"),
               ].filter(Boolean).join(" · ") || "No finance/project/programme/designation role recorded"}
               {o.endedRows?" · "+o.endedRows+" ended financial record"+(o.endedRows===1?"":"s"):""}
               {o.rolledUpOfficeIds.length?" · provider rows include "+o.rolledUpOfficeIds.length+" part-of office"+(o.rolledUpOfficeIds.length===1?"":"s"):""}
             </p>
           </div>)}
         </Card>
       </section>;
     })}
   </div>
   {!visible.length?<Card className="mt-9 p-8 text-center text-sm text-muted">
     No registered organization matches these filters.
     <button type="button" onClick={clear} className="ml-2 text-accent hover:underline">Show all organizations</button>
   </Card>:null}
 </div>;
}
