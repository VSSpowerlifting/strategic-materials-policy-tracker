import { controlMeasureTypeLabels, valueRoleLabels } from "@/lib/labels";
import { NO_ITEM_MEASURE_TYPES } from "@/lib/types";
import type { LatticeModel } from "@/lib/lattice";
import { cn } from "@/lib/utils";

type Gaps = LatticeModel["gaps"];

const byRuleTypes = () => NO_ITEM_MEASURE_TYPES.map((t) => controlMeasureTypeLabels[t].toLowerCase());

/** "a, b, c and d". */
const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/**
 * The prominent statement that most control clauses cannot appear on the lattice, with the reason split into the
 * two cases the record distinguishes: clauses that define no items of their own (no stage by rule) and clauses
 * that could carry a stage and record none. Every number is derived from the record.
 */
export function ControlGapNotice({ gaps, className, tone = "dark", id = "control-gap-heading" }: { gaps: Gaps; className?: string; tone?: "dark" | "light"; id?: string }) {
  const c = gaps.controls;
  return (
    <aside
      aria-labelledby={id}
      className={cn(
        "rounded-lg border-l-4 px-4 py-4 sm:px-5",
        tone === "dark" ? "border-accent bg-card text-foreground" : "border-paper-accent bg-paper-border/40 text-paper-foreground",
        className,
      )}
    >
      <h2 id={id} className="font-display text-base font-semibold leading-snug sm:text-lg">
        <span className="tnum">{c.noStage}</span> of <span className="tnum">{c.total}</span> control clauses record no stage, so they cannot appear on this lattice.
      </h2>
      <div className={cn("mt-2 space-y-2 text-sm leading-6", tone === "dark" ? "text-muted" : "text-paper-muted")}>
        <p>
          <span className="tnum">{c.noStageByRule}</span> of them are {list(byRuleTypes())} clauses. A clause of these kinds defines no items of its own, so
          no stage is recorded for it by rule. The other <span className="tnum">{c.noStageOther}</span> are clause types that could carry a stage and record none.
        </p>
        <p>
          The amber marks show the <span className="tnum">{c.placed}</span> clauses that can be placed, not all <span className="tnum">{c.total}</span>. A clause is placed
          at the stage its covered items belong to; that is not a claim that the clause restricts that stage.
          {c.noMaterialOnly > 0 ? ` ${c.noMaterialOnly} more record a stage but no tracked material.` : ""}
        </p>
      </div>
    </aside>
  );
}

/** The four counts of what the lattice does not hold, each for its own kind and never added to another. */
export function NotOnLatticeStats({ gaps, className }: { gaps: Gaps; className?: string }) {
  const { controls, designations, capital } = gaps;
  const indications = capital.otherRoles.indication ?? 0;
  const otherRoleNames = Object.keys(capital.otherRoles)
    .filter((r) => r !== "indication")
    .map((r) => valueRoleLabels[r as keyof typeof valueRoleLabels].toLowerCase());
  const noCommitment = capital.noStageOrMaterial + capital.noProvider;
  const items = [
    {
      n: controls.noStage,
      text: `of ${controls.total} control clauses record no stage`,
    },
    {
      n: noCommitment,
      text: `commitment or option rows record no ${capital.noStageOrMaterial ? `stage or tracked material (${capital.noStageOrMaterial})` : "stage"}${capital.noProvider ? `${capital.noStageOrMaterial ? " or" : " and"} no providing government (${capital.noProvider})` : ""}`,
    },
    { n: designations.unplaced, text: `designation${designations.unplaced === 1 ? " records" : "s record"} no stage or tracked material` },
    {
      n: capital.otherRoleTotal,
      text: `capital rows in other value roles${otherRoleNames.length ? `, such as ${list(otherRoleNames)}` : ""}${indications ? `${otherRoleNames.length ? " and" : ", such as"} the ${indications} non-binding indication${indications === 1 ? "" : "s"}` : ""}`,
    },
  ];
  return (
    <div className={className}>
      <h3 className="font-display text-sm font-semibold text-foreground">Not on the lattice</h3>
      <dl className="mt-3 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.text} className="flex items-baseline gap-3 lg:block">
            <dt className="tnum font-display text-3xl font-semibold text-foreground">{it.n}</dt>
            <dd className="text-sm leading-5 text-muted lg:mt-1">{it.text}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 max-w-3xl text-xs leading-5 text-faint">
        Each count is for its own kind of record over the whole record, whatever the filters above. They are never added together.
      </p>
    </div>
  );
}

/**
 * One sentence on what the lattice does not place, each kind counted on its own (the same buckets as
 * `NotOnLatticeStats`, read as a sentence for the overview's legend).
 */
export function NotPlacedSentence({ gaps }: { gaps: Gaps }) {
  const { controls, designations, capital } = gaps;
  const ind = capital.otherRoles.indication ?? 0;
  const commitments = capital.noStageOrMaterial + capital.noProvider;
  return (
    <>
      Not placed: {controls.noStage} of {controls.total} clauses, {designations.unplaced} {designations.unplaced === 1 ? "designation" : "designations"} and {commitments}{" "}
      {commitments === 1 ? "commitment or option row" : "commitment or option rows"} that record no stage, tracked material or providing government, and {capital.otherRoleTotal} rows in other value roles
      {ind ? `, such as the ${ind} ${ind === 1 ? "indication" : "indications"}` : ""}.
    </>
  );
}
