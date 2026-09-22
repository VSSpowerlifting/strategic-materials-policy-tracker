/**
 * Human-readable labels and restrained badge "tones" for the categorical
 * label sets defined in lib/types.ts. One definition per label, reused
 * across every page. The definitions themselves live on /methodology.
 */
import type {
  EnSource,
  FramingCategory,
  JurisdictionCode,
  JurisdictionRole,
  Mechanism,
  PolicyStatus,
  Sector,
  SourceConfidence,
  SourceType,
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
