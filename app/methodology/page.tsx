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
import { getAllControlMeasures, getAllEvents, getAllFinancialCommitments, getDatasetSummary } from "@/lib/data";
import {
  capitalSourceLabels,
  controlStatusLabels,
  financialStatusLabels,
  valueRoleLabels,
} from "@/lib/labels";
import { CAPITAL_SOURCES, CONTROL_STATUSES, FINANCIAL_STATUSES, VALUE_ROLES } from "@/lib/types";

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
  ["capital-counting", "Capital & Control: counting rules"],
  ["limitations", "Limitations & disclaimer"],
  ["versions", "Version history"],
] as const;

const VALUE_ROLE_DEFS: Record<(typeof VALUE_ROLES)[number], string> = {
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

const CAPITAL_SOURCE_DEFS: Record<(typeof CAPITAL_SOURCES)[number], string> = {
  public: "A government, ministry or state agency.",
  public_enterprise: "A state-owned company or fund, such as the UK National Wealth Fund.",
  mixed_vehicle: "A joint public-private vehicle whose public share is not stated.",
  private: "Commercial lenders, investors or the recipient.",
  not_stated: "The source does not say who provides the capital.",
};

const FINANCIAL_STATUS_DEFS: Record<(typeof FINANCIAL_STATUSES)[number], string> = {
  announced: "Publicly announced; no decision or agreement is stated.",
  authorized: "Legal or budgetary authority exists, e.g. an enacted statute or cabinet approval.",
  allocated: "Assigned to the purpose, e.g. in a budget.",
  decided: "The provider has decided to invest, lend or award, including a conditional commitment.",
  contracted: "A binding agreement has been executed.",
  partially_disbursed: "Some of the money has been paid out.",
  disbursed: "The money has been paid out.",
  withdrawn: "The commitment was withdrawn.",
  lapsed: "The commitment ended unused on its own terms, for example a commitment letter that expired undrawn.",
  not_stated: "The source states no status.",
};

const CONTROL_STATUS_DEFS: Record<(typeof CONTROL_STATUSES)[number], string> = {
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

const DEFS: Record<string, Record<string, string>> = {
  policyStatus: {
    active: "The measure is in effect now.",
    suspended: "Adopted but paused; it can resume.",
    proposed: "Announced or drafted, not yet in force.",
    superseded: "Replaced by a later measure.",
    in_force: "A standing law or regulation in continuing effect.",
    unclear: "Status not established from the available sources.",
    ended: "Concluded, withdrawn or expired with no continuing effect and nothing replacing it — for example a trade investigation that ended without an order.",
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
                Capital &amp; Control
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
                The dataset now holds {summary.financialCommitments} financial
                commitments and {summary.controlMeasures} control clauses, across{" "}
                {new Set([...getAllFinancialCommitments(), ...getAllControlMeasures()].map((r) => r.eventId)).size}{" "}
                events, each verified field by field against its sources. They are
                browsable on <Link href="/capital" className="text-accent hover:text-accent-strong">Capital</Link>,{" "}
                <Link href="/controls" className="text-accent hover:text-accent-strong">Controls</Link> and{" "}
                <Link href="/interplay" className="text-accent hover:text-accent-strong">Capital × Control</Link>; how
                figures are added up is set out under{" "}
                <a href="#capital-counting" className="text-accent hover:text-accent-strong">counting rules</a>.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <h3
                id="capital-intelligence"
                className="scroll-mt-20 font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted"
              >
                Capital intelligence: who, what and under which scheme
              </h3>
              <p>
                Version 0.6 adds the parties and undertakings the instruments connect, as
                registries the financial rows point to. An <strong>organization</strong>{" "}
                (<code className="font-mono text-faint">org-</code>) is a provider, recipient,
                sponsor or holder: a government body, public financier, joint vehicle,
                company, project company or bank. A <strong>project</strong>{" "}
                (<code className="font-mono text-faint">prj-</code>) is one physical
                undertaking, such as a mine, a refinery or a magnet plant. A{" "}
                <strong>programme</strong> (<code className="font-mono text-faint">prg-</code>)
                is a named scheme that awards, lends, credits, reserves or designates. A{" "}
                <strong>project designation</strong> (<code className="font-mono text-faint">dsg-</code>)
                records a project recognized under a designation scheme, such as an EU
                strategic project under the Critical Raw Materials Act.
              </p>
              <ul className="space-y-2 text-muted">
                <li>
                  · Registry records are factual claims like any other. An
                  organization&apos;s name, kind, country, government and parent bodies
                  each name the source that states them.
                </li>
                <li>
                  · A renamed body keeps one record and lists its other names, so its
                  portfolio does not split in two.
                </li>
                <li>
                  · A portfolio rolls up from an office to the department it is part of.
                  It does not roll up from a joint vehicle to the bodies that set it up:
                  a joint vehicle&apos;s money is not its founders&apos; money, and the
                  public share of it is not stated.
                </li>
                <li>
                  · A registry record holds no money. Capital stacks, portfolios,
                  co-investment and flows are derived from the financial rows under the
                  same counting rules, one value role at a time and one currency at a
                  time. There is no grand stack total, no public-share percentage, no
                  leverage ratio and no programme utilisation rate.
                </li>
                <li>
                  · A designation confers standing, not money, and never enters a sum.
                  Where a designation publishes expected investment, that is total
                  project cost and is not recorded as support.
                </li>
                <li>
                  · Each control clause records the kind of item it covers (goods,
                  equipment, technology) and the supply-chain stages those items belong
                  to. Controlling exports of separation technology places the item at the
                  separation stage; it does not mean the clause restricts separation
                  itself. End-use restrictions, customs enforcement, divestiture orders
                  and suspensions define no items of their own and carry neither.
                </li>
                <li>
                  · Whether money stays at home or goes abroad is read from the funded
                  row&apos;s stated location, or its project&apos;s, against the
                  provider&apos;s home territory: the member states for the EU, and the
                  United Kingdom as GB. Where no location is stated, the row is counted
                  as location not stated, never guessed.
                </li>
              </ul>
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
            <H2 id="capital-counting">Capital &amp; Control: counting rules</H2>
            <p>
              Every figure on the Capital and Controls pages, in the summary API and in
              the exports is derived by one module from the seed records, under these
              rules. They exist because the commonest error in public reporting on
              industrial policy is adding up numbers that are not the same kind of
              thing.
            </p>
            <ul className="space-y-2 text-muted">
              <li>
                · <strong className="text-foreground">Per currency, never converted.</strong> Totals are
                shown separately for each currency the sources use. No exchange rate is applied anywhere.
              </li>
              <li>
                · <strong className="text-foreground">One value role at a time.</strong> Only rows whose
                value role is &ldquo;commitment&rdquo; are ever summed. Envelopes, appropriations and
                lending authorities are listed, never totalled: two envelopes can share a drawdown (the
                Australian Reserve&apos;s A$1 billion for transactions is both part of the Reserve and
                drawn from the Critical Minerals Facility), and an envelope is not money committed to
                anyone.
              </li>
              <li>
                · <strong className="text-foreground">One instrument at a time.</strong> Within a currency,
                each instrument has its own sums: grants, loans, equity and loan guarantees are never added
                into one figure, because a
                guaranteed loan, a grant and a shareholding are different promises. Rows whose instrument the
                sources do not name, and packages that combine instruments without a split, are listed with
                their own figures and never summed, since adding them could add a loan to a grant unseen.
                Version 0.5 printed one sum per currency across instruments, contrary to this rule; version
                0.6 corrects it.
              </li>
              <li>
                · <strong className="text-foreground">Ended commitments are not money.</strong> A
                commitment whose current status is withdrawn or lapsed is listed as ended and left out of
                every sum. It is also not capital in any count derived from it: it backs no project, adds no
                government or provider to a stack, is no flow and no co-investment, and is counted only as
                ended. An ended package does not hide its parts: a part that is still standing counts as a
                row of its own.
              </li>
              <li>
                · <strong className="text-foreground">A status the source does not give is not &ldquo;not yet
                binding&rdquo;.</strong> A commitment with an amount whose current status is &ldquo;not
                stated&rdquo; is neither binding nor not yet binding: it is listed with its own figure, counted
                apart, and never summed. Version 0.5 read it as not yet binding; version 0.6 changes this to match the
                one for an instrument the source does not name. Such a row also does not hide its parts.
              </li>
              <li>
                · <strong className="text-foreground">No part is counted with its package.</strong> A row
                that is part of, or drawn from, another row in the same currency is left out of the sums and
                named beside them, whatever either row&apos;s instrument, when that other row is itself
                summed. If it is not (it ended, states no amount or no status), it does not suppress the row. If two counted rows were ever to share a descendant, the total for that
                currency is withheld and the overlap shown instead. The JSON summary says so in a
                machine-readable way: that currency&apos;s entry has <code className="font-mono text-xs">status: &quot;withheld&quot;</code>{" "}
                and its sums are <code className="font-mono text-xs">null</code>, never zero or partial.
              </li>
              <li>
                · <strong className="text-foreground">Record counts fold a part only where its package covers it.</strong>{" "}
                A part is counted inside its package, so one deal counts once, but only in a count where the
                package is counted too. Stage and material counts in a portfolio, and the stage response
                map and the material matrix, work cell by cell: a part is counted at a stage or material its
                package does not list, and never twice where the package lists it. A package whose parts
                do not all state a country shows &ldquo;not stated&rdquo; in the flow table, and its parts,
                folded into it there, can be listed on the package&apos;s own page.
              </li>
              <li>
                · <strong className="text-foreground">An option is not a commitment.</strong> A funding
                option (a ceiling the recipient may call on under a signed agreement) is listed apart and
                never summed. It counts only once a source records an exercise, which is coded as its own
                commitment drawn from the option; payment is then tracked in that commitment&apos;s status.
                A draw that has since been withdrawn or has lapsed is listed under the option as an ended
                draw, never as an exercise or as money moved. Wherever capital is counted (a project&apos;s
                backers, co-investment, a portfolio, the stage response map) an option is shown as an option
                and never as a commitment or as backing.
                The site shows each option&apos;s three steps (agreement executed, exercise, disbursement)
                and says &ldquo;none recorded&rdquo; where the corpus is silent, never &ldquo;not exercised&rdquo;.
              </li>
              <li>
                · <strong className="text-foreground">Public means public.</strong> &ldquo;Public
                commitments&rdquo; are rows with public or public-enterprise capital. Private financing, a
                recipient&apos;s own funds, expected co-investment and total project cost are shown apart,
                and so are joint public-private vehicles whose public share is not stated. A row is
                credited to a government only when a government provides the money: a bank loan or a
                company&apos;s own cash announced in a government&apos;s event is never that
                government&apos;s.
              </li>
              <li>
                · <strong className="text-foreground">Stated bounds are summed only with their own kind.</strong>{" "}
                A committed figure stated &ldquo;up to&rdquo;, &ldquo;about&rdquo; or &ldquo;at least&rdquo; is
                added only to figures with the same qualifier, within the same currency and instrument, and
                shown apart from exact figures. An &ldquo;up to&rdquo; total is a sum of stated upper
                bounds, not an amount paid and not an exact commitment; an &ldquo;at least&rdquo; total is a
                sum of stated lower bounds. This is separate from programme envelopes, appropriations,
                lending authorities and unexercised funding options, which are listed and never summed.
              </li>
              <li>
                · <strong className="text-foreground">Binding apart from not yet binding.</strong> Within
                each currency, money under an executed agreement or already paid (contracted, partially
                disbursed, disbursed) is summed apart from money announced, authorized, allocated or decided
                — which includes conditional loan commitments. A non-binding letter of intent or interest is
                not a commitment and is in neither: it is an indication, listed apart and never summed. Every
                row carries its own status.
              </li>
              <li>
                · <strong className="text-foreground">No figure without a figure.</strong> A price floor,
                an offtake, a tax offset or a procurement right with no stated total is listed with its
                terms, never valued. Nothing is estimated.
              </li>
              <li>
                · <strong className="text-foreground">Dates mean the data&apos;s date.</strong> Control
                statuses and the days left on a suspension are evaluated on the date the data was last
                checked ({formatDate(site.lastUpdated)}), not on the day a page is read. What follows a
                stated end date is recorded only once an official source states it.
              </li>
              <li>
                · <strong className="text-foreground">Time charts show sequence, not causation.</strong> The
                Capital × Control chronology places financial and control status changes side by side; it
                draws no link between them that a source does not state.
              </li>
              <li>
                · Arithmetic on amounts is exact decimal arithmetic; no amount passes through binary
                floating point.
              </li>
            </ul>
            <h3 className="pt-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">Value roles</h3>
            <DefList
              items={VALUE_ROLES.map((r) => [valueRoleLabels[r], VALUE_ROLE_DEFS[r]])}
            />
            <h3 className="pt-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">Capital sources</h3>
            <DefList items={CAPITAL_SOURCES.map((c) => [capitalSourceLabels[c], CAPITAL_SOURCE_DEFS[c]])} />
            <h3 className="pt-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">Financial statuses</h3>
            <DefList items={FINANCIAL_STATUSES.map((s) => [financialStatusLabels[s], FINANCIAL_STATUS_DEFS[s]])} />
            <h3 className="pt-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">Control statuses</h3>
            <DefList items={CONTROL_STATUSES.map((s) => [controlStatusLabels[s], CONTROL_STATUS_DEFS[s]])} />
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
                {formatDate(site.lastUpdated)}. Capital intelligence: registries of {summary.organizations}{" "}
                organizations, {summary.projects} projects and {summary.programmes} programmes that the financial
                rows point to, and {summary.projectDesignations} project designations, each evidenced field by field.
                New pages for portfolios, projects, organizations and programmes; capital stacks by value role;
                programme ledgers that list ceilings beside recorded awards; co-investment; flows; and a
                material-by-stage response map of capital, designations and control clauses, with item types and
                supply-chain stages coded on every control clause that defines items. New records from primaries:
                China&apos;s Announcements Nos. 56, 57, 58 and 62 of 2025; the EU&apos;s Critical Raw Materials Act
                Strategic Projects (March and June 2025) and RESourceEU; Japan&apos;s certified critical-mineral
                supply-assurance plans and JOGMEC grants; Canada&apos;s G7 Production Alliance round and PDAC 2026
                awards; Commerce&apos;s CHIPS agreements with USA Rare Earth; and what MP Materials&apos; later filings
                record about the DoD package. Corrections: currency totals are now split by instrument (version
                0.5 added grants, loans and equity together, contrary to its own rule), a withdrawn or lapsed
                commitment is no longer summed or counted as capital, a commitment whose status is not stated is
                listed apart instead of being read as not yet binding, an ended or unsummed package no
                longer hides parts that still stand, and a non-binding letter of intent or interest that names an
                amount is now an indication and no longer a commitment (three from the G7 round and the CHIPS
                letter of intent recorded in version 0.5): it is listed in its own layer and never summed,
                counted as binding or not yet binding, or read as capital, backing or co-investment. New
                vocabulary values: a financial status &ldquo;lapsed&rdquo;, a value role &ldquo;non-binding
                indication&rdquo;, and the registry, designation and item-type vocabularies. In the JSON, the
                released <code className="font-mono text-faint">/api/v1/capital-control/summary</code> (and its
                copy in <code className="font-mono text-faint">dataset.json</code> as{" "}
                <code className="font-mono text-faint">capitalControlSummary</code>) moved{" "}
                <code className="font-mono text-faint">capital.publicCommitmentTotals[].byQualifier</code>,{" "}
                <code className="font-mono text-faint">.binding</code> and{" "}
                <code className="font-mono text-faint">.notYetBinding</code> into{" "}
                <code className="font-mono text-faint">capital.publicCommitmentTotals[].instruments[]</code>;{" "}
                <code className="font-mono text-faint">/api/v1/capital-intelligence/summary</code> is new in this
                release.
              </li>
              <li>
                <span className="font-mono text-foreground">v0.5-capital-control</span> — 23 September 2026. Capital
                &amp; Control: 39 financial commitments and 32 control clauses, verified field by field against
                official primaries and binding filings; the Capital, Controls and Capital × Control pages; the
                counting rules above; new JSON endpoints and CSV exports. Three events added (the US–Australia
                critical minerals Framework, the OSC loans to Vulcan Elements and ReElement, the US active anode
                material AD/CVD investigations) and Proclamation 11001, the outcome of the section 232
                investigation. New vocabulary values: a policy status &ldquo;ended&rdquo;, an instrument
                &ldquo;several instruments, split not stated&rdquo;, a control status &ldquo;investigation
                concluded&rdquo; and a value role &ldquo;funding option&rdquo;. Proclamation 11001 is an
                event, not a control measure: it directs negotiations and imposes no restriction.
              </li>
              <li>
                <span className="font-mono text-foreground">Earlier releases</span> — Expanded multi-actor seed: nine events
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
