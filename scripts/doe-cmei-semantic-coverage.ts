/**
 * M2.9b DOE ARTICLE COVERAGE GAP INVENTORY — evidence only.
 *
 * Inspect the already publisher-validated schema:Article in a bounded page
 * and report HTML elements that the M2.8 experimental body hash can miss or
 * flatten. Never grant publication/rights/semantic-completeness approval.
 * The hashes are local fingerprints of a potentially missed element, not
 * official source-body attestations or approved revision hashes.
 */
import { createHash } from "node:crypto";
import { parseDoeBodyProof } from "./doe-cmei-body-proof";

export type DoeSemanticRisk =
  | "structured_table"
  | "embedded_media"
  | "image_or_caption"
  | "outside_text_field"
  | "outside_cited_link";
export type DoeCoverageGap = {
  kind: DoeSemanticRisk;
  tag: string;
  insideKnownTextField: boolean;
  elementFingerprint: string;
  /** Bounded structural parents only; no element text, URL, or HTML attributes. */
  ancestorTrail: string[];
};
export type DoeSemanticCoverage = {
  mode: "doe_manual_semantic_gap_inventory_only";
  officialUrl: string;
  candidateBodyFingerprint: string;
  risks: Record<DoeSemanticRisk, number>;
  riskTotal: number;
  sample: DoeCoverageGap[];
  sampleTruncated: boolean;
  /** Never an automatic certificate, even for a clean observed sample. */
  fullBodyBoundaryConfirmed: false;
  eligibleForRevisionTracking: false;
  collectorActivationAuthorized: false;
  sourceUseApproved: false;
};

const MAX_HTML_BYTES = 2_000_000;
const MAX_RISKS = 300;
const MAX_SAMPLE = 24;
const LIMITS: readonly DoeSemanticRisk[] = [
  "structured_table", "embedded_media", "image_or_caption",
  "outside_text_field", "outside_cited_link",
];
const MEDIA = new Set(["iframe","embed","object","video","audio","canvas","svg"]);
const IMAGES = new Set(["img","figure","figcaption","picture","source"]);
const VOID = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
type Frame = {tag:string; isTextField:boolean; isAccordionButton:boolean; isPublisherHeader:boolean; classHint:string|null};

