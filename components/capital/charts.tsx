/**
 * Capital & Control visualisations. Server-rendered SVG and tables: no chart
 * library, no client JavaScript, and every mark is a link to the record it
 * encodes, so a chart is also a navigation surface and never a dead end.
 *
 * Nothing here plots money against money across currencies or value roles.
 * Time charts plot dated status changes; matrices count records.
 */
import Link from "next/link";
import {
  CONTROL_STATUS_HUES,
  INSTRUMENT_KIND_HUES,
  controlMeasureTypeLabels,
  controlStatusLabels,
  financialStatusLabels,
  jurisdictionLabels,
  jurisdictionShort,
  supplyChainStageLabels,
} from "@/lib/labels";
import {
  controlIssuer,
  controlSpans,
  instrumentChronology,
  materialInterplay,
  commitmentActor,
  shortInstrumentLabel,
} from "@/lib/capital-control";
import { getAllMaterials, getEventById } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { CONTROL_STATUSES, JURISDICTIONS, SUPPLY_CHAIN_STAGES } from "@/lib/types";
import type { ControlMeasure, ControlStatus, FinancialCommitment, JurisdictionCode } from "@/lib/types";

const dayNum = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86_400_000;

function scale(from: string, to: string, x0: number, x1: number) {
  const a = dayNum(from);
  const b = dayNum(to);
  return (iso: string) => x0 + ((dayNum(iso) - a) / (b - a)) * (x1 - x0);
}

function years(from: string, to: string): string[] {
  const out: string[] = [];
  for (let y = Number(from.slice(0, 4)) + 1; y <= Number(to.slice(0, 4)); y++) out.push(`${y}-01-01`);
  return out;
}

// --- Control status timeline --------------------------------------------------------

/**
 * One bar per control clause, coloured by legal status over time, with the
 * stated end of a suspension or schedule drawn as a dashed tail to its date.
 * The vertical rule marks the data's as-of date.
 */
