/**
 * Human-readable labels and restrained badge "tones" for the categorical
 * label sets defined in lib/types.ts. One definition per label, reused
 * across every page. The definitions themselves live on /methodology.
 */
import type {
  CapitalSource,
  ControlDirection,
  ControlEvidenceField,
  ControlMeasureType,
  ControlStatus,
  ControlledItemType,
  CurrencyBasis,
  DesignationEvidenceField,
  DesignationStatus,
  EnSource,
  EvidenceLevel,
  FinancialEvidenceField,
  FinancialInstrument,
  FinancialRelationshipType,
  FinancialStatus,
  FramingCategory,
  ImplementationStatus,
  JurisdictionCode,
  JurisdictionRole,
  MaterialAttribution,
  Mechanism,
  OrganizationEvidenceField,
  OrganizationKind,
  OrganizationLinkType,
  OutcomeAttribution,
  OutcomeMetric,
  PolicyStatus,
  ProductCodeRole,
  ProductCodeSystem,
  ProgrammeEvidenceField,
  ProgrammeKind,
  ProjectEvidenceField,
  Sector,
  SourceConfidence,
  SourceType,
  StageAllocation,
  SupplyChainStage,
  TargetScope,
  TermKind,
  ValueQualifier,
  ValueRole,
  WatchCadence,
  WatchStatus,
} from "./types";

// --- Jurisdictions ----------------------------------------------------------

export const jurisdictionLabels: Record<JurisdictionCode, string> = {
  china: "China",
  us: "United States",
  eu: "European Union",
  australia: "Australia",
  japan: "Japan",
  canada: "Canada",
  uk: "United Kingdom",
  india: "India",
  other: "Other",
};

export const jurisdictionShort: Record<JurisdictionCode, string> = {
  china: "CN",
  us: "US",
  eu: "EU",
  australia: "AU",
  japan: "JP",
  canada: "CA",
  uk: "GB",
  india: "IN",
  other: "—",
};

// --- Policy status ----------------------------------------------------------

export const policyStatusLabels: Record<PolicyStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  proposed: "Proposed",
  superseded: "Superseded",
  in_force: "In force",
  unclear: "Unclear",
  ended: "Ended",
};

// --- Mechanisms -------------------------------------------------------------

export const mechanismLabels: Record<Mechanism, string> = {
  export_control: "Export control",
  dual_use_license: "Dual-use license",
  catalogue_listing: "Catalogue listing",
  designation: "Critical-mineral designation",
  supply_chain_security: "Supply-chain security measure",
  countermeasure: "Countermeasure",
  customs_enforcement: "Customs enforcement",
  funding: "Funding or subsidy",
  stockpiling: "Stockpiling",
  offtake_agreement: "Offtake agreement",
  investment_screening: "Investment screening",
  trade_action: "Trade action",
};

// --- Sectors ----------------------------------------------------------------

export const sectorLabels: Record<Sector, string> = {
  defense: "Defense",
  semiconductor: "Semiconductor",
  energy: "Energy",
  battery: "Battery",
  industrial: "Industrial",
};

// --- Framing categories -----------------------------------------------------

export const framingCategoryLabels: Record<FramingCategory, string> = {
  national_security: "National security or defense",
  economic_security: "Economic security or industrial competitiveness",
  supply_chain_resilience: "Supply-chain resilience or de-risking",
  leverage_retaliation: "Leverage, retaliation or countermeasure",
  resource_environmental: "Resource and environmental protection",
  anti_smuggling: "Anti-smuggling or enforcement integrity",
  allied_coordination: "Allied coordination or friend-shoring",
  compliance_modernization: "Regulatory or compliance modernization",
};

export const framingCategoryShort: Record<FramingCategory, string> = {
  national_security: "National security",
  economic_security: "Economic security",
  supply_chain_resilience: "Supply-chain resilience",
  leverage_retaliation: "Leverage / retaliation",
  resource_environmental: "Resource & environment",
  anti_smuggling: "Anti-smuggling",
  allied_coordination: "Allied coordination",
  compliance_modernization: "Compliance modernization",
};

// The framing-category dimension is the one place colour is kept (see
// FramingBadge): it genuinely helps compare actors on /framing. Strata-palette
// hues, rendered as a small squared marker — never as a pale pill fill.
export const FRAMING_HUES: Record<FramingCategory, string> = {
  national_security: "#C77B7B",
  economic_security: "#CBA86A",
  supply_chain_resilience: "#57B0A2",
  leverage_retaliation: "#CE8A5C",
  resource_environmental: "#84AE68",
  anti_smuggling: "#5AA1C2",
  allied_coordination: "#8E8AC6",
  compliance_modernization: "#A981B6",
};

