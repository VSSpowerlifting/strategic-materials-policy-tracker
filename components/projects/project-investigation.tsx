import Link from "next/link";
import { Section } from "@/components/ui/container";
import { SourceMention } from "@/components/capital/primitives";
import { OrgList } from "@/components/intelligence/org-link";
import { currentFinancialStatus } from "@/lib/capital-control";
import {
  financialInstrumentLabels,
  financialStatusLabels,
  policyStatusLabels,
  valueRoleLabels,
} from "@/lib/labels";
import { formatDate } from "@/lib/format";
import type { getPublicProjectInvestigation } from "@/lib/research-experience";
import type { PolicyStatus } from "@/lib/types";

type Investigation = NonNullable<
  ReturnType<typeof getPublicProjectInvestigation>
>;

export function ProjectOverview({
  investigation: { stack, pathway },
}: {
  investigation: Investigation;
}) {
  const states = [
    ...new Set(
      stack.rows.map((c) => financialStatusLabels[currentFinancialStatus(c)]),
    ),
  ];
  return (
    <div className="mt-8">
      <section aria-labelledby="project-overview">
        <h2 id="project-overview" className="font-serif text-2xl">
          What does the record establish?
        </h2>
        <p className="mt-3 max-w-4xl text-base leading-8 text-muted">
          {stack.project.notes ??
            "This registered undertaking is linked below to its financial instruments, policy context and available industrial evidence."}
        </p>
      </section>
      <div className="investigation-lanes mt-6">
        <section className="investigation-lane">
          <h2>Financial standing</h2>
          <p>
            {stack.rows.length
              ? `${stack.rows.length} directly linked instruments. Recorded financial states: ${states.join("; ")}.`
              : "No directly attributable financial instrument is recorded."}{" "}
            A commitment, a payment and a project cost remain separate.
          </p>
          <a href="#project-finance" className="research-text-link">
            Inspect instruments and terms
          </a>
        </section>
        <section className="investigation-lane">
          <h2>Legal and policy context</h2>
          <p>
            {pathway.policyContexts.length} parent policy records;{" "}
            {stack.designations.length} project designations. Designation
            confers standing, not finance. Material and stage overlaps with
            controls do not establish a restriction on this project.
          </p>
          <a href="#project-policy" className="research-text-link">
            Read the policy records
          </a>
        </section>
        <section className="investigation-lane">
          <h2>Industrial evidence</h2>
          <p>
            {pathway.nativeMilestones.length
              ? `${pathway.nativeMilestones.length} published source-reviewed observation${pathway.nativeMilestones.length === 1 ? "" : "s"}. The exact scope, date and speaker matter; source review is not on-site verification.`
              : "No source-reviewed project milestone is published in this corpus. Financing records may still contain attributed activity reports; this gap does not establish inactivity."}
          </p>
          <a href="#project-unknowns" className="research-text-link">
            See evidence gaps
          </a>
        </section>
      </div>
      <nav
        aria-label="Project evidence sections"
        className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-b pb-5 font-display text-sm text-accent"
      >
        <a href="#project-finance">Financial record</a>
        <a href="#project-industrial">Industrial observations</a>
        <a href="#project-policy">Policy context</a>
        <a href="#project-unknowns">Unknowns</a>
        <a href="#project-sources">Sources & reuse</a>
      </nav>
    </div>
  );
}

