// Renderers for families K. One file per implementation batch keeps edits disjoint.
import type { Renderer } from "../types";
import { criterionMatrix } from "./criterion-matrix";
import { exhibitWithInterpretation } from "./exhibit-with-interpretation";
import { locationTable } from "./location-table";
import { optionProfile } from "./option-profile";
import { roleMatrix } from "./role-matrix";

export const FAMILY_K: Renderer<never>[] = [
  criterionMatrix as Renderer<never>,
  roleMatrix as Renderer<never>,
  optionProfile as Renderer<never>,
  exhibitWithInterpretation as Renderer<never>,
  locationTable as Renderer<never>,
];
