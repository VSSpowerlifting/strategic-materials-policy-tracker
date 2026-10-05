import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { CapitalRowView, ControlView, DossierPayload, LayerBlock } from "@/lib/material-dossier";
import { AsStated, Chip, Money, SubHeading } from "./parts";

/**
 * Every capital row at its own stated amount, one row each. Nothing on this page adds, divides or converts an
 * amount: a part sits inside its package and is not added again, and a row that names several materials keeps its
 * whole amount under each.
 */

function Notes({ row, materialName }: { row: CapitalRowView; materialName: string }) {
  if (!row.notes.length) return null;
  return (
    <ul className="mt-1.5 space-y-0.5 text-xs leading-5 text-muted">
      {row.notes.map((n) => (
        <li key={`${n.relation}-${n.targetId}`}>
          {n.relation === "drawn_from" ? "Drawn from " : n.alsoParent ? "Also part of " : "Part of "}
          <Link href={n.href} className="text-accent hover:text-accent-strong">
            {n.targetTitle}
          </Link>
          {n.inSet ? "" : `, which does not name ${materialName}`}
        </li>
      ))}
    </ul>
  );
}

function CapitalRow({ row, materialName }: { row: CapitalRowView; materialName: string }) {
  return (
    <li className="rounded-md border border-border bg-card p-3 text-sm" data-capital-row={row.id}>
      {row.partLabel ? <p className="mb-1.5 font-display text-xs font-semibold text-muted">{row.partLabel}</p> : null}
      <div className="flex items-start gap-2">
        {row.actorShort ? <Chip>{row.actorShort}</Chip> : null}
        <Link href={row.href} className="min-w-0 font-display text-sm font-semibold leading-snug [overflow-wrap:anywhere] hover:text-accent">
          {row.title}
        </Link>
      </div>
      {row.provider || row.recipient ? (
        <p className="mt-1 text-xs leading-5 text-muted">
          {row.provider ? <>Provider: {row.provider}</> : null}
          {row.provider && row.recipient ? <span aria-hidden> · </span> : null}
          {row.recipient ? <>Recipient: {row.recipient}</> : null}
        </p>
      ) : null}
      <p className="mt-1.5">{row.amount ? <Money amount={row.amount} /> : <em className="text-faint">No amount stated</em>}</p>
      {row.asStated ? <AsStated text={row.asStated} /> : null}
      {row.amountBasis ? <p className="text-xs leading-5 text-faint">Amount basis: {row.amountBasis.toLowerCase()}; see the record page for how it relates to reported figures.</p> : null}
      <p className="mt-1 text-xs leading-5 text-muted">
        {row.instrument}. {row.status.text}.
      </p>
      <p className="mt-0.5 text-xs leading-5 text-faint">
        {row.standingLabel}.{row.authority ? ` Authority as stated: ${row.authority}.` : ""}
      </p>
      <p className="mt-0.5 text-xs leading-5 text-faint">Scope: {row.scope}.</p>
      <Notes row={row} materialName={materialName} />
      {row.parts.length ? (
        <ul className="mt-3 space-y-2 border-l border-border-strong pl-3">
          {row.parts.map((p) => (
            <CapitalRow key={p.id} row={p} materialName={materialName} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function Layer({ layer, materialName }: { layer: LayerBlock; materialName: string }) {
  return (
    <div className="space-y-3" data-layer={layer.key}>
      <div>
        <h4 className="font-display text-base font-semibold">
          {layer.label} <span className="font-normal text-faint">({layer.count})</span>
        </h4>
        <p className="mt-1 text-xs leading-5 text-faint">{layer.gloss}</p>
      </div>
      {layer.live.length ? (
        <ul className="space-y-2">
          {layer.live.map((r) => (
            <CapitalRow key={r.id} row={r} materialName={materialName} />
          ))}
        </ul>
      ) : null}
      {layer.statusNotStated.length ? (
        <div className="space-y-2">
          <SubHeading note="listed apart">Status not stated</SubHeading>
          <ul className="space-y-2">
            {layer.statusNotStated.map((r) => (
              <CapitalRow key={r.id} row={r} materialName={materialName} />
            ))}
          </ul>
        </div>
      ) : null}
      {layer.ended.length ? (
        <div className="space-y-2">
          <SubHeading note="listed apart">Withdrawn or lapsed</SubHeading>
          <ul className="space-y-2">
            {layer.ended.map((r) => (
              <CapitalRow key={r.id} row={r} materialName={materialName} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ControlRow({ control }: { control: ControlView }) {
  return (
    <li className="rounded-md border border-border bg-card p-3 text-sm" data-control-clause={control.id}>
      <div className="flex items-start gap-2">
        <Chip>{control.issuerShort}</Chip>
        <Link href={control.href} className="min-w-0 font-display text-sm font-semibold leading-snug [overflow-wrap:anywhere] hover:text-accent">
          {control.title}
        </Link>
      </div>
      {control.documentNumber ? <p className="mt-1 font-mono text-[11px] text-faint">{control.documentNumber}</p> : null}
      <p className="mt-1.5 text-sm text-foreground">{control.asOfState}</p>
      {control.entry ? <p className="text-xs leading-5 text-muted">{control.entry}</p> : null}
      {control.history.length ? (
        <ol className="mt-2 space-y-0.5 border-l border-border-strong pl-3 text-xs leading-5 text-muted">
          {control.history.map((h, i) => (
            <li key={i}>
              {h.text}
              {h.until ? `, until ${formatDate(h.until)}` : ""}
            </li>
          ))}
        </ol>
      ) : null}
      {control.items ? (
        <p className="mt-2 text-xs leading-5 text-faint">
          Covered items ({control.items}) belong at {control.itemStages.join(", ").toLowerCase() || "no recorded stage"}. That places the items; it is not a claim that the clause restricts that stage.
        </p>
      ) : null}
      {control.legalBasis.length ? (
        <p className="mt-1 text-xs leading-5 text-faint">
          Legal basis:{" "}
          {control.legalBasis.map((b, i) => (
            <span key={b.id}>
              <Link href={b.href} className="text-accent hover:text-accent-strong">
                {b.title}
              </Link>
              {i < control.legalBasis.length - 1 ? "; " : ""}
            </span>
          ))}
        </p>
      ) : null}
    </li>
  );
}

export function CapitalControls({ payload }: { payload: DossierPayload }) {
  const { money } = payload;
  return (
    <section id="capital-controls" className="scroll-mt-24">
      <h2 className="border-b border-border pb-2 font-display text-xl font-semibold">Capital and controls</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        Each capital row is shown at its own amount, in its own currency, exactly as the record states it. Nothing here adds up, splits or converts an amount, so a row that names several materials shows its whole amount and a part sits inside its package without being added again.
      </p>
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-8" data-block="capital">
          <h3 className="font-display text-lg font-semibold">
            Capital rows <span className="font-normal text-faint">({money.total} naming {payload.nameEn}; {money.topLevel} shown at top level, {money.nested} inside a package)</span>
          </h3>
          {money.layers.length ? (
            money.layers.map((l) => <Layer key={l.key} layer={l} materialName={payload.nameEn} />)
          ) : (
            <p className="text-sm leading-6 text-muted">No capital row names {payload.nameEn}.</p>
          )}
        </div>
        <div className="min-w-0 space-y-4" data-block="controls">
          <h3 className="font-display text-lg font-semibold">
            Control clauses <span className="font-normal text-faint">({payload.controls.length}, status on {formatDate(payload.asOf)})</span>
          </h3>
          {payload.controls.length ? (
            <ul className="space-y-2">
              {payload.controls.map((c) => (
                <ControlRow key={c.id} control={c} />
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-muted">No control clause names {payload.nameEn}.</p>
          )}
        </div>
      </div>
      <p className="mt-6 text-sm leading-6 text-muted">
        <Link href={payload.links.capital} className="font-semibold text-accent hover:text-accent-strong">
          Explore capital rows naming {payload.nameEn}
        </Link>{" "}
        and{" "}
        <Link href={payload.links.controls} className="font-semibold text-accent hover:text-accent-strong">
          control clauses naming {payload.nameEn}
        </Link>
        : all rows naming {payload.nameEn}, parts and options listed separately.
      </p>
    </section>
  );
}
