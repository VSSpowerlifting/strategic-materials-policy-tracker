/**
 * The dataset manifest served at `/api/v1/dataset-manifest`: what the curated
 * policy and capital corpus contains, where each collection is served, how
 * records join, and how dates and statuses are to be read.
 *
 * Deterministic and cheap by construction. It reads `site` and the seed
 * loaders' lengths through `lib/dataset-metadata.ts` only; it never builds
 * the full dataset export or a financial summary. The market-data layer
 * (`/markets`) is a separate research-data layer and is deliberately not
 * described here beyond a pointer.
 *
 * `manifestVersion` versions this document's own shape (semantic versioning;
 * fields are added, never repurposed). It is distinct from `corpus.version`,
 * which names the curated corpus release.
 */
import { datasetCounts, datasetIdentity, type DatasetCollectionKey } from "./dataset-metadata";
import { site } from "./site";

export const MANIFEST_VERSION = "1.0.0";
export const MANIFEST_PATH = "/api/v1/dataset-manifest";
export const INTEGRATION_GUIDE_PATH = "/data/guide";

type Csv = { url: string; filename: string };

export type ManifestCollection = {
  /** Key in `dataset.json` and in `counts`. */
  key: DatasetCollectionKey;
  label: string;
  /** ID prefix the collection's records use, when it has one. */
  idPrefix: string | null;
  /** List endpoint: a JSON array of every record. */
  json: string;
  /** Per-record endpoint, `{id}` replaced by a record ID; null where none exists. */
  record: string | null;
  csv: Csv | null;
  /** True when this collection's `{id}` record bundles the sources it cites. */
  recordBundlesSources: boolean;
};

export type ManifestJoin = {
  from: DatasetCollectionKey;
  /** Field path in the JSON record; `[]` marks an array element. */
  field: string;
  to: DatasetCollectionKey;
  /** Field of the target matched by the value. */
  targetKey: "id" | "code";
  cardinality: "one" | "many";
  /** True when the value may be null (one) or empty (many) by design. */
  nullable: boolean;
  /** CSV column carrying the same link, when the CSV export has one. */
  csvColumn: string | null;
  note?: string;
};

const JSON_HEADERS = "application/json; charset=utf-8";

const collections: ManifestCollection[] = [
  { key: "events", label: "Policy events", idPrefix: null, json: "/api/v1/events", record: "/api/v1/events/{id}", csv: { url: "/api/export/events.csv", filename: "smpt-events.csv" }, recordBundlesSources: true },
  { key: "framing", label: "Framing claims", idPrefix: "fc-", json: "/api/v1/framing", record: null, csv: { url: "/api/export/framing.csv", filename: "smpt-framing.csv" }, recordBundlesSources: false },
  { key: "materials", label: "Materials", idPrefix: null, json: "/api/v1/materials", record: null, csv: { url: "/api/export/materials.csv", filename: "smpt-materials.csv" }, recordBundlesSources: false },
  { key: "jurisdictions", label: "Jurisdictions (served as actors)", idPrefix: null, json: "/api/v1/actors", record: null, csv: { url: "/api/export/jurisdictions.csv", filename: "smpt-jurisdictions.csv" }, recordBundlesSources: false },
  { key: "sources", label: "Source register", idPrefix: "src-", json: "/api/v1/sources", record: null, csv: { url: "/api/export/sources.csv", filename: "smpt-sources.csv" }, recordBundlesSources: false },
  { key: "financialCommitments", label: "Financial commitments", idPrefix: "fin-", json: "/api/v1/financial-commitments", record: "/api/v1/financial-commitments/{id}", csv: { url: "/api/export/financial-commitments.csv", filename: "smpt-financial-commitments.csv" }, recordBundlesSources: true },
  { key: "controlMeasures", label: "Control clauses", idPrefix: "ctl-", json: "/api/v1/control-measures", record: "/api/v1/control-measures/{id}", csv: { url: "/api/export/control-measures.csv", filename: "smpt-control-measures.csv" }, recordBundlesSources: true },
  { key: "organizations", label: "Organizations", idPrefix: "org-", json: "/api/v1/organizations", record: "/api/v1/organizations/{id}", csv: { url: "/api/export/organizations.csv", filename: "smpt-organizations.csv" }, recordBundlesSources: true },
  { key: "projects", label: "Projects", idPrefix: "prj-", json: "/api/v1/projects", record: "/api/v1/projects/{id}", csv: { url: "/api/export/projects.csv", filename: "smpt-projects.csv" }, recordBundlesSources: true },
  { key: "programmes", label: "Programmes", idPrefix: "prg-", json: "/api/v1/programmes", record: "/api/v1/programmes/{id}", csv: { url: "/api/export/programmes.csv", filename: "smpt-programmes.csv" }, recordBundlesSources: true },
  { key: "projectDesignations", label: "Project designations", idPrefix: "dsg-", json: "/api/v1/project-designations", record: "/api/v1/project-designations/{id}", csv: { url: "/api/export/project-designations.csv", filename: "smpt-project-designations.csv" }, recordBundlesSources: true },
  { key: "projectMilestones", label: "Reviewed project milestones", idPrefix: "mil-", json: "/api/v1/project-milestones", record: null, csv: null, recordBundlesSources: false },
];

