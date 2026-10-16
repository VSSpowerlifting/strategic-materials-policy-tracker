/**
 * A navigable public record trail for ONE named programme.
 *
 * This is not a causal financing graph, spent-money aggregate or milestone
 * classifier. Scope comes from the existing programmeLedger; citations come
 * ONLY from explicit source-usage references. Parent/child counts overlap.
 */
import { currentFinancialStatus } from "./capital-control";
import { layerOf } from "./capital-intelligence";
import type { ProgrammeLedger } from "./capital-intelligence";
import type { SourceUse } from "./source-usage";
import type {
 FinancialCommitment, FinancialInstrument, FinancialStatus, JurisdictionCode,
 Organization, Programme, Project, ProjectDesignation, Source, ValueRole,
} from "./types";

export type TrailEntity = {id:string; name:string; href:string};
export type TrailSource = {id:string; title:string; publisher:string; datePublished:string|null; roles:string[]};
export type TrailFinance = {
 id:string; title:string; link:string; amountAsStated:string|null;
 valueRole:ValueRole; instrument:FinancialInstrument; financialStatus:FinancialStatus;
 layer:ReturnType<typeof layerOf>;
 programme:TrailEntity; inheritedFromChild:boolean;
 providers:TrailEntity[]; recipients:TrailEntity[];
 providerAsStated:string|null; recipientAsStated:string|null;
 project:TrailEntity|null; sharedProjects:TrailEntity[];
 sources:TrailSource[];
};
export type TrailDesignation = {
 id:string;name:string;programme:TrailEntity;
 project:TrailEntity;holders:TrailEntity[];sources:TrailSource[];
};
export type ProgrammeTrail = {
 id:string;programmeName:string;
 administrators:TrailEntity[];
 programmeSources:TrailSource[];
 finance:TrailFinance[];designations:TrailDesignation[];
 distinctProjectIds:string[];
 distinctSourceIds:string[];
};

type TrailSourceEntry = {source:Source; uses:readonly SourceUse[]};
export type ProgrammeTrailInput = {
 organisations:readonly Organization[];
 projects:readonly Project[];
 programmes:readonly Programme[];
 sourceEntries:readonly TrailSourceEntry[];
};

const compare=(a:string,b:string)=>a<b?-1:a>b?1:0;
function uniqueIds(rows:readonly {id:string}[],label:string){
 const ids=new Set(rows.map(r=>r.id));
 if(ids.size!==rows.length)throw new Error("Duplicate "+label+" ID");
 return new Map(rows.map(r=>[r.id,r]));
}

/** Only include ancestors/descendants declared by the typed programme parent field. */
function descendants(programmeId:string,all:readonly Programme[]):Set<string>{
 const scope=new Set([programmeId]),queue=[programmeId];
 while(queue.length){
  const parent=queue.shift()!;
  for(const g of all){
   if(g.parentProgrammeId!==parent)continue;
   if(scope.has(g.id))throw new Error("Programme hierarchy cycle at "+g.id);
   scope.add(g.id);queue.push(g.id);
  }
 }
 return scope;
}

