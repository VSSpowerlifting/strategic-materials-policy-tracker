import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading } from "@/components/ui/container";
import { formatDateLong } from "@/lib/format";
import { InquiryLink } from "@/components/inquiry-link";
import { site } from "@/lib/site";
import { jsonLdScript, organizationJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "About",
  description:
    "Stratellar LLC is an independent strategic-materials intelligence and advisory firm, founded and led by Benjamin Yang.",
  alternates: { canonical: "/about" },
};

/** The three capabilities, in the order the header lists them. */
const capabilities = [
  { href: "/intelligence", label: "Intelligence", note: "Source-linked records of policy actions, public financing and industrial projects. Controls is the first dataset available under a commercial licence." },
  { href: "/research", label: "Research", note: "Original studies, free to read, each with its sources and method." },
  { href: "/advisory", label: "Advisory", note: "Founder-led analysis for one decision, scoped individually and taken on selectively." },
] as const;

/** Where the evidence behind the research is kept. Each entry is an existing page at its existing URL. */
const evidence = [
  { href: "/methodology", label: "Methodology", note: "Definitions, counting rules and what each status means." },
  { href: "/sources", label: "Sources", note: "The register of official documents, filings and disclosures." },
  { href: "/coverage", label: "Coverage", note: "What Stratellar covers, and what it leaves out." },
  { href: "/data", label: "Data and API", note: "Downloads in JSON and CSV, with the public endpoints." },
] as const;

export default function AboutPage() {
  return (
    <Container className="py-12 sm:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd()) }} />
      <PageHeading
        title="About Stratellar"
        lead={`${site.legalName} is an independent strategic-materials intelligence and advisory firm, founded and led by ${site.founder}.`}
      />

      <div className="mx-auto mt-12 max-w-[38rem] space-y-6 text-[1.0625rem] leading-8">
        <p>
          Stratellar follows strategic materials from policy to capital to industrial execution, and to what
          those facts mean for a commercial decision. It connects government measures, financial commitments
          and industrial projects, and its records carry legal status, financing terms and the primary sources
          behind each entry.
        </p>
        <p>
          Benjamin Yang founded Stratellar and leads it while studying international affairs at George
          Washington University. The founder maintains the records, writes the research and carries out the advisory work.
        </p>
        <p>
          The public record and the published studies are not sponsored. Their sources, method and coverage
          limits are published with them. {site.boundary}
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

      <section aria-labelledby="capabilities-heading" className="mt-16">
        <h2 id="capabilities-heading" className="border-b border-border-strong pb-3 font-display text-base font-semibold">
          Capabilities
        </h2>
        <ul className="m-0 grid list-none gap-x-10 p-0 md:grid-cols-3">
          {capabilities.map((c) => (
            <li key={c.href} className="border-b border-border">
              <Link href={c.href} className="group block py-5">
                <span className="display-3 block text-foreground group-hover:text-accent">{c.label}</span>
                <span className="mt-1 block font-display text-sm leading-6 text-muted">{c.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="evidence-heading" className="mt-14">
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
          Last revised <time dateTime={site.revisedOn}>{formatDateLong(site.revisedOn)}</time>.
        </p>
      </section>

      <section aria-labelledby="contact-heading" className="mt-14 border-t border-border-strong pt-8">
        <h2 id="contact-heading" className="font-display text-base font-semibold">Contact</h2>
        <p className="mt-3 max-w-xl font-display text-[0.9375rem] leading-7 text-muted">
          Licence terms, advisory briefs, research questions and corrections go to the founder by email. The{" "}
          <Link href="/contact" className="link-quiet text-foreground">contact page</Link> lists each route.
        </p>
        <InquiryLink kind="research" label="Email Stratellar" className="mt-5" />
      </section>

      <nav aria-label="More about Stratellar" className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-border pt-6 font-display text-sm text-muted">
        <Link href="/research" className="link-quiet">Research</Link>
        <Link href="/markets" className="link-quiet">Market Monitor</Link>
        <a href={site.repository} className="link-quiet">GitHub</a>
      </nav>
    </Container>
  );
}
