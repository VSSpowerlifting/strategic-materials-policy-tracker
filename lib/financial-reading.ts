/**
 * Reader-facing interpretation only: NEVER an alternative legal-standing,
 * aggregation, eligibility, milestone or disbursement classifier.
 * Financial status is the last recorded history entry, just as on /capital.
 */
import type {FinancialCommitment,FinancialStatus,ValueRole} from "./types";
import {financialStatusLabels,valueRoleLabels} from "./labels";
import {FINANCIAL_STATUS_DEFS,VALUE_ROLE_DEFS} from "./capital-vocabulary";

export type RecordReading={
 role:{label:string;definition:string};
 status:{label:string;definition:string};
 payment:string;
 linkage:string;
 boundary:string;
};

export function explainFinancialRecord(
 c:Pick<FinancialCommitment,
  "valueRole"|"capitalSource"|"financialStatusHistory"|"projectId"|"associatedProjectIds">,
):RecordReading{
 const entry=c.financialStatusHistory.at(-1);
 if(!entry)throw new Error("Cannot explain a financial record without a recorded status");
 const status:FinancialStatus=entry.status;
 const role:ValueRole=c.valueRole;
 const shared=c.associatedProjectIds??[];
 if(c.projectId&&shared.length)throw new Error("Cannot label the same finance row as directly allocated and shared");
 if(new Set(shared).size!==shared.length)throw new Error("Duplicate unallocated project association");

 const payment=role==="funding_option"
   ? "For an option, this financial status describes the agreement granting the option, not exercise or payment. Check the option ladder and any separate drawn commitment."
   : status==="disbursed"
     ? "The source-linked current status records disbursement. Check the cited history for amount, timing and scope; it does not establish physical construction."
     : status==="partially_disbursed"
       ? "The source-linked current status records partial payment. It does not establish that the full stated amount was paid or that construction occurred."
       : status==="withdrawn"||status==="lapsed"
         ? "The current status records an ended instrument. It does not erase previous history or prove that no payment was ever made."
         : "This status does not itself establish a cash payment. In particular, a signed contract does not necessarily establish an obligation of funds.";
 const linkage=c.projectId
   ? "One registered project is linked directly to this row. The link alone does not prove the amount was paid or that the project advanced."
   : shared.length
     ? "The record names multiple associated projects, but its financial amount is shared and unallocated. No portion can be assigned to any individual project's capital stack."
     : "No direct registered project association is coded for this row. A project or facility may still be named in source text; absence of a link is not proof of inactivity.";
 const boundary=role==="commitment"
   ? c.capitalSource==="private"||c.capitalSource==="not_stated"
     ? "A commitment record is not automatically a government commitment. The recorded provider and capital source determine attribution."
     : "This is a commitment role, but the financial status still determines legal standing and payment. Funding and verified industrial outcomes remain separate."
   : "This value role is not included in SMPT's public-recipient commitment totals. A ceiling, indication, private contribution or project cost is not an additional government award.";
 return {
  role:{label:valueRoleLabels[role],definition:VALUE_ROLE_DEFS[role]},
  status:{label:financialStatusLabels[status],definition:FINANCIAL_STATUS_DEFS[status]},
  payment,linkage,boundary,
 };
}
