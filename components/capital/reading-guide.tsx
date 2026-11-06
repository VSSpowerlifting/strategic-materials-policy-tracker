import Link from "next/link";
import {FINANCIAL_STATUS_DEFS,VALUE_ROLE_DEFS} from "@/lib/capital-vocabulary";
import {explainFinancialRecord} from "@/lib/financial-reading";
import {financialStatusLabels,valueRoleLabels} from "@/lib/labels";
import type {FinancialCommitment} from "@/lib/types";

export function RecordReadingGuide({record}:{record:FinancialCommitment}){
 const reading=explainFinancialRecord(record);
 const rows=[
  {label:"Figure type",heading:reading.role.label,text:reading.role.definition},
  {label:"Legal status",heading:reading.status.label,text:reading.status.definition},
  {label:"Payment",heading:"Payment evidence",text:reading.payment},
  {label:"Linked projects",heading:"Project attribution",text:reading.linkage},
 ];
 return <section aria-labelledby="record-reading-guide" data-testid="financial-reading-guide"
   className="mt-7 max-w-4xl rounded-lg border border-border-strong bg-card p-5 sm:p-6">
   <p className="font-mono text-xs text-accent">Reading this record</p>
   <h2 id="record-reading-guide" className="mt-2 font-display text-xl font-semibold leading-snug">
     Evidence and status
   </h2>
   <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
    {rows.map(row=><div key={row.label} className="min-w-0 border-t border-border pt-3">
     <dt className="font-display text-xs font-semibold text-muted">{row.label}</dt>
     <dd className="mt-1">
      <span className="block font-display font-semibold">{row.heading}</span>
      <span className="mt-1 block text-sm leading-6 text-muted">{row.text}</span>
     </dd>
    </div>)}
   </dl>
   <p className="mt-4 border-t border-border pt-3 text-sm leading-6 text-muted">
    {reading.boundary} Construction, commissioning and production require
    separate physical-progress evidence. <Link href="/methodology#capital-counting"
      className="font-medium text-accent underline underline-offset-2 hover:text-accent-strong">
      Read SMPT&apos;s counting and evidence rules
    </Link>.
   </p>
  </section>;
}

const keys={
 capital:{
  title:"Financing definitions",
  intro:"Value roles classify the figure; financial statuses describe the instrument’s reported stage. Payment evidence is assessed separately.",
  rows:[
   {term:valueRoleLabels.commitment,meaning:VALUE_ROLE_DEFS.commitment},
   {term:valueRoleLabels.program_envelope,meaning:VALUE_ROLE_DEFS.program_envelope},
   {term:valueRoleLabels.funding_option,meaning:VALUE_ROLE_DEFS.funding_option},
   {term:valueRoleLabels.indication,meaning:VALUE_ROLE_DEFS.indication},
   {term:financialStatusLabels.authorized,meaning:FINANCIAL_STATUS_DEFS.authorized},
   {term:financialStatusLabels.decided,meaning:FINANCIAL_STATUS_DEFS.decided},
   {term:financialStatusLabels.contracted,meaning:FINANCIAL_STATUS_DEFS.contracted},
   {term:financialStatusLabels.partially_disbursed,meaning:FINANCIAL_STATUS_DEFS.partially_disbursed},
   {term:financialStatusLabels.disbursed,meaning:FINANCIAL_STATUS_DEFS.disbursed},
   {term:"Obligated",meaning:"Obligation is tracked outside SMPT's financial-status categories. A contracted instrument requires separate evidence of any formal obligation."},
  ],
 },
 projects:{
  title:"Project relationships",
  intro:"Project registrations and financing references establish recorded relationships. Physical completion requires separate milestone evidence.",
  rows:[
   {term:"Direct financing reference",meaning:"A financial instrument has a registered project ID. Its value role and current legal status still determine whether any funding is a public commitment or paid."},
   {term:"Shared, unallocated association",meaning:"One instrument references several projects; its reported amount remains unallocated across them."},
   {term:"Project designation",meaning:"A designation records official recognition or standing. Awards and disbursements use separate finance records."},
   {term:"Physical progress",meaning:"Company and government reports of construction, commissioning or operation are separate from funding; independently verified project milestones require their own source and editorial review."},
  ],
 },
 programmes:{
  title:"Programme finance",
  intro:"A government scheme can have an authorized ceiling, individual finance records and designations. Each has a distinct role and counting basis.",
  rows:[
   {term:valueRoleLabels.program_envelope,meaning:VALUE_ROLE_DEFS.program_envelope},
   {term:valueRoleLabels.lending_authority,meaning:VALUE_ROLE_DEFS.lending_authority},
   {term:valueRoleLabels.commitment,meaning:VALUE_ROLE_DEFS.commitment},
   {term:"Parent and child schemes",meaning:"Parent and child programme views may contain the same instruments. Each underlying instrument is counted once."},
   {term:"Designation",meaning:"Strategic-project recognition records standing. Financial awards, payments and physical milestones require separate evidence."},
  ],
 },
} as const;

export function ResearchReadingKey({topic}:{topic:keyof typeof keys}){
 const key=keys[topic];
 return <details data-testid={"reading-key-"+topic}
  className="mt-8 max-w-5xl rounded-lg border border-border-strong bg-card/50">
  <summary className="flex min-h-12 cursor-pointer list-item items-center px-4 py-3 font-display text-sm font-semibold text-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-5">
   {key.title}
  </summary>
  <div className="border-t border-border px-4 pb-5 pt-3 sm:px-5">
   <p className="max-w-3xl text-sm leading-6 text-muted">{key.intro}</p>
   <dl className="mt-3 grid gap-x-6 gap-y-0 sm:grid-cols-2">
    {key.rows.map(item=><div key={item.term} className="min-w-0 border-b border-border py-3">
     <dt className="font-display text-sm font-semibold text-foreground">{item.term}</dt>
     <dd className="mt-1 text-sm leading-6 text-muted">{item.meaning}</dd>
    </div>)}
   </dl>
   <Link href="/methodology#capital-counting"
    className="mt-4 inline-flex min-h-10 items-center font-display text-sm font-medium text-accent underline underline-offset-2">
    Full terminology and counting rules →
   </Link>
  </div>
 </details>;
}