function cls(attrs:string,name:string):boolean{
  const m=/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
  return !!m && (m[1]??m[2]).split(/\s+/).includes(name);
}
/** Publisher CSS class names can identify ownership without exposing content or links. */
function safeClassHint(attrs:string):string|null{
  const m=/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
  if(!m)return null;
  const hints=(m[1]??m[2]).split(/\s+/)
    .filter(x=>/^[a-z][a-z0-9_-]{0,50}$/i.test(x)).slice(0,2);
  return hints.length?hints.join("."):null;
}
function riskAncestorTrail(stack:readonly Frame[]):string[]{
  return stack.slice(-6).map(parent=>
    parent.tag+(parent.classHint?"."+parent.classHint:""));
}
function boundedArticle(input:string):string{
  const mains=[...input.matchAll(/<main\b[^>]*>([\s\S]*?)<\/main\s*>/gi)];
  if(mains.length!==1)throw Error("DOE semantic coverage needs one original main");
  const main=mains[0][1];
  const articles=[...main.matchAll(/<article\b([^>]*)>/gi)]
    .filter(x=>/\btypeof\s*=\s*(?:"[^"]*schema:Article[^"]*"|'[^']*schema:Article[^']*')/i.test(x[1]));
  if(articles.length!==1)throw Error("DOE semantic coverage needs one original schema:Article");
  const start=articles[0].index??0;
  const opener=articles[0][0];
  const matcher=/<\/?article\b[^>]*>/gi;
  matcher.lastIndex=start+opener.length;
  let depth=1,tag:RegExpExecArray|null;
  while((tag=matcher.exec(main))){
    depth+=tag[0].startsWith("</")?-1:1;
    if(depth===0)return main.slice(start+opener.length,tag.index);
  }
  throw Error("DOE semantic coverage article not closed");
}
/** Build a bounded fingerprint for the exact element or subtree, without exposing text. */
function elementFingerprint(fragment:string,start:number,tag:string,opener:string):string{
  if(VOID.has(tag)||/\/\s*>$/.test(opener))
    return createHash("sha256").update(opener).digest("hex");
  const matcher=new RegExp("<\\/?"+tag+"\\b[^>]*>","gi");
  matcher.lastIndex=start+opener.length;
  let depth=1,m:RegExpExecArray|null;
  while((m=matcher.exec(fragment))){
    depth+=m[0].startsWith("</")?-1:1;
    if(depth===0)return createHash("sha256").update(fragment.slice(start,matcher.lastIndex)).digest("hex");
  }
  // A malformed subsection is not silently called complete or healthy.
  throw Error("DOE semantic gap element has an unmatched "+tag+" boundary");
}
function reason(tag:string,inField:boolean,inHeader:boolean,inAccordion:boolean,attrs:string):DoeSemanticRisk|null{
  if(inHeader)return null;
  if(tag==="table"||tag==="thead"||tag==="tbody"||tag==="tfoot")return "structured_table";
  if(MEDIA.has(tag))return "embedded_media";
  if(IMAGES.has(tag))return "image_or_caption";
  if(!inField&&!inAccordion&&
     (tag==="p"||tag==="blockquote"||/^h[2-6]$/.test(tag)||tag==="ol"||tag==="ul"))
    return "outside_text_field";
  if(!inField&&!inAccordion&&tag==="a"&&/\bhref\s*=/i.test(attrs))
    return "outside_cited_link";
  return null;
}
export function auditDoeSemanticCoverage(html:string,articleUrl:string):DoeSemanticCoverage{
  if(Buffer.byteLength(html,"utf8")>MAX_HTML_BYTES)
    throw Error("DOE semantic coverage HTML exceeds original source bound");
  // The candidate proof already validates official URL, source-owned header,
  // date, article and minimum publisher-text fields before any gap counting.
  const proof=parseDoeBodyProof(html,articleUrl);
  const fragment=boundedArticle(html);
  const stack:Frame[]=[];
  const counters=Object.fromEntries(LIMITS.map(x=>[x,0])) as Record<DoeSemanticRisk,number>;
  const sample:DoeCoverageGap[]=[];
  let total=0;
  const tags=/<(\/?)([a-z][a-z0-9:-]*)\b([^>]*?)>/gi;
  let match:RegExpExecArray|null;
  while((match=tags.exec(fragment))){
    const closing=match[1]==="/",tag=match[2].toLowerCase(),attrs=match[3];
    if(closing){
      const top=stack.pop();
      if(!top||top.tag!==tag)
        throw Error("DOE semantic coverage malformed closing markup");
      continue;
    }
    const isField=tag==="div" && cls(attrs,"field--name-field-text")&&cls(attrs,"field--type-text-long");
    const isButton=tag==="button"&&cls(attrs,"usa-accordion__button");
    const isHeader=cls(attrs,"beneath-title");
    const inField=isField||stack.some(x=>x.isTextField);
    const inAccordion=isButton||stack.some(x=>x.isAccordionButton);
    const inHeader=isHeader||stack.some(x=>x.isPublisherHeader);
    const risk=reason(tag,inField,inHeader,inAccordion,attrs);
    if(risk){
      counters[risk]++;
      total++;
      if(total>MAX_RISKS)throw Error("DOE semantic coverage exceeded risk inventory bound");
      if(sample.length<MAX_SAMPLE){
        sample.push({
          kind:risk,tag,insideKnownTextField:inField,
          elementFingerprint:elementFingerprint(fragment,match.index,tag,match[0]),
          ancestorTrail:riskAncestorTrail(stack),
        });
      }
    }
    if(!VOID.has(tag)&&!/\/\s*>$/.test(match[0]))
      stack.push({tag,isTextField:isField,isAccordionButton:isButton,isPublisherHeader:isHeader,
        classHint:safeClassHint(attrs)});
  }
  if(stack.length)throw Error("DOE semantic coverage has unclosed markup");
  return {
    mode:"doe_manual_semantic_gap_inventory_only",
    officialUrl:proof.officialUrl,candidateBodyFingerprint:proof.candidateFingerprint,
    risks:counters,riskTotal:total,sample,sampleTruncated:total>MAX_SAMPLE,
    fullBodyBoundaryConfirmed:false,eligibleForRevisionTracking:false,
    collectorActivationAuthorized:false,sourceUseApproved:false,
  };
}
