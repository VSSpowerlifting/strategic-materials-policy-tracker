import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {buildSearchIndex} from "@/lib/search";
import {searchDocs,SEARCH_KINDS,normalize} from "@/lib/search-core";
import {
 getAllEvents,getAllFinancialCommitments,getAllControlMeasures,getAllProjects,
 getAllOrganizations,getAllProgrammes,getAllMaterials,getAllJurisdictions,
 getAllFramingClaims,getAllSources,getAllWatchedSources,
} from "@/lib/data";

const docs=buildSearchIndex();
const expectations={
 event:getAllEvents().length,
 capital:getAllFinancialCommitments().length,
 control:getAllControlMeasures().length,
 project:getAllProjects().length,
 organization:getAllOrganizations().length,
 programme:getAllProgrammes().length,
 material:getAllMaterials().length,
 actor:getAllJurisdictions().length,
 framing:getAllFramingClaims().length,
 source:getAllSources().length,
 watched:getAllWatchedSources().length,
} as const;

test("the existing single search index covers all eleven public record families without duplicates",()=>{
 assert.equal(SEARCH_KINDS.length,11);
 let total=0;
 const keys=new Set<string>();
 for(const k of SEARCH_KINDS){
   const expected=expectations[k],actual=docs.filter(d=>d.kind===k);
   assert.equal(actual.length,expected,k);
   assert.ok(actual.every(d=>d.href.startsWith("/")&&d.title.length>0));
   total+=expected;
   for(const doc of actual){
     const id=k+":"+doc.id;
     assert.ok(!keys.has(id),"Duplicate search result "+id);
     keys.add(id);
   }
 }
 assert.equal(total,docs.length);
 assert.ok(total>400,"Search should represent the full live curated corpus");
});

test("extracting client search leaves exact legal/document-number and CJK matching unchanged",()=>{
 const hits=(query:string)=>searchDocs(docs,query).map(x=>x.kind+":"+x.id);
 assert.deepEqual(hits(""),[]);
 assert.deepEqual(hits("    "),[]);
 assert.ok(hits("No. 61").length>0);
 assert.notDeepEqual(hits("No. 61"),hits("No. 62"));
 assert.ok(hits("稀土").length>0);
 assert.ok(hits("Hemerdon").includes("project:prj-gb-hemerdon"));
 assert.ok(hits("Critical Minerals Facility").includes("programme:prg-au-cmf"));
 assert.equal(normalize("  ÉNERGIE  "),"energie");
 assert.deepEqual(hits("2039847-no-doc-ever"),[]);
 assert.deepEqual(hits("gallium"),hits("gallium"));
});

test("search results preserve curated jurisdiction attribution without mislabeling sources or projects",()=>{
 for(const d of docs){
  if(d.kind==="project"||d.kind==="source")assert.equal(d.jurisdiction,null,d.id);
  if(d.kind==="capital"&&d.jurisdiction){
    const entry=getAllFinancialCommitments().find(r=>r.id===d.id)!;
    assert.equal(d.jurisdiction,entry.providerJurisdiction);
  }
 }
 assert.ok(docs.some(d=>d.kind==="source"&&d.jurisdiction===null));
 assert.ok(docs.some(d=>d.kind==="control"&&d.jurisdiction!==null));
});

test("client-side search code imports only the pure matcher, never the raw seed loaders",async()=>{
 const component=await readFile("components/search-explorer.tsx","utf8");
 const core=await readFile("lib/search-core.ts","utf8");
 const server=await readFile("lib/search.ts","utf8");
 assert.match(component,/from "@\/lib\/search-core"/);
 assert.doesNotMatch(component,/from "@\/lib\/search";/);
 assert.doesNotMatch(core,/from ["']\.\/data["']/);
 assert.doesNotMatch(core,/getAll(?:Events|FinancialCommitments|Sources|Projects)/);
 assert.match(server,/import \{ normalize \} from "\.\/search-core"/);
 assert.match(server,/export \{ SEARCH_KINDS, normalize, searchDocs \} from "\.\/search-core"/);
 assert.match(server,/from "\.\/data"/);
});

test("search interface exposes accessible browse shortcuts, full-record counts, keyboard targets and no-result recovery",async()=>{
 const ui=await readFile("components/search-explorer.tsx","utf8");
 const page=await readFile("app/search/page.tsx","utf8");
 assert.match(ui,/data-testid="search-browse"/);
 assert.match(ui,/data-testid="search-type-shortcut"/);
 assert.match(ui,/allCounts\[type\]/);
 assert.match(ui,/data-testid="search-result-count"/);
 assert.match(ui,/aria-live="polite"/);
 assert.match(ui,/min-h-11/);
 assert.match(ui,/selectClass/);
 assert.match(ui,/Clear all filters/);
 assert.match(ui,/sources and projects/);
 assert.match(page,/Search strategic-material policy/);
 assert.match(page,/original-language text/);
});
