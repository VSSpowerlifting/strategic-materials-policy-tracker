/**
 * Strategic Materials Policy Tracker — domain types.
 *
 * The categorical label sets below are the single source of truth: the union
 * types are derived from them, and the validation script imports the same
 * arrays. There are NO numeric risk scores anywhere in this model — every
 * classification is a source-grounded categorical label. See /methodology.
 */

// ---------------------------------------------------------------------------
// Allowed value sets (categorical labels — no synthetic scores)
// ---------------------------------------------------------------------------

export const JURISDICTIONS = [
  "china",
  "us",
  "eu",
  "australia",
  "japan",
  "canada",
  "other",
] as const;

export const POLICY_STATUSES = [
  "active",
  "suspended",
  "proposed",
  "superseded",
  "in_force",
  "unclear",
] as const;

export const MECHANISMS = [
  "export_control",
  "dual_use_license",
  "catalogue_listing",
  "designation",
  "supply_chain_security",
  "countermeasure",
  "customs_enforcement",
  "funding",
  "stockpiling",
  "offtake_agreement",
  "investment_screening",
  "trade_action",
] as const;

export const SECTORS = [
  "defense",
  "semiconductor",
  "energy",
  "battery",
  "industrial",
] as const;

export const FRAMING_CATEGORIES = [
  "national_security",
  "economic_security",
  "supply_chain_resilience",
  "leverage_retaliation",
  "resource_environmental",
  "anti_smuggling",
  "allied_coordination",
  "compliance_modernization",
] as const;

export const SOURCE_TYPES = [
  "official",
  "government_media",
  "dataset",
  "think_tank",
  "academic",
  "news",
  "other",
] as const;

export const SOURCE_CONFIDENCE = [
  "primary",
  "official_translation",
  "government_media",
  "secondary",
] as const;

export const TITLE_LANGS = ["zh", "en", "ja", "fr", "other"] as const;

export const SOURCE_LANGS = ["zh", "en", "ja", "fr", "other", "bilingual"] as const;

/**
 * Provenance of an English translation:
 *  - "official" — published by the issuing government / body
 *  - "self"     — non-official translation (this project's, or a cited third party)
 *  - "na"       — source is already in English; no translation involved
 */
export const EN_SOURCES = ["official", "self", "na"] as const;

export const JURISDICTION_ROLES = [
  "producer",
  "processor",
  "controller",
  "funder",
  "stockpiler",
  "import_dependent",
  "regulator",
] as const;

// ---------------------------------------------------------------------------
// Derived union types
// ---------------------------------------------------------------------------

export type JurisdictionCode = (typeof JURISDICTIONS)[number];
export type PolicyStatus = (typeof POLICY_STATUSES)[number];
export type Mechanism = (typeof MECHANISMS)[number];
export type Sector = (typeof SECTORS)[number];
export type FramingCategory = (typeof FRAMING_CATEGORIES)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];
export type SourceConfidence = (typeof SOURCE_CONFIDENCE)[number];
export type TitleLang = (typeof TITLE_LANGS)[number];
export type SourceLang = (typeof SOURCE_LANGS)[number];
export type EnSource = (typeof EN_SOURCES)[number];
export type JurisdictionRole = (typeof JURISDICTION_ROLES)[number];

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export type PolicyEvent = {
  id: string;
  /** ISO date; the operative / announcement date. */
  date: string;
  jurisdiction: JurisdictionCode;
  /** e.g. "MOFCOM", "BIS", "European Commission", "METI/JOGMEC". */
  issuingBody: string;
  /** Original-language title. */
  titleOriginal: string;
  titleOriginalLang: TitleLang;
  /** Translation (identical to original if already English). */
  titleEn: string;
  titleEnSource: EnSource;
  documentNumber?: string | null;
  policyStatus: PolicyStatus;
  mechanism: Mechanism[];
  affectedMaterialIds: string[];
  affectedSectors: Sector[];
  summary: string;
  analyticalSignificance: string;
  supersededByEventId?: string | null;
  sourceIds: string[];
};

