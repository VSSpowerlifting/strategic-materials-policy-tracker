/**
 * F5 O3a — PRIVATE, server-renderable Observatory casefile components.
 *
 * These present only the already-curated F5 editorial projection. They are NOT
 * wired to app/, exports, route metadata, sitemap, or public navigation.
 * Browser/responsive manual QA and human source review are separate gates.
 */
import type { ReactNode } from "react";
import type {
  F5ObservatoryScaffold, ObservatoryCasefile, ObservatoryEvidenceIndexItem,
} from "@/lib/f5-observatory-scaffold";
import type { PathwaySourceReference, PathwayStatus, PathwayMilestone } from "@/lib/project-evidence-pathway";

function requireInternal(model: F5ObservatoryScaffold) {
  if (model.schemaVersion !== "f5-observatory-prepublication-1" ||
      model.audience !== "internal_research_and_design" ||
      model.publicReleaseAuthorized !== false ||
      model.editorialClaimsAutomaticallyApproved !== false ||
      model.inferredCausalityAuthorized !== false ||
      model.attributableCapitalTotalsAuthorized !== false ||
      model.historicalAsOfAnalysisAuthorized !== false ||
      model.architecture.publicationRouteEnabled !== false ||
      model.cases.some(c =>
        c.draft.publicReleaseAuthorized !== false ||
        c.draft.audience !== "private_editorial_review_only" ||
        c.draft.policyCausalityAsserted !== false ||
        c.draft.historicalMoneyTotalsAuthorized !== false))
    throw new Error("F5 O3 cannot render public, causal, financially summed or unreviewed release models");
}

function checkedSourceUrl(raw: string): string {
  try {
    const url = new URL(raw);
    if ((url.protocol !== "https:" && url.protocol !== "http:") ||
        !url.hostname || url.username || url.password)
      throw new Error("invalid source URL");
    return raw;
  } catch {
    throw new Error("F5 O3 source reference must be an HTTP(S) URL without credentials");
  }
}

function EvidenceSource({source}: {source: PathwaySourceReference}) {
  return <a href={checkedSourceUrl(source.url)} target="_blank" rel="noopener noreferrer"
    className="break-words font-display text-sm text-accent underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
    {source.publisher || source.title}<span className="sr-only"> (opens source in new tab)</span>
  </a>;
}

function StatusList({entries}: {entries: readonly PathwayStatus[]}) {
  if (!entries.length) return <p className="text-sm text-muted">No recorded instrument status observations in this revision.</p>;
  return <ol className="space-y-3">
    {entries.map((entry,i)=><li key={i} className="border-l-2 border-border-strong pl-3 text-sm">
      <span className="font-display text-foreground">{entry.status.replaceAll("_"," ")}</span>
      <span className="ml-2 font-mono text-xs text-muted">
        {entry.statusDate ? <time dateTime={entry.statusDate}>{entry.statusDate}</time> : "Status day not stated"}
      </span>
      {entry.note ? <p className="mt-1 leading-6 text-muted">{entry.note}</p> : null}
      <p className="mt-1"><EvidenceSource source={entry.evidence}/></p>
    </li>)}
  </ol>;
}

function Lane({id,title,description,children}:{
  id:string;title:string;description:string;children:ReactNode;
}) {
  return <section id={id} aria-labelledby={id+"-title"}
    className="min-w-0 rounded-lg border border-border bg-card px-4 py-5 sm:px-6">
    <div className="mb-5 border-b border-border pb-3">
      <h3 id={id+"-title"} className="font-display text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </div>
    {children}
  </section>;
}

function EmptyLane({description}: {description:string}) {
  return <p className="rounded-md border border-dashed border-border-strong p-4 text-sm leading-6 text-muted">
    {description} Missing a recorded reference is not proof of real-world inactivity.
  </p>;
}

