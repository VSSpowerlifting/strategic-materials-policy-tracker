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
  "uk",
  "india",
  "other",
] as const;

export const POLICY_STATUSES = [
  "active",
  "suspended",
  "proposed",
  "superseded",
  "in_force",
  "unclear",
  "ended", // concluded, withdrawn or expired with no continuing effect and no replacement
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

/**
 * Evidentiary standing of a published record. This is a *status*, held
 * separately from `lifecycle.verifiedAt`, which records only *when* the
 * verification happened. A record can legitimately be "verified" with a null
 * `verifiedAt` when it was verified before the tracker kept lifecycle dates.
 *
 *  - "verified"    — resolves to at least one source that is BOTH
 *                    `confidence: "primary"` AND `sourceType: "official"`.
 *  - "provisional" — the record stands on translations, state media or
 *                    secondary analysis. It stays published and honestly
 *                    labelled, but is excluded from verified-action and
 *                    official-source-coverage counts.
 */
export const VERIFICATION_STATUSES = ["verified", "provisional"] as const;

/**
 * How a record entered the tracker.
 *
 *  - "backfill"  — added retrospectively when the archive was built. Lifecycle
 *                  dates are mostly unrecoverable and must stay null rather
 *                  than be reconstructed.
 *  - "monitored" — caught prospectively from the watchlist after monitoring
 *                  began. Requires the full lifecycle, which is what makes any
 *                  timeliness statistic well defined.
 */
export const INTAKE_MODES = ["backfill", "monitored"] as const;

/** How often a watched source is meant to be checked. */
export const WATCH_CADENCES = ["weekly", "biweekly", "monthly", "quarterly", "ad_hoc"] as const;

/** Whether a watched source is currently in the review rotation. */
export const WATCH_STATUSES = ["active", "paused", "retired"] as const;

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
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export type IntakeMode = (typeof INTAKE_MODES)[number];
export type WatchCadence = (typeof WATCH_CADENCES)[number];
export type WatchStatus = (typeof WATCH_STATUSES)[number];

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

/**
 * Dates tracing a record from the issuing body to this site. Every field is
 * nullable on purpose: an unknown date is recorded as null, never reconstructed
 * or approximated. Metrics that depend on a date simply exclude the records
 * that lack it, and state the denominator they used.
 */
export type EventLifecycle = {
  /** ISO date the issuing body published the instrument. */
  officialPublicationDate: string | null;
  /** ISO date the tracker first logged the measure. */
  discoveredAt: string | null;
  /** ISO date primary-source verification completed. Not a status — see
   *  `verificationStatus`. */
  verifiedAt: string | null;
  /** ISO date the record became publicly visible on the site. */
  publishedAt: string | null;
};

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
  /** Evidentiary standing. Gated by the official-primary rule in the validator. */
  verificationStatus: VerificationStatus;
  /** How the record entered the tracker. */
  intakeMode: IntakeMode;
  lifecycle: EventLifecycle;
};

/**
 * An official source under standing review — the input side of the tracker,
 * as opposed to `Source`, which is a citation bound to a published record.
 * Kept in its own file so that watching something implies no claim about it.
 */
