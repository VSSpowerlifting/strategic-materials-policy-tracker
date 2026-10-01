import Link from "next/link";
import { getEventById } from "@/lib/data";
import { INSTRUMENT_KIND_HUES, jurisdictionLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { CHRONOLOGY_FROM, CHRONOLOGY_TO, chronologyLanes, markStatusText, plottedMarks } from "@/lib/interplay-chronology";

const KINDS = [
  { kind: "capital", heading: "Financial rows", href: (id: string) => `/capital/${id}` },
  { kind: "control", heading: "Control clauses", href: (id: string) => `/controls/${id}` },
] as const;

/**
 * The text chronology behind `InterplayChronology`: every plotted status
 * change, grouped by actor, then kind, then record. One link per record, with
 * that record's dated status history inline. Actor groups are native `<details>`,
 * collapsed so the page opens with few tab stops; no client JS.
 */
export function InterplayChronologyList({ from = CHRONOLOGY_FROM, to = CHRONOLOGY_TO }: { from?: string; to?: string }) {
  const lanes = chronologyLanes(plottedMarks(from, to));

  return (
    <div>
      <nav aria-label="Jump to an actor's chronology" className="mb-5 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs">
        {lanes.map(({ jurisdiction: j }) => (
          <a key={j} href={`#chronology-${j}`} className="inline-block scroll-mt-10 py-2 text-muted hover:text-foreground">
            {jurisdictionLabels[j]}
          </a>
        ))}
      </nav>
      <div className="space-y-4">
        {lanes.map(({ jurisdiction: j, changes, records: byKind }) => {
          const records = byKind.capital.length + byKind.control.length;
          return (
            <details key={j} id={`chronology-${j}`} className="scroll-mt-24 rounded-lg border bg-card p-4">
              <summary className="scroll-mt-10 cursor-pointer py-1">
                <h3 className="inline font-display text-lg font-semibold">{jurisdictionLabels[j]}</h3>
                <span className="ml-3 font-mono text-xs text-muted">
                  {records} {records === 1 ? "record" : "records"}, {changes} status {changes === 1 ? "change" : "changes"}
                </span>
              </summary>
              <div className="mt-3 grid gap-x-8 gap-y-5 lg:grid-cols-2">
                {KINDS.map(({ kind, heading, href }) => {
                  const recs = byKind[kind];
                  if (!recs.length) return null;
                  return (
                    <section key={kind} aria-label={`${jurisdictionLabels[j]} ${heading.toLowerCase()}`}>
                      <h4 className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted">
                        <svg aria-hidden width="10" height="10">
                          {kind === "capital" ? (
                            <circle cx="5" cy="5" r="4.5" fill={INSTRUMENT_KIND_HUES.capital} />
                          ) : (
                            <rect width="10" height="10" rx="1" fill={INSTRUMENT_KIND_HUES.control} />
                          )}
                        </svg>
                        {heading} ({recs.length})
                      </h4>
                      <ol className="space-y-3">
                        {recs.map((history) => (
                          <li key={history[0].id}>
                            <Link href={href(history[0].id)} className="block scroll-mt-10 py-2 hover:text-accent">
                              <span className="text-sm font-medium">{history[0].label}</span>
                              <span className="block text-xs text-muted">{getEventById(history[0].eventId)?.titleEn ?? history[0].eventId}</span>
                              <span className="block break-all font-mono text-[11px] text-muted">{history[0].id}</span>
                            </Link>
                            <ul className="ml-3 border-l pl-3 font-mono text-xs text-muted">
                              {history.map((m) => (
                                <li key={`${m.date}-${m.status}`}>
                                  <time dateTime={m.date}>{formatDate(m.date)}</time>: {markStatusText(m)}
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ol>
                    </section>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
