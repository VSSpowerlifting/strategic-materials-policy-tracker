// Renderers for families J. One file per implementation batch keeps edits disjoint.
import type { Renderer } from "../types";
import { conditionTree } from "./condition-tree";
import { conversionFlow } from "./conversion-flow";
import { dependencyNetwork } from "./dependency-network";
import { stateDiagram } from "./state-diagram";
import { valueChainMeasured } from "./value-chain-measured";

export const FAMILY_J: Renderer<never>[] = [
  stateDiagram as Renderer<never>,
  conditionTree as Renderer<never>,
  valueChainMeasured as Renderer<never>,
  conversionFlow as Renderer<never>,
  dependencyNetwork as Renderer<never>,
];
