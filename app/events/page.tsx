import Link from "next/link";
import type { Metadata } from "next";
import { Container, PageHeading } from "@/components/ui/container";
import { EventsExplorer } from "@/components/events-explorer";
import {
  getAllEvents,
  getAllMaterials,
  getFramingCategoriesByEvent,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Explore policy evidence",
  description:
    "Searchable, filterable database of policy events — export controls, designations, funding and stockpiling — across China, the US, the EU and allied states.",
};

export default function EventsPage() {
  const events = getAllEvents();
  const materials = getAllMaterials();

  return (
    <Container className="py-12">
      <PageHeading
        eyebrow="Explore"
        title="Explore policy evidence"
        lead="Start with a material or government. Open a measure to distinguish its official rationale, legal standing and source-linked instruments. The list reflects this corpus, not all government activity."
      />
      <nav aria-label="Explore record types" className="mt-6 flex flex-wrap gap-x-6 gap-y-3 font-display text-sm">
        <span aria-current="page" className="font-semibold text-foreground">Policy events</span>
        <Link href="/capital" className="text-accent underline underline-offset-4">Financial instruments</Link>
        <Link href="/controls" className="text-accent underline underline-offset-4">Legal controls</Link>
        <Link href="/sources" className="text-accent underline underline-offset-4">Original sources</Link>
      </nav>
      <div className="mt-8">
        {/*
          No Suspense boundary here on purpose. The explorer applies any URL
          filters from `window.location.search` after mount rather than through
          `useSearchParams`, which would opt this subtree out of prerendering
          and ship an empty event list in the static HTML.
        */}
        <EventsExplorer
          events={events}
          materials={materials}
          framingByEvent={getFramingCategoriesByEvent()}
        />
      </div>
    </Container>
  );
}