export function ControlStatusChart({
  measures,
  asOf,
  from = "2022-10-01",
  to = "2027-03-01",
}: {
  measures: ControlMeasure[];
  asOf: string;
  from?: string;
  to?: string;
}) {
  const rows = [...measures]
    .map((m) => ({ m, spans: controlSpans(m), issuer: controlIssuer(m), event: getEventById(m.eventId)! }))
    .filter((r) => r.spans.length)
    .sort((a, b) => (a.spans[0].from < b.spans[0].from ? -1 : a.spans[0].from > b.spans[0].from ? 1 : a.m.id < b.m.id ? -1 : 1));
  const LABEL = 300;
  const W = 1000;
  const ROW = 22;
  const TOP = 28;
  const H = TOP + rows.length * ROW + 12;
  const x = scale(from, to, LABEL + 8, W - 12);
  const clamp = (iso: string) => (iso < from ? from : iso > to ? to : iso);
  const used = new Set<ControlStatus>(rows.flatMap((r) => r.spans.map((s) => s.status)));

  return (
    <figure>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto min-w-[760px] w-full"
          role="group"
          aria-labelledby="ctl-chart-title"
          aria-describedby="ctl-chart-desc"
        >
          <title id="ctl-chart-title">Legal status of each control clause over time</title>
          <desc id="ctl-chart-desc">
            {`${rows.length} clauses from ${formatDate(from)} to ${formatDate(to)}. Each bar is coloured by status; dashed tails run to a stated end date. As of ${formatDate(asOf)}. Each row links to its clause; the filterable list below gives the same records as text.`}
          </desc>
          {years(from, to).map((y) => (
            <g key={y}>
              <line x1={x(y)} x2={x(y)} y1={TOP - 8} y2={H - 8} stroke="var(--border)" />
              <text x={x(y) + 4} y={16} className="fill-[var(--faint)] font-mono" fontSize={11}>
                {y.slice(0, 4)}
              </text>
            </g>
          ))}
          <line x1={x(asOf)} x2={x(asOf)} y1={TOP - 12} y2={H - 4} stroke="var(--accent)" strokeDasharray="2 3" />
          <text x={x(asOf) - 4} y={TOP - 14} textAnchor="end" className="fill-[var(--accent)] font-mono" fontSize={10}>
            as of {formatDate(asOf)}
          </text>
          {rows.map(({ m, spans, issuer, event }, i) => {
            const y = TOP + i * ROW;
            const label = `${jurisdictionShort[issuer]} · ${shortInstrumentLabel(event)} · ${m.clause ?? (m.targetEntities.length === 1 ? m.targetEntities[0].split(/[\s(]/)[0] : controlMeasureTypeLabels[m.measureType])}`;
            return (
              <Link key={m.id} href={`/controls/${m.id}`}>
                <g className="group">
                  <rect x={0} y={y} width={W} height={ROW} fill="transparent" className="group-hover:fill-[var(--elevated)]" />
                  <text x={8} y={y + 15} fontSize={11.5} className="fill-[var(--muted)] font-mono group-hover:fill-[var(--fg)]">
                    {label.length > 44 ? `${label.slice(0, 43)}…` : label}
                    <title>{`${controlMeasureTypeLabels[m.measureType]} — ${event.titleEn}`}</title>
                  </text>
                  {spans.map((s, k) => {
                    const start = x(clamp(s.from));
                    const endIso = s.to ?? asOf;
                    const end = x(clamp(endIso < s.from ? s.from : endIso));
                    return (
                      <g key={k}>
                        <rect x={start} y={y + 6} width={Math.max(2, end - start)} height={ROW - 12} rx={1.5} fill={CONTROL_STATUS_HUES[s.status]} opacity={s.status === "concluded" ? 0.6 : 0.9}>
                          <title>{`${event.documentNumber ?? event.titleEn} — ${controlStatusLabels[s.status]} from ${formatDate(s.from)}${s.to ? ` to ${formatDate(s.to)}` : ""}${s.until ? ` (stated end ${formatDate(s.until)})` : ""}`}</title>
                        </rect>
                        {s.until && !s.to && s.until > asOf ? (
                          <line
                            x1={end}
                            x2={x(clamp(s.until))}
                            y1={y + ROW / 2}
                            y2={y + ROW / 2}
                            stroke={CONTROL_STATUS_HUES[s.status]}
                            strokeDasharray="3 3"
                            strokeWidth={2}
                          />
                        ) : null}
                        {s.until && !s.to ? (
                          <line x1={x(clamp(s.until))} x2={x(clamp(s.until))} y1={y + 4} y2={y + ROW - 4} stroke={CONTROL_STATUS_HUES[s.status]} strokeWidth={2} />
                        ) : null}
                      </g>
                    );
                  })}
                </g>
              </Link>
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] text-muted">
        {CONTROL_STATUSES.filter((s) => used.has(s)).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-4 rounded-[1px]" style={{ background: CONTROL_STATUS_HUES[s] }} />
            {controlStatusLabels[s]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <svg aria-hidden width="20" height="6"><line x1="0" x2="20" y1="3" y2="3" stroke="var(--muted)" strokeDasharray="3 3" strokeWidth="2" /></svg>
          stated end of the current status
        </span>
      </figcaption>
    </figure>
  );
}

// --- Capital and control chronology by actor ---------------------------------------------

/**
 * Swimlanes by actor: every dated status change of a financial row (circle)
 * and of a control clause (square). It shows sequence and density — who
 * reaches for money, who for restrictions, and when — never magnitude.
 */
export function InterplayChronology({
  asOf,
  from = "2022-07-01",
  to = "2027-01-01",
}: {
  asOf: string;
  from?: string;
  to?: string;
}) {
  const marks = instrumentChronology().filter((m) => m.date >= from && m.date <= to);
  const lanes = JURISDICTIONS.filter((j) => marks.some((m) => m.jurisdiction === j));
  const LABEL = 132;
  const W = 1000;
  const LANE = 44;
  const TOP = 30;
  const H = TOP + lanes.length * LANE + 8;
  const x = scale(from, to, LABEL + 10, W - 14);

  // Offset marks that fall on the same day in the same lane, so none hides another.
  const stack = new Map<string, number>();
  const placed = marks.map((m) => {
    const key = `${m.jurisdiction}|${m.kind}|${m.date.slice(0, 7)}`;
    const n = stack.get(key) ?? 0;
    stack.set(key, n + 1);
    return { ...m, n };
  });

  return (
    <figure>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto min-w-[760px] w-full" role="group" aria-labelledby="ip-title" aria-describedby="ip-desc">
          <title id="ip-title">Capital and control status changes by actor over time</title>
          <desc id="ip-desc">
            {`${placed.filter((m) => m.kind === "capital").length} dated financial status changes and ${placed.filter((m) => m.kind === "control").length} dated control status changes across ${lanes.length} actors, ${formatDate(from)} to ${formatDate(to)}. Each mark links to its record; the Capital and Controls lists give the same records as text.`}
          </desc>
          {years(from, to).map((y) => (
            <g key={y}>
              <line x1={x(y)} x2={x(y)} y1={TOP - 10} y2={H - 6} stroke="var(--border)" />
              <text x={x(y) + 4} y={16} fontSize={11} className="fill-[var(--faint)] font-mono">{y.slice(0, 4)}</text>
            </g>
          ))}
          <line x1={x(asOf)} x2={x(asOf)} y1={TOP - 14} y2={H - 4} stroke="var(--accent)" strokeDasharray="2 3" />
          {lanes.map((j, i) => {
            const y = TOP + i * LANE;
            return (
              <g key={j}>
                <line x1={LABEL} x2={W - 8} y1={y + LANE / 2} y2={y + LANE / 2} stroke="var(--border)" />
                <text x={8} y={y + LANE / 2 + 4} fontSize={12} className="fill-[var(--muted)] font-mono">
                  {jurisdictionLabels[j]}
                </text>
              </g>
            );
          })}
          {placed.map((m) => {
            const lane = lanes.indexOf(m.jurisdiction);
            const cy = TOP + lane * LANE + LANE / 2 + (m.kind === "capital" ? -8 : 8) + (m.n % 2 ? 0 : 0);
            const cx = x(m.date) + (m.n % 4) * 3;
            const href = m.kind === "capital" ? `/capital/${m.id}` : `/controls/${m.id}`;
            const status =
              m.kind === "control"
                ? controlStatusLabels[m.status as never]
                : m.valueRole === "funding_option"
                  ? `funding option; agreement ${String(financialStatusLabels[m.status as never]).toLowerCase()}, not committed money`
                  : m.valueRole === "indication"
                    ? `non-binding indication; ${String(financialStatusLabels[m.status as never]).toLowerCase()}, not a commitment`
                    : financialStatusLabels[m.status as never];
            const tip = `${formatDate(m.date)} — ${m.kind === "capital" ? "Capital" : "Control"}: ${m.label} (${status})`;
            return (
              <Link key={`${m.id}-${m.date}-${m.status}`} href={href}>
                {m.kind === "capital" ? (
                  <circle cx={cx} cy={cy} r={5} fill={INSTRUMENT_KIND_HUES.capital} fillOpacity={0.85} stroke="var(--bg)" strokeWidth={1}>
                    <title>{tip}</title>
                  </circle>
                ) : (
                  <rect x={cx - 4.5} y={cy - 4.5} width={9} height={9} rx={1} fill={INSTRUMENT_KIND_HUES.control} fillOpacity={0.85} stroke="var(--bg)" strokeWidth={1}>
                    <title>{tip}</title>
                  </rect>
                )}
              </Link>
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <svg aria-hidden width="12" height="12"><circle cx="6" cy="6" r="5" fill={INSTRUMENT_KIND_HUES.capital} /></svg>
          financial status change (upper row of each lane)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg aria-hidden width="12" height="12"><rect x="1.5" y="1.5" width="9" height="9" rx="1" fill={INSTRUMENT_KIND_HUES.control} /></svg>
          control status change (lower row)
        </span>
        <span>Undated status entries are omitted, never placed at a guessed date.</span>
      </figcaption>
    </figure>
  );
}

// --- Stage matrix -----------------------------------------------------------------------------

/**
 * Financial rows by actor and supply-chain stage: a count of records, not of
 * money. A row spread over several stages counts once in each stage it names.
 */
export function StageMatrix({ rows }: { rows: FinancialCommitment[] }) {
  const actors = JURISDICTIONS.filter((j) => rows.some((r) => commitmentActor(r) === j));
  const stages = SUPPLY_CHAIN_STAGES.filter((s) => rows.some((r) => r.stages.includes(s)));
  const count = (j: JurisdictionCode, s: string) => rows.filter((r) => commitmentActor(r) === j && r.stages.includes(s as never)).length;
  const max = Math.max(1, ...actors.flatMap((j) => stages.map((s) => count(j, s))));
  const unstaged = rows.filter((r) => r.stages.length === 0).length;
  const nonGov = rows.filter((r) => r.stages.length > 0 && !commitmentActor(r)).length;
  return (
    <div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <caption className="sr-only">Number of financial rows by actor and supply-chain stage</caption>
          <thead>
            <tr className="border-b bg-card font-mono text-[11px] text-faint">
              <th scope="col" className="px-3 py-2 text-left font-normal uppercase tracking-[0.12em]">Actor</th>
              {stages.map((s) => (
                <th key={s} scope="col" className="px-2 py-2 text-center font-normal">
                  {supplyChainStageLabels[s]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {actors.map((j) => (
              <tr key={j} className="border-b last:border-b-0">
                <th scope="row" className="px-3 py-2 text-left font-display font-normal text-muted">{jurisdictionLabels[j]}</th>
                {stages.map((s) => {
                  const n = count(j, s);
                  return (
                    <td key={s} className="p-1 text-center">
                      {n ? (
                        <Link
                          href={`/capital?actor=${j}&stage=${s}`}
                          className="tnum flex h-9 items-center justify-center rounded font-mono text-xs text-foreground hover:ring-1 hover:ring-accent"
                          style={{ background: `color-mix(in oklab, var(--accent) ${Math.round(12 + (n / max) * 48)}%, transparent)` }}
                          aria-label={`${n} ${jurisdictionLabels[j]} rows at the ${supplyChainStageLabels[s]} stage`}
                        >
                          {n}
                        </Link>
                      ) : (
                        <span className="flex h-9 items-center justify-center font-mono text-xs text-border-strong">·</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-faint">
        {unstaged} of {rows.length} rows name no stage (the source does not say which stage the money goes to) and are not shown
        {nonGov ? `; ${nonGov} staged row${nonGov === 1 ? " is" : "s are"} private or otherwise not government capital and ${nonGov === 1 ? "is" : "are"} left out of the actor rows` : ""}.
      </p>
    </div>
  );
}

// --- Material × actor interplay matrix --------------------------------------------------------

/**
 * Where money and restrictions meet on the same material. Each cell counts the
 * financial rows an actor provides that have not ended (a funding option is one
 * row, not an exercise) and the control clauses it issues naming
 * the material, with how many of those clauses are in force on the as-of date.
 * A part is folded into its package only in a cell where the package is counted.
 */
export function MaterialInterplayMatrix({ asOf }: { asOf: string }) {
  const grid = materialInterplay(asOf);
  const materials = getAllMaterials().filter((m) => grid.has(m.id));
  const actors = JURISDICTIONS.filter((j) => materials.some((m) => grid.get(m.id)?.has(j)));
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[44rem] border-collapse text-sm">
        <caption className="sr-only">
          Financial rows and control clauses by material and actor, as of {formatDate(asOf)}
        </caption>
        <thead>
          <tr className="border-b bg-card font-mono text-[11px] text-faint">
            <th scope="col" className="px-3 py-2 text-left font-normal uppercase tracking-[0.12em]">Material</th>
            {actors.map((j) => (
              <th key={j} scope="col" className="px-2 py-2 text-center font-normal">
                {jurisdictionLabels[j]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <tr key={m.id} className="border-b last:border-b-0">
              <th scope="row" className="px-3 py-2 text-left font-display font-normal">
                <Link href={`/materials/${m.slug}`} className="hover:text-accent">{m.nameEn}</Link>
              </th>
              {actors.map((j) => {
                const c = grid.get(m.id)?.get(j);
                if (!c) return <td key={j} className="px-2 py-2 text-center font-mono text-xs text-border-strong">·</td>;
                return (
                  <td key={j} className="px-2 py-2 text-center">
                    <span className="inline-flex flex-col items-center gap-1 font-mono text-[11px]">
                      {c.capitalIds.length ? (
                        <Link href={`/capital?actor=${j}&material=${m.id}`} className="inline-flex items-center gap-1 text-muted hover:text-foreground" aria-label={`${c.capitalIds.length} financial rows`}>
                          <svg aria-hidden width="8" height="8"><circle cx="4" cy="4" r="4" fill={INSTRUMENT_KIND_HUES.capital} /></svg>
                          <span className="tnum">{c.capitalIds.length}</span>
                        </Link>
                      ) : null}
                      {c.controlIds.length ? (
                        <Link href={`/controls?issuer=${j}&material=${m.id}`} className="inline-flex items-center gap-1 text-muted hover:text-foreground" aria-label={`${c.controlIds.length} control clauses, ${c.controlsInForce} in force`}>
                          <svg aria-hidden width="8" height="8"><rect width="8" height="8" rx="1" fill={INSTRUMENT_KIND_HUES.control} /></svg>
                          <span className="tnum">
                            {c.controlIds.length}
                            <span className="text-faint"> ({c.controlsInForce} in force)</span>
                          </span>
                        </Link>
                      ) : null}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
