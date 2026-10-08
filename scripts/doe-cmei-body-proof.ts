/**
 * M2.8 DOE body-boundary *candidate*, not a verified revision fingerprint.
 * Source: observed M2.7 DOE publisher HTML, artifact run 37825957544.
 * Do NOT use the hash as a production publication identity until full
 * structural (headings, accordion, tables, embeds) coverage is adjudicated.
 */
import {createHash} from "node:crypto";
import {parseDoeStructuredArticleHeader, type DoeCmeiHeader} from "./doe-cmei-structured-parser";

type Segment = {kind:"publisher_text_field"|"accordion_heading"; text:string; links:string[]};
export type DoeBodyProof = {
  officialUrl: string;
  title: string;
  publicationDate: string;
  issuingOffice: string;
  candidateFieldCount: number;
  accordionHeadingCount: number;
  segmentCount: number;
  textCharacterCount: number;
  sourceLinkCount: number;
  candidateFingerprint: string;
  representativePreview: string;
  /** Explicitly false until semantic/full-body review of actual DOE markup. */
  fullBodyBoundaryConfirmed: false;
  eligibleForRevisionTracking: false;
  caveats: string[];
};
const BOUND = 2_000_000;
function hasClass(attrs:string,cls:string):boolean {
  const m=/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
  return !!m && (m[1]??m[2]).split(/\s+/).includes(cls);
}
function decodeHtml(s:string):string {
  const named:Record<string,string>={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" ",rsquo:"’",lsquo:"‘",rdquo:"”",ldquo:"“",mdash:"—",ndash:"–"};
  return s.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi,(raw,entity:string)=>{
    const key=entity.toLowerCase();
    if (named[key]!==undefined) return named[key];
    if(key.startsWith("#")){
      const n=key.startsWith("#x")?parseInt(key.slice(2),16):parseInt(key.slice(1),10);
      if (Number.isInteger(n)&&n>0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff))return String.fromCodePoint(n);
    }
    return raw;
  });
}
function bodyText(html:string):string {
  return decodeHtml(html
    .replace(/<(?:script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/(?:script|style|noscript|svg)>/gi," ")
    .replace(/<[^>]*>/g," ").replace(/\s+/g," ")).trim().normalize("NFKC");
}
/**
 * Return a balanced original-tag boundary, refusing a missing close.
 * Only the exact known publisher field class is extracted; chrome outside
 * the original schema:Article can never enter the candidate fingerprint.
 */
function balancedFragment(html:string,tag:"article"|"div",start:number):{inner:string;end:number}{
  const pattern=new RegExp("<\\/?" + tag + "\\b[^>]*>","gi");
  pattern.lastIndex=start;
  const first=pattern.exec(html);
  if(!first||first.index!==start||first[0].startsWith("</"))throw Error("DOE body has an invalid "+tag+" opener");
  let depth=1;let m:RegExpExecArray|null;
  while((m=pattern.exec(html))){
    if(m[0].startsWith("</"))depth--;else depth++;
    if(depth===0)return {inner:html.slice(start+first[0].length,m.index),end:pattern.lastIndex};
    if(depth<0)break;
  }
  throw Error("DOE body missing closed "+tag+" boundary");
}
function linkedEvidence(html:string,officialUrl:string):string[]{
  const out:string[]=[];
  for(const a of html.matchAll(/<a\b([^>]*)>/gi)){
    const attr=/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(a[1]);
    const raw=decodeHtml(attr?.[1]??attr?.[2]??"");
    if(!raw||raw.startsWith("#")||raw.startsWith("mailto:"))continue;
    let url:URL;
    try {url=new URL(raw,officialUrl);} catch {throw Error("DOE body contains invalid source link");}
    if(!["https:","http:"].includes(url.protocol)||url.username||url.password)
      throw Error("DOE body contains unsupported source link scheme");
    // Dynamic fragments are display navigation, not target document identity.
    url.hash="";
    out.push(url.toString());
  }
  return out;
}
export function parseDoeBodyProof(html:string,articleUrl:string):DoeBodyProof{
  if(!/<html\b/i.test(html)||Buffer.byteLength(html,"utf8")>BOUND)
    throw Error("DOE body input missing bounded publisher HTML");
  const header:DoeCmeiHeader=parseDoeStructuredArticleHeader(html,articleUrl);
  const main=[...html.matchAll(/<main\b[^>]*>([\s\S]*?)<\/main\s*>/gi)];
  if(main.length!==1)throw Error("DOE body requires unique main boundary");
  const matches=[...main[0][1].matchAll(/<article\b([^>]*)>/gi)]
    .filter(x=>/\btypeof\s*=\s*(?:"[^"]*schema:Article[^"]*"|'[^']*schema:Article[^']*')/i.test(x[1]));
  if(matches.length!==1)throw Error("DOE body requires one schema:Article");
  const article=balancedFragment(main[0][1],"article",matches[0].index??0).inner;
  const found:{at:number;segment:Segment}[]=[];
  let fields=0,headings=0;
  for(const m of article.matchAll(/<div\b([^>]*)>/gi)){
    if(!hasClass(m[1],"field--name-field-text")||!hasClass(m[1],"field--type-text-long"))continue;
    const at=m.index??0;
    const fragment=balancedFragment(article,"div",at).inner;
    const txt=bodyText(fragment);
    if(txt.length<24||txt.length>80_000)
      throw Error("DOE text field empty, truncated or implausibly large");
    found.push({at,segment:{kind:"publisher_text_field",text:txt,
      links:linkedEvidence(fragment,articleUrl)}});
    fields++;
  }
  for(const m of article.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button\s*>/gi)){
    if(!hasClass(m[1],"usa-accordion__button"))continue;
    const text=bodyText(m[2]);
    if(!text||text.length>600)throw Error("DOE article accordion heading invalid");
    found.push({at:m.index??0,segment:{kind:"accordion_heading",text,links:[]}});
    headings++;
  }
  if(fields<1||fields>80)throw Error("DOE article lacks bounded official long-text fields");
  if(headings>120)throw Error("DOE article has implausible accordion headings");
  found.sort((a,b)=>a.at-b.at);
  const segments=found.map(x=>x.segment);
  const allText=segments.map(x=>x.text).join("\n");
  if(allText.length<170||allText.length>180_000)
    throw Error("DOE body candidate text outside bounded range");
  const fingerprint=createHash("sha256").update(JSON.stringify({
    version:"candidate-only-v1",segments,
  })).digest("hex");
  return {
    officialUrl:header.officialUrl,title:header.title,
    publicationDate:header.publicationDate,issuingOffice:header.issuingOffice,
    candidateFieldCount:fields,accordionHeadingCount:headings,segmentCount:segments.length,
    textCharacterCount:allText.length,
    sourceLinkCount:segments.reduce((n,s)=>n+s.links.length,0),
    candidateFingerprint:fingerprint,
    representativePreview:allText.slice(0,320),
    fullBodyBoundaryConfirmed:false,eligibleForRevisionTracking:false,
    caveats:[
      "Only observed field--name-field-text and accordion button content is hashed; other semantic publisher content may exist.",
      "Fingerprint is a bounded engineering diagnostic, NOT an approved DOI/DOE publication revision signal.",
      "Source-link hrefs are included so changes to cited destinations are not silently ignored.",
      "Original full publisher body, copyright/reuse, accessibility and embedded content completeness require independent review.",
      "DOE funding selections, competitions and prizes are NOT automatically funded or binding obligations.",
    ],
  };
}