export function ProjectFinancialRecord({
  investigation: { stack },
}: {
  investigation: Investigation;
}) {
  return (
    <Section
      title="Financial evidence and chronology"
      description="Each instrument keeps its own financial history. These dates describe financial states, not construction or production. Amounts are the current recorded terms, not historical amounts at every date below."
    >
      {!stack.rows.length ? (
        <p className="text-muted">
          No directly attributable financial instruments are recorded. Shared
          packages, if any, appear separately below.
        </p>
      ) : null}
      <div className="space-y-4">
        {stack.rows.map((row) => (
          <details
            key={row.id}
            className="rounded border border-border-strong bg-card p-4 sm:p-5"
          >
            <summary className="cursor-pointer font-display text-base font-medium leading-7">
              {financialInstrumentLabels[row.instrument]} ·{" "}
              {row.provider ?? "Provider not stated"}
              <span className="mt-1 block pl-4 text-sm font-normal text-muted">
                {row.amount?.amountAsStated ?? "Amount not stated"} ·{" "}
                {financialStatusLabels[currentFinancialStatus(row)]} ·{" "}
                {valueRoleLabels[row.valueRole]}
              </span>
            </summary>
            <div className="mt-5 space-y-4 text-sm leading-7">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="font-display text-xs text-muted">
                    Provider organizations
                  </dt>
                  <dd>
                    <OrgList
                      ids={row.providerOrgIds}
                      empty={row.provider ?? "Not stated"}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="font-display text-xs text-muted">Recipient</dt>
                  <dd>
                    {row.recipient ?? "Not stated"}
                    <OrgList
                      ids={row.recipientOrgIds}
                      empty="No separate recipient organization recorded"
                    />
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-display text-xs text-muted">
                    Legal authority as stated
                  </dt>
                  <dd>
                    {row.legalAuthority ??
                      "Not stated in this financial record"}
                  </dd>
                </div>
              </dl>
              <ol
                className="research-chronology"
                aria-label="Financial status chronology"
              >
                {row.financialStatusHistory.map((entry, i) => (
                  <li key={i}>
                    <p className="font-display font-medium">
                      {entry.date ? (
                        <time dateTime={entry.date}>
                          {formatDate(entry.date)}
                        </time>
                      ) : (
                        "Exact status date not stated"
                      )}{" "}
                      · {financialStatusLabels[entry.status]}
                    </p>
                    {entry.note ? (
                      <p className="mt-1 text-muted">{entry.note}</p>
                    ) : null}
                    <SourceMention sourceId={entry.sourceId} />
                  </li>
                ))}
              </ol>
              {row.terms.length ? (
                <div>
                  <h3 className="font-display font-medium">
                    Source-stated terms
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {row.terms.map((term, i) => (
                      <li key={i}>
                        {term.asStated}{" "}
                        <SourceMention sourceId={term.sourceId} />
                        {term.note ? (
                          <p className="text-muted">{term.note}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-muted">
                  No additional structured terms are recorded. See the full
                  instrument for its evidence and qualifications.
                </p>
              )}
              {row.notes ? <p className="text-muted">{row.notes}</p> : null}
              <Link href={`/capital/${row.id}`} className="research-text-link">
                Full financial instrument, conditions and field-level evidence
              </Link>
            </div>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function ProjectPolicyContext({
  investigation: { pathway },
}: {
  investigation: Investigation;
}) {
  return (
    <Section
      title="Policy context"
      description="These records directly parent the project's finance or designation entries. Their presence does not establish a causal effect on industrial activity."
    >
      <ul className="space-y-4">
        {pathway.policyContexts.map((context) => (
          <li key={context.id} className="rounded border bg-card p-4">
            <p className="font-display text-xs text-muted">
              {formatDate(context.eventDate)} ·{" "}
              {policyStatusLabels[context.eventStatus as PolicyStatus]}
            </p>
            <h3 className="mt-2 font-display font-semibold leading-7">
              <Link
                href={`/events/${context.id}`}
                className="text-accent hover:underline"
              >
                {context.title}
              </Link>
            </h3>
            <p className="mt-2 text-sm text-muted">{context.issuingBody}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {context.sourceRecords.map((source) => (
                <SourceMention key={source.id} sourceId={source.id} />
              ))}
            </div>
          </li>
        ))}
      </ul>
      {!pathway.policyContexts.length ? (
        <p className="text-muted">
          No parent finance or designation policy record is linked.
        </p>
      ) : null}
    </Section>
  );
}

export function ProjectUnknowns({
  investigation: { stack, pathway },
}: {
  investigation: Investigation;
}) {
  const missingAmounts = stack.rows.filter((row) => !row.amount).length;
  return (
    <Section
      title="What remains unknown"
      description="Gaps describe the available SMPT record. They do not establish that an activity did not occur."
    >
      <ul className="list-disc space-y-3 pl-5 text-base leading-7 text-muted">
        <li>
          {pathway.nativeMilestones.length
            ? "Reviewed observations establish only their stated scope. They do not by themselves establish sustained construction, capacity achieved, commercial output or a financing payout."
            : "No project-native source-reviewed industrial milestone is published. Attributed activity in financing histories remains a separate evidence class; no exact milestone date or facility-wide conclusion is inferred."}
        </li>
        {missingAmounts ? (
          <li>
            {missingAmounts} directly linked instrument
            {missingAmounts === 1 ? " has" : "s have"} no stated amount. The
            missing value is not zero.
          </li>
        ) : null}
        {!stack.project.sponsorOrgIds.length ? (
          <li>
            The project registry does not identify a sponsor organization.
            Providers and recipients are recorded separately on each financial
            instrument.
          </li>
        ) : null}
        {pathway.reviewGaps.hasUnreviewedFinancialAmounts ? (
          <li>
            Historical amount review is incomplete. The current capital stack
            cannot be read as a time series of earlier commitments.
          </li>
        ) : null}
        {stack.associatedRows.length ? (
          <li>
            Shared financing is not allocated among the named projects and is
            excluded from this project&apos;s stack and backers.
          </li>
        ) : null}
        <li>
          Structural links and shared materials do not demonstrate that a
          government measure caused an industrial outcome.
        </li>
      </ul>
    </Section>
  );
}