function MilestoneClaim({m}: {m:PathwayMilestone}) {
  const when = m.claimMode==="occurred" ? m.occurredOn : m.targetOn;
  return <li className="rounded-md border border-border p-4">
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <h4 className="font-display font-semibold text-foreground">{m.kind.replaceAll("_"," ")}</h4>
      <span className="rounded border border-border-strong px-2 py-0.5 font-mono text-xs text-muted">
        {m.claimMode==="occurred"?"Reported occurred":"Planned / target"}
      </span>
    </div>
    <p className="mt-2 font-mono text-xs text-muted">
      {when ? <><span>{m.claimMode==="occurred"?"Occurrence day":"Target day"}: </span>
        <time dateTime={when}>{when}</time></>
        : m.claimMode==="occurred"?"Exact physical occurrence day not established":"Exact target day not stated"}
    </p>
    <p className="mt-2 text-sm text-muted">Scope: {m.scopeAsStated ?? "Entire registered project (scope must be supported by original source)"}</p>
    <blockquote className="mt-3 border-l-2 border-accent/50 pl-3 font-serif text-base leading-7 text-foreground">
      “{m.speakerStatementEn}”
    </blockquote>
    {m.speakerStatementOriginal !== m.speakerStatementEn ?
      <p className="mt-2 text-sm text-muted">Original: “{m.speakerStatementOriginal}”</p> : null}
    <p className="mt-3 text-xs leading-5 text-muted">
      Issuer statement as registered, not independent on-site verification.
      Original source published {m.evidence.publishedOn ?? "on an unstated day"};
      review metadata dated <time dateTime={m.reviewedOn}>{m.reviewedOn}</time>.
      Neither date substitutes for an unknown occurrence day.
    </p>
    <div className="mt-2 text-sm"><EvidenceSource source={m.evidence}/></div>
    {m.evidence.locator ? <p className="mt-1 break-words font-mono text-xs text-muted">Source pinpoint: {m.evidence.locator}</p> : null}
  </li>;
}