export type FramingClaim = {
  id: string;
  eventId: string;
  actor: JurisdictionCode;
  category: FramingCategory[];
  /** REQUIRED short quoted anchor, in the original language. */
  quoteOriginal: string;
  /** REQUIRED translation (identical to original if already English). */
  quoteEn: string;
  quoteEnSource: EnSource;
  /** Must resolve to the Source the quote came from. */
  sourceId: string;
  notes?: string | null;
};

export type Material = {
  id: string;
  slug: string;
  nameEn: string;
  nameZh?: string | null;
  /** e.g. "rare earth elements". */
  grouping?: string | null;
  /** Current policy picture across actors, plain English. */
  statusSummary: string;
  /** The dominance / control fact that anchors most events. */
  chinaPositionNote: string;
  /** Allied diversification projects (Lynas, MP Materials, Iluka, etc.). */
  diversificationNote?: string | null;
  downstreamIndustries: string[];
  eventIds: string[];
  sourceIds: string[];
};

export type Jurisdiction = {
  id: string;
  /** "CN", "US", "EU", "AU", "JP", "CA". */
  code: string;
  name: string;
  roles: JurisdictionRole[];
  supplyChainPosition: string;
  keyBodies: string[];
  framingPosture?: string | null;
  eventIds: string[];
  sourceIds: string[];
};

export type Source = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  language: SourceLang;
  datePublished?: string | null;
  dateAccessed: string;
  sourceType: SourceType;
  confidence: SourceConfidence;
  notes?: string | null;
};

// ---------------------------------------------------------------------------
// Candidate (private / pre-publication) workflow
//
// Candidate records are DRAFTS. They live under `data/candidates/` and are
// NEVER imported by `lib/data.ts` or any file under `app/` — so they cannot
// reach public pages, exports, search, filters, or the production build.
// `scripts/validate-data.ts` proves this on every `npm run validate`.
// See `data/candidates/README.md` for the add/review/reject/promote workflow.
// ---------------------------------------------------------------------------

/** Lifecycle of a candidate record. */
export const CANDIDATE_STATUSES = [
  "draft", // researcher captured it; not yet verified
  "in_review", // source-verification / classification in progress
  "verified", // source-verifier returned VERIFIED (or VERIFIED WITH CORRECTIONS)
  "rejected", // will not be published
  "promoted", // merged into the published seed (see promotion.promotedEventId)
] as const;

/** The source-verifier's single verdict (mirrors the agent's contract). */
export const REVIEW_VERDICTS = [
  "pending",
  "verified",
  "verified_with_corrections",
  "insufficient_source",
  "reject",
] as const;

/** Categorical classification confidence — no numeric scores. */
export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;

export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];
export type ReviewVerdict = (typeof REVIEW_VERDICTS)[number];
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

/**
 * A proposed event. Same shape as `PolicyEvent` but every field is optional so
 * an early-stage draft can be incomplete. Completeness is enforced by the
 * validator once `status` reaches "verified"/"promoted".
 */
export type ProposedEvent = Partial<PolicyEvent>;

/** A proposed framing claim (same shape as `FramingClaim`, fields optional). */
export type ProposedFraming = Partial<FramingClaim>;

export type CandidateRecord = {
  /** Unique, in its own namespace (convention: "cand-..."). Must NOT collide
   *  with any published id. */
  candidateId: string;
  status: CandidateStatus;
  createdBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;

  /** The published payload being proposed. */
  proposedEvent: ProposedEvent;
  proposedFraming?: ProposedFraming[];
  /** New sources this candidate introduces (existing sources may be referenced
   *  by id in proposedEvent.sourceIds instead). */
  proposedSources?: Source[];

  /** Source-verification result. */
  verification: {
    verdict: ReviewVerdict;
    verifiedFields?: string[];
    corrections?: string[];
    reviewer?: string | null;
    reviewedAt?: string | null;
  };

  /** Proposed classification (existing taxonomy only). */
  classification: {
    proposedFramingCategories?: FramingCategory[];
    confidence: ConfidenceLevel;
    evidence?: string | null;
    ambiguityFlags?: string[];
  };

  reviewerNotes?: string | null;
  openQuestions?: string[];

  /** Promotion bookkeeping. */
  promotion: {
    promoted: boolean;
    promotedEventId?: string | null;
    promotedAt?: string | null;
    approvedBy?: string | null;
  };
};