export type WatchedSource = {
  id: string;
  jurisdiction: JurisdictionCode;
  /** e.g. "MOFCOM Bureau of Industry Security and Import/Export Control". */
  issuingBody: string;
  /** Original-language name of the issuing body, where it has one. */
  issuingBodyOriginal?: string | null;
  /** Human name of the page or feed being watched. */
  title: string;
  url: string;
  sourceType: SourceType;
  language: SourceLang;
  /** Materials this source is watched for; must resolve to materials.json. */
  materialIds: string[];
  /** Policy areas, drawn from the existing mechanism taxonomy. */
  mechanisms: Mechanism[];
  cadence: WatchCadence;
  status: WatchStatus;
  /**
   * ISO date this source was last checked for new measures. Null means never
   * checked in a published review cycle — it is not a claim of freshness.
   */
  lastCheckedAt: string | null;
  notes?: string | null;
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
// Capital & Control (v0.5): financial commitments and control measures
//
// A PolicyEvent stays the announcement and citation unit. The instruments an
// announcement contains are recorded as child rows of two separate kinds,
// because money and legal restrictions answer different questions and share
// almost no fields:
//
//   FinancialCommitment  "fin-..."  one financial instrument: a grant, loan,
//                                   equity stake, price floor, programme
//                                   envelope and so on.
//   ControlMeasure       "ctl-..."  one operative clause or limb of an export,
//                                   import, investment or domestic control.
//
// "fc-" already belongs to framing claims and "cand-" to private candidates.
//
// Ground rules the model is built around (validator enforcement is Phase 2):
//  - Original currency is authoritative. Amounts are decimal strings, never JS
//    numbers, and nothing here converts, deflates or totals them.
//  - Unlike instruments and value roles are never added together, and a
//    commitment is never counted together with one it is part of or drawn from.
//  - Private capital, a recipient's own funds and total project cost are
//    recorded so they can be kept out of public-support figures.
//  - Every important field names the source that supports it (`evidence`). A
//    record's source list is derived from that and is not stored separately.
//  - Statuses are source-linked histories, oldest first; the current status is
//    the last entry, so no separate current-status field is stored.
//  - Absence is null or an empty array. No row is created only to record that
//    something is not stated.
// ---------------------------------------------------------------------------

/** Reserved id prefixes for the two Capital & Control entities. */
export const FINANCIAL_COMMITMENT_ID_PREFIX = "fin-";
export const CONTROL_MEASURE_ID_PREFIX = "ctl-";

/** The kind of money, or money-like promise, a commitment is. */
export const FINANCIAL_INSTRUMENTS = [
  "grant",
  "loan",
  "loan_guarantee",
  "equity",
  "tax_credit",
  "price_floor",
  "offtake",
  "procurement_right",
  "stockpile_purchase",
  "mixed", // one amount the source spreads over several named instruments (e.g. "loans and equity support") without a split
  "unspecified", // the source says "support", "funding" or "investment" and names no instrument
] as const;

/**
 * What a stated amount represents. Only "commitment" is money committed to a
 * recipient or project; the other roles are recorded so they can be kept out
 * of support figures, or compared only with their own kind.
 */
export const VALUE_ROLES = [
  "commitment", // committed to a named recipient or project
  "program_envelope", // the ceiling of a programme or fund that awards are drawn from
  "budget_appropriation", // money set aside in a budget
  "lending_authority", // a ceiling on what a lender may lend or guarantee
  "funding_option", // a ceiling a party may call on at its election under an executed agreement; an exercise is recorded as its own commitment drawn from it
  "expected_co_investment", // money the government expects others to put in
  "private_financing", // commercial capital raised alongside public money
  "recipient_own_funds", // the recipient's own contribution
  "total_project_cost", // the whole cost of the project, whoever pays it
] as const;

/** Who ultimately provides the capital. */
export const CAPITAL_SOURCES = [
  "public",
  "public_enterprise", // a state-owned company or public-sector undertaking
  "mixed_vehicle", // a joint public-private vehicle, e.g. the JOGMEC-Sojitz JARE
  "private",
  "not_stated",
] as const;

/** The financial lifecycle of a commitment. The stages are distinct, never interchangeable. */
export const FINANCIAL_STATUSES = [
  "announced",
  "authorized", // legal or budgetary authority exists
  "allocated", // money assigned to the purpose, e.g. in a budget
  "decided", // the provider has decided to invest or award
  "contracted", // a binding agreement has been executed
  "partially_disbursed",
  "disbursed",
  "withdrawn",
  "lapsed", // ended unused on its own terms, e.g. a commitment letter that expired undrawn (v0.6)
  "not_stated",
] as const;

/** Physical progress of the funded project, held apart from the money. */
export const IMPLEMENTATION_STATUSES = [
  "announced",
  "feasibility",
  "construction",
  "commissioning",
  "operational",
  "suspended",
  "cancelled",
  "not_stated",
  "not_applicable", // no physical project, e.g. a tax credit or a programme envelope
] as const;

/** Supply-chain stages. Recorded on each commitment, never on the event. */
export const SUPPLY_CHAIN_STAGES = [
  "exploration",
  "mining",
  "separation",
  "processing",
  "refining",
  "component_manufacturing",
  "final_manufacturing",
  "recycling",
  "stockpiling",
  "research_development",
  "cross_cutting",
] as const;

/** Whether a commitment's amount can be attributed to the stages it lists. */
export const STAGE_ALLOCATIONS = [
  "single_stage", // the whole amount supports the one stage listed
  "multi_stage_unallocated", // spread over the stages listed; the split is not stated
  "not_stated", // the source does not say which stage the money goes to
] as const;

/** How the materials a source names relate to the tracked material set. */
export const MATERIAL_ATTRIBUTIONS = [
  "tracked_only", // every material the source names is a tracked material
  "includes_untracked", // the source also names materials outside the taxonomy
  "not_stated", // the source names no specific material
] as const;

/** How the source qualifies a figure. "up_to" is a ceiling, not the committed sum. */
export const VALUE_QUALIFIERS = ["exact", "up_to", "approximately", "at_least"] as const;

/**
 * How the currency of an amount was established:
 *  - "stated"         — the source prints the code or an unambiguous symbol
 *                       ("AUD", "£", "Rs.").
 *  - "issuer_context" — the source prints an ambiguous symbol such as "$", and
 *                       the currency is read from the issuing government (a
 *                       Canadian federal release → CAD).
 */
export const CURRENCY_BASES = ["stated", "issuer_context"] as const;

/** Structured terms a commitment can carry. One commitment may carry several. */
export const TERM_KINDS = [
  "tax_credit_rate",
  "price_floor",
  "annual_reimbursement_cap",
  "lending_rate",
  "duration",
  "procurement_share",
  "offtake_share",
  "quantity_covenant",
  "capacity_covenant",
  "other",
] as const;

/** Outcomes a source attributes to a commitment. */
export const OUTCOME_METRICS = [
  "annual_capacity",
  "supply_share",
  "procurement_right_share",
  "direct_jobs",
  "target_date",
  "other",
] as const;

/** Who makes an outcome claim within the source; a company's target is not a government's. */
export const OUTCOME_ATTRIBUTIONS = ["government", "recipient", "third_party"] as const;

/**
 * How a commitment relates to another. A link is read from the record that
 * holds it, towards the commitment it names:
 *  - "part_of"    — this commitment is a component of that one, e.g. one
 *                   element of a reserve or package.
 *  - "drawn_from" — this commitment is paid out of that one, e.g. an award from
 *                   a facility, envelope, appropriation or lending authority.
 * There are no inverse types, so every link has one spelling.
 */
export const FINANCIAL_RELATIONSHIP_TYPES = ["part_of", "drawn_from"] as const;

/**
 * How directly a source supports the fields it is cited for. There is no "not
 * stated" level: a fact the sources do not state is null or an empty array.
 */
export const EVIDENCE_LEVELS = ["explicit", "ambiguous"] as const;

/** FinancialCommitment fields an evidence reference can support. */
export const FINANCIAL_EVIDENCE_FIELDS = [
  "instrument",
  "value_role",
  "capital_source",
  "amount",
  "relationships",
  "provider", // provider, providerJurisdiction and providerOrgIds
  "legal_authority",
  "recipient", // recipient and recipientOrgIds
  "project", // project and projectId
  "facility",
  "location",
  "stages", // stages and stageAllocation
  "materials", // materialIds, materialAttribution and untrackedMaterialsAsStated
  "status", // both status histories
  "terms",
  "outcomes",
  "programme", // programmeId (v0.6)
] as const;

/** The kind of legal or contractual control a measure imposes. */
export const CONTROL_MEASURE_TYPES = [
  "export_licensing",
  "export_prohibition",
  "extraterritorial_licensing",
  "end_use_restriction",
  "decontrol",
  "suspension",
  "trade_investigation",
  "import_restriction",
  "investment_divestiture",
  "customs_enforcement",
  "domestic_production_control",
  "contractual_ownership_covenant",
] as const;

/** Which flow a control measure governs. */
export const CONTROL_DIRECTIONS = [
  "export",
  "re_export",
  "import",
  "inbound_investment",
  "outbound_investment",
  "domestic",
] as const;

/** Legal status of one control clause over time. */
export const CONTROL_STATUSES = [
  "announced",
  "scheduled", // adopted, with a stated future effective date
  "in_force",
  "suspended",
  "expired",
  "revoked",
  "investigation", // an inquiry that imposes no restriction yet
  "concluded", // an inquiry that has ended with a finding or report; what follows is recorded as its own measure
  "not_stated",
] as const;

/** How a control measure defines whom or what it targets. A measure may combine several. */
export const TARGET_SCOPES = [
  "all_jurisdictions", // applies whatever the destination or origin
  "named_jurisdictions",
  "named_entities", // named companies, persons or listed parties
  "end_users", // categories of user, worded in targetEndUsersAsStated
  "end_uses", // categories of use, worded in targetEndUsesAsStated
  "domestic_operators", // enterprises inside the issuing jurisdiction
] as const;

/** Classification systems a product code can come from. */
export const PRODUCT_CODE_SYSTEMS = [
  "cn_customs", // China customs commodity code (10-digit)
  "cn_control_number", // China dual-use item control number, e.g. 1C902
  "hs", // WCO Harmonized System
  "us_hts", // US Harmonized Tariff Schedule
  "us_eccn", // US Export Control Classification Number
  "eu_cn", // EU Combined Nomenclature
] as const;

/**
 * What a listed code does:
 *  - "reference"   — printed for convenience; the item description governs
 *                    (China's 参考海关商品编号).
 *  - "legal_scope" — the code itself defines what is covered.
 */
export const PRODUCT_CODE_ROLES = ["reference", "legal_scope"] as const;

/** ControlMeasure fields an evidence reference can support. */
export const CONTROL_EVIDENCE_FIELDS = [
  "measure_type",
  "direction",
  "clause",
  "targets", // every target* field, including the stated end users and end uses
  "materials", // materialIds, materialAttribution and untrackedMaterialsAsStated
  "product_scope",
  "product_codes",
  "legal_basis", // legalBasisEventIds and legalBasisAsStated
  "modified_measures", // modifiesMeasureIds and modifiesExternalInstruments
  "status",
  "item_scope", // controlledItemTypes and controlledStages (v0.6)
] as const;

export type FinancialInstrument = (typeof FINANCIAL_INSTRUMENTS)[number];
export type ValueRole = (typeof VALUE_ROLES)[number];
export type CapitalSource = (typeof CAPITAL_SOURCES)[number];
export type FinancialStatus = (typeof FINANCIAL_STATUSES)[number];
export type ImplementationStatus = (typeof IMPLEMENTATION_STATUSES)[number];
export type SupplyChainStage = (typeof SUPPLY_CHAIN_STAGES)[number];
export type StageAllocation = (typeof STAGE_ALLOCATIONS)[number];
export type MaterialAttribution = (typeof MATERIAL_ATTRIBUTIONS)[number];
export type ValueQualifier = (typeof VALUE_QUALIFIERS)[number];
export type CurrencyBasis = (typeof CURRENCY_BASES)[number];
export type TermKind = (typeof TERM_KINDS)[number];
export type OutcomeMetric = (typeof OUTCOME_METRICS)[number];
export type OutcomeAttribution = (typeof OUTCOME_ATTRIBUTIONS)[number];
export type FinancialRelationshipType = (typeof FINANCIAL_RELATIONSHIP_TYPES)[number];
export type EvidenceLevel = (typeof EVIDENCE_LEVELS)[number];
export type FinancialEvidenceField = (typeof FINANCIAL_EVIDENCE_FIELDS)[number];
export type ControlMeasureType = (typeof CONTROL_MEASURE_TYPES)[number];
export type ControlDirection = (typeof CONTROL_DIRECTIONS)[number];
export type ControlStatus = (typeof CONTROL_STATUSES)[number];
export type TargetScope = (typeof TARGET_SCOPES)[number];
export type ProductCodeSystem = (typeof PRODUCT_CODE_SYSTEMS)[number];
export type ProductCodeRole = (typeof PRODUCT_CODE_ROLES)[number];
export type ControlEvidenceField = (typeof CONTROL_EVIDENCE_FIELDS)[number];

/**
 * A figure written as a canonical decimal string: digits with an optional
 * fractional part, and no sign, exponent, currency symbol or thousands
 * separator. No leading zeros (other than a lone "0" before the point) and no
 * trailing fractional zeros, so every value has exactly one spelling:
 * "163000000000", "47668000", "0.5". Held as a string so that no amount ever
 * passes through binary floating point.
 */
export type DecimalString = string;

/** ISO 4217 alphabetic currency code, e.g. "USD", "CAD", "INR". */
export type CurrencyCode = string;

/** ISO 3166-1 alpha-2 country code, e.g. "NA" (Namibia), "US". */
export type CountryCode = string;

/** An amount of money exactly as a source states it, in the source's currency. */
export type MonetaryAmount = {
  /** Major currency units: "Rs.16,300 crore" → "163000000000". */
  value: DecimalString;
  currency: CurrencyCode;
  qualifier: ValueQualifier;
  /** The amount as the source prints it, e.g. "up to $3.8 billion". */
  amountAsStated: string;
  currencyBasis: CurrencyBasis;
};

/**
 * Where a funded project or facility is. Deliberately not the actor taxonomy:
 * a project can sit in a country the tracker does not follow.
 */
export type ProjectLocation = {
  countryCode: CountryCode | null;
  /** State, province, region or site, e.g. "Kunene Region". */
  subnational: string | null;
  /** The location exactly as the source words it. */
  asStated: string | null;
};

/**
 * One entry in a source-linked status history. Histories run oldest first and
 * the current status is the last entry, so no separate current-status field
 * is stored.
 */
export type StatusEntry<S extends string> = {
  status: S;
  /** ISO date the status took effect, as the source states it; null if it gives none. */
  date: string | null;
  sourceId: string;
  note?: string | null;
};

export type FinancialStatusEntry = StatusEntry<FinancialStatus>;
export type ImplementationStatusEntry = StatusEntry<ImplementationStatus>;

export type ControlStatusEntry = StatusEntry<ControlStatus> & {
  /**
   * The stated end of this status, when the source gives one: the date a
   * "scheduled" clause is due to take effect, the end of a suspension, or the
   * expiry of a measure in force.
   */
  until?: string | null;
};

/**
 * Field-level provenance: one source, the fields of one record it supports,
 * and how directly it supports them. A record's sources are the distinct
 * `sourceId`s of its evidence; there is no separate `sourceIds` list to drift.
 * Terms, outcomes, status entries and relationships also name their own
 * source, which must appear here under the matching field.
 */
export type EvidenceReference<F extends string> = {
  sourceId: string;
  /** The fields this source supports on this record; never empty. */
  supports: F[];
  evidence: EvidenceLevel;
  /** Pinpoint within the source, e.g. "para. 8", "Item 1.01", "p. 20". */
  locator?: string | null;
  note?: string | null;
};

export type FinancialEvidence = EvidenceReference<FinancialEvidenceField>;
export type ControlEvidence = EvidenceReference<ControlEvidenceField>;

/**
 * One structured term of an instrument: a rate, cap, floor, share, duration
 * or covenant. Figures are decimal strings. Money in a term carries its own
 * currency, and `unit` says what the figure is expressed in or per, as the
 * source gives it: "%", "years", "per kg", "tonnes per annum". Units are free
 * text on purpose; a controlled list waits until repeated real values show a
 * stable set.
 */
export type InstrumentTerm = {
  kind: TermKind;
  /** Null when the source states the term without a figure. */
  value: DecimalString | null;
  qualifier: ValueQualifier | null;
  /** ISO 4217 code when the figure is money (a price floor, a cap); otherwise null. */
  currency: CurrencyCode | null;
  unit: string | null;
  /** The term as the source words it. */
  asStated: string;
  sourceId: string;
  note?: string | null;
};

/** An outcome a source attributes to a commitment: capacity, supply access, jobs or a date. */
export type StatedOutcome = {
  metric: OutcomeMetric;
  /** Decimal string for a quantity; null for "target_date" or when no figure is stated. */
  value: DecimalString | null;
  qualifier: ValueQualifier | null;
  /** Free text, as the source gives it (see InstrumentTerm). */
  unit: string | null;
  /** For "target_date": an ISO date or partial date ("2027", "2027-03"); otherwise null. */
  targetDate: string | null;
  /** The outcome as the source words it, e.g. "full-scale production in Q1 2027". */
  asStated: string;
  statedBy: OutcomeAttribution;
  sourceId: string;
  note?: string | null;
};

/**
 * A typed link from this commitment to another, which may belong to a
 * different event. Read it from the record that holds it: "part_of" means this
 * commitment is a component of `commitmentId`; "drawn_from" means it is paid
 * out of `commitmentId`. A commitment can hold several links of both kinds and
 * is never counted together with a commitment it links to. Each link names
 * the source that states it.
 */
export type FinancialRelationship = {
  /** The other commitment: "fin-...". */
  commitmentId: string;
  relationship: FinancialRelationshipType;
  sourceId: string;
  /** Pinpoint within the source, e.g. "para. 4". */
  locator?: string | null;
  note?: string | null;
};

/**
 * One financial instrument announced in, or cited by, an event. An event can
 * carry several (an equity stake, a loan and a price floor in one package),
 * and each is recorded, sourced and statused on its own.
 */
export type FinancialCommitment = {
  /** "fin-..." */
  id: string;
  /** The event that announces or cites this commitment. */
  eventId: string;
  /**
   * What this commitment is part of or drawn from, in this event or another;
   * empty when the sources state neither. One amount can be part of a reserve
   * and drawn from a separate facility at the same time.
   */
  relationships: FinancialRelationship[];
  instrument: FinancialInstrument;
  valueRole: ValueRole;
  capitalSource: CapitalSource;
  /** Null when the source states no amount, e.g. a rate-based tax credit. */
  amount: MonetaryAmount | null;
  /** Normalized name of whoever provides the money; null when not stated. */
  provider: string | null;
  /** The tracked actor behind the provider (actor taxonomy, not a location). */
  providerJurisdiction: JurisdictionCode | null;
  /**
   * The providers as registry organizations ("org-..."), most specific unit
   * first-named (OSC, not the whole department). Empty when the provider is
   * not an identifiable organization, e.g. "PSUs, etc."; `provider` keeps the
   * wording either way.
   */
  providerOrgIds: string[];
  /** Statute or authority invoked, as stated, e.g. "Defense Production Act Title III". */
  legalAuthority: string | null;
  /** The programme or scheme the money is awarded or managed under ("prg-..."), when the sources name one. */
  programmeId: string | null;
  recipient: string | null;
  /** The recipients as registry organizations; empty when the recipient is a project, a class or unstated. */
  recipientOrgIds: string[];
  /** The funded undertaking, e.g. a mine restart or a demonstration plant. */
  project: string | null;
  /** The registry project ("prj-...") this row funds, when it funds one identifiable project. */
  projectId: string | null;
  /** The physical site or plant, where named. */
  facility: string | null;
  /** Empty when the source gives no location. */
  locations: ProjectLocation[];
  stages: SupplyChainStage[];
  stageAllocation: StageAllocation;
  /** Tracked materials only: a subset of the parent event's affectedMaterialIds. */
  materialIds: string[];
  materialAttribution: MaterialAttribution;
  /** Co-products and other materials outside the taxonomy, as the source names them. */
  untrackedMaterialsAsStated: string[];
  financialStatusHistory: FinancialStatusEntry[];
  implementationStatusHistory: ImplementationStatusEntry[];
  terms: InstrumentTerm[];
  outcomes: StatedOutcome[];
  evidence: FinancialEvidence[];
  notes?: string | null;
};

/** A product code exactly as the source prints it. */
export type ProductCode = {
  system: ProductCodeSystem;
  /** As printed, e.g. "2805301100" or "1C902". */
  code: string;
  role: ProductCodeRole;
};

/**
 * One operative clause or limb of a control. Clauses whose statuses differ
 * (one limb in force, another suspended) are separate rows, so no row hides a
 * conflicting status history.
 */
export type ControlMeasure = {
  /** "ctl-..." */
  id: string;
  eventId: string;
  measureType: ControlMeasureType;
  direction: ControlDirection;
  /** The operative clause or limb, e.g. "Item 1(3)", "Art. 2"; null for a single-clause measure. */
  clause: string | null;
  /** Empty when the source does not define its targets. */
  targetScopes: TargetScope[];
  /** Named target jurisdictions, as ISO 3166-1 alpha-2 codes. */
  targetJurisdictions: CountryCode[];
  /** Named companies, persons or lists, as the source names them. */
  targetEntities: string[];
  /**
   * Classes of end user the measure targets, named or described in the
   * source's words, e.g. "military end users". Not a controlled vocabulary.
   */
  targetEndUsersAsStated: string[];
  /** End uses the measure targets, in the source's words. Not a controlled vocabulary. */
  targetEndUsesAsStated: string[];
  /** Tracked materials only: a subset of the parent event's affectedMaterialIds. */
  materialIds: string[];
  materialAttribution: MaterialAttribution;
  untrackedMaterialsAsStated: string[];
  /** The covered items in the source's own words. */
  productScopeAsStated: string | null;
  productCodes: ProductCode[];
  /**
   * What kind of item the clause covers (v0.6). Empty for clauses that do not
   * define items of their own: end-use restrictions, customs enforcement,
   * divestiture orders and suspensions.
   */
  controlledItemTypes: ControlledItemType[];
  /**
   * The supply-chain stages the covered items belong to: the stage that
   * produces a covered material or product, or the stage a covered technology
   * or piece of equipment is used in. Read from the product scope; empty on
   * the same clauses as controlledItemTypes. Controlling exports of
   * separation technology is not controlling separation itself, so this says
   * where the items sit, not what the clause restricts domestically.
   */
  controlledStages: SupplyChainStage[];
  /** Events in the corpus that are this measure's legal basis, e.g. an export control law. */
  legalBasisEventIds: string[];
  legalBasisAsStated: string | null;
  /** Control measures this one modifies, suspends or replaces. */
  modifiesMeasureIds: string[];
  /** Instruments it modifies that are not in the corpus, by document number or title. */
  modifiesExternalInstruments: string[];
  statusHistory: ControlStatusEntry[];
  evidence: ControlEvidence[];
  notes?: string | null;
};

// ---------------------------------------------------------------------------
// Capital intelligence (v0.6): who, what and under which scheme
//
// v0.5 recorded the instruments. v0.6 adds the parties and undertakings they
// connect, as registries that the instrument rows point to:
//
//   Organization        "org-..."  a provider, recipient, sponsor or holder:
//                                  a government body, public financier,
//                                  joint vehicle, company or bank.
//   Project             "prj-..."  one physical undertaking (a mine, a
//                                  refinery, a magnet plant) that capital or
//                                  a designation is aimed at.
//   Programme           "prg-..."  a named scheme that awards, lends,
//                                  credits, reserves or designates.
//   ProjectDesignation  "dsg-..."  non-monetary support: a project recognized
//                                  under a scheme (an EU CRMA strategic
//                                  project). A child row of the event that
//                                  recognizes it, like fin- and ctl- rows.
//
// Registry records are factual claims too: every name, kind, country, actor
// and parent link names its source in `evidence`. Nothing money-related is
// stored on a registry record; stacks, portfolios, co-investment and flows are
// derived in lib/capital-intelligence.ts through the v0.5 counting rules.
// A designation is never capital and never enters a sum.
// ---------------------------------------------------------------------------

export const ORGANIZATION_ID_PREFIX = "org-";
export const PROJECT_ID_PREFIX = "prj-";
export const PROGRAMME_ID_PREFIX = "prg-";
export const PROJECT_DESIGNATION_ID_PREFIX = "dsg-";

/** What kind of body an organization is. */
export const ORGANIZATION_KINDS = [
  "government", // a government, or one of its ministries, departments, agencies or offices
  "public_financier", // a publicly owned lender, investor or export-credit agency, e.g. the National Wealth Fund
  "joint_vehicle", // a vehicle set up jointly by public and private parties, e.g. JARE
  "company", // a company acting in its own name
  "project_company", // a company established to develop one project
  "bank", // a commercial bank
] as const;

/**
 * How an organization relates to another, read from the record that holds the
 * link. "part_of" (an office inside a department) rolls a portfolio up to the
 * parent; "established_by" (a joint vehicle or project company and the bodies
 * that set it up) does not, because the vehicle's money is not its founders'.
 */
export const ORGANIZATION_LINK_TYPES = ["part_of", "established_by"] as const;

/** Organization fields an evidence reference can support. */
export const ORGANIZATION_EVIDENCE_FIELDS = [
  "name", // name, nameOriginal and aliases
  "kind",
  "country",
  "actor",
  "parents",
] as const;

/** Project fields an evidence reference can support. */
export const PROJECT_EVIDENCE_FIELDS = ["name", "sponsors", "location", "stages", "materials"] as const;

/** What a programme does with the money or recognition it manages. */
export const PROGRAMME_KINDS = [
  "grant_programme", // awards grants or non-repayable contributions
  "financing_facility", // lends, guarantees or invests
  "tax_incentive", // a tax credit or offset
  "strategic_reserve", // buys, holds or trades stocks
  "designation_scheme", // recognizes projects; any money comes from other instruments
  "multi_instrument", // funds several of the above under one name, with no split stated
] as const;

/** Programme fields an evidence reference can support. */
export const PROGRAMME_EVIDENCE_FIELDS = [
  "name", // name and nameOriginal
  "kind",
  "administrators", // administeringOrgIds, and the actor they belong to
  "parent",
  "legal_authority",
] as const;

/** Legal standing of a project designation over time. */
export const DESIGNATION_STATUSES = [
  "recognized", // the scheme's decision recognizes the project
  "withdrawn", // the recognition has been withdrawn or has lapsed
] as const;

/** ProjectDesignation fields an evidence reference can support. */
export const DESIGNATION_EVIDENCE_FIELDS = [
  "programme",
  "project", // projectId and projectNameAsStated
  "holders",
  "location",
  "stages",
  "materials",
  "status",
] as const;

/** What kind of item a control clause covers. */
export const CONTROLLED_ITEM_TYPES = [
  "goods", // materials, compounds, alloys and products other than production equipment
  "equipment", // production, processing or testing equipment
  "technology", // technology, know-how or technical data
] as const;

export type OrganizationKind = (typeof ORGANIZATION_KINDS)[number];
export type OrganizationLinkType = (typeof ORGANIZATION_LINK_TYPES)[number];
export type OrganizationEvidenceField = (typeof ORGANIZATION_EVIDENCE_FIELDS)[number];
export type ProjectEvidenceField = (typeof PROJECT_EVIDENCE_FIELDS)[number];
export type ProgrammeKind = (typeof PROGRAMME_KINDS)[number];
export type ProgrammeEvidenceField = (typeof PROGRAMME_EVIDENCE_FIELDS)[number];
export type DesignationStatus = (typeof DESIGNATION_STATUSES)[number];
export type DesignationEvidenceField = (typeof DESIGNATION_EVIDENCE_FIELDS)[number];
export type ControlledItemType = (typeof CONTROLLED_ITEM_TYPES)[number];

/** A link from one organization to another, naming the source that states it. */
export type OrganizationLink = {
  /** The other organization: "org-...". */
  organizationId: string;
  relationship: OrganizationLinkType;
  sourceId: string;
  locator?: string | null;
  note?: string | null;
};

/**
 * A provider, recipient, sponsor or holder. One record per body, however
 * many names the sources use for it: a renamed department keeps one id and
 * lists its other names in `aliases`, so its portfolio does not split.
 */
export type Organization = {
  /** "org-..." */
  id: string;
  /** Normalized English name. */
  name: string;
  /** The name in the body's own language, where that is not English. */
  nameOriginal: string | null;
  /** Other names the sources use, e.g. "Department of War". */
  aliases: string[];
  kind: OrganizationKind;
  /** ISO 3166-1 alpha-2 code of the country it is constituted in; null for a supranational body. */
  countryCode: CountryCode | null;
  /**
   * The tracked government the body belongs to: set for government bodies and
   * public financiers, null for companies, banks and joint vehicles, whose
   * money is not a government's even when a government helped found them.
   */
  actor: JurisdictionCode | null;
  parents: OrganizationLink[];
  evidence: EvidenceReference<OrganizationEvidenceField>[];
  notes?: string | null;
};

/**
 * One physical undertaking capital or a designation is aimed at. It holds
 * what the undertaking is, not what was paid for it: money stays on the
 * financial rows that point here.
 */
export type Project = {
  /** "prj-..." */
  id: string;
  name: string;
  /** Developers or owners the sources name. */
  sponsorOrgIds: string[];
  locations: ProjectLocation[];
  stages: SupplyChainStage[];
  /** Tracked materials the sources name for the project. */
  materialIds: string[];
  materialAttribution: MaterialAttribution;
  untrackedMaterialsAsStated: string[];
  evidence: EvidenceReference<ProjectEvidenceField>[];
  notes?: string | null;
};

/** A named scheme that awards, lends, credits, reserves or designates. */
export type Programme = {
  /** "prg-..." */
  id: string;
  name: string;
  nameOriginal: string | null;
  /** The tracked government that runs it. */
  actor: JurisdictionCode;
  kind: ProgrammeKind;
  administeringOrgIds: string[];
  /** A wider programme this one is funded from or forms part of. */
  parentProgrammeId: string | null;
  legalAuthorityAsStated: string | null;
  evidence: EvidenceReference<ProgrammeEvidenceField>[];
  notes?: string | null;
};

export type DesignationStatusEntry = StatusEntry<DesignationStatus>;

/**
 * A project recognized under a designation scheme. It confers standing
 * (priority, coordination, faster permitting), not money: any money that
 * follows is its own financial row.
 */
export type ProjectDesignation = {
  /** "dsg-..." */
  id: string;
  /** The event that recognizes the project, e.g. a Commission decision. */
  eventId: string;
  /** The designation scheme. */
  programmeId: string;
  projectId: string;
  /** The project's name exactly as the designation gives it. */
  projectNameAsStated: string;
  /** Promoters or holders as registry organizations; empty when the source names none. */
  holderOrgIds: string[];
  /** The location as the designation states it. */
  locations: ProjectLocation[];
  stages: SupplyChainStage[];
  /** Tracked materials only: a subset of the event's affectedMaterialIds. */
  materialIds: string[];
  materialAttribution: MaterialAttribution;
  untrackedMaterialsAsStated: string[];
  statusHistory: DesignationStatusEntry[];
  evidence: EvidenceReference<DesignationEvidenceField>[];
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