export function buildProgrammeTrail(ledger:ProgrammeLedger,input:ProgrammeTrailInput):ProgrammeTrail{
 const {programme:p}=ledger;
 const orgs=uniqueIds(input.organisations,"organization");
 const projects=uniqueIds(input.projects,"project");
 const programmes=uniqueIds(input.programmes,"programme");
 const sources=uniqueIds(input.sourceEntries.map(e=>e.source),"source");
 if(!programmes.has(p.id))throw new Error("Unregistered programme "+p.id);
 const scope=descendants(p.id,input.programmes);
 const entity=(id:string,kind:"organization"|"project"|"programme"):TrailEntity=>{
  const model=kind==="organization"?orgs.get(id):kind==="project"?projects.get(id):programmes.get(id);
  if(!model)throw new Error("Unresolved "+kind+" link "+id+" for "+p.id);
  return {id,name:model.name,href:kind==="organization"?"/organizations/"+id:kind==="project"?"/projects/"+id:"/programmes/"+id};
 };
 const sourceUses=new Map<string,Map<string,Set<string>>>();
 for(const entry of input.sourceEntries){
  for(const use of entry.uses){
   if(!["capital","programme","designation"].includes(use.kind))continue;
   const key=use.kind+":"+use.id;
   const refs=sourceUses.get(key)??new Map<string,Set<string>>();
   const roles=refs.get(entry.source.id)??new Set<string>();
   for(const role of use.roles)roles.add(role);
   refs.set(entry.source.id,roles);
   sourceUses.set(key,refs);
  }
 }
 const citations=(kind:"capital"|"programme"|"designation",id:string):TrailSource[]=>{
  const citations=sourceUses.get(kind+":"+id)??new Map();
  return [...citations].map(([sid,roles])=>{
   const source=sources.get(sid);
   if(!source)throw new Error("Unregistered source "+sid+" on "+kind+":"+id);
   return {id:sid,title:source.title,publisher:source.publisher,
    datePublished:source.datePublished??null,roles:[...roles].sort(compare)};
  }).sort((a,b)=>compare(a.id,b.id));
 };
 const expected=(kind:"capital"|"programme"|"designation",id:string,data:readonly unknown[])=>{
  const refs=citations(kind,id);
  if(data.length&&!refs.length)throw new Error("Missing direct citation for "+kind+":"+id);
  return refs;
 };
 const finance:TrailFinance[]=ledger.rows.map(c=>{
  if(!c.programmeId||!scope.has(c.programmeId))
   throw new Error("Financial row outside programme scope "+c.id);
  if(c.projectId&&(c.associatedProjectIds?.length??0))
   throw new Error("Attributable and shared project references mixed: "+c.id);
  const direct=c.projectId?entity(c.projectId,"project"):null;
  const shared=(c.associatedProjectIds??[]).map(id=>entity(id,"project"));
  if(new Set(shared.map(x=>x.id)).size!==shared.length)throw new Error("Duplicate shared project: "+c.id);
  return {
   id:c.id,
   title:c.project??c.recipient??c.provider??c.id,
   link:"/capital/"+c.id,amountAsStated:c.amount?.amountAsStated??null,
   valueRole:c.valueRole,instrument:c.instrument,
   financialStatus:currentFinancialStatus(c),layer:layerOf(c),
   programme:entity(c.programmeId,"programme"),inheritedFromChild:c.programmeId!==p.id,
   providers:c.providerOrgIds.map(id=>entity(id,"organization")),
   recipients:c.recipientOrgIds.map(id=>entity(id,"organization")),
   providerAsStated:c.provider,recipientAsStated:c.recipient,
   project:direct,sharedProjects:shared,
   sources:expected("capital",c.id,[...c.evidence,...c.financialStatusHistory]),
  };
 }).sort((a,b)=>compare(a.id,b.id));
 if(new Set(finance.map(c=>c.id)).size!==finance.length)
  throw new Error("Duplicate programme financial row");
 const designations:TrailDesignation[]=ledger.designations.map(d=>{
  if(!scope.has(d.programmeId))throw new Error("Designation outside programme scope "+d.id);
  return {
   id:d.id,name:d.projectNameAsStated,
   programme:entity(d.programmeId,"programme"),
   project:entity(d.projectId,"project"),
   holders:d.holderOrgIds.map(id=>entity(id,"organization")),
   sources:expected("designation",d.id,[...d.evidence,...d.statusHistory]),
  };
 }).sort((a,b)=>compare(a.id,b.id));
 if(new Set(designations.map(d=>d.id)).size!==designations.length)
  throw new Error("Duplicate programme designation");
 const programmeSources=expected("programme",p.id,p.evidence);
 const administrators=p.administeringOrgIds.map(id=>entity(id,"organization"));
 const allSources=[...programmeSources,...finance.flatMap(c=>c.sources),...designations.flatMap(d=>d.sources)];
 const projectIds=[
  ...finance.flatMap(c=>[...(c.project?[c.project.id]:[]),...c.sharedProjects.map(x=>x.id)]),
  ...designations.map(d=>d.project.id),
 ];
 return {
  id:p.id,programmeName:p.name,administrators,
  programmeSources,finance,designations,
  distinctProjectIds:[...new Set(projectIds)].sort(compare),
  distinctSourceIds:[...new Set(allSources.map(s=>s.id))].sort(compare),
 };
}
