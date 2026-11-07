// Renderers for family I (time and sequence). One file per implementation batch keeps edits disjoint.
import type { Renderer } from "../types";
import { durationBars } from "./duration-bars";
import { evidenceMilestoneStrip } from "./evidence-milestone-strip";
import { stageLadder } from "./stage-ladder";
import { swimlane } from "./swimlane";
import { twoLaneTimeline } from "./two-lane-timeline";

export const FAMILY_I: Renderer<never>[] = [
  twoLaneTimeline as Renderer<never>,
  swimlane as Renderer<never>,
  evidenceMilestoneStrip as Renderer<never>,
  stageLadder as Renderer<never>,
  durationBars as Renderer<never>,
];
