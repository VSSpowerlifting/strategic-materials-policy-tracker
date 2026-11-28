import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading } from "@/components/ui/container";
import { InquiryLink } from "@/components/inquiry-link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Stratellar about licence terms, an advisory brief, research questions or corrections.",
  alternates: { canonical: "/contact" },
};

const pathways = [
  {
    kind: "licence",
    title: "Licence terms",
    note: "For an organisation that needs a written agreement for its use of the records. Say which dataset and how it would be used.",
    label: "Request licence terms",
    more: { href: "/intelligence#licensing", label: "Public and licensed use" },
  },
  {
    kind: "advisory",
    title: "Advisory brief",
    note: "Describe the decision, the materials and jurisdictions involved, and the timing.",
    label: "Send a brief",
    more: { href: "/advisory", label: "Scope and boundaries" },
  },
  {
    kind: "research",
    title: "Research and corrections",
    note: "Questions about a study or a record, a source Stratellar should see, or an error to correct. To report an error, name the record or page concerned and the source that shows it.",
    label: "Write about research",
    more: { href: "/methodology", label: "Methodology" },
  },
] as const;

export default function ContactPage() {
  return (
    <Container className="py-12 sm:py-20">
      <PageHeading title="Contact" lead={`Each route below is an email to the founder, ${site.founder}.`} />

      <ul role="list" className="m-0 mt-12 list-none divide-y divide-border border-b border-border p-0">
        {pathways.map((p) => (
          <li key={p.kind} className="grid gap-5 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:gap-12">
            <div>
              <h2 className="display-3 text-foreground">{p.title}</h2>
              <p className="mt-2 font-display text-sm">
                <Link href={p.more.href} className="link-quiet text-muted">{p.more.label}</Link>
              </p>
            </div>
            <div>
              <p className="max-w-xl font-display text-[0.9375rem] leading-7 text-muted">{p.note}</p>
              <InquiryLink kind={p.kind} label={p.label} className="mt-5" />
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-8 max-w-xl font-display text-sm leading-6 text-faint">
        <Link href="/about" className="link-quiet text-muted">About {site.legalName}</Link>. {site.boundary}
      </p>
    </Container>
  );
}
