import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "About SMPT",
  description: "About the Strategic Materials Policy Tracker and its researcher, Benjamin Yang.",
};

export default function AboutPage() {
  return (
    <Container className="py-12 sm:py-20">
      <PageHeading
        title="About SMPT"
        lead="Independent research by Benjamin Yang on strategic-materials policy, financing and industrial development."
      />

      <div className="mt-12 max-w-3xl space-y-6 text-lg leading-8">
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
          <Link href="/methodology" className="text-accent underline underline-offset-4">methodology</Link>
          {" "}and{" "}
          <Link href="/coverage" className="text-accent underline underline-offset-4">coverage report</Link>.
        </p>
      </div>

      <nav aria-label="More about SMPT" className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-border pt-6 font-display text-sm">
        <Link href="/research" className="text-accent underline underline-offset-4">Research</Link>
        <Link href="/sources" className="text-accent underline underline-offset-4">Source register</Link>
        <Link href="/data" className="text-accent underline underline-offset-4">Download data</Link>
        <a href="https://github.com/VSSpowerlifting/strategic-materials-policy-tracker" className="text-accent underline underline-offset-4">GitHub</a>
      </nav>
    </Container>
  );
}
