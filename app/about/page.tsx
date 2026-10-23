import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Benjamin Yang and SMPT",
  description:
    "The research purpose, approach and limitations of Benjamin Yang's Strategic Materials Policy Tracker.",
};

export default function AboutPage() {
  return (
    <Container className="py-12">
      <PageHeading
        eyebrow="About"
        title="Research by Benjamin Yang"
        lead="An independent research project connecting government policy, legal controls, financial instruments and industrial evidence across strategic-material supply chains."
      />
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="max-w-prose space-y-10 text-lg leading-8 text-foreground/90">
          <Section title="The question behind the tracker">
            <p>
              How do governments use policy, legal controls, finance and
              industrial intervention to reshape strategic-material supply
              chains, and what does the available evidence establish about
              implementation?
            </p>
            <p className="mt-4">
              {site.name} organizes the instruments and the evidence needed to
              investigate that question. It connects a measure to its official
              rationale, a financing record to its organizations and project,
              and reported industrial activity to the source that states it.
            </p>
          </Section>
          <Section title="The researcher">
            <p>
              Built and maintained by Benjamin Yang. The project&apos;s depth on
              Chinese measures comes from direct reading of Mandarin-language
              primary sources, paired with a multi-actor frame that tracks US,
              EU, Japanese, Australian, Canadian and Chinese policy instruments
              side by side.
            </p>
            <p className="mt-4">
              The work is intended for journalists, policy staff, analysts and
              researchers who need structured, citable records and a clear route
              back to the original text.
            </p>
          </Section>
          <Section title="How to judge the work">
            <p>
              Inspect the reasoning at the level of a record: the original text,
              translation provenance, field-level references, status
              distinctions and specific unknowns. Government statements, issuer
              claims and SMPT interpretation retain their separate roles.
            </p>
            <p className="mt-4">
              Coverage is selective and uneven. A source-reviewed observation is
              not independent on-site verification, and a shared material or
              date does not demonstrate causation. The{" "}
              <Link href="/methodology" className="text-accent underline">
                methodology
              </Link>{" "}
              and{" "}
              <Link href="/coverage" className="text-accent underline">
                coverage report
              </Link>{" "}
              explain these limits.
            </p>
          </Section>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-44 lg:self-start">
          <div className="opening-case">
            <h2 className="font-serif text-2xl">See the method at work</h2>
            <p className="mt-3 text-base leading-7 text-muted">
              Investigate the distinction between an announced financial
              instrument and reported physical activity.
            </p>
            <Link
              href="/projects/prj-au-alcoa-sojitz-gallium"
              className="research-text-link"
            >
              Alcoa–Sojitz Gallium Recovery Project
            </Link>
          </div>
          <div className="rounded border p-5">
            <h2 className="font-display text-base font-semibold">
              Check, cite and reuse
            </h2>
            <ul className="mt-3 space-y-3 font-display text-sm text-accent">
              <li>
                <Link href="/sources">Source register</Link>
              </li>
              <li>
                <Link href="/methodology#translation">Translation policy</Link>
              </li>
              <li>
                <Link href="/data">Data downloads and read-only API</Link>
              </li>
              <li>
                <a href="https://github.com/VSSpowerlifting/strategic-materials-policy-tracker">
                  Source code on GitHub
                </a>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </Container>
  );
}