const j = (
  from: DatasetCollectionKey,
  field: string,
  to: DatasetCollectionKey,
  cardinality: "one" | "many",
  nullable: boolean,
  csvColumn: string | null,
  note?: string,
  targetKey: "id" | "code" = "id",
): ManifestJoin => ({ from, field, to, targetKey, cardinality, nullable, csvColumn, ...(note ? { note } : {}) });

const SOURCE_NOTE = "Every populated field group cites its source here.";
const AMOUNT_HISTORY_NOTE = "Optional, audited versions of the same facility's amount; the field is absent where the history is unreviewed. Each version and each effective-date bound cites its own source.";

const joins: ManifestJoin[] = [
  j("events", "sourceIds[]", "sources", "many", false, "sourceIds"),
  j("events", "affectedMaterialIds[]", "materials", "many", true, "affectedMaterialIds"),
  j("events", "jurisdiction", "jurisdictions", "one", false, "jurisdiction", "Jurisdiction id (\"china\", \"uk\"), not its ISO-style code."),
  j("events", "supersededByEventId", "events", "one", true, "supersededByEventId"),
  j("framing", "eventId", "events", "one", false, "eventId"),
  j("framing", "sourceId", "sources", "one", false, "sourceId", "The document the quotation was taken from."),
  j("framing", "actor", "jurisdictions", "one", false, "actor", "Jurisdiction id."),
  j("materials", "eventIds[]", "events", "many", true, "eventIds", "Index kept in sync with events.affectedMaterialIds."),
  j("materials", "sourceIds[]", "sources", "many", true, "sourceIds"),
  j("jurisdictions", "eventIds[]", "events", "many", true, "eventIds", "Index kept in sync with events.jurisdiction."),
  j("jurisdictions", "sourceIds[]", "sources", "many", true, "sourceIds"),
  j("financialCommitments", "eventId", "events", "one", false, "eventId"),
  j("financialCommitments", "relationships[].commitmentId", "financialCommitments", "many", true, "partOf; drawnFrom", "Typed by relationships[].relationship: part_of (a component of a package) or drawn_from (drawn from an authority or envelope). Each link cites relationships[].sourceId."),
  j("financialCommitments", "relationships[].sourceId", "sources", "many", true, null),
  j("financialCommitments", "providerJurisdiction", "jurisdictions", "one", true, "providerJurisdiction", "Jurisdiction id; null when the provider is not a tracked government."),
  j("financialCommitments", "providerOrgIds[]", "organizations", "many", true, "providerOrgIds"),
  j("financialCommitments", "recipientOrgIds[]", "organizations", "many", true, "recipientOrgIds"),
  j("financialCommitments", "projectId", "projects", "one", true, "projectId", "Allocative: the amount belongs to this project's stack."),
  j("financialCommitments", "associatedProjectIds[]", "projects", "many", true, "associatedProjectIds", "Non-allocative: an unsplit amount that supports several projects; it never enters any one project's stack."),
  j("financialCommitments", "programmeId", "programmes", "one", true, "programmeId"),
  j("financialCommitments", "materialIds[]", "materials", "many", true, "materialIds"),
  j("financialCommitments", "evidence[].sourceId", "sources", "many", false, "sourceIds", SOURCE_NOTE),
  j("financialCommitments", "financialStatusHistory[].sourceId", "sources", "many", false, null),
  j("financialCommitments", "implementationStatusHistory[].sourceId", "sources", "many", true, null),
  j("financialCommitments", "terms[].sourceId", "sources", "many", true, null),
  j("financialCommitments", "outcomes[].sourceId", "sources", "many", true, null),
  j("financialCommitments", "financialAmountHistory[].sourceId", "sources", "many", true, null, AMOUNT_HISTORY_NOTE),
  j("financialCommitments", "financialAmountHistory[].effectiveNotBeforeEvidence.sourceId", "sources", "many", true, null),
  j("financialCommitments", "financialAmountHistory[].effectiveNoLaterThanEvidence.sourceId", "sources", "many", true, null),
  j("controlMeasures", "eventId", "events", "one", false, "eventId"),
  j("controlMeasures", "legalBasisEventIds[]", "events", "many", true, "legalBasisEventIds", "Tracked instruments only; untracked legal bases are free text in legalBasisAsStated."),
  j("controlMeasures", "modifiesMeasureIds[]", "controlMeasures", "many", true, "modifiesMeasureIds", "Tracked clauses only; untracked instruments are free text in modifiesExternalInstruments."),
  j("controlMeasures", "materialIds[]", "materials", "many", true, "materialIds"),
  j("controlMeasures", "targetJurisdictions[]", "jurisdictions", "many", true, "targetJurisdictions", "ISO-style code (\"CN\", \"US\"; the United Kingdom is \"GB\"), matched against jurisdictions.code, not jurisdictions.id.", "code"),
  j("controlMeasures", "statusHistory[].sourceId", "sources", "many", false, null),
  j("controlMeasures", "evidence[].sourceId", "sources", "many", false, "sourceIds", SOURCE_NOTE),
  j("organizations", "parents[].organizationId", "organizations", "many", true, "partOf; establishedBy", "Typed by parents[].relationship: part_of or established_by. A joint vehicle's money is not its founders'."),
  j("organizations", "parents[].sourceId", "sources", "many", true, null),
  j("organizations", "actor", "jurisdictions", "one", true, "actor", "Jurisdiction id; null for a non-government body."),
  j("organizations", "evidence[].sourceId", "sources", "many", false, "sourceIds"),
  j("projects", "sponsorOrgIds[]", "organizations", "many", true, "sponsorOrgIds"),
  j("projects", "materialIds[]", "materials", "many", true, "materialIds"),
  j("projects", "evidence[].sourceId", "sources", "many", false, "sourceIds"),
  j("programmes", "actor", "jurisdictions", "one", false, "actor", "Jurisdiction id."),
  j("programmes", "administeringOrgIds[]", "organizations", "many", true, "administeringOrgIds"),
  j("programmes", "parentProgrammeId", "programmes", "one", true, "parentProgrammeId"),
  j("programmes", "evidence[].sourceId", "sources", "many", false, "sourceIds"),
  j("projectDesignations", "eventId", "events", "one", false, "eventId"),
  j("projectDesignations", "programmeId", "programmes", "one", false, "programmeId"),
  j("projectDesignations", "projectId", "projects", "one", true, "projectId"),
  j("projectDesignations", "holderOrgIds[]", "organizations", "many", true, "holderOrgIds"),
  j("projectDesignations", "materialIds[]", "materials", "many", true, "materialIds"),
  j("projectDesignations", "statusHistory[].sourceId", "sources", "many", false, null),
  j("projectDesignations", "evidence[].sourceId", "sources", "many", false, "sourceIds"),
  j("projectMilestones", "projectId", "projects", "one", false, null),
  j("projectMilestones", "sourceId", "sources", "one", false, null),
];

