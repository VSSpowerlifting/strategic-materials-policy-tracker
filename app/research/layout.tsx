import type { ReactNode } from "react";
import { ReadingProgress } from "@/components/ui/reading-progress";

/** A lightweight reading indicator only on individual research pieces. */
export default function ResearchLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ReadingProgress />
      {children}
    </>
  );
}
