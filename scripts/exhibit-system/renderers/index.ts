// Renderer registry: pattern id -> renderer. Pure (no pptxgenjs import).
import type { Renderer } from "../types";
import { dumbbell } from "./dumbbell";
import { rankedBar } from "./ranked-bar";
import { sourcesAndUses } from "./sources-and-uses";
import { waterfall } from "./waterfall";

const list: Renderer<never>[] = [
  rankedBar as Renderer<never>,
  waterfall as Renderer<never>,
  dumbbell as Renderer<never>,
  sourcesAndUses as Renderer<never>,
];

export const RENDERERS: ReadonlyMap<string, Renderer<unknown>> = new Map(
  list.map((r) => [r.id, r as unknown as Renderer<unknown>]),
);
