import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type FileInfo = {path:string;sha256:string;bytes:number};
type Case = {research_cutoff:string;original_pdf:string;original_sha256:string;alternate_files:{pdf:FileInfo;pptx:FileInfo}};
const manifest = JSON.parse(readFileSync(resolve("public/research/archivo-alternate-editions-manifest.json"),"utf8")) as {cases:Record<string,Case>;publication_status:string};
const digest = (b:Buffer)=>createHash("sha256").update(b).digest("hex");
const read=(path:string)=>readFileSync(resolve(path));

test("Archivo alternate release: four files are present, hash-matched, format-valid and original PDFs remain unchanged",()=>{
  assert.deepEqual(Object.keys(manifest.cases).sort(),["a001","r001"]);
  assert.equal(manifest.publication_status,"draft_pending_human_approval");
  for(const c of Object.values(manifest.cases)){
    assert.match(c.research_cutoff,/^2026-11-0[34]$/);
    assert.equal(digest(read(c.original_pdf)),c.original_sha256);
    for(const [kind,file] of Object.entries(c.alternate_files)){
      const bytes=read(file.path);
      assert.equal(bytes.length,file.bytes);
      assert.equal(digest(bytes),file.sha256);
      if(kind==="pdf")assert.equal(bytes.subarray(0,4).toString(),"%PDF");
      else assert.equal(bytes.subarray(0,2).toString(),"PK");
      assert.ok(file.path.startsWith("public/research/"));
      assert.notEqual(file.path,c.original_pdf,"original published PDF must not be overwritten");
    }
  }
});

test("Original presentation links are preserved and alternate PDF/PPTX editions are transparently labeled",()=>{
  const t=read("app/research/tungsten-supply-security/page.tsx").toString("utf8");
  const a=read("app/research/antimony-supply-resilience/page.tsx").toString("utf8");
  assert.match(t,/\/research\/r001\/tungsten-supply-security-slides\.pdf/);
  assert.match(t,/\/research\/r001\/tungsten-supply-security-archivo-executive\.pdf/);
  assert.match(t,/\/research\/r001\/tungsten-supply-security-archivo-executive\.pptx/);
  assert.match(a,/\/research\/applied-001\/antimony-supply-resilience\.pdf/);
  assert.match(a,/\/research\/applied-001\/antimony-supply-resilience-archivo-executive\.pdf/);
  assert.match(a,/\/research\/applied-001\/antimony-supply-resilience-archivo-executive\.pptx/);
  for(const page of [t,a]){
    assert.match(page,/Archivo executive edition/);
    assert.match(page,/editable|Editable/);
    assert.match(page,/original/i);
  }
});