// --- Sources ----------------------------------------------------------------

export const sourceTypeLabels: Record<SourceType, string> = {
  official: "Official",
  government_media: "Government / state media",
  dataset: "Dataset",
  think_tank: "Think tank",
  academic: "Academic",
  news: "News",
  other: "Other",
};

export const confidenceLabels: Record<SourceConfidence, string> = {
  primary: "Primary source",
  official_translation: "Official translation",
  government_media: "Government / state media",
  secondary: "Secondary analysis",
};

export const enSourceLabels: Record<EnSource, string> = {
  official: "Official translation",
  self: "Project / third-party translation",
  na: "English original",
};

// --- Watchlist --------------------------------------------------------------
//
// Cadence is the review interval the project commits to, not an observed
// update frequency of the source itself.

export const cadenceLabels: Record<WatchCadence, string> = {
  weekly: "Weekly",
  biweekly: "Every two weeks",
  monthly: "Monthly",
  quarterly: "Quarterly",
  ad_hoc: "As prompted",
};

export const watchStatusLabels: Record<WatchStatus, string> = {
  active: "In rotation",
  paused: "Paused",
  retired: "Retired",
};

// --- Jurisdiction roles -----------------------------------------------------

export const roleLabels: Record<JurisdictionRole, string> = {
  producer: "Producer",
  processor: "Processor",
  controller: "Controller",
  funder: "Funder",
  stockpiler: "Stockpiler",
  import_dependent: "Import-dependent",
  regulator: "Regulator",
};

// --- Capital & Control (v0.5) -----------------------------------------------
//
// Labels for the financial-commitment and control-measure vocabularies, used
// by /capital, /controls, the event pages and the exports. Kept deliberately
// plain: a status or an instrument is a fact about the record, not a
// judgement of it.

export const financialInstrumentLabels: Record<FinancialInstrument, string> = {
  grant: "Grant",
  loan: "Loan",
  loan_guarantee: "Loan guarantee",
  equity: "Equity",
  tax_credit: "Tax credit",
  price_floor: "Price floor",
  offtake: "Offtake",
  procurement_right: "Procurement right",
  stockpile_purchase: "Stockpile purchase",
  mixed: "Several instruments, split not stated",
  unspecified: "Instrument not specified",
};

export const valueRoleLabels: Record<ValueRole, string> = {
  commitment: "Commitment",
  program_envelope: "Program envelope",
  budget_appropriation: "Budget appropriation",
  lending_authority: "Lending authority",
  funding_option: "Funding option",
  expected_co_investment: "Expected co-investment",
  private_financing: "Private financing",
  recipient_own_funds: "Recipient's own funds",
  total_project_cost: "Total project cost",
};

export const capitalSourceLabels: Record<CapitalSource, string> = {
  public: "Public",
  public_enterprise: "Public enterprise",
  mixed_vehicle: "Mixed public-private vehicle",
  private: "Private",
  not_stated: "Not stated",
};

export const financialStatusLabels: Record<FinancialStatus, string> = {
  announced: "Announced",
  authorized: "Authorized",
  allocated: "Allocated",
  decided: "Decided",
  contracted: "Contracted",
  partially_disbursed: "Partially disbursed",
  disbursed: "Disbursed",
  withdrawn: "Withdrawn",
  not_stated: "Not stated",
};

export const implementationStatusLabels: Record<ImplementationStatus, string> = {
  announced: "Announced",
  feasibility: "Feasibility",
  construction: "Construction",
  commissioning: "Commissioning",
  operational: "Operational",
  suspended: "Suspended",
  cancelled: "Cancelled",
  not_stated: "Not stated",
  not_applicable: "Not applicable",
};

export const supplyChainStageLabels: Record<SupplyChainStage, string> = {
  exploration: "Exploration",
  mining: "Mining",
  separation: "Separation",
  processing: "Processing",
  refining: "Refining",
  component_manufacturing: "Component manufacturing",
  final_manufacturing: "Final manufacturing",
  recycling: "Recycling",
  stockpiling: "Stockpiling",
  research_development: "Research and development",
  cross_cutting: "Cross-cutting",
};

export const stageAllocationLabels: Record<StageAllocation, string> = {
  single_stage: "Single stage",
  multi_stage_unallocated: "Several stages, split not stated",
  not_stated: "Not stated",
};

export const materialAttributionLabels: Record<MaterialAttribution, string> = {
  tracked_only: "Tracked materials only",
  includes_untracked: "Includes untracked materials",
  not_stated: "Not stated",
};

export const valueQualifierLabels: Record<ValueQualifier, string> = {
  exact: "Exact",
  up_to: "Up to",
  approximately: "Approximately",
  at_least: "At least",
};

