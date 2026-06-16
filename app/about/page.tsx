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
      <PageHeading eyebrow="About" title={site.name} />

      <div className="mt-8 max-w-prose space-y-4 leading-7 text-foreground/90">
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
          What makes it distinctive is depth on the Chinese side: the maintainer
          reads the Mandarin-language primaries directly, so Chinese measures are
          tracked more closely than English secondary reporting usually allows. The
          multi-actor frame keeps that depth honest by following the whole contest —
          the incumbent and everyone trying to diversify away from it.
        </p>
        <p>
          Every record resolves to a source. Every framing label is anchored to a
          quoted passage in the original language. Nothing is scored on an invented
          0–100 scale. How all of that is decided is set out in the{" "}
          <Link href="/methodology" className="text-accent hover:underline">
            methodology
          </Link>
          .
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/events"
          className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
        >
          Browse the events →
        </Link>
        <Link
          href="/data"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-elevated"
        >
          Export the data
        </Link>
      </div>
    </Container>
  );
}
