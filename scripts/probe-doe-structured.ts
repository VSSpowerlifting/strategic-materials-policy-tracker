/**
 * M2.7 one-off structural source-admission audit. Uses exactly the M2.5 DOE
 * sources, no scheduled crawler/identity/fingerprints/editorial or policy rows.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  DOE_CMEI_EXAMPLES, DOE_CMEI_LISTING_0, DOE_CMEI_LISTING_1,
  getPublisherHtml,
} from "./doe-cmei-forensics";
import {
  compareDoeOfficialHeader, parseDoeStructuredArticleHeader,
  parseDoeStructuredListing, validateDoePagination, type DoeCmeiRow,
  type DoeCmeiHeader,
} from "./doe-cmei-structured-parser";

const OUT = join(process.cwd(), ".monitor-doe-structured");
const NOW = () => new Date().toISOString();
type Sample = {
  role: string; url: string; header: DoeCmeiHeader;
  matchedInTwoPageListing: boolean; bodyCandidates: { tag: string; boundedMarkup: string }[];
};
type Report = {
  version: 1;
  mode: "doe_cmei_structured_admission_only";
  checkedAt: string;
  health: "forensic_only" | "degraded";
  listingRows: DoeCmeiRow[];
  pageCount: number;
  overlapCount: number;
  articleSamples: Sample[];
  errors: string[];
  bodyBoundaryConfirmed: false;
  sourceStateCreated: false;
  enabledForMonitoring: false;
};
function bodyCandidateHints(html: string): {tag:string;boundedMarkup:string}[] {
  const bounds = [...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article\s*>/gi)]
    .filter(x => /schema:Article/.test(x[1]));
  if (bounds.length !== 1) return [];
  const article = bounds[0][2];
  const result: {tag:string;boundedMarkup:string}[] = [];
  const tags = [...article.matchAll(/<(?:div|section)\b[^>]*class\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>/gi)];
  for (const t of tags) {
    const name=(t[1] ?? t[2]).split(/\s+/).filter(x =>
      /(?:body|article-content|field--name-body|field--type-text)/i.test(x)).join(" ");
    if (!name) continue;
    const pos=t.index ?? 0;
    result.push({tag:t[0].slice(0,240),boundedMarkup:article.slice(Math.max(0,pos-140),pos+1000)});
    if (result.length>=4) break;
  }
  return result;
}
function summarize(r: Report): string {
  return [
    "## SMPT M2.7 — DOE CMEI structured publisher-admission evidence",
    "",
    "UTC " + r.checkedAt + ". **" + r.health + "**. Collector active: **NO**.",
    "Completed listing pages: " + r.pageCount + "/2; source-scoped rows: " + r.listingRows.length +
      "; page overlap: " + r.overlapCount + ".",
    "Original DOE article header samples: " + r.articleSamples.length + "/3.",
    "Index source attributions: " +
      r.listingRows.filter(x=>x.issuingOffice!==null).length +
      " CMEI-office-confirmed, " +
      r.listingRows.filter(x=>x.issuingOffice===null).length +
      " Energy.gov-sitewide only (issuer NOT established by the listing).",
    "",
    "| Displayed publisher date | Attribution as listed | Confirmed listing issuer | Document type | Original DOE URL |",
    "| --- | --- | --- | --- | --- |",
    ...r.listingRows.map(x=>"| "+x.publicationDate+" | "+x.attributionAsListed+
      " | "+(x.issuingOffice??"not established")+" | "+
      x.documentType.replace(/\|/g,"\\|")+" | "+x.officialUrl+" |"),
    "",
    "### Sampled DOE article headers",
    ...r.articleSamples.map(x=>"- "+x.role+": "+x.header.publicationDate+
      "; matched listing: "+(x.matchedInTwoPageListing?"yes":"NO")+
      "; body-region selector hints: "+x.bodyCandidates.length+
      "; **no certified body boundary**."),
    "",
    "### Errors",
    ...(r.errors.length?r.errors.map(x=>"- "+x):["- none"]),
    "",
    "Full evidence in report.json. No baseline, body hash, classification, approval, financial event or commitment.",
    "A successfully parsed date is a publisher source date, not a financial obligation.",
    "",
  ].join("\n");
}
async function main() {
  if (process.argv.slice(2).join(" ")==="--check-runtime") {
    process.stdout.write("DOE CMEI structured provenance startup passed (offline, no network, no state)\n");
    return;
  }
  if (process.argv.length!==2) throw Error("Unsupported structured DOE probe arguments");
  const errors:string[]=[];
  const rows: DoeCmeiRow[]=[];
  const pages: DoeCmeiRow[][]=[];
  const samples:Sample[]=[];
  const targetPages=[DOE_CMEI_LISTING_0,DOE_CMEI_LISTING_1];
  for (const url of targetPages) {
    try {
      const html=await getPublisherHtml(url,fetch);
      const parsed=parseDoeStructuredListing(html.html,url);
      pages.push(parsed);
      rows.push(...parsed);
    } catch(e) {
      errors.push("Failed DOI filtered page "+url+": "+String(e).slice(0,260));
    }
  }
  let overlap=0;
  if (pages.length===2) {
    overlap=pages[1].filter(x=>pages[0].some(y=>x.officialUrl===y.officialUrl)).length;
    try {validateDoePagination(pages[0],pages[1]);}
    catch(e) {errors.push("Two-page continuity rejected: "+String(e).slice(0,260));}
  } else errors.push("Fewer than two valid, distinct DOE filtered listing pages");
  for (const sample of DOE_CMEI_EXAMPLES) {
    try {
      const html=await getPublisherHtml(sample.url,fetch);
      const header=parseDoeStructuredArticleHeader(html.html,sample.url);
      const card=rows.find(x=>x.officialUrl===header.officialUrl);
      // Extract original publisher evidence even when the index failed. A
      // missing index must still remain red, but must not suppress direct
      // header diagnostics and force another needless source probe.
      if (!card) {
        errors.push("Sample "+sample.role+" original article parsed but source index "+
          "could not establish its corresponding card");
      } else {
        compareDoeOfficialHeader(card,header);
      }
      samples.push({
        role:sample.role,url:sample.url,header,matchedInTwoPageListing:!!card,
        bodyCandidates:bodyCandidateHints(html.html),
      });
    } catch(e) {
      errors.push("Original DOE "+sample.role+" failed structured header: "+String(e).slice(0,260));
    }
  }
  if (samples.length!==3) errors.push("Not all three DOE original publisher samples passed");
  const report:Report={
    version:1,mode:"doe_cmei_structured_admission_only",checkedAt:NOW(),
    health:errors.length?"degraded":"forensic_only",
    listingRows:rows,pageCount:pages.length,overlapCount:overlap,
    articleSamples:samples,errors,
    bodyBoundaryConfirmed:false,sourceStateCreated:false,enabledForMonitoring:false,
  };
  mkdirSync(OUT,{recursive:true,mode:0o700});
  writeFileSync(join(OUT,"report.json"),JSON.stringify(report,null,2)+"\n",{mode:0o600});
  const summary=summarize(report);
  writeFileSync(join(OUT,"summary.md"),summary,{mode:0o600});
  process.stdout.write(summary);
  if(report.health!=="forensic_only")process.exitCode=1;
}
main().catch(e=>{process.stderr.write("DOE structured admission failed: "+String(e)+"\n");process.exitCode=1;});
