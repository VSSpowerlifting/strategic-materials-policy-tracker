/** Public source-register filters; citation counts are explicit reverse-provenance links, never evidence scores. */
import type { Source } from "./types";
import type { SourceUse, SourceUseKind } from "./source-usage";
import { SOURCE_USE_KINDS } from "./source-use-taxonomy";
import { SOURCE_CONFIDENCE, type SourceConfidence } from "./types";

export type SourceDirectoryRow = {source:Source; directlyCitingRecords:number; citingKinds:SourceUseKind[]};
export type SourceDirectoryFilters = {
  q?:string; confidence?:string; sourceType?:string; language?:string;
  publication?:string; citingKind?:string;
};
export const UNCITED_FILTER="not_cited";
export const normalizeSourceQuery=(s:string)=>s.normalize("NFKD")
  .replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
const lex=(a:string,b:string)=>a<b?-1:a>b?1:0;
const tierOrder=new Map<SourceConfidence,number>(SOURCE_CONFIDENCE.map((s,i)=>[s,i]));
const kindOrder=new Map<SourceUseKind,number>(SOURCE_USE_KINDS.map((s,i)=>[s,i]));
export function buildSourceDirectory(
  sources:readonly Source[], uses:ReadonlyMap<string,readonly SourceUse[]>,
):SourceDirectoryRow[]{
  const ids=new Set(sources.map(s=>s.id));
  if(ids.size!==sources.length)throw new Error("Duplicate source directory ID");
  for(const id of uses.keys())if(!ids.has(id))throw new Error("Unknown source use index key: "+id);
  return sources.map(source=>{
    const refs=uses.get(source.id)??[];
    const unique=new Set<string>();
    for(const use of refs){
      const key=use.kind+":"+use.id;
      if(unique.has(key))throw new Error("Duplicate citing record "+key+" for "+source.id);
      if(!kindOrder.has(use.kind))throw new Error("Unrecognized citation kind "+use.kind);
      unique.add(key);
    }
    return {source:{...source},directlyCitingRecords:unique.size,
      citingKinds:[...new Set(refs.map(x=>x.kind))].sort((a,b)=>
        (kindOrder.get(a)??99)-(kindOrder.get(b)??99))};
  }).sort((a,b)=>(tierOrder.get(a.source.confidence)??99)-(tierOrder.get(b.source.confidence)??99)
    ||lex(a.source.title,b.source.title)||lex(a.source.id,b.source.id));
}
export function filterSourceDirectory(rows:readonly SourceDirectoryRow[],f:SourceDirectoryFilters):SourceDirectoryRow[]{
  const terms=normalizeSourceQuery(f.q??"").split(" ").filter(Boolean);
  return rows.filter(({source:s,directlyCitingRecords,citingKinds})=>{
    if(f.confidence&&f.confidence!=="all"&&s.confidence!==f.confidence)return false;
    if(f.sourceType&&f.sourceType!=="all"&&s.sourceType!==f.sourceType)return false;
    if(f.language&&f.language!=="all"&&s.language!==f.language)return false;
    if(f.publication==="dated"&&!s.datePublished)return false;
    if(f.publication==="undated"&&!!s.datePublished)return false;
    if(f.citingKind&&f.citingKind!=="all"){
      if(f.citingKind===UNCITED_FILTER){
        if(directlyCitingRecords!==0)return false;
      }else if(!citingKinds.includes(f.citingKind as SourceUseKind))return false;
    }
    const haystack=normalizeSourceQuery([
      s.id,s.title,s.publisher,s.url,s.notes??"",s.language,s.datePublished??"",s.dateAccessed
    ].join(" "));
    return terms.every(term=>haystack.includes(term));
  });
}
