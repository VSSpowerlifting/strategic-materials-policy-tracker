import Link from "next/link";
import { CellMarks, KindSwatch, stageShortLabels } from "@/components/lattice/marks";
import { countWord } from "@/lib/lattice-view";
import type { CapitalRowView, ControlView, DesignationView, DossierPayload, StageBlock } from "@/lib/material-dossier";
import { AsStated, Chip, FoldedList, Money, SubHeading } from "./parts";

const CARD_LIMIT = 6;

// --- The band: the material's row of the lattice, opened out --------------------------------------

type BandCounts = { commitments: number; controls: number; designations: number };
type BandActors = { commitments: string[]; controls: string[]; designations: string[] };

/** One column of the band: a stage, or the records that name the material and record no stage. */
function BandCell({ label, short, counts, actors, marks, attr }: { label: string; short: string; counts: BandCounts; actors: BandActors; marks: boolean; attr: Record<string, string> }) {
  const marked = counts.commitments + counts.controls + counts.designations > 0;
  return (
    <li {...attr} className="flex items-center gap-4 rounded-md px-2 py-2.5 lg:flex-col lg:items-center lg:gap-1 lg:px-1 lg:py-3 lg:text-center">
      <span className="w-28 shrink-0 font-display text-sm font-semibold text-foreground lg:w-auto lg:text-xs">
        <span className="lg:hidden">{label}</span>
        <span className="hidden lg:inline">{short}</span>
      </span>
      {marked ? (
        <>
          {marks ? <CellMarks counts={counts} className="mx-0 lg:mx-auto" /> : null}
          <span className="min-w-0 space-y-1 text-xs leading-5 text-muted">
            {(
              [
                { kind: "commitments", n: counts.commitments, one: "commitment", many: "commitments", who: actors.commitments },
                { kind: "controls", n: counts.controls, one: "clause", many: "clauses", who: actors.controls },
                { kind: "designations", n: counts.designations, one: "designation", many: "designations", who: actors.designations },
              ] as const
            )
              .filter((k) => k.n > 0)
              .map((k) => (
                <span key={k.kind} className="flex flex-wrap items-baseline gap-x-1.5 lg:justify-center">
                  <span className="self-center">
                    <KindSwatch kind={k.kind} />
                  </span>
                  <span className="whitespace-nowrap text-foreground">{countWord(k.n, k.one, k.many)}</span>
                  <span className="whitespace-nowrap font-mono text-[10px] text-faint">{k.who.join(" ")}</span>
                </span>
              ))}
          </span>
        </>
      ) : (
        <span className="text-xs text-faint">None recorded</span>
      )}
    </li>
  );
}

const shortCodes = (xs: (string | null)[]) => [...new Set(xs.filter((x): x is string => !!x))].sort();

export function SupplyChainBand({ payload }: { payload: DossierPayload }) {
  const n = payload.stages.length + 1;
  const un = payload.unstaged;
  const unCounts = { commitments: un.capital.length, controls: un.controls.length, designations: un.designations.length };
  const unActors = {
    commitments: shortCodes(un.capital.map((r) => r.actorShort)),
    controls: shortCodes(un.controls.map((c) => c.issuerShort)),
    designations: shortCodes(un.designations.map((d) => d.programmeActorShort)),
  };
  return (
    <section id="supply-chain" className="scroll-mt-24">
      <h2 className="border-b border-border pb-2 font-display text-xl font-semibold">Supply chain, stage by stage</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        {payload.nameEn}&apos;s row of the lattice: what the record places at each stage. Counts are records per stage, never money; a record coded to several stages is counted at each, so the stages have no total. The last column holds records that name {payload.nameEn} and record no stage, so the lattice cannot place them.
      </p>
      <ul
        className="mt-4 grid gap-1 rounded-lg border border-border bg-card/50 p-2 lg:[grid-template-columns:repeat(var(--stages),minmax(0,1fr))]"
        style={{ "--stages": n } as React.CSSProperties}
        aria-label={`${payload.nameEn} by supply-chain stage`}
      >
        {payload.stages.map((s) => (
          <BandCell key={s.id} label={s.label} short={stageShortLabels[s.id]} counts={s.counts} actors={s.actors} marks attr={{ "data-stage": s.id }} />
        ))}
        <BandCell label="No stage recorded" short="No stage" counts={unCounts} actors={unActors} marks={false} attr={{ "data-no-stage": "true" }} />
      </ul>
    </section>
  );
}

// --- The cards -------------------------------------------------------------------------------------

