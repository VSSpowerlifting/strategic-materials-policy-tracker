// Renderers for families A,B,C. One file per implementation batch keeps edits disjoint.
import type { Renderer } from "../types";
import { annotatedLine } from "./annotated-line";
import { groupedBar } from "./grouped-bar";
import { indexedLines } from "./indexed-lines";
import { rangeInterval } from "./range-interval";
import { rankedDot } from "./ranked-dot";
import { slope } from "./slope";
import { smallMultiples } from "./small-multiples";

export const FAMILY_ABC: Renderer<never>[] = [
  rankedDot as Renderer<never>,
  groupedBar as Renderer<never>,
  rangeInterval as Renderer<never>,
  slope as Renderer<never>,
  annotatedLine as Renderer<never>,
  smallMultiples as Renderer<never>,
  indexedLines as Renderer<never>,
];
