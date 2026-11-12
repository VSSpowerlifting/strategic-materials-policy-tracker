import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading } from "@/components/ui/container";
import {
  getAllEvents,
  getAllFinancialCommitments,
  getAllMaterials,
  getAllOrganizations,
  getAllProjects,
} from "@/lib/data";
import { exploreJourneys } from "@/lib/site";

export const metadata: Metadata = {
  title: "Explore the record",
  description:
    "Browse government measures, public financing, industrial projects, organizations and materials, each linked to its primary source.",
};

/**
 * Entry to the record. Five collections, each with the number of records it holds, then every other view
 * grouped by the journey it belongs to. Counts are record counts from the public loaders; nothing here sums
 * or compares money.
 */
export default function ExplorePage() {
  const materials = getAllMaterials();
  const collections = [
    {
      href: "/events",
      label: "Government action",
      count: getAllEvents().length,
      unit: "events",
      note: "Export controls, laws, funding decisions and official statements, with legal status by date.",
    },
    {
      href: "/capital",
      label: "Public capital",
      count: getAllFinancialCommitments().length,
      unit: "commitments",
      note: "Grants, loans, equity and guarantees, each dated from announcement through contract to disbursement.",
    },
    {
      href: "/projects",
      label: "Projects",
      count: getAllProjects().length,
      unit: "projects",
      note: "Mines, refineries and plants, with their financing and reported milestones.",
    },
    {
      href: "/organizations",
      label: "Organizations",
      count: getAllOrganizations().length,
      unit: "organizations",
      note: "Companies, public financiers and agencies named in the capital and project records.",
    },
    {
      href: "/materials",
      label: "Materials",
      count: materials.length,
      unit: "materials",
      note: "One dossier per material: measures, financing, projects and supply-chain stage.",
    },
  ] as const;

  return (
    <Container width="wide" className="py-12 sm:py-20">
      <PageHeading
        title="Explore the record"
        lead="Every record links to the official document it comes from. Amounts stay in their original currency."
      />

      <form action="/search" method="get" role="search" className="mx-auto mt-10 flex max-w-2xl gap-3">
        <label htmlFor="explore-q" className="sr-only">Search the record</label>
        <input
          id="explore-q"
          name="q"
          type="search"
          placeholder="Document number, organization, project or material"
          className="min-h-11 min-w-0 flex-1 border border-border-strong bg-plate px-4 font-display text-[0.9375rem] text-foreground placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <button type="submit" className="research-button">Search</button>
      </form>

      <nav aria-label="Collections" className="mt-14">
        <ul className="m-0 list-none border-t border-border-strong p-0">
          {collections.map((c) => (
            <li key={c.href} className="border-b border-border">
              <Link
                href={c.href}
                className="group grid items-baseline gap-x-8 gap-y-1 py-6 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_auto]"
              >
                <span className="display-3 text-foreground group-hover:text-accent">{c.label}</span>
                <span className="font-display text-[0.9375rem] leading-7 text-muted">{c.note}</span>
                <span className="font-display text-sm text-faint">
                  <span className="tnum text-foreground">{c.count}</span> {c.unit}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-16 grid gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section aria-labelledby="views-heading" className="min-w-0">
          <h2 id="views-heading" className="border-b border-border-strong pb-3 font-display text-base font-semibold">
            All views
          </h2>
          <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {exploreJourneys.map((journey) => (
              <div key={journey.href}>
                <h3 className="font-display text-sm font-semibold text-foreground">{journey.label}</h3>
                <ul className="m-0 mt-3 list-none space-y-1.5 p-0 font-display text-sm">
                  {journey.views.map((view) => (
                    <li key={view.href}>
                      <Link href={view.href} className="link-quiet text-foreground">{view.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="materials-heading" className="min-w-0">
          <h2 id="materials-heading" className="border-b border-border-strong pb-3 font-display text-base font-semibold">
            Material dossiers
          </h2>
          <ul className="m-0 mt-6 list-none columns-2 gap-x-8 p-0 font-display text-sm leading-8">
            {materials.map((m) => (
              <li key={m.id}>
                <Link href={`/materials/${m.slug}`} className="link-quiet text-foreground">{m.nameEn}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Container>
  );
}
