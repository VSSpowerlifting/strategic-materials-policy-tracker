/**
 * The canonical reader definitions for SMPT's financial and control terminology.
 * Previously local to /methodology. Imported by both the methodology and
 * read-only explanatory UI, so meaning never drifts with a glossary copy.
 * These labels are source-independent category definitions, not an adjudication
 * of any individual record.
 */
import {
  VALUE_ROLES, CAPITAL_SOURCES, FINANCIAL_STATUSES, CONTROL_STATUSES,
} from "./types";

export const VALUE_ROLE_DEFS: Record<(typeof VALUE_ROLES)[number], string> = {
  commitment: "Money, or a money-like promise, committed to a named recipient or project. The only role ever summed.",
  program_envelope: "The ceiling of a programme, fund or facility that awards are drawn from.",
  budget_appropriation: "Money set aside in a budget or allocation.",
  lending_authority: "A ceiling on what a lender may lend or guarantee.",
  funding_option:
    "A ceiling a party may call on at its own election under an executed agreement. Listed, never summed: an executed option is not committed money. An exercise is recorded as its own commitment drawn from the option, with its own payment status.",
  indication:
    "A non-binding letter of intent or interest that names an amount: possible support, not money committed to anyone. Listed in its own layer, never summed, and never counted as binding, not yet binding, capital, backing or co-investment.",
  expected_co_investment: "Money a government expects others to invest.",
  private_financing: "Commercial capital raised alongside public money.",
  recipient_own_funds: "The recipient's own contribution.",
  total_project_cost: "The value of a project or pipeline, whoever pays for it.",
};

export const CAPITAL_SOURCE_DEFS: Record<(typeof CAPITAL_SOURCES)[number], string> = {
  public: "A government, ministry or state agency.",
  public_enterprise: "A state-owned company or fund, such as the UK National Wealth Fund.",
  mixed_vehicle: "A joint public-private vehicle whose public share is not stated.",
  private: "Commercial lenders, investors or the recipient.",
  not_stated: "The source does not say who provides the capital.",
};

export const FINANCIAL_STATUS_DEFS: Record<(typeof FINANCIAL_STATUSES)[number], string> = {
  announced: "Publicly announced; no decision or agreement is stated.",
  authorized: "Legal or budgetary authority exists, e.g. an enacted statute or cabinet approval.",
  allocated: "Assigned to the purpose, e.g. in a budget.",
  decided: "The provider has decided to invest, lend or award, including a conditional commitment.",
  contracted: "A binding agreement has been executed. Not a payment, and not necessarily an obligation of funds: an agreement can leave that to a later step.",
  partially_disbursed: "Some of the money has been paid out.",
  disbursed: "The money has been paid out.",
  withdrawn: "The commitment was withdrawn.",
  lapsed: "The commitment ended unused on its own terms, for example a commitment letter that expired undrawn.",
  not_stated: "The source states no status.",
};

export const CONTROL_STATUS_DEFS: Record<(typeof CONTROL_STATUSES)[number], string> = {
  announced: "Announced or deployed without a stated legal effective date.",
  scheduled: "Adopted, with a stated future effective date.",
  in_force: "Legally in effect.",
  suspended: "Adopted but paused, usually until a stated date.",
  expired: "Lapsed at the end of its stated term.",
  revoked: "Repealed or withdrawn.",
  investigation: "An inquiry that imposes no restriction yet.",
  concluded: "An inquiry that has ended with a finding or report; any measure that follows is its own record.",
  not_stated: "The source states no status.",
};