export const currencyBasisLabels: Record<CurrencyBasis, string> = {
  stated: "Stated in the source",
  issuer_context: "Read from the issuing government",
};

export const termKindLabels: Record<TermKind, string> = {
  tax_credit_rate: "Tax-credit rate",
  price_floor: "Price floor",
  annual_reimbursement_cap: "Annual reimbursement cap",
  lending_rate: "Lending rate",
  duration: "Duration",
  procurement_share: "Procurement share",
  offtake_share: "Offtake share",
  quantity_covenant: "Quantity covenant",
  capacity_covenant: "Capacity covenant",
  other: "Other term",
};

export const outcomeMetricLabels: Record<OutcomeMetric, string> = {
  annual_capacity: "Annual capacity",
  supply_share: "Supply share",
  procurement_right_share: "Procurement-right share",
  direct_jobs: "Direct jobs",
  target_date: "Target date",
  other: "Other outcome",
};

export const outcomeAttributionLabels: Record<OutcomeAttribution, string> = {
  government: "Stated by the government",
  recipient: "Stated by the recipient",
  third_party: "Stated by a third party",
};

export const financialRelationshipTypeLabels: Record<FinancialRelationshipType, string> = {
  part_of: "Part of",
  drawn_from: "Drawn from",
};

export const evidenceLevelLabels: Record<EvidenceLevel, string> = {
  explicit: "Explicit",
  ambiguous: "Ambiguous",
};

export const financialEvidenceFieldLabels: Record<FinancialEvidenceField, string> = {
  instrument: "Instrument",
  value_role: "Value role",
  capital_source: "Capital source",
  amount: "Amount",
  relationships: "Related commitments",
  provider: "Provider",
  legal_authority: "Legal authority",
  recipient: "Recipient",
  project: "Project",
  facility: "Facility",
  location: "Location",
  stages: "Supply-chain stages",
  materials: "Materials",
  status: "Status",
  terms: "Terms",
  outcomes: "Outcomes",
  programme: "Programme",
};

export const controlMeasureTypeLabels: Record<ControlMeasureType, string> = {
  export_licensing: "Export licensing",
  export_prohibition: "Export prohibition",
  extraterritorial_licensing: "Extraterritorial licensing",
  end_use_restriction: "End-use restriction",
  decontrol: "Decontrol",
  suspension: "Suspension",
  trade_investigation: "Trade investigation",
  import_restriction: "Import restriction",
  investment_divestiture: "Investment divestiture",
  customs_enforcement: "Customs enforcement",
  domestic_production_control: "Domestic production control",
  contractual_ownership_covenant: "Contractual ownership covenant",
};

export const controlDirectionLabels: Record<ControlDirection, string> = {
  export: "Export",
  re_export: "Re-export",
  import: "Import",
  inbound_investment: "Inbound investment",
  outbound_investment: "Outbound investment",
  domestic: "Domestic",
};

export const controlStatusLabels: Record<ControlStatus, string> = {
  announced: "Announced",
  scheduled: "Scheduled",
  in_force: "In force",
  suspended: "Suspended",
  expired: "Expired",
  revoked: "Revoked",
  investigation: "Under investigation",
  concluded: "Investigation concluded",
  not_stated: "Not stated",
};

export const targetScopeLabels: Record<TargetScope, string> = {
  all_jurisdictions: "All jurisdictions",
  named_jurisdictions: "Named jurisdictions",
  named_entities: "Named entities",
  end_users: "End users",
  end_uses: "End uses",
  domestic_operators: "Domestic operators",
};

export const productCodeSystemLabels: Record<ProductCodeSystem, string> = {
  cn_customs: "China customs commodity code",
  cn_control_number: "China dual-use control number",
  hs: "Harmonized System (HS)",
  us_hts: "US Harmonized Tariff Schedule",
  us_eccn: "US Export Control Classification Number",
  eu_cn: "EU Combined Nomenclature",
};

export const productCodeRoleLabels: Record<ProductCodeRole, string> = {
  reference: "Reference only",
  legal_scope: "Defines legal scope",
};

export const controlEvidenceFieldLabels: Record<ControlEvidenceField, string> = {
  measure_type: "Measure type",
  direction: "Direction",
  clause: "Clause",
  targets: "Targets",
  materials: "Materials",
  product_scope: "Product scope",
  product_codes: "Product codes",
  legal_basis: "Legal basis",
  modified_measures: "Modified measures or instruments",
  status: "Status",
  item_scope: "Item types and stages",
};

// --- Capital intelligence (v0.6) ------------------------------------------------

