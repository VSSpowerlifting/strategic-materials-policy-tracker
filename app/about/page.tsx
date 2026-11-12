import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading } from "@/components/ui/container";
import { formatDateLong } from "@/lib/format";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About SMPT",
  description: "About the Strategic Materials Policy Tracker and its researcher, Benjamin Yang.",
};

/** Where the evidence behind the research is kept. Each entry is an existing page at its existing URL. */
const evidence = [
  { href: "/methodology", label: "Methodology", note: "Definitions, counting rules and what each status means." },
  { href: "/sources", label: "Sources", note: "The register of official documents, filings and disclosures." },
  { href: "/coverage", label: "Coverage", note: "What the record includes, and what it leaves out." },
  { href: "/data", label: "Data and API", note: "Downloads in JSON and CSV, with the public endpoints." },
] as const;

export default function AboutPage() {
  return (
    <Container className="py-12 sm:py-20">
      <PageHeading
        title="About SMPT"
        lead="Independent research by Benjamin Yang on strategic-materials policy, financing and industrial development."
      />

      <div className="mx-auto mt-12 max-w-[38rem] space-y-6 text-[1.0625rem] leading-8">
        <p>
          The Strategic Materials Policy Tracker connects government measures, financial
          commitments and industrial projects. Its database records legal status,
          financing terms and the primary sources behind each entry.
        </p>
        <p>
          Benjamin Yang created and maintains SMPT while studying international affairs
          at George Washington University. The research examines how public policy and
          capital shape investment decisions and industrial execution across strategic
          supply chains.
        </p>
        <p className="text-muted">
          Coverage is selective. Government and company disclosures are attributed to
          their publishers; reported progress is distinguished from independently
          verified outcomes. Full definitions and limitations appear in the{" "}
          <Link href="/methodology" className="link-quiet text-foreground">methodology</Link>
          {" "}and{" "}
          <Link href="/coverage" className="link-quiet text-foreground">coverage report</Link>.
        </p>
      </div>

      <section aria-labelledby="evidence-heading" className="mt-16">
        <h2 id="evidence-heading" className="border-b border-border-strong pb-3 font-display text-base font-semibold">
          Evidence
        </h2>
        <ul className="m-0 grid list-none gap-x-10 p-0 sm:grid-cols-2">
          {evidence.map((e) => (
            <li key={e.href} className="border-b border-border">
              <Link href={e.href} className="group block py-5">
                <span className="display-3 block text-foreground group-hover:text-accent">{e.label}</span>
                <span className="mt-1 block font-display text-sm leading-6 text-muted">{e.note}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-display text-sm text-faint">
          Record revised <time dateTime={site.revisedOn}>{formatDateLong(site.revisedOn)}</time>.
        </p>
      </section>

      <section aria-labelledby="contact-heading" className="mt-14 grid gap-8 border-t border-border-strong pt-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <h2 id="contact-heading" className="font-display text-base font-semibold">Research inquiries</h2>
          <p className="mt-3 max-w-xl font-display text-[0.9375rem] leading-7 text-muted">
            For research collaboration or a commissioned analysis of critical-minerals policy or finance,
            write to Benjamin Yang.
          </p>
        </div>
        <a href="mailto:ben.yang@gwmail.gwu.edu?subject=SMPT%20research%20inquiry" className="research-button-secondary">
          ben.yang@gwmail.gwu.edu
        </a>
      </section>

      <nav aria-label="More about SMPT" className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-border pt-6 font-display text-sm text-muted">
        <Link href="/research" className="link-quiet">Research</Link>
        <Link href="/markets" className="link-quiet">Market Monitor</Link>
        <a href="https://github.com/VSSpowerlifting/strategic-materials-policy-tracker" className="link-quiet">GitHub</a>
      </nav>
    </Container>
  );
}
