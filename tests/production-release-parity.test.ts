import test from "node:test";
import assert from "node:assert/strict";
import {
  checkPublicReleaseParity,expectedPublicRelease,publicHttpsFetcher,
  type ExpectedPublicRelease,type PublicHttpFetcher,
} from "../lib/production-release-parity";
import {getAllProjectMilestones} from "../lib/data";

const expected=()=>expectedPublicRelease();
function healthyHttp(e:ExpectedPublicRelease):PublicHttpFetcher {
  return async path=>{
    if(path==="/api/v1/project-milestones")
      return {status:200,body:structuredClone(e.milestones)};
    if(path==="/api/export/dataset.json")
      return {status:200,body:structuredClone(e.dataset)};
    const p=e.projects.find(x=>path==="/api/v1/projects/"+encodeURIComponent(x.id));
    if(p)return {status:200,body:{
      reviewedProjectMilestones:structuredClone(p.milestones),
      reviewedMilestoneSources:structuredClone(p.milestoneSources),
      layers:[],associatedRowIds:[],latestImplementation:null,
    }};
    return {status:404,body:null};
  };
}

test("read-only public parity checks the entire exported corpus and every actually released physical project",async()=>{
  const e=expected();
  assert.deepEqual(e.milestones,getAllProjectMilestones());
  assert.deepEqual(e.milestones.map(m=>m.id),["mil-au-alcoa-wagerup-groundbreaking-2026-08-24"]);
  assert.equal(e.projects.length,1);
  assert.equal(e.dataset.counts.projectMilestones,1);
  const before=JSON.stringify(e);
  const r=await checkPublicReleaseParity(e,healthyHttp(e));
  assert.equal(r.status,"in_sync");
  assert.equal(r.expectedCuratedCorpusCutoff,"2026-10-17");
  assert.equal(r.expectedPublishedMilestoneCount,1);
  assert.deepEqual(r.issues,[]);
  assert.equal(r.checkedEndpoints.length,3);
  assert.equal(r.publicOnly,true);
  assert.equal(r.publicationAuthorized,false);
  assert.equal(r.deploymentShaVerified,false,"public data parity is NOT Vercel exact-commit attestation");
  assert.match(r.caveat,/not verification of the exact Vercel deployment SHA/);
  assert.equal(JSON.stringify(e),before,"parity checks cannot edit the source corpus");
});

test("production serving the previous pre-API build is detected without claiming a network outage",async()=>{
  const e=expected();
  const good=healthyHttp(e);
  const r=await checkPublicReleaseParity(e,async path=>{
    if(path==="/api/v1/project-milestones")return {status:404,body:null};
    if(path==="/api/export/dataset.json"){
      const dataset=structuredClone(e.dataset) as Record<string,unknown>;
      delete dataset.projectMilestones;
      return {status:200,body:dataset};
    }
    return good(path);
  });
  assert.equal(r.status,"stale_or_mismatched");
  assert.ok(r.issues.some(x=>x.code==="http_status"&&x.endpoint==="/api/v1/project-milestones"));
  assert.ok(r.issues.some(x=>x.code==="payload_mismatch"&&x.endpoint==="/api/export/dataset.json"));
  assert.equal(r.deploymentShaVerified,false);
});

test("silent changes to the original-source citation and project record are surfaced separately",async()=>{
  const e=expected();
  const good=healthyHttp(e);
  const r=await checkPublicReleaseParity(e,async path=>{
    if(path.startsWith("/api/v1/projects/")){
      const ref=(await good(path)).body as Record<string,unknown>;
      const s=structuredClone(ref.reviewedMilestoneSources);
      (s as {url:string}[])[0].url="https://example.invalid/not-the-original";
      return {status:200,body:{...ref,reviewedMilestoneSources:s,reviewedProjectMilestones:[]}};
    }
    return good(path);
  });
  assert.equal(r.status,"stale_or_mismatched");
  assert.ok(r.issues.some(x=>x.code==="source_mismatch"));
  assert.ok(r.issues.some(x=>x.code==="payload_mismatch"));
});

test("network errors and corrupt JSON fail closed rather than producing a false green",async()=>{
  const e=expected();
  const r=await checkPublicReleaseParity(e,async path=>{
    if(path==="/api/export/dataset.json")throw new Error("Synthetic DNS failure");
    if(path==="/api/v1/project-milestones")return {status:200,body:null,error:"Invalid JSON"};
    return healthyHttp(e)(path);
  });
  assert.equal(r.status,"unreachable");
  assert.ok(r.issues.some(x=>x.code==="network_error"));
  assert.ok(r.issues.some(x=>x.code==="invalid_json"));
  assert.equal(r.publicationAuthorized,false);
});

test("HTTPS-only fetcher does not send credentials or leave specified production origin",async()=>{
  for(const origin of ["http://public.example.org/","https://someone:secret@public.example.org/","https://public.example.org/subpath","https://public.example.org/?token=secret"])
    assert.throws(()=>publicHttpsFetcher(origin),/plain HTTPS/);
  const seen:string[]=[];
  const fake=async (input:RequestInfo|URL)=>{
    const url=String(input);
    seen.push(url);
    return new Response(JSON.stringify({okay:true}),{status:200,headers:{"content-type":"application/json"}});
  };
  const fetcher=publicHttpsFetcher("https://public.example.org/",fake as typeof fetch);
  assert.deepEqual(await fetcher("/api/v1/project-milestones"),{status:200,body:{okay:true}});
  assert.deepEqual(seen,["https://public.example.org/api/v1/project-milestones"]);
  await assert.rejects(()=>fetcher("https://other.example.org/api/v1/project-milestones"),/same-origin/);
  await assert.rejects(()=>fetcher("/admin/secret"),/same-origin/);
});

test("404 HTTP payload is a stale public-route finding, not invalid-JSON/network classification",async()=>{
  const fake=async ()=>new Response("<html>missing</html>",{status:404,headers:{"content-type":"text/html"}});
  const getter=publicHttpsFetcher("https://public.example.org/",fake as typeof fetch);
  assert.deepEqual(await getter("/api/v1/project-milestones"),{status:404,body:null});
  const e=expected();
  const r=await checkPublicReleaseParity(e,async path=>path==="/api/v1/project-milestones"?
    getter(path):healthyHttp(e)(path));
  assert.equal(r.status,"stale_or_mismatched");
});
