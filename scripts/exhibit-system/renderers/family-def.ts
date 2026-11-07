// Renderers for families D,E,F. One file per implementation batch keeps edits disjoint.
import type { Renderer } from "../types";
import { parallelBasisPanels } from "./parallel-basis-panels";
import { percentStacked } from "./percent-stacked";
import { sensitivityGrid } from "./sensitivity-grid";
import { stackedBar } from "./stacked-bar";
import { statusSeparatedCapital } from "./status-separated-capital";
import { tornado } from "./tornado";

export const FAMILY_DEF: Renderer<never>[] = [
  stackedBar as Renderer<never>,
  percentStacked as Renderer<never>,
  parallelBasisPanels as Renderer<never>,
  tornado as Renderer<never>,
  sensitivityGrid as Renderer<never>,
  statusSeparatedCapital as Renderer<never>,
];
