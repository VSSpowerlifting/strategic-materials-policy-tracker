import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading } from "@/components/ui/container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "A source-linked English database of how the major powers contest rare earths and strategic materials through policy.",
};

export default function AboutPage() {
  return (
    <Container className="py-12">
      <PageHeading index="01" eyebrow="About" title={site.name} />

      <div className="mt-8 max-w-prose space-y-4 text-lg leading-8 text-foreground/90">
        <p>
          The {site.name} is a source-linked English database of how the major
          powers contest rare earths and adjacent strategic materials through
          policy: export controls, licensing, critical-mineral designations,
          funding, stockpiling and supply-chain-security law — and the official
          framing each government uses to justify its stance.
        </p>
        <p>
          It is built for journalists, congressional and parliamentary staff, and
          think-tank analysts who need the Chinese, US and EU instruments —
          translated, structured and citable — without a global market model
          wrapped around them.
        </p>
        <p>
          It follows the whole contest rather than any single side — the incumbent
          producer-processor and the states working to diversify away from it. Every
          measure is cited to its source, in the original language with a translation
          where applicable, so each record can be checked against the primary text.
        </p>
        <p>
          Every record resolves to a source. Every framing label is anchored to a
          quoted passage in the original language. Nothing is scored on an invented
          0–100 scale. How all of that is decided is set out in the{" "}
          <Link href="/methodology" className="font-display text-accent hover:text-accent-strong">
            methodology
          </Link>
          .
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/events"
          className="inline-flex items-center rounded-md bg-accent px-4 py-2 font-display text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong"
        >
          Browse the events →
        </Link>
        <Link
          href="/data"
          className="inline-flex items-center rounded-md border border-border px-4 py-2 font-display text-sm font-medium transition-colors hover:border-accent/40 hover:bg-elevated"
        >
          Export the data
        </Link>
      </div>
    </Container>
  );
}
