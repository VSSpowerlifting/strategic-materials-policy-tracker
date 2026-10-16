/**
 * Public organization register projection. Only references explicitly recorded
 * by existing capital-intelligence roles are exposed. No inferred ownership,
 * government backing, cash payout, or project outcome.
 */
import type {Organization,OrganizationKind,JurisdictionCode} from "./types";
import type {OrganizationRoles} from "./capital-intelligence";
export const ORGANIZATION_ROLES=["provider","recipient","sponsor","administrator","designation_holder","unlinked"] as const;
export type DirectoryRole=(typeof ORGANIZATION_ROLES)[number];
export const UNSTATED_COUNTRY="not_stated";
export const NO_GOVERNMENT="no_government";
export type OrganizationDirectoryRow={
 id:string; name:string; nameOriginal:string|null; aliases:string[];
 kind:OrganizationKind; countryCode:string|null; actor:JurisdictionCode|null;
 searchText:string; roles:Exclude<DirectoryRole,"unlinked">[];
 providedRows:number; receivedRows:number; endedRows:number;
 sponsoredProjects:number; administeredProgrammes:number; heldDesignations:number;
 rolledUpOfficeIds:string[];
};
export type OrganizationDirectoryFilters={
 q?:string;kind?:string;country?:string;actor?:string;role?:string;
};
const lex=(a:string,b:string)=>a<b?-1:a>b?1:0;
export const normalizeOrgText=(s:string)=>s.normalize("NFKD")
  .replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();

/**
 * Input roles must come from the existing organizationRoles function.
 * Provider rows may include legitimate part_of office roll-ups; recipient,
 * sponsor, programme and designation roles do not inherit via ownership.
 */
export function buildOrganizationDirectory(
 orgs:readonly Organization[],roleEntries:readonly {id:string;roles:OrganizationRoles}[],
):OrganizationDirectoryRow[]{
 const known=new Set(orgs.map(o=>o.id));
 if(known.size!==orgs.length)throw new Error("Duplicate organization registry ID");
 const roleMap=new Map<string,OrganizationRoles>();
 for(const e of roleEntries){
   if(!known.has(e.id))throw new Error("Unknown organization role identity: "+e.id);
   if(roleMap.has(e.id))throw new Error("Duplicate organization role identity: "+e.id);
   roleMap.set(e.id,e.roles);
 }
 return orgs.map(o=>{
   const r=roleMap.get(o.id);
   if(!r)throw new Error("Missing organization role identity: "+o.id);
   if(!r.rolledUpIds.includes(o.id))throw new Error("Organization role rollup missing self: "+o.id);
   for(const id of r.rolledUpIds)if(!known.has(id))throw new Error("Unknown rolled-up office: "+id);
   const roles:OrganizationDirectoryRow["roles"]=[];
   if(r.provided.length)roles.push("provider");
   if(r.received.length)roles.push("recipient");
   if(r.sponsoredProjects.length)roles.push("sponsor");
   if(r.administeredProgrammes.length)roles.push("administrator");
   if(r.heldDesignations.length)roles.push("designation_holder");
   const endedIds=new Set([...r.provided,...r.received].filter(c=>
     c.financialStatusHistory.at(-1)?.status==="withdrawn" ||
     c.financialStatusHistory.at(-1)?.status==="lapsed").map(c=>c.id));
   return {
     id:o.id,name:o.name,nameOriginal:o.nameOriginal,aliases:[...o.aliases],
     kind:o.kind,countryCode:o.countryCode,actor:o.actor,
     searchText:[o.id,o.name,o.nameOriginal,...o.aliases,o.countryCode,o.notes].filter(Boolean).join(" "),
     roles,providedRows:r.provided.length,receivedRows:r.received.length,
     endedRows:endedIds.size,
     sponsoredProjects:r.sponsoredProjects.length,
     administeredProgrammes:r.administeredProgrammes.length,
     heldDesignations:r.heldDesignations.length,
     rolledUpOfficeIds:r.rolledUpIds.filter(id=>id!==o.id),
   };
 }).sort((a,b)=>lex(a.name,b.name)||lex(a.id,b.id));
}
export function filterOrganizationDirectory(rows:readonly OrganizationDirectoryRow[],f:OrganizationDirectoryFilters){
 const terms=normalizeOrgText(f.q??"").split(" ").filter(Boolean);
 return rows.filter(o=>
   (!f.kind||f.kind==="all"||o.kind===f.kind) &&
   (!f.country||f.country==="all"||(f.country===UNSTATED_COUNTRY?!o.countryCode:o.countryCode===f.country)) &&
   (!f.actor||f.actor==="all"||(f.actor===NO_GOVERNMENT?o.actor===null:o.actor===f.actor)) &&
   (!f.role||f.role==="all"||(f.role==="unlinked"?o.roles.length===0:o.roles.includes(f.role as never))) &&
   terms.every(t=>normalizeOrgText(o.searchText).includes(t))
 );
}