function PartLine({ part }: { part: CapitalRowView }) {
  return (
    <li className="text-xs leading-5 text-muted">
      {part.partLabel}{" "}
      <Link href={part.href} className="text-accent hover:text-accent-strong">
        Open row
      </Link>
    </li>
  );
}

export function CapitalCard({ row }: { row: CapitalRowView }) {
  return (
    <li className="rounded-md border border-border bg-card p-3 text-sm">
      <div className="flex items-start gap-2">
        {row.actorShort ? <Chip>{row.actorShort}</Chip> : null}
        <Link href={row.href} className="min-w-0 font-display text-sm font-semibold leading-snug [overflow-wrap:anywhere] hover:text-accent">
          {row.title}
        </Link>
      </div>
      <p className="mt-1.5">
        {row.amount ? <Money amount={row.amount} /> : <em className="text-faint">No amount stated</em>}
      </p>
      {row.asStated ? <AsStated text={row.asStated} /> : null}
      <p className="mt-1 text-xs leading-5 text-muted">
        {row.instrument}. {row.status.text}.
      </p>
      {row.parts.length ? <ul className="mt-2 space-y-1 border-l border-border-strong pl-2.5">{row.parts.map((p) => <PartLine key={p.id} part={p} />)}</ul> : null}
    </li>
  );
}

export function ControlCard({ control }: { control: ControlView }) {
  return (
    <li className="rounded-md border border-border bg-card p-3 text-sm">
      <div className="flex items-start gap-2">
        <Chip>{control.issuerShort}</Chip>
        <Link href={control.href} className="min-w-0 font-display text-sm font-semibold leading-snug [overflow-wrap:anywhere] hover:text-accent">
          {control.title}
        </Link>
      </div>
      {control.documentNumber ? <p className="mt-1 font-mono text-[11px] text-faint">{control.documentNumber}</p> : null}
      <p className="mt-1.5 text-xs leading-5 text-muted">
        {control.asOfState}
        {control.entry ? <span className="block text-faint">{control.entry}</span> : null}
      </p>
      {control.items ? <p className="mt-1 text-xs leading-5 text-faint">Covered items ({control.items}) belong here. That places the items, not a claim that the clause restricts this stage.</p> : null}
      {control.noStageReason ? <p className="mt-1 text-xs leading-5 text-faint">{control.noStageReason}</p> : null}
    </li>
  );
}

/**
 * The project's registry facts, secondary to the designation. A labelled block from `lg` up and a disclosure
 * below it (spec 5.3, 7). Two elements, one shown per width, so it works without a script or `::details-content`.
 */
function RegistryBlock({ registry }: { registry: DesignationView["registry"] }) {
  const facts = (
    <div className="space-y-1 text-xs leading-5 text-muted">
      {registry.locations.length ? <p>Locations: {registry.locations.join("; ")}</p> : null}
      {registry.sponsors.length ? <p>Sponsors: {registry.sponsors.join(", ")}</p> : null}
    </div>
  );
  const label = "font-mono text-[11px] uppercase tracking-[0.1em] text-faint";
  return (
    <>
      <details className="mt-2 lg:hidden">
        <summary className={`cursor-pointer hover:text-foreground ${label}`}>Project registry</summary>
        <div className="mt-1.5">{facts}</div>
      </details>
      <div className="mt-2 hidden lg:block">
        <p className={label}>Project registry</p>
        <div className="mt-1.5">{facts}</div>
      </div>
    </>
  );
}

export function DesignationCard({ d }: { d: DesignationView }) {
  return (
    <li className="rounded-md border border-border bg-card p-3 text-sm">
      <div className="flex items-start gap-2">
        <span aria-hidden className="mt-1.5">
          <KindSwatch kind="designations" />
        </span>
        <Link href={d.href} className="min-w-0 font-display text-sm font-semibold leading-snug [overflow-wrap:anywhere] hover:text-accent">
          {d.heading}
        </Link>
      </div>
      {d.asStated ? <p className="mt-1 text-xs leading-5 text-faint">As stated: {d.asStated}</p> : null}
      <p className="mt-1.5 text-xs leading-5 text-muted">
        {d.programme}
        {d.programmeActor ? ` (${d.programmeActor})` : ""}. {d.status.text}. Standing, not money.
      </p>
      {d.holders.length ? <p className="mt-1 text-xs leading-5 text-muted">Holder: {d.holders.join(", ")}</p> : null}
      <p className="mt-1 text-xs leading-5 text-muted">Names: {d.materials.join(", ")}</p>
      {d.untracked.length ? <p className="mt-1 text-xs leading-5 text-muted">Also names: {d.untracked.join(", ")}, not a tracked material</p> : null}
      {d.registry.stageNote ? <p className="mt-1.5 text-xs leading-5 text-faint">{d.registry.stageNote}</p> : null}
      {d.registry.untracked.length ? <p className="mt-1 text-xs leading-5 text-faint">Project record also names: {d.registry.untracked.join(", ")}, not a tracked material</p> : null}
      {d.noStageReason ? <p className="mt-1 text-xs leading-5 text-faint">{d.noStageReason}</p> : null}
      {d.registry.locations.length || d.registry.sponsors.length ? <RegistryBlock registry={d.registry} /> : null}
    </li>
  );
}

