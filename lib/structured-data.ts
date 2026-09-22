/**
 * schema.org JSON-LD, so the database is discoverable as a dataset rather than
 * as a pile of pages.
 *
 * The modelling choice worth knowing: an event page is described as a
 * `Legislation`-typed `CreativeWork` whose `creator` is the *issuing
 * government*, while this project is only the `publisher` of the record about
 * it. Marking the tracker as the author of the instrument would be a
 * provenance error in machine-readable form — the same error the citation
 * builders are careful to avoid in human-readable form.
 */
import { site } from "./site";
import { jurisdictionLabels } from "./labels";
import type { PolicyEvent, Source } from "./types";
import { getAllEvents, getAllJurisdictions, getAllMaterials } from "./data";

export function datasetJsonLd() {
  const events = getAllEvents();
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: site.name,
    alternateName: site.shortName,
    description: site.description,
    url: site.url,
    version: site.version,
    dateModified: site.lastUpdated,
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    creator: { "@type": "Organization", name: site.name },
    keywords: [
      "rare earth elements",
      "critical minerals",
      "export controls",
      "strategic materials",
      "policy instruments",
      ...getAllMaterials().map((m) => m.nameEn),
    ],
    spatialCoverage: getAllJurisdictions().map((j) => ({
      "@type": "Place",
      name: j.name,
    })),
    temporalCoverage: `${events.reduce((min, e) => (e.date < min ? e.date : min), events[0]?.date ?? "")}/..`,
    variableMeasured: [
      "policy instrument",
      "issuing authority",
      "mechanism",
      "material scope",
      "official framing",
    ],
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${site.url}/api/export/dataset.json`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        contentUrl: `${site.url}/api/export/events.csv`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/vnd.citationstyles.csl+json",
        contentUrl: `${site.url}/api/cite/csl`,
      },
    ],
  };
}

export function eventJsonLd(event: PolicyEvent, sources: Source[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Legislation",
    name: event.titleEn,
    alternateName: event.titleOriginal !== event.titleEn ? event.titleOriginal : undefined,
    legislationIdentifier: event.documentNumber ?? undefined,
    legislationJurisdiction: jurisdictionLabels[event.jurisdiction],
    datePublished: event.lifecycle.officialPublicationDate ?? event.date,
    // The government issues the instrument; this project only publishes the
    // record describing it.
    creator: { "@type": "GovernmentOrganization", name: event.issuingBody },
    publisher: { "@type": "Organization", name: site.name },
    url: `${site.url}/events/${event.id}`,
    abstract: event.summary,
    isBasedOn: sources.map((s) => ({
      "@type": "CreativeWork",
      name: s.title,
      url: s.url,
      publisher: { "@type": "Organization", name: s.publisher },
      inLanguage: s.language,
    })),
    isPartOf: { "@type": "Dataset", name: site.name, url: site.url },
  };
}

/** Serialised for a <script type="application/ld+json"> tag. */
export function jsonLdScript(data: unknown): string {
  // `<` is escaped so the payload cannot terminate the script element.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
