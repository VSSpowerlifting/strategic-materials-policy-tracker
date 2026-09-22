import { test } from "node:test";
import assert from "node:assert/strict";

import {
  JURISDICTIONS,
  POLICY_STATUSES,
  MECHANISMS,
  SECTORS,
  FRAMING_CATEGORIES,
  SOURCE_TYPES,
  SOURCE_CONFIDENCE,
  EN_SOURCES,
  JURISDICTION_ROLES,
  WATCH_CADENCES,
  WATCH_STATUSES,
} from "@/lib/types";
import {
  jurisdictionLabels,
  jurisdictionShort,
  policyStatusLabels,
  mechanismLabels,
  sectorLabels,
  framingCategoryLabels,
  framingCategoryShort,
  FRAMING_HUES,
  sourceTypeLabels,
  confidenceLabels,
  enSourceLabels,
  roleLabels,
  cadenceLabels,
  watchStatusLabels,
} from "@/lib/labels";

// A display label must exist for every taxonomy value, and no label may be
// stale. This test fails the moment the taxonomy grows without its labels.
function covers(name: string, values: readonly string[], rec: Record<string, unknown>) {
  test(`labels are exhaustive and not stale: ${name}`, () => {
    for (const v of values) assert.ok(v in rec, `missing label for ${name}: "${v}"`);
    for (const k of Object.keys(rec)) assert.ok(values.includes(k), `stale label for ${name}: "${k}"`);
  });
}

covers("jurisdiction", JURISDICTIONS, jurisdictionLabels);
covers("jurisdiction-short", JURISDICTIONS, jurisdictionShort);
covers("policyStatus", POLICY_STATUSES, policyStatusLabels);
covers("mechanism", MECHANISMS, mechanismLabels);
covers("sector", SECTORS, sectorLabels);
covers("framingCategory", FRAMING_CATEGORIES, framingCategoryLabels);
covers("framingCategory-short", FRAMING_CATEGORIES, framingCategoryShort);
covers("framingCategory-hues", FRAMING_CATEGORIES, FRAMING_HUES);
covers("sourceType", SOURCE_TYPES, sourceTypeLabels);
covers("sourceConfidence", SOURCE_CONFIDENCE, confidenceLabels);
covers("enSource", EN_SOURCES, enSourceLabels);
covers("jurisdictionRole", JURISDICTION_ROLES, roleLabels);
covers("watchCadence", WATCH_CADENCES, cadenceLabels);
covers("watchStatus", WATCH_STATUSES, watchStatusLabels);
