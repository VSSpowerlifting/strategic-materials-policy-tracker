import { redirect } from "next/navigation";
import { controlBriefCases, controlBriefHref } from "@/lib/control-brief-cases";

export default function ControlsChangesPage() {
  redirect(controlBriefHref(controlBriefCases[0]));
}
