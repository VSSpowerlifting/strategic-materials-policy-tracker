import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { SourceCard } from "@/components/source-ref";
import { confidenceLabels } from "@/lib/labels";
import { SOURCE_CONFIDENCE } from "@/lib/types";
import { getAllSources } from "@/lib/data";

export const metadata: Metadata = {
  title: "Sources",
  description:
    "The source register, ordered by the project's confidence hierarchy: primary official documents, official translations, government/state media, then secondary analysis.",
};

const HIERARCHY_NOTE: Record<string, string> = {
  primary: "Government documents and official announcements in the original language.",
  official_translation:
    "English translations of primary documents (official, or faithful institutional translations such as CSET's).",
  government_media:
    "State or government-affiliated outlets, used for official framing — treated as the actor's own voice, not neutral reporting.",
  secondary: "Analysis, legal commentary and reporting used to corroborate facts.",
};

export default function SourcesPage() {
  const sources = getAllSources();

  return (
    <Container className="py-12">
      <PageHeading
        eyebrow="Provenance"
        title="Source register"
        lead="Every record on this site resolves to one of these sources. They are ordered by the confidence hierarchy the project applies: primary official text first, then official translation, then government/state media, then secondary analysis."
      />

      <div className="mt-10 space-y-12">
        {SOURCE_CONFIDENCE.map((level) => {
          const group = sources.filter((s) => s.confidence === level);
          if (group.length === 0) return null;
          return (
            <Section
              key={level}
              title={`${confidenceLabels[level]} (${group.length})`}
              description={HIERARCHY_NOTE[level]}
            >
              <div className="grid gap-3">
                {group.map((s) => (
                  <SourceCard key={s.id} source={s} />
                ))}
              </div>
            </Section>
          );
        })}
      </div>

      <p className="mt-12 max-w-prose text-sm leading-6 text-faint">
        How these tiers are defined and applied is set out on the{" "}
        <Link href="/methodology#sources" className="text-accent hover:underline">
          methodology page
        </Link>
        .
      </p>
    </Container>
  );
}
