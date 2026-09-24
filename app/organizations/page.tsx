import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { JurisdictionTag } from "@/components/labels";
import { organizationRoles } from "@/lib/capital-intelligence";
import { getAllOrganizations } from "@/lib/data";
import { organizationKindLabels } from "@/lib/labels";
import { ORGANIZATION_KINDS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Organizations",
  description:
    "Every provider, recipient, sponsor and holder in the capital record: government bodies, public financiers, joint vehicles, companies, project companies and banks, with what each provides and receives.",
};

export default function OrganizationsPage() {
  const orgs = getAllOrganizations();
  const roles = new Map(orgs.map((o) => [o.id, organizationRoles(o.id)]));

  return (
    <Container className="py-12">
      <PageHeading
        index="05"
        eyebrow="Capital intelligence"
        title="Organizations"
        lead={
          <>
            Who provides and who receives. One record per body, whatever it is called: a renamed department keeps one id.
            A government office&apos;s rows roll up into its department; a joint vehicle&apos;s never roll up into the bodies
            that set it up, because its money is not theirs.
          </>
        }
      />
      <div className="mt-10 space-y-12">
        {ORGANIZATION_KINDS.map((kind, i) => {
          const list = orgs.filter((o) => o.kind === kind);
          if (!list.length) return null;
          return (
            <Section key={kind} index={String(i + 1).padStart(2, "0")} title={organizationKindLabels[kind]} description={`${list.length} record${list.length === 1 ? "" : "s"}`}>
              <Card className="overflow-hidden">
                {list.map((o) => {
                  const r = roles.get(o.id)!;
                  return (
                    <Link key={o.id} href={`/organizations/${o.id}`} className="group flex flex-col gap-1 border-b px-4 py-3 last:border-b-0 hover:bg-elevated sm:flex-row sm:items-center sm:gap-4">
                      <span className="flex items-center gap-2 sm:w-32 sm:shrink-0">
                        {o.actor ? <JurisdictionTag code={o.actor} /> : <span className="font-mono text-[11px] text-faint">{o.countryCode ?? "—"}</span>}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="font-display font-semibold group-hover:text-accent">{o.name}</span>
                        {o.nameOriginal ? <span lang="und" className="ml-2 text-sm text-muted">{o.nameOriginal}</span> : null}
                        {o.aliases.length ? <span className="block font-mono text-[11px] text-faint">also {o.aliases.join(" · ")}</span> : null}
                      </span>
                      <span className="tnum font-mono text-[11px] text-muted sm:text-right">
                        {r.provided.length ? `provides ${r.provided.length}` : ""}
                        {r.provided.length && r.received.length ? " · " : ""}
                        {r.received.length ? `receives ${r.received.length}` : ""}
                        {!r.provided.length && !r.received.length ? (r.sponsoredProjects.length ? `sponsors ${r.sponsoredProjects.length}` : "parent body") : ""}
                      </span>
                    </Link>
                  );
                })}
              </Card>
            </Section>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted">
        Download: <a href="/api/export/organizations.csv" className="text-accent hover:text-accent-strong">CSV</a>
        {" · "}
        <Link href="/api/v1/organizations" prefetch={false} className="text-accent hover:text-accent-strong">JSON API</Link>
      </p>
    </Container>
  );
}
