import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading } from "@/components/ui/container";
import { formatDate } from "@/lib/format";
import { formatMoney, groupDecimal, type CommitmentTotals } from "@/lib/capital-control";
import { MANIFEST_PATH } from "@/lib/dataset-manifest";
import { financingExample, sourceDateGaps, walkthrough } from "@/lib/integration-guide";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Integration guide",
  description:
    "How SMPT records join, which date answers which question, how to read control status at the cutoff, and how to total financing without double counting.",
};

const code = "font-mono text-[0.8125rem] text-foreground break-words";
const h2 = "font-display text-lg font-semibold text-foreground";
const h3 = "font-display text-base font-semibold text-foreground";
const table = "w-full min-w-[36rem] border-collapse text-left text-sm";
const th = "border-b border-border-strong py-2 pr-4 font-display font-medium text-foreground";
const td = "border-b border-border py-2 pr-4 align-top text-muted";

function C({ children }: { children: React.ReactNode }) {
  return <code className={code}>{children}</code>;
}

/** The summed figure for one instrument, qualifier and binding bucket, as `totalCommitments` reports it. */
function figure(t: CommitmentTotals, bucket: "byQualifier" | "binding" | "notYetBinding", qualifier: "exact"): string | null {
  const cur = t.currencies[0];
  if (!cur || cur.status !== "summed") return null;
  const sums = cur.instruments[0]?.[bucket];
  return sums?.[qualifier] ?? null;
}

const statusWord: Record<string, string> = {
  scheduled: "scheduled",
  suspended: "suspended",
  in_force: "in force",
};