export const controlledItemTypeLabels: Record<ControlledItemType, string> = {
  goods: "Goods",
  equipment: "Equipment",
  technology: "Technology",
};

export const organizationKindLabels: Record<OrganizationKind, string> = {
  government: "Government body",
  public_financier: "Public financier",
  joint_vehicle: "Joint vehicle",
  company: "Company",
  project_company: "Project company",
  bank: "Commercial bank",
};

export const organizationLinkTypeLabels: Record<OrganizationLinkType, string> = {
  part_of: "Part of",
  established_by: "Established by",
};

export const organizationEvidenceFieldLabels: Record<OrganizationEvidenceField, string> = {
  name: "Name",
  kind: "Kind",
  country: "Country",
  actor: "Government",
  parents: "Parent bodies",
};

export const projectEvidenceFieldLabels: Record<ProjectEvidenceField, string> = {
  name: "Name",
  sponsors: "Sponsors",
  location: "Location",
  stages: "Supply-chain stages",
  materials: "Materials",
};

export const programmeKindLabels: Record<ProgrammeKind, string> = {
  grant_programme: "Grant programme",
  financing_facility: "Financing facility",
  tax_incentive: "Tax incentive",
  strategic_reserve: "Strategic reserve",
  designation_scheme: "Designation scheme",
  multi_instrument: "Multi-instrument programme",
};

export const programmeEvidenceFieldLabels: Record<ProgrammeEvidenceField, string> = {
  name: "Name",
  kind: "Kind",
  administrators: "Administering bodies",
  parent: "Parent programme",
  legal_authority: "Legal authority",
};

export const designationStatusLabels: Record<DesignationStatus, string> = {
  recognized: "Recognized",
  withdrawn: "Withdrawn",
};

export const designationEvidenceFieldLabels: Record<DesignationEvidenceField, string> = {
  programme: "Programme",
  project: "Project",
  holders: "Holders",
  location: "Location",
  stages: "Supply-chain stages",
  materials: "Materials",
  status: "Status",
};

// --- Capital & Control chart hues ---------------------------------------------
//
// Drawn from the Strata palette above, so no new colour enters the system.
// Status hues encode legal standing on the control-status chart; the two kind
// hues separate money from restrictions on the capital-and-control chronology.

export const CONTROL_STATUS_HUES: Record<ControlStatus, string> = {
  announced: "#A981B6",
  scheduled: "#8E8AC6",
  in_force: "#4fb59e",
  suspended: "#CBA86A",
  expired: "#38414a",
  revoked: "#38414a",
  investigation: "#5AA1C2",
  concluded: "#7b8488",
  not_stated: "#38414a",
};

export const INSTRUMENT_KIND_HUES = {
  capital: "#CBA86A",
  control: "#C77B7B",
} as const;

// --- Capital intelligence views (v0.6) ------------------------------------------------
//
// Keyed by the derived view keys in lib/capital-intelligence.ts. Kept here with
// the other label maps; the view keys are not stored vocabularies.

export const layerLabels = {
  public_commitment: "Public commitments",
  joint_vehicle_commitment: "Joint-vehicle commitments",
  other_commitment: "Other commitments",
  funding_option: "Funding options",
  envelope: "Envelopes, appropriations and lending authorities",
  private_financing: "Private financing",
  recipient_own_funds: "Recipient's own funds",
  expected_co_investment: "Expected co-investment",
  total_project_cost: "Total project cost",
} as const;

export const layerGlosses = {
  public_commitment: "Committed to a recipient by a government or public enterprise. Summed per currency; a part is never added to its package.",
  joint_vehicle_commitment: "Committed by a vehicle that public and private parties set up together. Summed apart from public money: the public share is not stated.",
  other_commitment: "Committed with private capital, or capital whose source the sources do not state. Listed, never summed with public money.",
  funding_option: "A ceiling a party may call on under an executed agreement. Listed, never summed: an option is not committed money until exercised.",
  envelope: "Ceilings that awards are drawn from. Listed, never summed, and never divided into awards.",
  private_financing: "Commercial capital raised alongside public money. Listed, never public support.",
  recipient_own_funds: "The recipient's own contribution. Listed, never public support.",
  expected_co_investment: "Money a government expects others to invest. Listed, never a commitment.",
  total_project_cost: "The whole cost of a project, whoever pays it. Listed, never support.",
} as const;

export const geographyLabels = {
  domestic: "At home",
  abroad: "Abroad",
  domestic_and_abroad: "At home and abroad",
  not_stated: "Location not stated",
} as const;

export const coInvestmentKindLabels = {
  cross_government: "More than one government",
  public_and_private: "Public and private capital",
  several_public_bodies: "Several public bodies of one government",
} as const;
