/**
 * Locally write or validate the F5 O3b *unpublished* browser preview.
 *
 * npm run preview:f5-observatory
 * npm run preview:f5-observatory -- --check
 *
 * Intentionally NOT an app/ page, a network server, or a public export.
 */
import { lstat, mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildF5LocalBrowserPreview, F5_PREVIEW_DIRECTORY,
  F5_PREVIEW_HTML, F5_PREVIEW_QA,
} from "./f5-observatory-local-preview";

const args=process.argv.slice(2);
if(args.length>1 || args.some(a=>a!=="--check")){
  console.error("Usage: npm run preview:f5-observatory [-- --check]");
  process.exit(2);
}

async function refuseSymlink(dir:string):Promise<void>{
  try {
    const info=await lstat(dir);
    if(info.isSymbolicLink()||!info.isDirectory())
      throw new Error("F5 local preview output directory must be an actual non-symlink directory");
  } catch(error){
    if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;
  }
}

async function main():Promise<void>{
  const preview=await buildF5LocalBrowserPreview();
  const base=path.resolve(process.cwd(),F5_PREVIEW_DIRECTORY);
  const html=path.join(base,F5_PREVIEW_HTML);
  const qa=path.join(base,F5_PREVIEW_QA);
  if(args.includes("--check")){
    process.stdout.write([
      "F5 local preview: PASS (no files written)",
      "Four casefiles: 4",
      "Curated corpus cutoff: "+preview.qaPlan.corpusCutoff,
      "Compiled Lattice CSS: "+preview.stylesheetBytes+" bytes",
      "HTML SHA-256: "+preview.qaPlan.artifactSha256,
      "Public route/release: NOT AUTHORIZED",
      "Browser, keyboard and source QA: NOT RUN",
      "",
    ].join("\n"));
    return;
  }
  await refuseSymlink(base);
  await mkdir(base,{recursive:true,mode:0o700});
  await refuseSymlink(base);
  const stamp=process.pid.toString();
  const temporaryHtml=html+"."+stamp+".tmp";
  const temporaryQa=qa+"."+stamp+".tmp";
  try {
    await writeFile(temporaryHtml,preview.html,{encoding:"utf8",mode:0o600,flag:"wx"});
    await writeFile(temporaryQa,JSON.stringify(preview.qaPlan,null,2)+"\n",{
      encoding:"utf8",mode:0o600,flag:"wx",
    });
    await rename(temporaryHtml,html);
    await rename(temporaryQa,qa);
  } catch(error){
    const { rm }=await import("node:fs/promises");
    await Promise.all([rm(temporaryHtml,{force:true}),rm(temporaryQa,{force:true})]);
    throw error;
  }
  process.stdout.write([
    "F5 local Observatory preview generated in gitignored reviewer directory:",
    "  HTML: "+html,
    "  UNSIGNED QA PLAN: "+qa,
    "Open the HTML directly in a local browser (file://); do not upload or publish it.",
    "Public route/release: NOT AUTHORIZED",
    "Source adjudication/browser QA: NOT COMPLETED",
    "",
  ].join("\n"));
}

main().catch(error=>{
  console.error("F5 local preview refused: "+(error instanceof Error?error.message:String(error)));
  process.exitCode=1;
});