export default function IntegrationGuidePage() {
  const w = walkthrough();
  const gaps = sourceDateGaps();
  const f = financingExample();
  const [first, second] = w.entries;
  const asOfEntry = w.inEffect;
  const latestSource = w.latest.source;
  const pkg = f.rows[0];
  const currency = pkg.amount.currency;
  const counted = figure(f.counted, "byQualifier", "exact");
  const binding = figure(f.withPeer, "binding", "exact");
  const notYetBinding = figure(f.withPeer, "notYetBinding", "exact");
  const money = (v: string | null) => (v === null ? "not summed" : formatMoney(v, currency));

  return (
    <Container className="py-12">
      <PageHeading
        title="Integration guide"
        align="start"
        breadcrumbs={[{ href: "/data", label: "Data export" }, { label: "Integration guide" }]}
        lead={
          <>
            How the published records join, which date answers which question, and how to total financing without
            counting the same money twice. Every example below is read from the {site.version} corpus released{" "}
            {formatDate(site.lastUpdated)}.
          </>
        }
      />

      <div className="mt-10 max-w-prose space-y-12 text-sm leading-7 text-muted">
        <section aria-labelledby="manifest" className="space-y-3">
          <h2 id="manifest" className={h2}>Start from the manifest</h2>
          <p>
            <a href={MANIFEST_PATH} className="link-quiet"><C>{MANIFEST_PATH}</C></a> describes the corpus in one small
            file: its release and legal-status dates, record counts, the JSON, per-record and CSV address of each
            collection, and every field that links one record to another, with the key it matches and whether it may
            be empty. <C>manifestVersion</C> versions the manifest&apos;s own layout; <C>corpus.version</C> names the data
            release. The same counts head <C>/api/export/dataset.json</C>.
          </p>
          <p>
            Most links match a record&apos;s <C>id</C>. Two kinds need care. Jurisdiction links on events, framing,
            organizations and programmes use the jurisdiction id (<C>china</C>, <C>uk</C>), while a control
            clause&apos;s <C>targetJurisdictions</C> uses the code (<C>CN</C>, <C>GB</C>). The JSON collection is served at{" "}
            <C>/api/v1/actors</C> and exported as <C>jurisdictions</C>. Fields such as{" "}
            <C>modifiesExternalInstruments</C>, <C>legalBasisAsStated</C> and <C>untrackedMaterialsAsStated</C> name
            things outside the corpus on purpose and are listed under <C>outOfCorpusFields</C>.
          </p>
        </section>

        <section aria-labelledby="walkthrough" className="space-y-4">
          <h2 id="walkthrough" className={h2}>From an event to a clause, its status and the source</h2>
          <ol className="list-decimal space-y-4 pl-5">
            <li>
              <p>
                Fetch the event:{" "}
                <a href={`/api/v1/events/${w.event.id}`} className="link-quiet"><C>/api/v1/events/{w.event.id}</C></a>.
                The response holds <C>event</C>, its <C>framing</C> claims and the <C>sources</C> it cites. This is{" "}
                {w.event.documentNumber ?? w.event.titleEn}, with an event <C>date</C> of {formatDate(w.event.date)}.
              </p>
            </li>
            <li>
              <p>
                Find its control clauses by filtering <C>/api/v1/control-measures</C> (or{" "}
                <C>smpt-control-measures.csv</C>) on <C>eventId</C>. This event has {w.clauses.length} clauses. The
                example follows clause {w.measure.clause}:{" "}
                <a href={`/api/v1/control-measures/${w.measure.id}`} className="link-quiet"><C>/api/v1/control-measures/{w.measure.id}</C></a>.
              </p>
            </li>
            <li>
              <p>
                Read <C>measure.statusHistory</C> in order. The same entries are rows of{" "}
                <C>smpt-control-status-history.csv</C>, where <C>sequence</C> counts from 0.
              </p>
              <div className="mt-3 overflow-x-auto" tabIndex={0} role="region" aria-label="Status history of the example clause">
                <table className={table}>
                  <thead>
                    <tr>
                      <th scope="col" className={th}>sequence</th>
                      <th scope="col" className={th}>status</th>
                      <th scope="col" className={th}>date</th>
                      <th scope="col" className={th}>until</th>
                      <th scope="col" className={th}>sourceId</th>
                      <th scope="col" className={th}>isCurrent</th>
                    </tr>
                  </thead>
                  <tbody className="tnum">
                    {w.entries.map((e) => (
                      <tr key={e.sequence}>
                        <td className={td}>{e.sequence}</td>
                        <td className={td}>{e.status}</td>
                        <td className={td}>{e.date ?? "null"}</td>
                        <td className={td}>{e.until ?? "null"}</td>
                        <td className={td}><C>{e.sourceId}</C></td>
                        <td className={td}>{String(e.isCurrent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {first && second ? (
                <p className="mt-3">
                  The first entry is {statusWord[first.status] ?? first.status} with an <C>until</C> of{" "}
                  {first.until ? formatDate(first.until) : "null"}: on a scheduled entry, <C>until</C> is the date the
                  clause was due to take effect. The {statusWord[second.status] ?? second.status} entry began on{" "}
                  {second.date ? formatDate(second.date) : "an unstated date"}, before that date, so the history records
                  no period in force for this clause.
                </p>
              ) : null}
            </li>
            <li>
              <p>
                Resolve each <C>sourceId</C> in the record&apos;s <C>sources</C> array or in <C>/api/v1/sources</C>. The
                latest entry cites <C>{latestSource.id}</C>, {latestSource.title}, published{" "}
                {latestSource.datePublished ? formatDate(latestSource.datePublished) : "on no stated date"}.
              </p>
            </li>
          </ol>
        </section>

        <section aria-labelledby="dates" className="space-y-3">
          <h2 id="dates" className={h2}>Five dates, five questions</h2>
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Date fields in the walkthrough">
            <table className={table}>
              <thead>
                <tr>
                  <th scope="col" className={th}>Field</th>
                  <th scope="col" className={th}>Answers</th>
                  <th scope="col" className={th}>In the example</th>
                </tr>
              </thead>
              <tbody className="tnum">
                <tr>
                  <td className={td}><C>event.date</C></td>
                  <td className={td}>When the instrument was announced or became operative, as recorded for the event</td>
                  <td className={td}>{formatDate(w.event.date)}</td>
                </tr>
                <tr>
                  <td className={td}><C>source.datePublished</C></td>
                  <td className={td}>When a source document was published</td>
                  <td className={td}>{latestSource.datePublished ? formatDate(latestSource.datePublished) : "null"} (<C>{latestSource.id}</C>)</td>
                </tr>
                <tr>
                  <td className={td}><C>statusHistory[].date</C></td>
                  <td className={td}>When that legal status took effect</td>
                  <td className={td}>{w.latest.date ? formatDate(w.latest.date) : "null"}</td>
                </tr>
                <tr>
                  <td className={td}><C>dates.legalStatusAsOf</C></td>
                  <td className={td}>The cutoff on which current control status is evaluated</td>
                  <td className={td}>{formatDate(site.legalStatusAsOf)}</td>
                </tr>
                <tr>
                  <td className={td}><C>dates.releasedOn</C></td>
                  <td className={td}>When this curated corpus was released (<C>generatedAt</C> in <C>dataset.json</C>)</td>
                  <td className={td}>{formatDate(site.lastUpdated)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            The two corpus dates are equal in this release but can differ: a release may add records without
            advancing the legal-status cutoff.
          </p>
        </section>

        <section aria-labelledby="current" className="space-y-3">
          <h2 id="current" className={h2}>Status at the cutoff and the last recorded entry</h2>
          <p>
            In <C>smpt-control-status-history.csv</C>, <C>isCurrent</C> is <C>true</C> on the last recorded entry of
            each clause. It is not evaluated against a date, so when a source has already announced a change that
            starts later, the last entry is that future change.
          </p>
          <p>
            For legal status on the cutoff, use <C>smpt-control-measures.csv</C>. Its <C>statusAsOf</C> column carries
            the cutoff, <C>currentStatus</C>, <C>currentStatusDate</C> and <C>currentStatusUntil</C> give the entry in
            effect on that date, and <C>scheduledStatus</C>, <C>scheduledStatusFrom</C> and{" "}
            <C>scheduledStatusUntil</C> give an announced change that has not started.
            {asOfEntry ? (
              <>
                {" "}For the example clause the two agree: the entry in effect on {formatDate(w.asOf)} is the{" "}
                {statusWord[asOfEntry.status] ?? asOfEntry.status} entry that began {asOfEntry.date ? formatDate(asOfEntry.date) : "on an unstated date"}
                {w.scheduled ? <>, and a change is scheduled from {formatDate(w.scheduled.date!)}.</> : <>, and nothing is scheduled.</>}
              </>
            ) : null}
          </p>
          <p>
            When a clause has no entry in effect on the cutoff, for example one announced with a later start date,{" "}
            <C>currentStatus</C> shows its first recorded entry and the scheduled columns show the first future entry,
            so both can describe the same entry. Compare <C>currentStatusDate</C> with <C>statusAsOf</C> before reading
            it as in effect.
          </p>
        </section>

        <section aria-labelledby="gaps" className="space-y-3">
          <h2 id="gaps" className={h2}>Null dates, stated ends and missing records</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              A status entry with a <C>null</C> date has no date in its source. It counts as in effect only after an
              earlier dated entry; it never moves a clause into effect on its own.
            </li>
            <li>
              <C>until</C> is inclusive.{" "}
              {w.latest.until ? (
                <>
                  The example&apos;s suspension, with an <C>until</C> of {formatDate(w.latest.until)}, is still in effect
                  on that day.{" "}
                </>
              ) : null}
              Once a stated end passes with no later entry, the corpus records no operative status after it and
              infers neither renewal nor expiry.
            </li>
            <li>
              {gaps.withoutDatePublished} of {gaps.total} sources have a <C>null</C> <C>datePublished</C> because the
              source states none. Their <C>dateAccessed</C> is the date they were read, not a publication date.
            </li>
            <li>
              Coverage is selective and uneven by jurisdiction and material. A measure absent from the corpus is a
              missing observation, not a finding that no such measure exists. See{" "}
              <Link href="/coverage" className="link-quiet">Coverage</Link> and the{" "}
              <Link href="/methodology#limitations" className="link-quiet">limitations</Link>.
            </li>
          </ul>
        </section>

        <section aria-labelledby="financing" className="space-y-3">
          <h2 id="financing" className={h2}>Totalling financing without double counting</h2>
          <p>
            A financing package and its components are separate rows, and so are an authority and the loans drawn
            from it. The US Office of Strategic Capital rows for Vulcan Elements and ReElement show both.
          </p>
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Rows in the financing example">
            <table className={table}>
              <thead>
                <tr>
                  <th scope="col" className={th}>id</th>
                  <th scope="col" className={th}>valueRole</th>
                  <th scope="col" className={th}>amount</th>
                  <th scope="col" className={th}>status</th>
                  <th scope="col" className={th}>relationships</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {[...f.rows, f.authority].map((r) => (
                  <tr key={r.id}>
                    <td className={td}><Link href={`/capital/${r.id}`} className="link-quiet"><C>{r.id}</C></Link></td>
                    <td className={td}>{r.valueRole}</td>
                    <td className={td}>{r.amount.currency} {groupDecimal(r.amount.value)} ({r.amount.qualifier})</td>
                    <td className={td}>{r.status}</td>
                    <td className={td}>
                      {r.relationships.length
                        ? r.relationships.map((x) => `${x.relationship} ${x.commitmentId}`).join("; ")
                        : "none"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Adding the first three rows gives {money(f.naive)}. The two loans are <C>part_of</C> the joint commitment,
            so the counted total is {money(counted)}. The joint commitment is <C>drawn_from</C> the lending
            authority, whose <C>valueRole</C> is <C>{f.authority.valueRole}</C>: it is a ceiling of{" "}
            {formatMoney(f.authority.amount.value, f.authority.amount.currency)} ({f.authority.amount.qualifier}) and is
            listed, never added to the loans.
          </p>
          <p>
            Adding the {f.peer.status} {f.peer.instrument} <C>{f.peer.id}</C>, also drawn from that authority, keeps
            binding and not-yet-binding money apart: {money(binding)} binding and {money(notYetBinding)} not yet
            binding.
          </p>
          <h3 className={h3}>Rules to apply</h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>Follow <C>relationships</C> (<C>partOf</C> and <C>drawnFrom</C> in the CSV) and count a row only when none of its ancestors is counted.</li>
            <li>Sum only the <C>commitment</C> value role. Envelopes, appropriations and lending authorities are listed.</li>
            <li>Keep each source currency, <C>instrument</C> and <C>amount.qualifier</C> separate. Nothing is converted.</li>
            <li>Keep binding statuses apart from not-yet-binding ones, and list withdrawn, lapsed and status-not-stated rows without summing them.</li>
          </ul>
          <p>
            <a href="/api/v1/capital-control/summary" className="link-quiet"><C>/api/v1/capital-control/summary</C></a>{" "}
            applies these rules to the whole corpus and states them in <C>countingRules</C>. The full rules are in the{" "}
            <Link href="/methodology#capital-counting" className="link-quiet">methodology</Link>.
          </p>
        </section>
      </div>
    </Container>
  );
}
