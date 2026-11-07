// Renderers for families G,H. One file per implementation batch keeps edits disjoint.
import type { Renderer } from "../types";
import { boxInterval } from "./box-interval";
import { bubble } from "./bubble";
import { stripPlot } from "./strip-plot";
import { histogram } from "./histogram";
import { scatter } from "./scatter";
import { thresholdScatter } from "./threshold-scatter";

export const FAMILY_GH: Renderer<never>[] = [scatter as Renderer<never>, thresholdScatter as Renderer<never>, bubble as Renderer<never>, stripPlot as Renderer<never>, boxInterval as Renderer<never>, histogram as Renderer<never>];
