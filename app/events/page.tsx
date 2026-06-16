import type { Metadata } from "next";
import { Container, PageHeading } from "@/components/ui/container";
import { EventsExplorer } from "@/components/events-explorer";
import { getAllEvents, getAllMaterials } from "@/lib/data";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Searchable, filterable database of policy events — export controls, designations, funding and stockpiling — across China, the US, the EU and allied states.",
};

export default function EventsPage() {
  const events = getAllEvents();
  const materials = getAllMaterials();

  return (
    <Container className="py-12">
      <PageHeading
        eyebrow="The spine"
        title="Policy events"
        lead="Every tracked measure, newest first. Filter by actor, mechanism, status or material. Each event is a structured, source-linked record — open one for the full framing and citations."
      />
      <div className="mt-10">
        <EventsExplorer events={events} materials={materials} />
      </div>
    </Container>
  );
}