function Empty({ children }: { children: string }) {
  return <p className="text-xs text-faint">{children}</p>;
}

// --- Records by stage ------------------------------------------------------------------------------

/**
 * A column with more than CARD_LIMIT cards shows its first CARD_LIMIT, in row order, and folds the rest behind
 * "Show all N" on the row they belong to. Returns how many cards each row shows.
 */
function shownPerRow(lengths: number[]): number[] {
  const total = lengths.reduce((a, b) => a + b, 0);
  let left = total > CARD_LIMIT ? CARD_LIMIT : total;
  return lengths.map((n) => {
    const shown = Math.min(n, left);
    left -= shown;
    return shown;
  });
}

// On desktop each column spans four rows of the parent grid as a subgrid (heading, capital, controls,
// designations), so the three labelled rows line up across the stages of one grid line.
const columnRows = "flex flex-col gap-5 lg:row-span-4 lg:mb-8 lg:grid lg:grid-rows-subgrid lg:gap-y-5";

function StageColumn({ stage }: { stage: StageBlock }) {
  const list = "space-y-2";
  const [capN, optN, endN, ctlN, desN] = shownPerRow([stage.capital.length, stage.options.length, stage.ended.length, stage.controls.length, stage.designations.length]);
  return (
    <div className={`dossier-stage min-w-0 rounded-md p-1 ${columnRows}`}>
      <h3 id={`stage-${stage.id}`} className="scroll-mt-24 font-display text-base font-semibold">
        {stage.label}
      </h3>
      <div className="space-y-2">
        <SubHeading>Capital rows</SubHeading>
        {stage.capital.length ? <FoldedList items={stage.capital} limit={capN} label="Show all" className={list} render={(r) => <CapitalCard key={r.id} row={r} />} /> : <Empty>None</Empty>}
        {stage.options.length ? (
          <div className="space-y-2 pt-1">
            <SubHeading note="listed apart">Funding options, not commitments</SubHeading>
            <p className="text-xs leading-5 text-faint">A funding option is a right to call on money, not an exercise of it.</p>
            <FoldedList items={stage.options} limit={optN} label="Show all" className={list} render={(r) => <CapitalCard key={r.id} row={r} />} />
          </div>
        ) : null}
        {stage.ended.length ? (
          <div className="space-y-2 pt-1">
            <SubHeading note="listed apart">Withdrawn or lapsed</SubHeading>
            <FoldedList items={stage.ended} limit={endN} label="Show all" className={list} render={(r) => <CapitalCard key={r.id} row={r} />} />
          </div>
        ) : null}
      </div>
      <div className="space-y-2">
        <SubHeading>Control clauses</SubHeading>
        {stage.controls.length ? <FoldedList items={stage.controls} limit={ctlN} label="Show all" className={list} render={(c) => <ControlCard key={c.id} control={c} />} /> : <Empty>None</Empty>}
      </div>
      <div className="space-y-2">
        <SubHeading note="standing, not money">Designations</SubHeading>
        {stage.designations.length ? <FoldedList items={stage.designations} limit={desN} label="Show all" className={list} render={(d) => <DesignationCard key={d.id} d={d} />} /> : <Empty>None</Empty>}
      </div>
    </div>
  );
}

function NoStageColumn({ payload }: { payload: DossierPayload }) {
  const { capital, controls, designations } = payload.unstaged;
  const [capN, ctlN, desN] = shownPerRow([capital.length, controls.length, designations.length]);
  return (
    <div className={`min-w-0 rounded-md border border-dashed border-border-strong p-3 ${columnRows}`}>
      <h3 id="no-stage" className="scroll-mt-24 font-display text-base font-semibold">
        No stage recorded
      </h3>
      <div className="space-y-2">
        <p className="text-xs leading-5 text-faint">These name {payload.nameEn} but record no stage, so the lattice cannot place them.</p>
        {capital.length ? (
          <>
            <SubHeading>Capital rows</SubHeading>
            <FoldedList items={capital} limit={capN} label="Show all" className="space-y-2" render={(r) => <CapitalCard key={r.id} row={r} />} />
          </>
        ) : null}
      </div>
      <div className="space-y-2">
        {controls.length ? (
          <>
            <SubHeading>Control clauses</SubHeading>
            <FoldedList items={controls} limit={ctlN} label="Show all" className="space-y-2" render={(c) => <ControlCard key={c.id} control={c} />} />
          </>
        ) : null}
      </div>
      <div className="space-y-2">
        {designations.length ? (
          <>
            <SubHeading note="standing, not money">Designations</SubHeading>
            <FoldedList items={designations} limit={desN} label="Show all" className="space-y-2" render={(d) => <DesignationCard key={d.id} d={d} />} />
          </>
        ) : null}
      </div>
    </div>
  );
}

