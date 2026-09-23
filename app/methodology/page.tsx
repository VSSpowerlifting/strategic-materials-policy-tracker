import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading } from "@/components/ui/container";
import {
  confidenceLabels,
  enSourceLabels,
  framingCategoryLabels,
  jurisdictionLabels,
  mechanismLabels,
  policyStatusLabels,
  sectorLabels,
} from "@/lib/labels";
import {
  EN_SOURCES,
  FRAMING_CATEGORIES,
  MECHANISMS,
  POLICY_STATUSES,
  SECTORS,
  SOURCE_CONFIDENCE,
} from "@/lib/types";
import type { JurisdictionCode } from "@/lib/types";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/format";
import { getAllEvents, getDatasetSummary } from "@/lib/data";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "Scope, source hierarchy, translation policy, label definitions, how framing is assigned, limitations, and version history.",
};

const TOC = [
  ["scope", "What this tracks — and does not"],
  ["sources", "Source hierarchy"],
  ["translation", "Translation policy"],
  ["provenance", "Provenance and coverage"],
  ["labels", "Label definitions"],
  ["framing-method", "How framing is assigned"],
  ["limitations", "Limitations & disclaimer"],
  ["versions", "Version history"],
] as const;

const DEFS: Record<string, Record<string, string>> = {
  policyStatus: {
    active: "The measure is in effect now.",
    suspended: "Adopted but paused; it can resume.",
    proposed: "Announced or drafted, not yet in force.",
    superseded: "Replaced by a later measure.",
    in_force: "A standing law or regulation in continuing effect.",
    unclear: "Status not established from the available sources.",
  },
  mechanism: {
    export_control: "Restriction on exporting specified items.",
    dual_use_license: "Licensing for items with civilian and military uses.",
    catalogue_listing: "Addition of items to a control or prohibition catalogue.",
    designation: "Official labelling of a material as critical or strategic.",
    supply_chain_security: "A law or rule that secures supply chains.",
    countermeasure: "A measure framed or used as a response to another state's action.",
    customs_enforcement: "Border and customs enforcement of controls.",
    funding: "Subsidy, grant or financing to build capacity.",
    stockpiling: "Building or releasing strategic stocks.",
    offtake_agreement: "A commitment to purchase output, often with a price floor.",
    investment_screening: "Review or restriction of inbound/outbound investment.",
    trade_action: "A tariff, truce or other trade measure affecting the materials.",
  },
  sector: {
    defense: "Defense and military systems.",
    semiconductor: "Chips and semiconductor manufacturing.",
    energy: "Power generation and the grid, including wind.",
    battery: "Batteries and EV supply chains.",
    industrial: "General industrial and manufacturing use.",
  },
  confidence: {
    primary: "The government document or official announcement in its original language.",
    official_translation:
      "An English rendering of a primary document — official, or a faithful institutional translation.",
    government_media:
      "State or government-affiliated outlets; treated as the actor's own voice, not neutral reporting.",
    secondary: "Legal commentary, analysis and news used to corroborate facts.",
  },
  framing: {
    national_security: "Justified as protecting national security or defense.",
    economic_security:
      "Justified as protecting economic security or industrial competitiveness.",
    supply_chain_resilience:
      "Justified as securing or diversifying supply — de-risking.",
    leverage_retaliation: "Framed as leverage, retaliation or a countermeasure.",
    resource_environmental:
      "Justified by resource conservation or environmental protection.",
    anti_smuggling:
      "Justified as preventing smuggling or preserving enforcement integrity.",
    allied_coordination: "Justified by coordination with allies or friend-shoring.",
    compliance_modernization:
      "Framed as aligning rules with international norms or dual-use compliance.",
  },
  enSource: {
    official: "The issuing government's own English.",
    self: "A non-official translation — this project's, or a cited institutional translation.",
    na: "The source is already in English; no translation is involved.",
  },
};

function DefList({ items }: { items: [string, string][] }) {
  return (
    <dl className="mt-3 space-y-px overflow-hidden rounded-lg border border-border">
      {items.map(([term, def]) => (
        <div
          key={term}
          className="grid gap-1 bg-card px-4 py-2.5 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-4"
        >
          <dt className="font-display text-sm font-semibold">{term}</dt>
          <dd className="leading-7 text-muted">{def}</dd>
        </div>
      ))}
    </dl>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-20 font-display text-xl font-bold tracking-tight">
      {children}
    </h2>
  );
}