/** Fields that hold free text or codes outside the corpus by design. They are not broken links. */
const outOfCorpusFields = [
  { field: "controlMeasures.modifiesExternalInstruments[]", meaning: "Instruments modified by a clause that the corpus does not track, as the source names them." },
  { field: "controlMeasures.legalBasisAsStated", meaning: "Legal basis in the source's words, including untracked instruments." },
  { field: "controlMeasures.targetEntities[]", meaning: "Named entities as the source states them; not joined to organizations." },
  { field: "*.untrackedMaterialsAsStated[]", meaning: "Materials the source names that are outside the tracked material set." },
  { field: "*.locations[].countryCode", meaning: "ISO 3166 country code of a stated location; not a join to jurisdictions." },
  { field: "organizations.countryCode", meaning: "ISO 3166 country code of an organization; not a join to jurisdictions." },
  { field: "sources.url", meaning: "Link to the original publication outside this site." },
];

export function buildDatasetManifest() {
  const identity = datasetIdentity();
  const counts = datasetCounts();
  return {
    manifestVersion: MANIFEST_VERSION,
    manifestUrl: MANIFEST_PATH,
    corpus: {
      name: identity.name,
      shortName: site.shortName,
      version: identity.version,
      siteUrl: site.url,
      scopeFrom: identity.scopeFrom,
      notice: identity.notice,
    },
    dates: {
      releasedOn: site.lastUpdated,
      legalStatusAsOf: site.legalStatusAsOf,
      revisedOn: site.revisedOn,
      meanings: {
        releasedOn: "Date of the latest source-reviewed curated corpus release (dataset.json generatedAt). It does not claim every historical record was rechecked on that date.",
        legalStatusAsOf: "Cutoff for control status: control-measures CSV currentStatus and scheduledStatus fields, and the capital-control summary's controls block, are evaluated on this date. It is not a claim that every instrument was freshly rechecked.",
        revisedOn: "Date of the last curated research or legal revision of the site.",
        "events.date": "The event's recorded operative or announcement date.",
        "events.lifecycle.officialPublicationDate": "Date the issuing body published the instrument; null when not coded.",
        "sources.datePublished": "The source document's publication date; null when the source states none.",
        "sources.dateAccessed": "Date the source was read for this corpus.",
        "statusHistory[].date": "Date that status took effect, per its source; null when the source gives no date.",
        "statusHistory[].until": "Stated end of that status, inclusive: for scheduled, the date it is due to take effect; for a suspension, its end; for a measure in force, its expiry. Null when none is stated.",
      },
    },
    coverage: {
      statement: "A selective, depth-first corpus of policy instruments, official framing, public financing and projects affecting rare earths and adjacent strategic materials. Coverage is uneven across jurisdictions and materials; it is not a census.",
      limitations: [
        "A record absent from the corpus is a missing observation, not a finding that no such measure exists.",
        "Unknown values are null or \"Not yet coded\"; they are never estimated.",
        "Categorical labels are research classifications grounded in cited sources, not legal determinations.",
        "Status reflects the dates above, not the day the data is read.",
        "Not legal or compliance advice.",
      ],
      links: {
        coveragePage: "/coverage",
        coverageReport: "/api/v1/coverage",
        scope: "/methodology#scope",
        provenance: "/methodology#provenance",
        countingRules: "/methodology#capital-counting",
        limitations: "/methodology#limitations",
        versions: "/methodology#versions",
        integrationGuide: INTEGRATION_GUIDE_PATH,
      },
    },
    counts,
    fullExport: {
      url: "/api/export/dataset.json",
      filename: "smpt-dataset.json",
      note: "Every collection in counts, plus capitalControlSummary and capitalIntelligenceSummary.",
    },
    formats: {
      json: { contentType: JSON_HEADERS, note: "List endpoints return a bare JSON array. Per-record endpoints return the record with the records needed to check it; an unknown id returns 404 with { error, id }." },
      csv: { contentType: "text/csv; charset=utf-8", note: "UTF-8 with a byte-order mark, CRLF line endings, RFC 4180 quoting. List fields are joined with \"; \". A text cell that begins with =, +, - or @ (or a control character) is prefixed with a tab inside its quotes so spreadsheets do not run it; plain signed numbers are left as they are. Strip one leading tab from such a cell to recover the value." },
    },
    collections,
    histories: [
      {
        key: "financialStatusHistory",
        csv: { url: "/api/export/financial-status-history.csv", filename: "smpt-financial-status-history.csv" },
        joinsTo: "financialCommitments",
        isCurrent: "Marks the last recorded entry of each history. It is not evaluated against a date.",
      },
      {
        key: "controlStatusHistory",
        csv: { url: "/api/export/control-status-history.csv", filename: "smpt-control-status-history.csv" },
        joinsTo: "controlMeasures",
        isCurrent: "Marks the last recorded entry, which can be a scheduled change. For legal status on legalStatusAsOf use the control-measures CSV statusAsOf, currentStatus, currentStatusDate and currentStatusUntil, and its separate scheduledStatus, scheduledStatusFrom and scheduledStatusUntil.",
      },
    ],
    summaries: [
      { key: "capitalControlSummary", url: "/api/v1/capital-control/summary", note: "Totals by source currency and instrument, with counting rules, and control status counts as of legalStatusAsOf." },
      { key: "capitalIntelligenceSummary", url: "/api/v1/capital-intelligence/summary", note: "Portfolios, capital stacks, programme ledgers, co-investment and flows; every amount comes from the same counting rules." },
      { key: "coverageReport", url: "/api/v1/coverage", note: "Evidence and coverage shares, each with its denominator." },
    ],
    projectPackets: { record: "/api/v1/projects/{id}/investigation", note: "One project with its financing, status and source references." },
    joins,
    outOfCorpusFields,
    controlStatus: {
      asOfDate: site.legalStatusAsOf,
      inEffect: "The last dated status entry on or before the as-of date. An undated entry takes effect only after an earlier dated entry.",
      scheduled: "The first status entry dated after the as-of date. It is not in effect yet.",
      notYetEffective: "When no entry is in effect on the as-of date, the control-measures CSV currentStatus columns show the first recorded entry and the scheduled columns show the first future entry, so both can describe the same entry. Compare currentStatusDate with statusAsOf.",
      statedEnd: "until is inclusive: a status whose until equals the as-of date is still in effect. A passed end with no later entry means the corpus records no operative status after it; it does not infer renewal or expiry.",
    },
    financialCounting: {
      rulesUrl: "/methodology#capital-counting",
      summaryUrl: "/api/v1/capital-control/summary",
      rules: [
        "Do not add every amount: a package and its part_of components, and an authority and the rows drawn_from it, describe the same money.",
        "Keep amounts in their source currency (amount.currency); nothing is converted.",
        "Keep instruments apart (instrument): a grant, loan and equity stake are not summed together.",
        "Only the commitment value role (valueRole) is summed; envelopes, appropriations and lending authorities are listed.",
        "Keep amount qualifiers apart (amount.qualifier: exact, approximately, at_least, up_to).",
        "Keep binding and not-yet-binding statuses apart; ended and status-not-stated rows are listed, not summed.",
      ],
    },
    outOfScope: [
      { key: "markets", note: "Published price series are a separate research-data layer at /markets with their own releases, terms and validator; they are not part of this corpus and never join to its records." },
      { key: "watchlist", note: "Monitored sources at /api/v1/watchlist are a work register, not corpus records, and are not counted." },
    ],
  };
}

export type DatasetManifest = ReturnType<typeof buildDatasetManifest>;
