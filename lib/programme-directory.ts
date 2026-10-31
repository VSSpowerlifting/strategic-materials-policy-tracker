/**
 * Public, nonallocative programme directory read model.
 * The existing programmeLedger is the only authority for nested programme
 * finance and designation membership. This is not a spending or approval model.
 */
import {formatMoney} from "./decimal";
import type {Programme,ProgrammeKind,JurisdictionCode} from "./types";
import type {ProgrammeLedger} from "./capital-intelligence";

export const PROGRAMME_EVIDENCE_FILTERS=["ceiling","public_commitment","designation","other","none"] as const;
export type ProgrammeEvidenceFilter=(typeof PROGRAMME_EVIDENCE_FILTERS)[number];
export type ProgrammeDirectoryRow={
 id:string;name:string;nameOriginal:string|null;actor:JurisdictionCode;kind:ProgrammeKind;
 parentId:string|null;parentName:string|null;childIds:string[];
 administers:string[];hasNamedAdministrator:boolean;
 legalAuthorityAsStated:string|null;searchText:string;
 envelopeCount:number;envelopeLabels:string[];
 publicCommitmentCount:number;otherFinanceCount:number;
 designationCount:number;
 /** All record counts include the child programme records if this programme is a parent. */
 includesDescendants:boolean;
};
export type ProgrammeDirectoryFilters={
 q?:string;actor?:string;kind?:string;evidence?:string;administrator?:string;
};
export const normalizeProgrammeQuery=(s:string)=>s.normalize("NFKD")
  .replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
const lex=(a:string,b:string)=>a<b?-1:a>b?1:0;
const distinct=<T>(values:readonly T[])=>[...new Set(values)];
const assertUnique=(ids:readonly string[],label:string)=>{
 if(new Set(ids).size!==ids.length)throw new Error("Duplicate "+label+" IDs");
};
const formatEnvelope=(c:ProgrammeLedger["envelopes"][number])=>{
 if(!c.amount)return "Amount not stated";
 const a=c.amount;
 return [(a.qualifier==="exact"?"":a.qualifier.replace(/_/g," ")+" "),formatMoney(a.value,a.currency),a.basisLabel??""].join(" ").replace(/\s+/g," ").trim();
};
export function buildProgrammeDirectory(
 programmes:readonly Programme[], ledgers:readonly {id:string;ledger:ProgrammeLedger}[],
 administratorNames:ReadonlyMap<string,string>,
):ProgrammeDirectoryRow[]{
 const ids=new Set(programmes.map(p=>p.id));
 if(ids.size!==programmes.length)throw new Error("Duplicate programme registry ID");
 const names=new Map(programmes.map(p=>[p.id,p.name]));
 const index=new Map<string,ProgrammeLedger>();
 for(const entry of ledgers){
  if(!ids.has(entry.id))throw new Error("Unknown programme ledger ID: "+entry.id);
  if(index.has(entry.id))throw new Error("Duplicate programme ledger ID: "+entry.id);
  if(entry.ledger.programme.id!==entry.id)throw new Error("Programme ledger identity mismatch: "+entry.id);
  index.set(entry.id,entry.ledger);
 }
 return programmes.map(p=>{
  const l=index.get(p.id);
  if(!l)throw new Error("Missing programme ledger: "+p.id);
  if(p.parentProgrammeId&&!names.has(p.parentProgrammeId))
   throw new Error("Unresolved programme parent: "+p.id);
  const childIds=l.children.map(c=>c.id);
  assertUnique(childIds,p.id+" child");
  for(const child of l.children)
   if(!ids.has(child.id)||child.parentProgrammeId!==p.id)throw new Error("Invalid programme child: "+child.id);
  for(const id of p.administeringOrgIds)
   if(!administratorNames.has(id))throw new Error("Unknown programme administrator: "+id);
  const admins=p.administeringOrgIds.map(id=>administratorNames.get(id)!);
  const envelopeIds=l.envelopes.map(c=>c.id);
  const publicIds=l.recordedAwards?.rows.map(c=>c.id)??[];
  const otherIds=l.otherLayers.flatMap(x=>x.rows.map(c=>c.id));
  const designationIds=l.designations.map(d=>d.id);
  for(const [type,values] of [["envelope",envelopeIds],["public commitment",publicIds],
    ["other finance",otherIds],["designation",designationIds]] as const)assertUnique(values,p.id+" "+type);
  if(new Set([...envelopeIds,...publicIds,...otherIds]).size!==l.rows.length)
   throw new Error("Programme finance layers do not partition ledger: "+p.id);
  const scoped=distinct([p.id,...l.children.map(c=>c.id)]);
  const row:ProgrammeDirectoryRow={
   id:p.id,name:p.name,nameOriginal:p.nameOriginal,actor:p.actor,kind:p.kind,
   parentId:p.parentProgrammeId,parentName:p.parentProgrammeId?names.get(p.parentProgrammeId)!:null,
   childIds,administers:admins,hasNamedAdministrator:admins.length>0,
   legalAuthorityAsStated:p.legalAuthorityAsStated,
   searchText:[p.id,p.name,p.nameOriginal,p.legalAuthorityAsStated,p.notes,
     ...admins,...scoped.map(id=>names.get(id))].filter(Boolean).join(" "),
   envelopeCount:envelopeIds.length,
   envelopeLabels:l.envelopes.map(formatEnvelope),
   publicCommitmentCount:publicIds.length,
   otherFinanceCount:otherIds.length,
   designationCount:designationIds.length,
   includesDescendants:childIds.length>0,
  };
  return row;
 }).sort((a,b)=>lex(a.name,b.name)||lex(a.id,b.id));
}
export function filterProgrammeDirectory(rows:readonly ProgrammeDirectoryRow[],f:ProgrammeDirectoryFilters){
 const terms=normalizeProgrammeQuery(f.q??"").split(" ").filter(Boolean);
 return rows.filter(p=>
  (!f.actor||f.actor==="all"||p.actor===f.actor) &&
  (!f.kind||f.kind==="all"||p.kind===f.kind) &&
  (!f.administrator||f.administrator==="all"||
   (f.administrator==="named"?p.hasNamedAdministrator:!p.hasNamedAdministrator)) &&
  (!f.evidence||f.evidence==="all"||
   (f.evidence==="ceiling"?p.envelopeCount>0:
    f.evidence==="public_commitment"?p.publicCommitmentCount>0:
    f.evidence==="designation"?p.designationCount>0:
    f.evidence==="other"?p.otherFinanceCount>0:
    !p.envelopeCount&&!p.publicCommitmentCount&&!p.otherFinanceCount&&!p.designationCount)) &&
  terms.every(t=>normalizeProgrammeQuery(p.searchText).includes(t))
 );
}