export function RecordsByStage({ payload }: { payload: DossierPayload }) {
  const filled = payload.stages.filter((s) => !s.empty);
  const empty = payload.stages.filter((s) => s.empty);
  const hasUnstaged = payload.unstaged.capital.length + payload.unstaged.controls.length + payload.unstaged.designations.length > 0;
  return (
    <section id="records" className="scroll-mt-24">
      <h2 className="border-b border-border pb-2 font-display text-xl font-semibold">Records by stage</h2>
      {/* Phones: one column of stages, so a row of jump links; each targets the stage's one id. */}
      <nav aria-label="Jump to a stage" className="mt-4 flex flex-wrap gap-2 lg:hidden">
        {payload.stages.map((st) => (
          <a
            key={st.id}
            href={`#stage-${st.id}`}
            className={`inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm hover:text-foreground ${st.empty ? "border-border text-faint" : "border-border-strong text-muted"}`}
          >
            {stageShortLabels[st.id]}
          </a>
        ))}
        {hasUnstaged ? (
          <a href="#no-stage" className="inline-flex min-h-11 items-center rounded-full border border-dashed border-border-strong px-3.5 text-sm text-muted hover:text-foreground">
            No stage recorded
          </a>
        ) : null}
      </nav>
      <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:gap-y-0 lg:[grid-template-columns:repeat(auto-fill,minmax(13.5rem,1fr))]">
        {filled.map((s) => (
          <StageColumn key={s.id} stage={s} />
        ))}
        {hasUnstaged ? <NoStageColumn payload={payload} /> : null}
      </div>
      {empty.length ? (
        <p className="mt-6 text-sm leading-6 text-faint">
          <span>None recorded at: </span>
          {empty.map((s, i) => (
            <span key={s.id}>
              <span id={`stage-${s.id}`} className="dossier-stage-name scroll-mt-24 text-muted">
                {s.label}
              </span>
              {i < empty.length - 1 ? ", " : ""}
            </span>
          ))}
          .
        </p>
      ) : null}
      <p className="mt-6 max-w-3xl text-sm leading-6 text-muted">
        A designation is a government&apos;s recognition of a project under a named scheme. It records standing, not money, and covers only the stages and materials the designation names. A project is the registry record of the site or venture. Shared stage codes are not a finding.
      </p>

      {payload.registryProjects.length ? (
        <div className="mt-10">
          <h3 className="font-display text-base font-semibold">Registry projects with no designation naming {payload.nameEn}</h3>
          <p className="mt-1 text-sm leading-6 text-faint">Not placed by stage: a project&apos;s own stage list is not a designation, and the lattice places only designations.</p>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {payload.registryProjects.map((p) => (
              <li key={p.id} className="rounded-md border border-border bg-card p-3 text-sm">
                <Link href={p.href} className="font-display font-semibold leading-snug hover:text-accent">
                  {p.name}
                </Link>
                {p.locations.length ? <p className="mt-1 text-xs leading-5 text-muted">Locations: {p.locations.join("; ")}</p> : null}
                {p.sponsors.length ? <p className="mt-1 text-xs leading-5 text-muted">Sponsors: {p.sponsors.join(", ")}</p> : null}
                {p.stages.length ? <p className="mt-1 text-xs leading-5 text-faint">Project record codes: {p.stages.join(", ").toLowerCase()}. Registry stages, not placed on the supply-chain lattice.</p> : null}
                {p.designatedElsewhere.length ? <p className="mt-1 text-xs leading-5 text-faint">Designated under {p.designatedElsewhere.join(", ")} for other materials.</p> : null}
                {p.capitalRows.length ? (
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {countWord(p.capitalRows.length, "capital row names", "capital rows name")} this project:{" "}
                    {p.capitalRows.map((r, i) => (
                      <span key={r.id}>
                        <Link href={r.href} className="text-accent hover:text-accent-strong">
                          {r.title}
                        </Link>
                        {i < p.capitalRows.length - 1 ? "; " : ""}
                      </span>
                    ))}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
