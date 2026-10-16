/**
 * DOE M2 manual report comparison. Read two explicitly supplied local JSON
 * artifacts; no network, source monitor state, pub seed or output files.
 *
 * Usage:
 *   npx tsx scripts/compare-doe-manual-reports.ts old/report.json new/report.json
 */
import { readFileSync,statSync } from "node:fs";
import { compareDoeManualReports } from "./doe-manual-report-diff";

function originalReport(path:string):unknown{
 if(!path.endsWith(".json"))throw Error("DOE compare accepts only JSON report paths");
 const stats=statSync(path);
 if(!stats.isFile()||stats.size>150_000||stats.size<100)
   throw Error("DOE compare needs a bounded local original report file");
 return JSON.parse(readFileSync(path,"utf8")) as unknown;
}
function main():void{
 if(process.argv.length!==4)
   throw Error("Usage: tsx scripts/compare-doe-manual-reports.ts older/report.json later/report.json");
 const before=originalReport(process.argv[2]),after=originalReport(process.argv[3]);
 const result=compareDoeManualReports(before,after);
 process.stdout.write(JSON.stringify(result,null,2)+"\n");
 // An observed difference needs source inspection, not an automated source
 // publication signal. CLI produces a report, not an alerting process.
}
try{main();}catch(e){
 process.stderr.write("DOE offline report comparison refused: "+String(e)+"\n");
 process.exitCode=1;
}
