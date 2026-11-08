import { counterpartyMap } from "./counterparty-map";
import type { Renderer } from "../types";
import { dumbbell } from "./dumbbell";
import { FAMILY_ABC } from "./family-abc";
import { FAMILY_DEF } from "./family-def";
import { FAMILY_GH } from "./family-gh";
import { FAMILY_I } from "./family-i";
import { FAMILY_J } from "./family-j";
import { FAMILY_K } from "./family-k";
import { rankedBar } from "./ranked-bar";
import { sourcesAndUses } from "./sources-and-uses";
import { waterfall } from "./waterfall";

const list: Renderer<never>[] = [
  counterpartyMap as Renderer<never>,
  rankedBar as Renderer<never>,
  waterfall as Renderer<never>,
  dumbbell as Renderer<never>,
  sourcesAndUses as Renderer<never>,
  ...FAMILY_ABC,
  ...FAMILY_DEF,
  ...FAMILY_GH,
  ...FAMILY_I,
  ...FAMILY_J,
  ...FAMILY_K,
];

const map = new Map<string, Renderer<unknown>>();
for (const r of list) {
  if (map.has(r.id)) throw new Error(`duplicate renderer id ${r.id}`);
  map.set(r.id, r as unknown as Renderer<unknown>);
}
export const RENDERERS: ReadonlyMap<string, Renderer<unknown>> = map;
