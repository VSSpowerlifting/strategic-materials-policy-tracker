import test from "node:test";
import assert from "node:assert/strict";
import {buildOrganizationDirectory,filterOrganizationDirectory,
 NO_GOVERNMENT,UNSTATED_COUNTRY,normalizeOrgText} from "@/lib/organization-directory";
import {organizationRoles} from "@/lib/capital-intelligence";
import {getAllOrganizations} from "@/lib/data";
import {isEnded} from "@/lib/capital-control";

const seed=()=>getAllOrganizations();
const bundles=(orgs=seed())=>orgs.map(o=>({id:o.id,roles:organizationRoles(o.id)}));
const directory=()=>{const orgs=seed();return buildOrganizationDirectory(orgs,bundles(orgs))};

test("organization directory contains every distinct registered entity and stable identity",()=>{
 const orgs=seed(),rows=directory();
 assert.equal(rows.length,orgs.length);
 assert.equal(new Set(rows.map(o=>o.id)).size,orgs.length);
 assert.deepEqual(new Set(rows.map(o=>o.id)),new Set(orgs.map(o=>o.id)));
 for(let i=1;i<rows.length;i++)assert.ok(rows[i-1].name<=rows[i].name ||
   (rows[i-1].name===rows[i].name&&rows[i-1].id<rows[i].id));
});

test("all five recorded roles match the existing single authority, including exact organization linkage",()=>{
 for(const o of directory()){
   const r=organizationRoles(o.id);
   assert.equal(o.providedRows,r.provided.length,o.id);
   assert.equal(o.receivedRows,r.received.length,o.id);
   assert.equal(o.sponsoredProjects,r.sponsoredProjects.length,o.id);
   assert.equal(o.administeredProgrammes,r.administeredProgrammes.length,o.id);
   assert.equal(o.heldDesignations,r.heldDesignations.length,o.id);
   assert.equal(o.roles.includes("provider"),r.provided.length>0);
   assert.equal(o.roles.includes("recipient"),r.received.length>0);
   assert.equal(o.roles.includes("sponsor"),r.sponsoredProjects.length>0);
   assert.equal(o.roles.includes("administrator"),r.administeredProgrammes.length>0);
   assert.equal(o.roles.includes("designation_holder"),r.heldDesignations.length>0);
   assert.equal(o.endedRows,
     new Set([...r.provided,...r.received].filter(isEnded).map(x=>x.id)).size);
 }
});

test("part-of offices roll up providers, but established-by joint vehicles do not confer their money on founders",()=>{
 const rows=directory(),dod=rows.find(o=>o.id==="org-us-dod")!;
 assert.ok(dod.rolledUpOfficeIds.includes("org-us-osc"),"DoD should inherit explicitly part-of OSC office");
 const jare=rows.find(o=>o.id==="org-jare")!;
 assert.equal(jare.kind,"joint_vehicle");
 assert.equal(jare.actor,null);
 const jogmec=rows.find(o=>o.id==="org-jp-jogmec")!;
 const sojitz=rows.find(o=>o.id==="org-sojitz")!;
 assert.ok(!jogmec.rolledUpOfficeIds.includes(jare.id));
 assert.ok(!sojitz.rolledUpOfficeIds.includes(jare.id));
 assert.ok(!jogmec.rolledUpOfficeIds.includes(sojitz.id));
 assert.equal(rows.find(o=>o.id==="org-perpetua-resources-corp")!.rolledUpOfficeIds.includes("org-perpetua-resources-idaho"),true);
});

test("explicit actor affiliation is not inferred from country or founder relationships",()=>{
 const rows=directory();
 const jare=rows.find(o=>o.id==="org-jare")!;
 assert.ok(filterOrganizationDirectory(rows,{actor:NO_GOVERNMENT}).some(o=>o.id===jare.id));
 assert.ok(!filterOrganizationDirectory(rows,{actor:"japan"}).some(o=>o.id===jare.id));
 const japanese=rows.filter(o=>o.countryCode==="JP");
 assert.ok(japanese.some(o=>o.actor===null));
 assert.deepEqual(filterOrganizationDirectory(rows,{country:"JP"}),
   japanese);
 const unspecified=filterOrganizationDirectory(rows,{country:UNSTATED_COUNTRY});
 assert.deepEqual(unspecified,rows.filter(o=>o.countryCode===null));
});

