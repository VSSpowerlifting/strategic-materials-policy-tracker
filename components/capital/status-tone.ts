/**
 * Status tones for Capital & Control. Pure presentation with no data imports, so the server sheets and the
 * client explorers share one mapping.
 */
import type { BadgeTone } from "@/components/ui/badge";
import type { ControlStatus, FinancialStatus, ImplementationStatus } from "@/lib/types";

/**
 * Accent only where a binding agreement exists or money has moved; hematite where the commitment has ended;
 * ochre for a selection that is not yet an award. Every other stage is a quiet label.
 */
export const FINANCIAL_STATUS_TONE: Record<FinancialStatus, BadgeTone> = {
  announced: "neutral",
  selected_for_negotiations: "ochre",
  authorized: "neutral",
  allocated: "neutral",
  decided: "neutral",
  contracted: "accent",
  partially_disbursed: "accent",
  disbursed: "accent",
  withdrawn: "negative",
  lapsed: "negative",
  not_stated: "neutral",
};

export const IMPLEMENTATION_STATUS_TONE: Partial<Record<ImplementationStatus, BadgeTone>> = {
  suspended: "ochre",
  cancelled: "negative",
};

/** Label ink for a control status: accent in force, hematite once ended, otherwise quiet. */
export function controlStatusTextClass(status: ControlStatus): string {
  if (status === "in_force") return "text-accent";
  if (status === "expired" || status === "revoked") return "text-negative";
  return "text-muted";
}
