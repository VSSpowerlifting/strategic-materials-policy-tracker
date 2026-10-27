import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Strategic Materials Policy Tracker",
  description:
    "The comparative economic-security research purpose, evidence standards and limitations of Strategic Materials Policy Tracker.",
};

export default function AboutPage() {
  return (
    <Container className="py-12">
      <PageHeading
        eyebrow="About"
        title="Research by Benjamin Yang"
        lead="An independent, comparative economic-security research project connecting industrial policy, trade and legal controls, public finance and reported industrial activity across strategic-material supply chains."
      />
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="max-w-prose space-y-10 text-lg leading-8 text-foreground/90">
          <Section title="The question behind the tracker">
            <p>
              How do governments use industrial policy, trade and legal
              controls, public finance and investment to reshape
              strategic-material supply chains, and what does the available
              evidence establish about implementation?
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
              Built and maintained by Benjamin Yang, {site.name} combines
              international affairs research, economic-security analysis and
              close examination of primary-source evidence. Its approach is
              comparative rather than country-centered, examining how
              governments deploy policy instruments, public financing and
              industrial interventions across major economies and
              strategic-material supply chains.
            </p>
            <p className="mt-4">
              The project is intended for journalists, policymakers, analysts
              and researchers who need structured, citable records, transparent
              evidence and a clearer understanding of the relationship between
              government action and reported industrial outcomes.
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