export function PrivateObservatoryCasefile({item}: {item:ObservatoryCasefile}) {
  const {comparison:c,draft:d,sourceIndex}=item;
  if(d.publicReleaseAuthorized !== false || d.audience !== "private_editorial_review_only")
    throw new Error("F5 private casefile refuses public-ready or unscreened draft");
  const id="f5-case-"+c.projectId;
  return <article id={id} aria-labelledby={id+"-title"} className="scroll-mt-24 space-y-6">
    <header className="border-b border-border-strong pb-5">
      <p className="rail mb-3">{c.track==="initial_pilot"?"Initial research pilot":"Extended comparator"} · INTERNAL SOURCE REVIEW</p>
      <h2 id={id+"-title"} className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {c.projectName}
      </h2>
      <p className="mt-3 max-w-3xl font-serif text-lg leading-7 text-muted">{c.researchQuestion}</p>
      <p className="mt-3 font-mono text-xs text-muted">Materials: {c.materialIds.join(", ") || "Not classified"}</p>
    </header>

    <div className="rounded-md border border-border-strong bg-elevated p-4" role="note">
      <h3 className="font-display font-semibold">Evidence readiness — {c.manualSourceAndBrowserQaCandidate?"Eligible for manual QA only":"Blocked"}</h3>
      {c.blockers.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
        {c.blockers.map(b=><li key={b}>{b}</li>)}</ul> :
        <p className="mt-2 text-sm text-muted">Structural evidence exists; source and browser QA and explicit maintainer release approval are still required.</p>}
      <p className="mt-2 text-sm text-muted">
        {c.registeredReviewedOccurredClaims===0 ?
          "No reviewed occurred physical milestone is registered. This does not mean the project is stalled or inactive." :
          c.registeredReviewedOccurredClaims+" registered occurred physical source claims; not evidence of policy causality or independently verified site output."}
        {" "}{c.unreviewedLegacyPhysicalObservations} legacy financier physical observations await separate review.
      </p>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <Lane id={id+"-policy"} title="01 · Policy record"
        description="Linked policy announcement contexts only; adjacency is not evidence of a government-caused physical result.">
        {d.lanes.policy.length ? <ol className="space-y-4">
          {d.lanes.policy.map(p=><li key={p.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
            <h4 className="font-display font-semibold">{p.title}</h4>
            <p className="mt-1 font-mono text-xs text-muted">{p.issuingBody} · <time dateTime={p.eventDate}>{p.eventDate}</time> · {p.eventStatus.replaceAll("_"," ")}</p>
            <p className="mt-1 text-sm text-muted">Context: finance/designation parent, not a causal link.</p>
            <ul className="mt-2 space-y-1">{p.sourceRecords.map(s=>
              <li key={s.id+":"+(s.locator??"")}><EvidenceSource source={s}/></li>)}</ul>
          </li>)}
        </ol> : <EmptyLane description="No linked policy context is registered in this casefile."/>}
      </Lane>
      <Lane id={id+"-finance"} title="02 · Financial instruments"
        description="Directly attributable instrument references are separate from nonallocative associations. Neither category proves spending, payout, or physical progress.">
        {d.lanes.finance.length ? <ol className="space-y-5">
          {d.lanes.finance.map(f=><li key={f.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
            <h4 className="break-words font-display font-semibold">{f.instrument.replaceAll("_"," ")} · {f.valueRole.replaceAll("_"," ")}</h4>
            <p className="mt-1 font-mono text-xs text-muted">{f.relationship==="nonallocative_association"?
              "NONALLOCATIVE: project association only":"Project-linked instrument reference"}</p>
            <p className="mt-2 text-sm text-muted">{f.provider??"Provider not recorded"} → {f.recipient??"Recipient not recorded"}</p>
            <div className="mt-3"><StatusList entries={f.financialStatusHistory}/></div>
            <ul className="mt-2">{f.evidence.map(s=>
              <li key={s.id+":"+(s.locator??"")}><EvidenceSource source={s}/></li>)}</ul>
            {f.unreviewedFinancierPhysicalReports ? <p className="mt-2 text-xs leading-5 text-muted">
              {f.unreviewedFinancierPhysicalReports} financier physical report(s) remain outside the verified physical lane.
            </p> : null}
          </li>)}
        </ol> : <EmptyLane description="No financing instrument references are linked to this project."/>}
        {d.lanes.financePackageReferences.length ?
          <p className="mt-4 border-t border-border pt-3 text-xs leading-5 text-muted">
            {d.lanes.financePackageReferences.length} parent/child finance relationship(s) recorded;
            packages are references only, not additional or attributable capital.
          </p> : null}
      </Lane>
      <Lane id={id+"-designations"} title="03 · Official project designations"
        description="Official recognition, including strategic-project designation, is not an award, loan, or cash receipt.">
        {d.lanes.designations.length ? <ol className="space-y-4">
          {d.lanes.designations.map(x=><li key={x.id} className="rounded-md border border-border p-3">
            <h4 className="break-all font-mono text-xs text-foreground">{x.id}</h4>
            <p className="mt-1 text-xs text-muted">Recognition only — not funding</p>
            <div className="mt-2"><StatusList entries={x.statusHistory}/></div>
            <ul className="mt-2">{x.evidence.map(s=>
              <li key={s.id+":"+(s.locator??"")}><EvidenceSource source={s}/></li>)}</ul>
          </li>)}
        </ol> : <EmptyLane description="No project-designation reference is registered for this project."/>}
      </Lane>
      <Lane id={id+"-physical"} title="04 · Industrial progress evidence"
        description="Only independently adjudicated project-native register claims may appear here. Original issuer reporting is not independent plant inspection.">
        {d.lanes.physical.occurred.length ? <section aria-label="Registered occurred physical assertions">
          <h4 className="mb-3 font-display text-sm font-semibold">Registered occurred claims</h4>
          <ol className="space-y-4">{d.lanes.physical.occurred.map(m=><MilestoneClaim key={m.id} m={m}/>)}</ol>
        </section> : <EmptyLane description="No source-reviewed occurred physical milestone has entered the project-native register."/>}
        {d.lanes.physical.planned.length ? <section className="mt-5" aria-label="Planned physical targets">
          <h4 className="mb-3 font-display text-sm font-semibold">Planned targets — not achieved outcomes</h4>
          <ol className="space-y-4">{d.lanes.physical.planned.map(m=><MilestoneClaim key={m.id} m={m}/>)}</ol>
        </section> : null}
      </Lane>
    </div>
    <section aria-labelledby={id+"-sources-title"} className="border-t border-border pt-5">
      <h3 id={id+"-sources-title"} className="font-display text-xl font-semibold">Source and provenance index</h3>
      <p className="mt-2 text-sm text-muted">Source registration establishes documentary traceability, not independent verification of industrial results.</p>
      {sourceIndex.length?<ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {sourceIndex.map((s:ObservatoryEvidenceIndexItem)=><li key={s.sourceId} className="min-w-0 rounded-md border border-border p-3">
          <a href={checkedSourceUrl(s.url)} target="_blank" rel="noopener noreferrer"
            className="break-words font-display text-sm text-accent underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            {s.publisher}<span className="sr-only"> (opens source in new tab)</span>
          </a>
          <p className="mt-1 break-all font-mono text-xs text-muted">{s.sourceId}</p>
          <p className="mt-1 text-xs text-muted">
            Published {s.publishedOn??"date unknown"}; registry accessed {s.accessedOn}.
          </p>
          <p className="mt-1 text-xs text-muted">Referenced by: {s.inLanes.join(", ")}</p>
        </li>)}
      </ul>:<EmptyLane description="There are no indexed original sources for this draft casefile."/>}
    </section>
  </article>;
}

/** Stateless, server-renderable, nonrouted review surface. */
export function PrivateObservatoryReview({model}: {model:F5ObservatoryScaffold}) {
  requireInternal(model);
  const id="f5-internal-overview";
  return <div data-f5-private-review="true" className="mx-auto max-w-7xl space-y-12 px-4 py-10 text-foreground sm:px-6 lg:px-8">
    <header>
      <p className="rail mb-3">INTERNAL EDITORIAL REVIEW ONLY · NOT A PUBLIC OBSERVATORY</p>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">Industrial Outcome Observatory</h1>
      <p className="mt-4 max-w-4xl font-serif text-lg leading-8 text-muted">
        Source-linked project comparisons from SMPT&apos;s curated current corpus.
        This is a research draft, not a policy-effect assessment, release authorization or historical as-of view.
      </p>
      <p className="mt-3 font-mono text-xs text-muted">
        Curated corpus cutoff: <time dateTime={model.curatedCorpusCutoff}>{model.curatedCorpusCutoff}</time> ·
        {" "}{model.cohortSize} cohort projects · {model.sourceReviewedCasefilesReadyForManualQa} candidates for manual QA
      </p>
    </header>

    <section id={id} aria-labelledby={id+"-title"}>
      <h2 id={id+"-title"} className="font-display text-2xl font-semibold">Cross-project evidence coverage</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
        These are numbers of registered documentary references, not money totals, impact scores,
        disbursements, attributable outcomes or measures of project success.
      </p>
      <div className="mt-5 max-w-full overflow-x-auto rounded-lg border border-border" role="region"
        aria-label="Horizontally scrollable project-evidence coverage comparison" tabIndex={0}>
        <table className="w-full min-w-[52rem] border-collapse text-sm">
          <caption className="sr-only">Industrial project evidence coverage, not outcome ranking or policy effectiveness</caption>
          <thead className="bg-elevated">
            <tr>
              {["Project","Policy records","Direct finance refs","Nonallocative refs","Designations","Reviewed occurred","Physical evidence"].map(label=>
                <th key={label} scope="col" className="border-b border-border px-3 py-3 text-left font-mono text-xs font-normal text-muted">{label}</th>)}
            </tr>
          </thead>
          <tbody>{model.cases.map(item=>{
            const c=item.comparison;
            return <tr key={c.projectId} className="border-b border-border last:border-b-0">
              <th scope="row" className="px-3 py-3 text-left font-display font-semibold">
                <a href={"#f5-case-"+c.projectId} className="text-accent underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                  {c.projectName}
                </a>
              </th>
              <td className="px-3 py-3 font-mono">{c.policyRecordReferences}</td>
              <td className="px-3 py-3 font-mono">{c.directFinancialInstrumentReferences}</td>
              <td className="px-3 py-3 font-mono">{c.nonallocativeFinancialAssociations}</td>
              <td className="px-3 py-3 font-mono">{c.designationReferences}</td>
              <td className="px-3 py-3 font-mono">{c.registeredReviewedOccurredClaims}</td>
              <td className="min-w-32 px-3 py-3 text-xs text-muted">
                {c.registeredReviewedOccurredClaims===0?"No reviewed occurred claim registered":"Registered source claims; requires QA"}
              </td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </section>

    <section aria-label="Internal project casefiles" className="space-y-14">
      {model.cases.map(item=><PrivateObservatoryCasefile key={item.comparison.projectId} item={item}/>)}
    </section>

    <footer className="rounded-lg border border-border-strong bg-card p-5" aria-label="Release blockers and required verification">
      <h2 className="font-display text-xl font-semibold">Publication gate: CLOSED</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        No casefile or comparison is approved for a public route. Independent source adjudication,
        actual browser/keyboard QA and explicit maintainer signoff are mandatory.
        Missing reviewed evidence never establishes that an industrial project is inactive.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
        {model.requiredHumanChecks.map(c=><li key={c}>{c}</li>)}
      </ul>
    </footer>
  </div>;
}