/**
 * Coverage sentences on this page are derived, never typed in. Hand-written
 * counts here have gone stale twice as the corpus grew, and a stale count on
 * the methodology page is a truth-in-labeling failure, not a cosmetic one.
 */
function coverageShape() {
  const events = getAllEvents();
  const summary = getDatasetSummary();
  const byActor = new Map<JurisdictionCode, number>();
  for (const e of events) byActor.set(e.jurisdiction, (byActor.get(e.jurisdiction) ?? 0) + 1);
  const ranked = [...byActor.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const fewest = ranked[ranked.length - 1][1];
  const thinnest = ranked.filter(([, n]) => n === fewest).map(([j]) => jurisdictionLabels[j]);
  return { summary, ranked, fewest, thinnest };
}

/** "A", "A and B", "A, B and C" — so a derived sentence still reads as English. */
function listSentence(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export default function MethodologyPage() {
  const { summary, ranked, fewest, thinnest } = coverageShape();
  return (
    <Container className="py-12">
      <PageHeading
        index="01"
        eyebrow="How the data is made"
        title="Methodology"
        lead="The boundaries of this project are its credibility. This page sets out exactly what is and is not tracked, how sources are graded, how translations are handled, what every label means, and how framing is assigned."
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav className="space-y-1 font-display text-sm">
            {TOC.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="block rounded px-2 py-1 text-muted transition-colors hover:bg-elevated hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="max-w-3xl space-y-12 leading-7 text-foreground/90">
          <section className="space-y-3">
            <H2 id="scope">What this tracks — and does not</H2>
            <p>
              This database tracks <strong>policy instruments and official framing</strong>:
              the export controls, licensing regimes, critical-mineral designations,
              supply-chain-security laws, funding, stockpiling and offtake measures
              governments use around rare earths and adjacent strategic materials —
              and the language each government uses to justify them.
            </p>
            <p>
              It does <strong>not</strong> model the global minerals market. It does
              not track or forecast market prices, estimate reserves or tonnages,
              publish supply-risk numbers or rankings, or make projections its
              sources do not state. Where market-share figures appear — for
              example, that China processes roughly 90% of rare earths — they are
              cited context drawn from bodies such as the IEA and USGS, not original
              estimates.
            </p>
            <p>
              The one kind of figure it does record is a term of a policy
              instrument: a number that a government states, or that a binding
              filing sets out, as part of the measure itself — a price floor written
              into an agreement, a tax-offset percentage, a capacity covenant, a
              contract term. Such a term is recorded only when it can be cited
              precisely. It describes the instrument; it is not an estimate of the
              market.
            </p>
            <p>
              Scope is deliberately bounded: {summary.jurisdictions} actors, a
              rare-earth-centred material set, and events from {site.scopeStart}{" "}
              forward. The boundary is
              the point — it is what lets every record be sourced. Some records carry
              no material at all: a framework statute names none of its own, and an
              instrument may name minerals that fall outside this material set. Both
              are recorded as an empty scope and said so on the record, rather than
              being filled in from the measures issued under them.
            </p>

            <div className="space-y-3 pt-2">
              <h3
                id="capital-control"
                className="scroll-mt-20 font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted"
              >
                Capital &amp; Control (in development)
              </h3>
              <p>
                Version 0.5 extends the model so that one announcement can hold the
                separate financial instruments and control measures inside it. The
                event stays the unit of announcement and citation. Beneath it, a{" "}
                <strong>financial commitment</strong> (ids beginning{" "}
                <code className="font-mono text-faint">fin-</code>) records one
                instrument, such as a grant, loan, equity stake, price floor or
                program envelope, and a <strong>control measure</strong> (ids
                beginning <code className="font-mono text-faint">ctl-</code>) records
                one operative clause of an export, import, investment or domestic
                control. The tracker remains a policy-intelligence record, not a
                commodity-price or market-forecasting model.
              </p>
              <ul className="space-y-2 text-muted">
                <li>
                  · Original currency is authoritative. An amount is kept as the
                  source states it, with its currency and any qualifier such as
                  &ldquo;up to&rdquo;. Nothing is converted, adjusted for inflation or
                  totalled across currencies.
                </li>
                <li>
                  · Unlike instruments are never combined. A loan, an equity stake, a
                  tax credit and a price floor are different promises and are not
                  added into one figure.
                </li>
                <li>
                  · A commitment records how it relates to larger ones: it can be
                  part of a reserve or package, drawn from a facility or program
                  envelope, or both at once. An amount is never counted both on its
                  own and inside a commitment it is linked to.
                </li>
                <li>
                  · Private financing, a recipient&apos;s own funds and total project
                  cost are recorded so they can be kept apart. None of them is
                  presented as public support.
                </li>
                <li>
                  · Announced, authorized, contracted and disbursed money are
                  different stages, and a project under construction is not an
                  operational one. Each status carries the date and the source that
                  support it.
                </li>
                <li>
                  · Each important field names the source that supports it. Where the
                  sources do not state something, the field is left empty rather
                  than inferred.
                </li>
                <li>
                  · A company&apos;s binding securities filing, or a recipient&apos;s
                  own official disclosure, can support contract, financing, capacity
                  or implementation facts that it states directly. It cannot, on its
                  own, establish a government&apos;s rationale or framing, a status
                  the government has not stated, a speculative valuation, a
                  market-price estimate or an unsupported projection. What it
                  supports stays visibly attributed to the company, not to the
                  government.
                </li>
                <li>
                  · A control clause whose status differs from the rest of its
                  instrument — one limb in force, another suspended — is recorded on
                  its own, so one record never hides a conflict.
                </li>
                <li>
                  · There is no synthetic economic-security score, index or ranking,
                  and none will be added.
                </li>
              </ul>
              <p>
                At this stage the model is in place but holds no data: no financial
                commitments or control measures are published yet. They will be
                added as each is verified against its sources.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <H2 id="sources">Source hierarchy</H2>
            <p>
              Records are graded by a four-tier confidence hierarchy, shown as a badge
              on every source. Higher tiers are preferred; where a record currently
              rests on a lower tier, that is visible in the badge, and upgrading it is
              tracked work.
            </p>
            <DefList
              items={SOURCE_CONFIDENCE.map((c) => [
                confidenceLabels[c],
                DEFS.confidence[c],
              ])}
            />
          </section>

          <section className="space-y-3">
            <H2 id="translation">Translation policy</H2>
            <p>
              Official English is preferred wherever the issuing body publishes one.
              Where it does not, every translated field is marked by provenance:
            </p>
            <DefList
              items={EN_SOURCES.map((e) => [enSourceLabels[e], DEFS.enSource[e]])}
            />
            <p>
              Only short passages are quoted, always alongside or linked to the
              original. The original-language text is retained; nothing is paraphrased
              into a quotation.
            </p>
          </section>

          <section className="space-y-3">
            <H2 id="provenance">Provenance and coverage</H2>
            <p>
              Sources are cited in their original language, with an English
              translation where the issuing body does not publish its own. Every
              source is labelled with its provenance and a confidence level — the
              four tiers set out above — so the basis for each record is visible.
            </p>
            <p>
              Coverage is multi-actor by design: it follows the whole contest across
              the tracked governments — the incumbent producer-processor and the
              states working to diversify away from it — rather than any single
              country&apos;s measures in isolation.
            </p>
          </section>

          <section className="space-y-5">
            <H2 id="labels">Label definitions</H2>
            <p>
              There are no numeric scores anywhere in the model. Every classification
              is one of the categorical labels below.
            </p>
            <div>
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">
                Policy status
              </h3>
              <DefList
                items={POLICY_STATUSES.map((s) => [
                  policyStatusLabels[s],
                  DEFS.policyStatus[s],
                ])}
              />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">
                Mechanism
              </h3>
              <DefList
                items={MECHANISMS.map((m) => [mechanismLabels[m], DEFS.mechanism[m]])}
              />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">
                Material sensitivity (sectors)
              </h3>
              <DefList
                items={SECTORS.map((s) => [sectorLabels[s], DEFS.sector[s]])}
              />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">
                Framing category
              </h3>
              <DefList
                items={FRAMING_CATEGORIES.map((c) => [
                  framingCategoryLabels[c],
                  DEFS.framing[c],
                ])}
              />
            </div>
          </section>

          <section className="space-y-3">
            <H2 id="framing-method">How framing is assigned</H2>
            <p>
              A framing category is assigned to an event <strong>only</strong> from a
              quoted passage in the source — never inferred from context, headlines or
              analyst interpretation. This is the project&apos;s central commitment.
            </p>
            <ul className="space-y-2 text-muted">
              <li>
                · Every framing claim carries a short quote in the original language,
                its translation, the translation provenance, and a source that
                resolves to the document the quote came from.
              </li>
              <li>
                · If no such anchor exists yet, the event&apos;s framing is left
                &ldquo;Not yet coded&rdquo; rather than guessed — you will see this on
                several events.
              </li>
              <li>
                · Categories are multi-select: one passage can carry more than one
                label when the text supports it.
              </li>
              <li>
                · Readings the source does not state in its own words — for example,
                that a control is &ldquo;retaliation&rdquo; — live in the event&apos;s
                analytical-significance note, not in a framing label attributed to the
                actor.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <H2 id="limitations">Limitations &amp; disclaimer</H2>
            <ul className="space-y-2 text-muted">
              <li>
                · The dataset is a seed. Every tracked actor is event-coded and every
                coded event carries at least one framing anchor — but coverage is
                deliberately uneven: {jurisdictionLabels[ranked[0][0]]} accounts for{" "}
                {ranked[0][1]} of the {summary.events} events, while{" "}
                {listSentence(thinnest)} {thinnest.length === 1 ? "is" : "are"}{" "}
                represented by{" "}
                {fewest === 1 ? "a single instrument" : `only ${fewest} each`}. Read it
                as a depth-first sample, not a census.
              </li>
              <li>
                · Some Chinese document numbers and original-language titles are not
                yet transcribed against the primary and are marked{" "}
                <code className="font-mono text-faint">null</code> or &ldquo;Not yet
                coded.&rdquo;
              </li>
              <li>
                · Categorical labels are interpretive judgements anchored to sources,
                not legal determinations. Status reflects the last-updated date;
                measures change.
              </li>
            </ul>
            <p className="rounded-lg border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 text-amber-100/90">
              This is not legal or compliance advice. Do not rely on it for
              export-control classification or licensing decisions; consult the primary
              instruments and qualified counsel.
            </p>
          </section>

          <section className="space-y-3">
            <H2 id="versions">Version history</H2>
            <ul className="space-y-2 text-muted">
              <li>
                <span className="font-mono text-foreground">{site.version}</span> —{" "}
                {formatDate(site.lastUpdated)}. Expanded multi-actor seed: nine events
                added since v0.1.0 so all six actors are event-coded — the US DoD–MP
                Materials partnership, Australia&apos;s Critical Minerals Strategic
                Reserve, Japan&apos;s JOGMEC/JARE investment in Lynas, Canada&apos;s
                Investment Canada Act divestiture order, and China&apos;s 2023–2025
                gallium/germanium, graphite, US-directed ban (Announcement No. 46),
                tungsten and antimony controls. Framing anchors are now coded for every
                event in the dataset. The gallium/germanium anchor was re-cited to
                MOFCOM/GACC Announcement No. 23 (2023) itself after review found it
                pointing at a state-media English report that does not carry the
                quoted Chinese text.
              </li>
              <li>
                <span className="font-mono text-foreground">v0.1.0</span> — June 2026.
                Initial public foundation: schema, typed loaders, a passing data
                validator, and a verified seed — China&apos;s April, October and November
                2025 rare-earth measures, the US 2025 Critical Minerals List, and the EU
                Critical Raw Materials Act — with framing anchors across three actors.
              </li>
            </ul>
          </section>

          <p className="border-t border-border pt-6 leading-7 text-faint">
            Questions about a classification? Each rests on the linked source — start
            there, then see the <Link href="/sources" className="font-display text-accent hover:text-accent-strong">source register</Link>.
          </p>
        </div>
      </div>
    </Container>
  );
}
