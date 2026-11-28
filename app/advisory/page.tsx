import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageContents, PageHeading, Section } from "@/components/ui/container";
import { InquiryLink } from "@/components/inquiry-link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Advisory",
  description:
    "Founder-led, individually scoped analysis of strategic-materials policy, public capital and industrial execution, built from primary sources.",
  alternates: { canonical: "/advisory" },
};

/** The five areas of work, each with the question a deliverable in it would answer. */
const areas = [
  ["Policy and regulatory intelligence", "What the official text of a measure states, who issued it, its dates and its recorded status."],
  ["Public capital and industrial policy", "Which instruments are open, committed or drawn, and on what conditions."],
  ["Market and competitive intelligence", "Who is building what at a given supply-chain stage, and with whose backing."],
  ["Supply-chain and industrial strategy research", "Where a material's chain depends on one stage, jurisdiction or permit."],
  ["Bespoke analysis", "A defined question that crosses these areas, answered from the primary record."],
] as const;

/** Examples of scope. None describes work done for anyone. */
const questions = [
  "Which recorded control clauses name a given material and destination, and what status does each carry on a given date?",
  "Which public financing instruments are open to a processing project in a given jurisdiction, and at what stage is each?",
  "How does government support for one supply-chain stage differ between two jurisdictions, by instrument and status?",
  "Which announced projects at a given stage have recorded financing, permits or construction milestones, and which rest on operator statements alone?",
  "Which recorded licensing requirements bear on a procurement or offtake decision, what does the official text of each say, and which points would counsel need to confirm?",
  "Where does the public record stop for a given material, and what would further primary-source work need to establish?",
] as const;

const formats = [
  ["Decision memorandum", "The question, the evidence, the options and what each depends on."],
  ["Regulatory assessment", "The operative text, its stated scope and status, and the points left for counsel."],
  ["Competitive landscape", "Projects and operators at one stage, with status attributed to its source."],
  ["Financing map", "Instruments, providers and status for one project, programme or material."],
  ["Evidence pack", "The primary documents behind a set of claims, with pinpoint references."],
  ["Scenario model", "A spreadsheet with assumptions listed and kept apart from sourced inputs."],
  ["Executive briefing", "A short deck or call covering the findings and their limits."],
] as const;

/** Published studies, as public examples of the method. */
const studies = [
  ["/research/china-export-control-suspension-extension", "China Extends the Suspension of Six Export-Control Announcements Through January 10, 2027"],
  ["/research/escondida-copper", "Goldman Sachs’ Copper Outlook and BHP’s $6 Billion Escondida Decision"],
  ["/research/hemerdon-financing", "Inside Tungsten West’s £71 Million Restart Financing"],
  ["/research/antimony-supply-resilience", "U.S. Antimony Supply Resilience, 2027–2031"],
  ["/research/tungsten-supply-security", "Tungsten Supply Security"],
] as const;

const steps = [
  "Send a short brief by email: the kind of decision, the materials and jurisdictions involved, and the timing. Leave out anything confidential at this stage.",
  "Stratellar replies with a proposed scope (the question, the sources, the deliverable and the timetable) or says the brief falls outside what it takes on.",
  "Terms are agreed in writing before any work starts.",
  "Any analysis comes with a source appendix, with assumptions and scenarios labelled apart from evidence.",
] as const;

const rowList = "m-0 list-none divide-y divide-border border-y border-border-strong p-0";

export default function AdvisoryPage() {
  return (
    <Container className="py-12 sm:py-20">
      <PageHeading
        title="Advisory"
        lead="Analysis for one decision, built from primary sources. Advisory work is founder-led, individually scoped and taken on selectively."
      />
      <PageContents
        className="mt-8"
        items={[
          { href: "#areas", label: "Areas of work" },
          { href: "#questions", label: "Illustrative questions" },
          { href: "#formats", label: "Formats" },
          { href: "#studies", label: "Published research" },
          { href: "#scoping", label: "How work is scoped" },
          { href: "#boundaries", label: "Boundaries" },
        ]}
      />

      <Section id="areas" title="Areas of work" className="mt-12">
        <ul role="list" className={rowList}>
          {areas.map(([name, note]) => (
            <li key={name} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-8">
              <span className="font-editorial text-xl leading-7 text-foreground">{name}</span>
              <span className="font-display text-sm leading-6 text-muted">{note}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="questions"
        title="Illustrative questions"
        className="mt-16"
        description="Examples of scope. None describes a completed engagement."
      >
        <ul role="list" className="m-0 grid list-none gap-x-12 p-0 md:grid-cols-2">
          {questions.map((q, i) => (
            <li key={q} className="flex gap-4 border-b border-border py-4">
              <span aria-hidden className="tnum font-display text-sm text-accent">{i + 1}</span>
              <span className="text-[1.0625rem] leading-7 text-foreground">{q}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="formats"
        title="Representative formats"
        className="mt-16"
        description="Representative formats a deliverable can take. None describes a completed engagement."
      >
        <ul role="list" className={rowList}>
          {formats.map(([name, note]) => (
            <li key={name} className="grid gap-1 py-3.5 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-8">
              <span className="font-display text-[0.9375rem] font-medium text-foreground">{name}</span>
              <span className="font-display text-sm leading-6 text-muted">{note}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="studies"
        title="Published research"
        className="mt-16"
        description="Stratellar's own studies, written from public sources and free to read. They are independent research and show the method and the standard of sourcing."
      >
        <ul role="list" className={rowList}>
          {studies.map(([href, title]) => (
            <li key={href}>
              <Link href={href} className="block py-3 font-display text-[0.9375rem] leading-7 text-foreground hover:text-accent">
                {title}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="scoping" title="How work is scoped" className="mt-16">
        <p className="mb-6 max-w-[40rem] font-display text-[0.9375rem] leading-7 text-muted">
          The work is done by the founder,{" "}
          <Link href="/about" className="link-quiet text-foreground">{site.founder}</Link>, who also maintains the
          records and writes the published research.
        </p>
        <ol role="list" className="m-0 grid list-none gap-x-8 gap-y-6 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step} className="border-t border-border-strong pt-3">
              <span className="tnum font-display text-sm font-semibold text-accent">
                <span className="sr-only">Step </span>
                {i + 1}
              </span>
              <p className="mt-1 font-display text-sm leading-6 text-foreground">{step}</p>
            </li>
          ))}
        </ol>
        <InquiryLink kind="advisory" label="Send a brief" primary className="mt-8" />
      </Section>

      <Section id="boundaries" title="Boundaries" className="mt-16">
        <div className="max-w-[40rem] space-y-5 text-[1.0625rem] leading-8">
          <p>
            Advisory work is research and analysis. {site.boundary}
          </p>
          <p className="text-muted">
            No outcome is guaranteed. Coverage of jurisdictions and materials is selective. Legal, compliance and
            investment decisions need the official sources and qualified advisers. The{" "}
            <Link href="/methodology" className="link-quiet text-foreground">methodology</Link> states how evidence,
            issuer reports and assumptions are kept apart.
          </p>
        </div>
      </Section>
    </Container>
  );
}
