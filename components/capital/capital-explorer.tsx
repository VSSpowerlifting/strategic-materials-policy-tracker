"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { CommitmentRow } from "@/components/capital/rows";
import {
  ALL,
  FilterSelect,
  SearchBox,
  countOptions,
  normalize,
  useUrlFilters,
} from "@/components/capital/filter-controls";
import {
  capitalSourceLabels,
  financialInstrumentLabels,
  financialRelationshipTypeLabels,
  financialStatusLabels,
  jurisdictionLabels,
  supplyChainStageLabels,
  valueRoleLabels,
} from "@/lib/labels";
import {
  CAPITAL_SOURCES,
  FINANCIAL_INSTRUMENTS,
  FINANCIAL_STATUSES,
  JURISDICTIONS,
  SUPPLY_CHAIN_STAGES,
  VALUE_ROLES,
} from "@/lib/types";
import type { CommitmentSummary } from "@/lib/capital-control";

/**
 * Filterable list of financial rows. With "families" on (the default) a row
 * that is part of, or drawn from, another visible row is nested under it, so
 * the reader sees at a glance which figures sit inside which — the same
 * structure the counting rules use to avoid double counting.
 */
export function CapitalExplorer({
  rows,
  materialNames,
}: {
  rows: CommitmentSummary[];
  materialNames: Record<string, string>;
}) {
  const [q, setQ] = useState("");
  const [actor, setActor] = useState(ALL);
  const [instrument, setInstrument] = useState(ALL);
  const [role, setRole] = useState(ALL);
  const [source, setSource] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [stage, setStage] = useState(ALL);
  const [material, setMaterial] = useState(ALL);
  const [families, setFamilies] = useState(true);

  const opts = useMemo(
    () => ({
      actor: countOptions(rows.map((r) => r.actor), jurisdictionLabels, JURISDICTIONS),
      instrument: countOptions(rows.map((r) => r.instrument), financialInstrumentLabels, FINANCIAL_INSTRUMENTS),
      role: countOptions(rows.map((r) => r.valueRole), valueRoleLabels, VALUE_ROLES),
      source: countOptions(rows.map((r) => r.capitalSource), capitalSourceLabels, CAPITAL_SOURCES),
      status: countOptions(rows.map((r) => r.status), financialStatusLabels, FINANCIAL_STATUSES),
      stage: countOptions(rows.flatMap((r) => r.stages), supplyChainStageLabels, SUPPLY_CHAIN_STAGES),
      material: Object.entries(materialNames)
        .filter(([id]) => rows.some((r) => r.materialIds.includes(id)))
        .map(([value, label]) => ({ value, label, count: rows.filter((r) => r.materialIds.includes(value)).length })),
    }),
    [rows, materialNames],
  );

  useUrlFilters({ q, actor, instrument, role, source, status, stage, material }, (i) => {
    const ok = (list: { value: string }[], v?: string) => (v && list.some((o) => o.value === v) ? v : ALL);
    setQ(i.q ?? "");
    setActor(ok(opts.actor, i.actor));
    setInstrument(ok(opts.instrument, i.instrument));
    setRole(ok(opts.role, i.role));
    setSource(ok(opts.source, i.source));
    setStatus(ok(opts.status, i.status));
    setStage(ok(opts.stage, i.stage));
    setMaterial(ok(opts.material, i.material));
  });

  const filtered = useMemo(() => {
    const needle = normalize(q.trim());
    return rows.filter(
      (r) =>
        (actor === ALL || r.actor === actor) &&
        (instrument === ALL || r.instrument === instrument) &&
        (role === ALL || r.valueRole === role) &&
        (source === ALL || r.capitalSource === source) &&
        (status === ALL || r.status === status) &&
        (stage === ALL || r.stages.includes(stage as never)) &&
        (material === ALL || r.materialIds.includes(material)) &&
        (!needle ||
          normalize(
            [r.recipient, r.provider, r.project, r.eventTitle, r.id, r.amount?.amountAsStated].filter(Boolean).join(" "),
          ).includes(needle)),
    );
  }, [rows, q, actor, instrument, role, source, status, stage, material]);

  // Family layout: nest each visible row under its first visible parent.
  const ordered = useMemo(() => {
    if (!families) return filtered.map((c) => ({ c, depth: 0, rel: undefined as string | undefined }));
    const visible = new Map(filtered.map((c) => [c.id, c]));
    const parentOf = (c: CommitmentSummary) => c.parents.find((p) => visible.has(p.id));
    const children = new Map<string, CommitmentSummary[]>();
    const roots: CommitmentSummary[] = [];
    for (const c of filtered) {
      const p = parentOf(c);
      if (p) children.set(p.id, [...(children.get(p.id) ?? []), c]);
      else roots.push(c);
    }
    const out: { c: CommitmentSummary; depth: number; rel?: string }[] = [];
    const walk = (c: CommitmentSummary, depth: number, seen: Set<string>) => {
      if (seen.has(c.id)) return;
      seen.add(c.id);
      const p = parentOf(c);
      const rel = depth > 0 && p ? `${financialRelationshipTypeLabels[p.relationship].toLowerCase()} ${visible.get(p.id)?.recipient ?? visible.get(p.id)?.provider ?? p.id}` : undefined;
      out.push({ c, depth, rel });
      for (const k of children.get(c.id) ?? []) walk(k, depth + 1, seen);
    };
    const seen = new Set<string>();
    roots.forEach((r) => walk(r, 0, seen));
    return out;
  }, [filtered, families]);

  const active = [q, actor, instrument, role, source, status, stage, material].some((v) => v && v !== ALL);
  const reset = () => {
    setQ("");
    [setActor, setInstrument, setRole, setSource, setStatus, setStage, setMaterial].forEach((f) => f(ALL));
  };

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <SearchBox id="cap-q" value={q} onChange={setQ} placeholder="Recipient, provider, project…" />
        </div>
        <FilterSelect id="cap-actor" label="Actor" value={actor} onChange={setActor} options={opts.actor} />
        <FilterSelect id="cap-role" label="Value role" value={role} onChange={setRole} options={opts.role} />
        <FilterSelect id="cap-instrument" label="Instrument" value={instrument} onChange={setInstrument} options={opts.instrument} />
        <FilterSelect id="cap-source" label="Capital source" value={source} onChange={setSource} options={opts.source} />
        <FilterSelect id="cap-status" label="Financial status" value={status} onChange={setStatus} options={opts.status} />
        <FilterSelect id="cap-stage" label="Supply-chain stage" value={stage} onChange={setStage} options={opts.stage} />
        <FilterSelect id="cap-material" label="Material" value={material} onChange={setMaterial} options={opts.material} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-muted" aria-live="polite">
          <span className="tnum text-foreground">{filtered.length}</span> of {rows.length} financial rows
          {active ? (
            <button type="button" onClick={reset} className="ml-3 text-accent hover:text-accent-strong">
              Clear filters
            </button>
          ) : null}
        </p>
        <label className="inline-flex cursor-pointer items-center gap-2 font-mono text-xs text-muted">
          <input type="checkbox" checked={families} onChange={(e) => setFamilies(e.target.checked)} className="accent-[#4fb59e]" />
          Nest parts under their packages
        </label>
      </div>
      <Card className="mt-3 overflow-hidden">
        {ordered.length ? (
          ordered.map(({ c, depth, rel }) => <CommitmentRow key={c.id} c={c} indent={depth} relationLabel={rel} />)
        ) : (
          <p className="px-4 py-8 text-center text-sm text-muted">No financial row matches these filters.</p>
        )}
      </Card>
    </div>
  );
}
