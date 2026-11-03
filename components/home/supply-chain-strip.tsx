import Link from "next/link";
import type { StageCounts } from "@/lib/homepage-chain";
import { hasRecords } from "@/lib/homepage-chain";
import { countWord } from "@/lib/lattice-view";
import { getMaterialMeta } from "@/lib/materials-meta";
import type { Material } from "@/lib/types";

/** The lattice's encodings at legend size: gold disc, amber disc, cream diamond. */
function KindMark({ kind }: { kind: "commitments" | "controls" | "designations" }) {
  return (
    <svg aria-hidden viewBox="0 0 10 10" className="h-2.5 w-2.5 shrink-0">
      {kind === "designations" ? (
        <path d="M5 1L9 5L5 9L1 5Z" fill="var(--bg)" stroke="var(--mark-designation)" strokeWidth="1.2" />
      ) : (
        <circle cx="5" cy="5" r="4" fill={kind === "commitments" ? "var(--mark-commitment)" : "var(--mark-control)"} />
      )}
    </svg>
  );
}

const KIND_WORDS = [
  ["commitments", "commitment", "commitments"],
  ["controls", "control clause", "control clauses"],
  ["designations", "designation", "designations"],
] as const;

/**
 * The supply chain as a row of stages (a column below `xl`), each with its record counts by kind. The connector
 * between two stages carries a slow dash drift and a pulse that passes along the chain stage by stage; both stop
 * under reduced motion. The counts are the content; the motion is decoration and carries no data.
 */
export function SupplyChainStrip({ chain, outside, asOf }: { chain: StageCounts[]; outside: StageCounts[]; asOf: React.ReactNode }) {
  return (
    <figure aria-labelledby="chain-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
        <h2 id="chain-heading" className="font-display text-base font-semibold">
          Where the records sit along the supply chain
        </h2>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 font-display text-xs text-muted">
          {KIND_WORDS.map(([kind, , many]) => (
            <li key={kind} className="flex items-center gap-1.5">
              <KindMark kind={kind} />
              {kind === "commitments" ? "government commitments" : many}
            </li>
          ))}
        </ul>
      </div>

      <ol className="mt-8 grid xl:grid-cols-8">
        {chain.map((s, i) => {
          const empty = !hasRecords(s);
          return (
            <li key={s.stage} className="chain-stage relative flex gap-4 pb-6 xl:flex-col xl:items-center xl:gap-3 xl:px-2 xl:pb-0 xl:text-center">
              {i < chain.length - 1 ? (
                <span aria-hidden className="chain-link" style={{ "--i": i } as React.CSSProperties} />
              ) : null}
              <span
                aria-hidden
                className={
                  "relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full border-2 bg-background xl:mt-0 " +
                  (empty ? "border-border-strong" : "border-accent")
                }
              />
              <div className="min-w-0">
                <p className={"font-display text-sm font-semibold leading-5 " + (empty ? "text-muted" : "text-foreground")}>
                  {s.label}
                </p>
                {empty ? (
                  <p className="mt-1.5 font-display text-xs text-muted">No records coded</p>
                ) : (
                  <ul className="mt-1.5 space-y-1 font-display text-xs leading-4 text-muted xl:inline-block xl:text-left">
                    {KIND_WORDS.filter(([kind]) => s[kind] > 0).map(([kind, one, many]) => (
                      <li key={kind} className="flex items-center gap-1.5">
                        <KindMark kind={kind} />
                        <span className="tnum">{countWord(s[kind], one, many)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <figcaption className="mt-8 max-w-3xl text-sm leading-6 text-muted">
        Distinct records at each stage across all materials, {asOf}. A record that covers several stages is
        counted at each; the three kinds are counted apart and never added. Commitments leave out funding options
        and withdrawn or lapsed rows.
        {outside.length ? (
          <>
            {" "}Also recorded outside the physical chain:{" "}
            {outside
              .map((s) => `${s.label.toLowerCase()} (${KIND_WORDS.filter(([k]) => s[k] > 0).map(([k, one, many]) => countWord(s[k], one, many)).join(", ")})`)
              .join("; ")}
            .
          </>
        ) : null}{" "}
        <Link href="#browse" className="font-display text-accent underline underline-offset-4">
          Browse by material and stage
        </Link>
      </figcaption>
    </figure>
  );
}

/** A compact element-tile row: each material in scope, linking to its page. Symbols are presentation only. */
export function ElementStrip({ materials }: { materials: Material[] }) {
  return (
    <nav aria-label="Materials in scope" className="mt-8">
      <p className="font-display text-xs text-muted">Materials in scope</p>
      <ul className="mt-2 flex flex-wrap gap-1">
        {materials.map((m) => {
          const { symbol, atomicNumber, hue } = getMaterialMeta(m.id);
          return (
            <li key={m.id}>
              <Link
                href={`/materials/${m.slug}`}
                title={m.nameEn}
                className="element-tile relative flex h-10 min-w-10 items-center justify-center rounded border bg-elevated px-1.5 font-mono text-sm font-medium text-foreground/90"
                style={{ borderColor: `${hue}80` }}
              >
                <span className="sr-only">{m.nameEn}</span>
                <span aria-hidden>{symbol}</span>
                {atomicNumber ? (
                  <span aria-hidden className="absolute right-0.5 top-0 text-[8px] text-faint">
                    {atomicNumber}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