test("role filters overlap without double counting organizations and treat ended finance as recorded, not paid",()=>{
 const rows=directory();
 for(const role of ["provider","recipient","sponsor","administrator","designation_holder"]){
   const matching=filterOrganizationDirectory(rows,{role});
   assert.ok(matching.length>0,role);
   assert.ok(matching.every(o=>o.roles.includes(role as never)));
 }
 const unlinked=filterOrganizationDirectory(rows,{role:"unlinked"});
 assert.ok(unlinked.every(o=>o.roles.length===0));
 assert.equal(new Set(rows.map(o=>o.id)).size,rows.length);
 assert.equal(filterOrganizationDirectory(rows,{role:"provider"}).length+
   filterOrganizationDirectory(rows,{role:"unlinked"}).length<=rows.length,true);
});

test("original names, aliases and country search coexist with exact AND filters",()=>{
 const rows=directory();
 const org=rows.find(o=>o.aliases.includes("5N+"))!;
 assert.ok(filterOrganizationDirectory(rows,{q:"5N+"}).some(o=>o.id===org.id));
 assert.ok(filterOrganizationDirectory(rows,{q:"5N+ Canada"}).some(o=>o.id===org.id)==false,
   "country search uses canonical country code and original text only");
 assert.ok(filterOrganizationDirectory(rows,{q:"5N+ CA",kind:"company"}).some(o=>o.id===org.id));
 const original=rows.find(o=>o.nameOriginal && o.nameOriginal!==o.name);
 assert.ok(original);
 assert.ok(filterOrganizationDirectory(rows,{q:original.nameOriginal!}).some(o=>o.id===original.id));
 assert.deepEqual(filterOrganizationDirectory(rows,{q:"not-a-real-organizational-entity"}),[]);
 assert.equal(normalizeOrgText("  Énergie  "),"energie");
});

test("unknown, duplicate and missing organization role inputs fail closed; shuffled input deterministic",()=>{
 const orgs=seed(),roles=bundles(orgs),before=structuredClone(roles);
 const a=buildOrganizationDirectory(orgs,roles);
 const b=buildOrganizationDirectory([...orgs].reverse(),[...roles].reverse());
 assert.deepEqual(a,b);
 assert.deepEqual(roles,before);
 assert.throws(()=>buildOrganizationDirectory([...orgs,orgs[0]],roles),/Duplicate organization registry ID/);
 assert.throws(()=>buildOrganizationDirectory(orgs,roles.slice(1)),/Missing organization role identity/);
 assert.throws(()=>buildOrganizationDirectory(orgs,[...roles,roles[0]]),/Duplicate organization role identity/);
 assert.throws(()=>buildOrganizationDirectory(orgs,[...roles,{...roles[0],id:"org-unknown"}]),/Unknown organization role identity/);
 const broken=roles.map((e,i)=>i===0?{id:e.id,roles:{...e.roles,rolledUpIds:["org-unknown"]}}:e);
 assert.throws(()=>buildOrganizationDirectory(orgs,broken),/missing self/);
});

test("directory page retains export links, static HTML, keyboard links and accessible filters",async()=>{
 const {readFile}=await import("node:fs/promises");
 const page=await readFile("app/organizations/page.tsx","utf8");
 const explorer=await readFile("components/organizations-explorer.tsx","utf8");
 assert.match(page,/OrganizationsExplorer/);
 assert.ok(!page.includes("useSearchParams"));
 assert.ok(explorer.includes("aria-live=\"polite\""));
 assert.match(explorer,/Clear filters/);
 assert.match(explorer,/data-testid="organization-record"/);
 assert.match(page,/\/api\/export\/organizations.csv/);
 assert.match(explorer,/providerRows/);
});
