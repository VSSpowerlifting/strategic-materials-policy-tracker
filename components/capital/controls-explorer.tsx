"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { ControlRow } from "@/components/capital/rows";
import {
  ALL,
  FilterSelect,
  SearchBox,
  countOptions,
  normalize,
  useUrlFilters,
} from "@/components/capital/filter-controls";
import {
  controlDirectionLabels,
  controlMeasureTypeLabels,
  controlStatusLabels,
  jurisdictionLabels,
  targetScopeLabels,
} from "@/lib/labels";
import {
  CONTROL_DIRECTIONS,
  CONTROL_MEASURE_TYPES,
  CONTROL_STATUSES,
  JURISDICTIONS,
  TARGET_SCOPES,
} from "@/lib/types";
import type { ControlSummary } from "@/lib/capital-control";

export function ControlsExplorer({
  rows,
  materialNames,
}: {
  rows: ControlSummary[];
  materialNames: Record<string, string>;
}) {
  const [q, setQ] = useState("");
  const [issuer, setIssuer] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [direction, setDirection] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [scope, setScope] = useState(ALL);
  const [material, setMaterial] = useState(ALL);
  const [target, setTarget] = useState(ALL);

  const opts = useMemo(() => {
    const targets = [...new Set(rows.flatMap((r) => r.targetJurisdictions))].sort();
    return {
      issuer: countOptions(rows.map((r) => r.issuer), jurisdictionLabels, JURISDICTIONS),
      type: countOptions(rows.map((r) => r.measureType), controlMeasureTypeLabels, CONTROL_MEASURE_TYPES),
      direction: countOptions(rows.map((r) => r.direction), controlDirectionLabels, CONTROL_DIRECTIONS),
      status: countOptions(rows.map((r) => r.status), controlStatusLabels, CONTROL_STATUSES),
      scope: countOptions(rows.flatMap((r) => r.targetScopes), targetScopeLabels, TARGET_SCOPES),
      target: targets.map((t) => ({ value: t, label: t, count: rows.filter((r) => r.targetJurisdictions.includes(t)).length })),
      material: Object.entries(materialNames)
        .filter(([id]) => rows.some((r) => r.materialIds.includes(id)))
        .map(([value, label]) => ({ value, label, count: rows.filter((r) => r.materialIds.includes(value)).length })),
    };
  }, [rows, materialNames]);

  useUrlFilters({ q, issuer, type, direction, status, scope, target, material }, (i) => {
    const ok = (list: { value: string }[], v?: string) => (v && list.some((o) => o.value === v) ? v : ALL);
    setQ(i.q ?? "");
    setIssuer(ok(opts.issuer, i.issuer));
    setType(ok(opts.type, i.type));
    setDirection(ok(opts.direction, i.direction));
    setStatus(ok(opts.status, i.status));
    setScope(ok(opts.scope, i.scope));
    setTarget(ok(opts.target, i.target));
    setMaterial(ok(opts.material, i.material));
  });

  const filtered = useMemo(() => {
    const needle = normalize(q.trim());
    return rows.filter(
      (r) =>
        (issuer === ALL || r.issuer === issuer) &&
        (type === ALL || r.measureType === type) &&
        (direction === ALL || r.direction === direction) &&
        (status === ALL || r.status === status) &&
        (scope === ALL || r.targetScopes.includes(scope as never)) &&
        (target === ALL || r.targetJurisdictions.includes(target)) &&
        (material === ALL || r.materialIds.includes(material)) &&
        (!needle ||
          normalize(
            [r.eventTitle, r.documentNumber, r.clause, r.id, ...r.targetEntities, ...r.untrackedMaterials].filter(Boolean).join(" "),
          ).includes(needle)),
    );
  }, [rows, q, issuer, type, direction, status, scope, target, material]);

  const active = [q, issuer, type, direction, status, scope, target, material].some((v) => v && v !== ALL);
  const reset = () => {
    setQ("");
    [setIssuer, setType, setDirection, setStatus, setScope, setTarget, setMaterial].forEach((f) => f(ALL));
  };

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <SearchBox id="ctl-q" value={q} onChange={setQ} placeholder="Document, clause, entity…" />
        </div>
        <FilterSelect id="ctl-issuer" label="Issuer" value={issuer} onChange={setIssuer} options={opts.issuer} />
        <FilterSelect id="ctl-status" label="Current status" value={status} onChange={setStatus} options={opts.status} />
        <FilterSelect id="ctl-type" label="Measure type" value={type} onChange={setType} options={opts.type} />
        <FilterSelect id="ctl-direction" label="Direction" value={direction} onChange={setDirection} options={opts.direction} />
        <FilterSelect id="ctl-scope" label="Targeting" value={scope} onChange={setScope} options={opts.scope} />
        <FilterSelect id="ctl-target" label="Named target" value={target} onChange={setTarget} options={opts.target} />
        <FilterSelect id="ctl-material" label="Material" value={material} onChange={setMaterial} options={opts.material} />
      </div>
      <p className="mt-4 font-mono text-xs text-muted" aria-live="polite">
        <span className="tnum text-foreground">{filtered.length}</span> of {rows.length} control clauses
        {active ? (
          <button type="button" onClick={reset} className="ml-3 text-accent hover:text-accent-strong">
            Clear filters
          </button>
        ) : null}
      </p>
      <Card className="mt-3 overflow-hidden">
        {filtered.length ? (
          filtered.map((m) => <ControlRow key={m.id} m={m} />)
        ) : (
          <p className="px-4 py-8 text-center text-sm text-muted">No control clause matches these filters.</p>
        )}
      </Card>
    </div>
  );
}
