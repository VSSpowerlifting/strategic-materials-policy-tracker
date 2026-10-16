"use client";
import {useMemo,useState} from "react";
import {SourceCard} from "@/components/source-ref";
import {ALL,FilterSelect,SearchBox,useUrlFilters} from "@/components/capital/filter-controls";
import {SOURCE_CONFIDENCE,SOURCE_LANGS,SOURCE_TYPES} from "@/lib/types";
import {SOURCE_USE_KINDS,SOURCE_USE_LABELS} from "@/lib/source-usage";
import {confidenceLabels,sourceTypeLabels} from "@/lib/labels";
import {filterSourceDirectory,UNCITED_FILTER,type SourceDirectoryRow} from "@/lib/source-directory";

const hierarchyNotes:Record<string,string>={
 primary:"Original official or directly issuing documents; primary does not necessarily mean government-issued.",
 official_translation:"Official or institutional translations of primary documents.",
 government_media:"State- or government-affiliated reporting, not neutral third-party verification.",
 secondary:"Secondary research or reporting, subject to its evidentiary limits.",
};
const languages:Record<string,string>={en:"English",zh:"Chinese",ja:"Japanese",fr:"French",
 et:"Estonian",bilingual:"Bilingual",other:"Other"};
export function SourceRegisterExplorer({rows}:{rows:SourceDirectoryRow[]}){
 const [q,setQ]=useState("");
 const [confidence,setConfidence]=useState(ALL);
 const [sourceType,setSourceType]=useState(ALL);
 const [language,setLanguage]=useState(ALL);
 const [publication,setPublication]=useState(ALL);
 const [citingKind,setCitingKind]=useState(ALL);
 const options=useMemo(()=>{
  const count=(p:(r:SourceDirectoryRow)=>boolean)=>rows.filter(p).length;
  return {
   confidence:SOURCE_CONFIDENCE.filter(c=>rows.some(r=>r.source.confidence===c))
     .map(c=>({value:c,label:confidenceLabels[c],count:count(r=>r.source.confidence===c)})),
   sourceType:SOURCE_TYPES.filter(t=>rows.some(r=>r.source.sourceType===t))
     .map(t=>({value:t,label:sourceTypeLabels[t],count:count(r=>r.source.sourceType===t)})),
   language:SOURCE_LANGS.filter(l=>rows.some(r=>r.source.language===l))
     .map(l=>({value:l,label:languages[l],count:count(r=>r.source.language===l)})),
   publication:[
     {value:"dated",label:"Publisher date recorded",count:count(r=>!!r.source.datePublished)},
     {value:"undated",label:"Publisher date unknown",count:count(r=>!r.source.datePublished)},
   ],
   citingKind:[
     ...SOURCE_USE_KINDS.filter(k=>rows.some(r=>r.citingKinds.includes(k)))
       .map(k=>({value:k,label:SOURCE_USE_LABELS[k],count:count(r=>r.citingKinds.includes(k))})),
     ...(rows.some(r=>r.directlyCitingRecords===0)?[{
       value:UNCITED_FILTER,label:"No directly citing record",count:count(r=>r.directlyCitingRecords===0)}]:[]),
   ],
  };
 },[rows]);
 useUrlFilters({q,confidence,sourceType,language,publication,citingKind},incoming=>{
   const checked=(key:keyof typeof options,v:string|undefined)=>
     v&&options[key].some(o=>o.value===v)?v:ALL;
   setQ((incoming.q??"").slice(0,256));
   setConfidence(checked("confidence",incoming.confidence));
   setSourceType(checked("sourceType",incoming.sourceType));
   setLanguage(checked("language",incoming.language));
   setPublication(checked("publication",incoming.publication));
   setCitingKind(checked("citingKind",incoming.citingKind));
 });
 const visible=useMemo(()=>filterSourceDirectory(rows,{
   q,confidence,sourceType,language,publication,citingKind
 }),[rows,q,confidence,sourceType,language,publication,citingKind]);
 const active=!!q.trim()||[confidence,sourceType,language,publication,citingKind].some(v=>v!==ALL);
 const clear=()=>{setQ("");setConfidence(ALL);setSourceType(ALL);setLanguage(ALL);
   setPublication(ALL);setCitingKind(ALL)};
 return <div>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
     <div className="sm:col-span-2 lg:col-span-2">
       <SearchBox id="source-query" value={q} onChange={setQ} placeholder="Publisher, title, source ID, language or text…"/>
     </div>
     <FilterSelect id="source-confidence" label="Source confidence tier" value={confidence} onChange={setConfidence} options={options.confidence}/>
     <FilterSelect id="source-kind" label="Document type" value={sourceType} onChange={setSourceType} options={options.sourceType}/>
     <FilterSelect id="source-language" label="Original language" value={language} onChange={setLanguage} options={options.language}/>
     <FilterSelect id="source-publication" label="Publication-date completeness" value={publication} onChange={setPublication} options={options.publication}/>
     <FilterSelect id="source-cited" label="Directly citing record type" value={citingKind} onChange={setCitingKind} options={options.citingKind}/>
   </div>
   <div className="mt-4 flex flex-wrap items-center gap-3">
     <p className="font-mono text-xs text-muted" role="status" aria-live="polite">
       <span data-testid="sources-count" className="tnum text-foreground">{visible.length}</span> of {rows.length} registered sources
     </p>
     {active?<button type="button" onClick={clear}
       className="font-mono text-xs text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
       Clear filters</button>:null}
   </div>
   <p className="mt-2 max-w-4xl text-xs leading-5 text-faint">
     Direct citations count distinct published records, not individual assertions, independent corroborations or policy effects.
     Missing publication dates remain unknown. Source access dates are recorded observations, not event or publication dates.
   </p>
   <div className="mt-10 space-y-12">
     {SOURCE_CONFIDENCE.map((tier,i)=>{
       const group=visible.filter(r=>r.source.confidence===tier);
       if(!group.length)return null;
       return <section key={tier} aria-labelledby={"source-tier-"+tier}>
         <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-border pb-3">
           <span className="font-mono text-xs text-faint">{String(i+1).padStart(2,"0")}</span>
           <h2 id={"source-tier-"+tier} className="font-display text-xl font-semibold">
             {confidenceLabels[tier]} <span className="font-mono text-xs font-normal text-muted">({group.length})</span>
           </h2>
         </div>
         <p className="mb-4 max-w-prose text-sm leading-6 text-muted">{hierarchyNotes[tier]}</p>
         <div className="grid gap-3">
           {group.map(r=><div key={r.source.id} data-testid="source-record" className="min-w-0">
             <SourceCard source={r.source}/>
             <p className="mt-1 pl-1 font-mono text-[11px] text-muted">
               {r.directlyCitingRecords} directly citing published record{r.directlyCitingRecords===1?"":"s"}
               {r.citingKinds.length?" · "+r.citingKinds.map(k=>SOURCE_USE_LABELS[k]).join(" · "):""}
             </p>
           </div>)}
         </div>
       </section>;
     })}
   </div>
   {!visible.length?<div className="mt-10 rounded-lg border border-dashed p-8 text-center text-sm text-muted">
     No registered source matches these filters.
     <button type="button" onClick={clear} className="ml-2 text-accent hover:underline">Show all sources</button>
   </div>:null}
 </div>;
}
