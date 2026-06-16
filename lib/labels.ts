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
} from "./types";

// Muted, institutional badge palette. Each tone is a low-opacity fill with a
// desaturated foreground and a hairline border — no loud SaaS colors.
export type Tone =
  | "neutral"
  | "amber"
  | "sky"
  | "emerald"
  | "violet"
  | "rose"
  | "slate"
  | "teal"
  | "orange"
  | "cyan"
  | "indigo";

export const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-white/[0.04] text-muted border-border",
  amber: "bg-amber-500/10 text-amber-200/90 border-amber-500/25",
  sky: "bg-sky-500/10 text-sky-200/90 border-sky-500/25",
  emerald: "bg-emerald-500/10 text-emerald-200/90 border-emerald-500/25",
  violet: "bg-violet-500/10 text-violet-200/90 border-violet-500/25",
  rose: "bg-rose-500/10 text-rose-200/90 border-rose-500/25",
  slate: "bg-slate-400/10 text-slate-300/90 border-slate-400/25",
  teal: "bg-teal-500/10 text-teal-200/90 border-teal-500/25",
  orange: "bg-orange-500/10 text-orange-200/90 border-orange-500/25",
  cyan: "bg-cyan-500/10 text-cyan-200/90 border-cyan-500/25",
  indigo: "bg-indigo-500/10 text-indigo-200/90 border-indigo-500/25",
};

// --- Jurisdictions ----------------------------------------------------------

export const jurisdictionLabels: Record<JurisdictionCode, string> = {
  china: "China",
  us: "United States",
  eu: "European Union",
  australia: "Australia",
  japan: "Japan",
  canada: "Canada",
  other: "Other",
};

export const jurisdictionShort: Record<JurisdictionCode, string> = {
  china: "CN",
  us: "US",
  eu: "EU",
  australia: "AU",
  japan: "JP",
  canada: "CA",
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

export const policyStatusTone: Record<PolicyStatus, Tone> = {
  active: "amber",
  suspended: "slate",
  proposed: "violet",
  superseded: "neutral",
  in_force: "sky",
  unclear: "neutral",
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

export const framingCategoryTone: Record<FramingCategory, Tone> = {
  national_security: "rose",
  economic_security: "amber",
  supply_chain_resilience: "teal",
  leverage_retaliation: "orange",
  resource_environmental: "emerald",
  anti_smuggling: "cyan",
  allied_coordination: "sky",
  compliance_modernization: "violet",
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

export const confidenceTone: Record<SourceConfidence, Tone> = {
  primary: "emerald",
  official_translation: "sky",
  government_media: "amber",
  secondary: "slate",
};

export const enSourceLabels: Record<EnSource, string> = {
  official: "Official translation",
  self: "Project / third-party translation",
  na: "English original",
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
