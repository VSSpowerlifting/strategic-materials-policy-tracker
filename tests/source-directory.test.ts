import test from "node:test";
import assert from "node:assert/strict";
import {buildSourceDirectory,filterSourceDirectory,normalizeSourceQuery,UNCITED_FILTER} from "@/lib/source-directory";
import {buildSourceUseIndex,publishedSourceRecords,SOURCE_USE_KINDS} from "@/lib/source-usage";
import {getAllSources} from "@/lib/data";

const corpus=()=>publishedSourceRecords();
const directory=()=>{
 const d=corpus();return buildSourceDirectory(d.sources,buildSourceUseIndex(d));
};
test("source directory counts exactly the published unique register and retains confidence tier order",()=>{
 const all=getAllSources(),rows=directory();
 assert.equal(rows.length,all.length);
 assert.deepEqual(new Set(rows.map(r=>r.source.id)),new Set(all.map(s=>s.id)));
 assert.equal(new Set(rows.map(r=>r.source.id)).size,rows.length);
 const order=["primary","official_translation","government_media","secondary"];
 for(let i=1;i<rows.length;i++)
   assert.ok(order.indexOf(rows[i-1].source.confidence)<=order.indexOf(rows[i].source.confidence));
});
test("reverse citations remain distinct citing records and not field-reference inflation",()=>{
 const c=corpus(),index=buildSourceUseIndex(c),rows=buildSourceDirectory(c.sources,index);
 for(const row of rows){
   const use=index.get(row.source.id)??[];
   assert.equal(row.directlyCitingRecords,use.length);
   assert.deepEqual(row.citingKinds,[...new Set(use.map(u=>u.kind))].sort(
     (a,b)=>SOURCE_USE_KINDS.indexOf(a)-SOURCE_USE_KINDS.indexOf(b)));
 }
 const wagerup=rows.find(r=>r.source.id==="src-alcoa-wagerup-groundbreaking-2026")!;
 assert.ok(wagerup.citingKinds.includes("capital"));
 assert.ok(wagerup.directlyCitingRecords>=3);
 assert.ok(wagerup.citingKinds.includes("milestone"));
  assert.equal(index.get(wagerup.source.id)?.filter(x=>x.kind==="milestone").length,1);
});
test("publisher publication date is not inferred from later recorded access",()=>{
 const rows=directory(),dated=filterSourceDirectory(rows,{publication:"dated"});
 const undated=filterSourceDirectory(rows,{publication:"undated"});
 assert.equal(dated.length+undated.length,rows.length);
 assert.ok(undated.length>0);
 assert.ok(undated.every(r=>!r.source.datePublished && !!r.source.dateAccessed));
 assert.ok(dated.every(r=>!!r.source.datePublished));
});
test("citation-kind filtering uses only exact canonical source references",()=>{
 const rows=directory();
 for(const kind of ["capital","project","control","event","framing"]){
  const found=filterSourceDirectory(rows,{citingKind:kind});
  assert.ok(found.length>0,kind);
  assert.ok(found.every(r=>r.citingKinds.includes(kind as typeof SOURCE_USE_KINDS[number])));
 }
 const none=filterSourceDirectory(rows,{citingKind:UNCITED_FILTER});
 assert.deepEqual(none,rows.filter(r=>r.directlyCitingRecords===0));
 assert.ok(none.every(r=>!r.citingKinds.length));
});
test("search original-language and English publisher/title/notes while intersecting filters",()=>{
 const rows=directory();
 assert.ok(filterSourceDirectory(rows,{q:"5N+ germanium"}).length>0);
 const zh=rows.find(r=>r.source.language==="zh")!;
 assert.ok(filterSourceDirectory(rows,{language:"zh",q:zh.source.title}).some(r=>r.source.id===zh.source.id));
 assert.deepEqual(filterSourceDirectory(rows,{confidence:"primary",language:"ja"}),
   rows.filter(r=>r.source.confidence==="primary"&&r.source.language==="ja"));
 assert.equal(filterSourceDirectory(rows,{q:"no-such-token-19384901"}).length,0);
 assert.equal(normalizeSourceQuery("  Électricité    "), "electricite");
});
test("reject duplicate/unknown source index identities",()=>{
 const d=corpus(),index=buildSourceUseIndex(d);
 assert.throws(()=>buildSourceDirectory([...d.sources,d.sources[0]],index),/Duplicate source directory ID/);
 const extra=new Map(index);extra.set("src-does-not-exist",[]);
 assert.throws(()=>buildSourceDirectory(d.sources,extra),/Unknown source use index key/);
 const duplicate=new Map(index);
 const withUses=[...index].find(([,list])=>list.length>0)!;
 duplicate.set(withUses[0],[withUses[1][0],withUses[1][0]]);
 assert.throws(()=>buildSourceDirectory(d.sources,duplicate),/Duplicate citing record/);
});
test("filtering never mutates data or publishes private milestone review",()=>{
 const rows=directory(),original=structuredClone(rows);
 filterSourceDirectory(rows,{q:"China",publication:"undated",citingKind:"capital"});
 assert.deepEqual(rows,original);
 assert.equal(filterSourceDirectory(rows,{citingKind:"milestone"}).length,1);
});
test("source page statically includes full directory with accessible and shareable filters",async()=>{
 const {readFile}=await import("node:fs/promises");
 const page=await readFile("app/sources/page.tsx","utf8");
 const explorer=await readFile("components/source-register-explorer.tsx","utf8");
 assert.match(page,/SourceRegisterExplorer/);
 assert.ok(!page.includes("useSearchParams"));
 assert.match(explorer,/aria-live="polite"/);
 assert.match(explorer,/Clear filters/);
 assert.match(explorer,/SourceCard source=\{r.source\}/);
 assert.match(explorer,/directlyCitingRecords/);
});
