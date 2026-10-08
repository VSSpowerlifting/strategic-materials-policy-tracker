/**
 * M2.9 DOE shadow-state CONTINUITY CONTRACT ONLY.
 *
 * No collector, workflow, persisted file, baseline, or approved content hash.
 * A future authorized monitor may call this pure, fail-closed proposal, but
 * not until source-body completeness, source-use and baseline review pass.
 *
 * DOE publisher observations are NOT approved policy/finance records.
 */
import { createHash } from "node:crypto";
export const DOE_SHADOW_SOURCE_ID = "watch-us-doe-cmei-news-shadow" as const;
export const DOE_SHADOW_MAX_SAVED = 3000;
export type DoeShadowStateV1 = {
  version: 1;
  sourceId: typeof DOE_SHADOW_SOURCE_ID;
  semanticVersion: string;
  seen: Record<string, string>;
  lastLatestId: string;
  lastSuccessfulAt: string;
};
export type DoePublisherObservation = {
  officialUrl: string;
  title: string;
  publicationDate: string;
  attributionAsListed: "Office of Critical Minerals and Energy Innovation" | "Energy.gov";
  issuingOffice: "Office of Critical Minerals and Energy Innovation" | null;
  /** Stable complete semantic body + metadata digest, NOT an M2.8 candidate. */
  approvedSemanticFingerprint: string;
  /** Future separately reviewed publisher-article/header match. */
  originalHeaderVerified: true;
};
export type DoeCoverageGate = {
  observedAt: string;
  /** Future independently proven article-body/heading/link completeness. */
  fullBodyBoundaryCertified: true;
  /** Source-use and copyright guard separately adjudicated. */
  sourceUseApproved: true;
  /** Page + date + issuer + body response continuity verified independently. */
  sourceWindowComplete: true;
  /** Explicit human-accepted approved semantic fingerprint format. */
  approvedSemanticVersion: string;
  /** For now, two known publisher-card pages. Later version separately. */
  publisherPagesVerified: 2;
  originalArticleHeadersVerified: true;
  /** This contract cannot authorize the first baseline. */
  priorStateRecoveredFromIndependentArtifact: true;
};
export type DoeShadowPreview = {
  mode: "shadow_state_transition_preview_only";
  status: "would_advance" | "coverage_gap";
  previousState: DoeShadowStateV1;
  proposedState: DoeShadowStateV1;
  noStateWritten: true;
  possibleWindowGap: boolean;
  reviewOnly: {
    observationId: string;
    officialUrl: string;
    titleAsListed: string;
    publisherDate: string;
    attributionAsListed: DoePublisherObservation["attributionAsListed"];
    issuingOffice: DoePublisherObservation["issuingOffice"];
    change: "new" | "revised";
    reviewStatus: "unreviewed";
    cannotPromoteFinancialClaim: true;
  }[];
};
const HEX = /^[0-9a-f]{64}$/;
const MODE = /^doe-semantic-v[1-9]\d{0,2}$/;
function isObject(a:unknown):a is Record<string,unknown> {
  return typeof a==="object" && a!==null && !Array.isArray(a);
}
function utc(value:unknown):value is string {
  if(typeof value!=="string"||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value))return false;
  const d=new Date(value);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10)===value.slice(0,10);
}
function date(s:unknown):s is string {
  if(typeof s!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
  const dt=new Date(s+"T00:00:00Z");
  return Number.isFinite(dt.getTime())&&dt.toISOString().slice(0,10)===s;
}
function officialUrl(s:string):string {
  const u=new URL(s);
  if(u.origin!=="https://www.energy.gov"||u.username||u.password||
     u.search||u.hash||u.port||
     !/^\/(?:cmei\/articles|articles)\/[a-z0-9][a-z0-9-]+$/i.test(u.pathname))
    throw Error("DOE continuity requires exact canonical HTTPS official article URLs");
  return u.toString();
}
function sourceId(url:string):string {
  return createHash("sha256").update(DOE_SHADOW_SOURCE_ID+"\n"+url).digest("hex");
}
export function readDoeShadowState(raw:unknown):DoeShadowStateV1 {
  // Never manufacture a new baseline from missing, expired or corrupt state.
  if(!isObject(raw)||raw.version!==1||raw.sourceId!==DOE_SHADOW_SOURCE_ID||
     typeof raw.semanticVersion!=="string"||!MODE.test(raw.semanticVersion)||
     !isObject(raw.seen)||!utc(raw.lastSuccessfulAt)||
     typeof raw.lastLatestId!=="string"||!HEX.test(raw.lastLatestId))
    throw Error("DOE prior source state unavailable/corrupt: restore independently reviewed artifact, never rebaseline");
  const items=Object.entries(raw.seen);
  if(items.length===0||items.length>DOE_SHADOW_MAX_SAVED||
     !Object.prototype.hasOwnProperty.call(raw.seen,raw.lastLatestId)||
     items.some(([key,v])=>!HEX.test(key)||typeof v!=="string"||!HEX.test(v)))
    throw Error("DOE source state has invalid identity map or missing last-latest anchor");
  if(Object.keys(raw).some(k=>!["version","sourceId","semanticVersion","seen","lastLatestId","lastSuccessfulAt"].includes(k)))
    throw Error("DOE prior state schema mismatch; explicit source version upgrade required");
  return {
    version:1,sourceId:DOE_SHADOW_SOURCE_ID,semanticVersion:raw.semanticVersion,
    // Every entry's key/value was checked as a 64-character digest above.
    seen:Object.fromEntries(items) as Record<string,string>,lastLatestId:raw.lastLatestId,
    lastSuccessfulAt:raw.lastSuccessfulAt,
  };
}
function validateGate(g:DoeCoverageGate,prev:DoeShadowStateV1):void {
  if(!utc(g.observedAt)||g.observedAt<=prev.lastSuccessfulAt||
     g.fullBodyBoundaryCertified!==true||g.sourceUseApproved!==true||
     g.sourceWindowComplete!==true||g.originalArticleHeadersVerified!==true||
     g.publisherPagesVerified!==2||g.priorStateRecoveredFromIndependentArtifact!==true||
     g.approvedSemanticVersion!==prev.semanticVersion)
    throw Error("DOE state update is unapproved: missing body/source-use/continuity/recovery gate");
}
export function previewDoeShadowTransition(
  persistedState:unknown, observations:readonly DoePublisherObservation[],
  gate:DoeCoverageGate,
):DoeShadowPreview {
  const prev=readDoeShadowState(persistedState);
  validateGate(gate,prev);
  if(observations.length<10||observations.length>70)
    throw Error("DOE source window lacks bounded publisher-card evidence");
  const docs:{id:string;row:DoePublisherObservation}[]=[];
  const duplicates=new Set<string>();
  for(const row of observations){
    const url=officialUrl(row.officialUrl);
    if(!date(row.publicationDate)||typeof row.title!=="string"||
       row.title.trim()!==row.title||row.title.length<12||row.title.length>500||
       !HEX.test(row.approvedSemanticFingerprint)||
       row.originalHeaderVerified!==true||
       !["Energy.gov","Office of Critical Minerals and Energy Innovation"].includes(row.attributionAsListed)||
       (row.attributionAsListed==="Energy.gov" && row.issuingOffice!==null)||
       (row.attributionAsListed!=="Energy.gov"&&row.issuingOffice!==row.attributionAsListed))
      throw Error("DOE publication lacks verified official metadata, attribution or semantic digest");
    const id=sourceId(url);
    if(duplicates.has(id))throw Error("DOE source window repeated an official article identity");
    duplicates.add(id);
    docs.push({id,row});
  }
  for(let i=1;i<docs.length;i++){
    if(docs[i].row.publicationDate>docs[i-1].row.publicationDate)
      throw Error("DOE source window is not ordered newest-first");
  }
  if(!duplicates.has(prev.lastLatestId)){
    // Preserve the last trusted state if the historical rollover exceeds
    // the bounded window. This is NOT proof there were zero new records.
    return {
      mode:"shadow_state_transition_preview_only",status:"coverage_gap",
      previousState:prev,proposedState:prev,noStateWritten:true,
      possibleWindowGap:true,reviewOnly:[],
    };
  }
  const next={...prev.seen};
  const change:DoeShadowPreview["reviewOnly"]=[];
  for(const {id,row} of docs){
    if(prev.seen[id]!==row.approvedSemanticFingerprint)
      change.push({
        observationId:id,officialUrl:row.officialUrl,titleAsListed:row.title,
        publisherDate:row.publicationDate,
        attributionAsListed:row.attributionAsListed,issuingOffice:row.issuingOffice,
        change:prev.seen[id]===undefined?"new":"revised",reviewStatus:"unreviewed",
        cannotPromoteFinancialClaim:true,
      });
    delete next[id];
    next[id]=row.approvedSemanticFingerprint;
  }
  while(Object.keys(next).length>DOE_SHADOW_MAX_SAVED)delete next[Object.keys(next)[0]];
  return {
    mode:"shadow_state_transition_preview_only",status:"would_advance",
    previousState:prev,proposedState:{
      version:1,sourceId:DOE_SHADOW_SOURCE_ID,
      semanticVersion:prev.semanticVersion,
      seen:next,lastLatestId:docs[0].id,lastSuccessfulAt:gate.observedAt,
    },
    noStateWritten:true,possibleWindowGap:false,reviewOnly:change,
  };
}
