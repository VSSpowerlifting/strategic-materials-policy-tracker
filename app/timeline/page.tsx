import type { Metadata } from "next";
import { Container, PageHeading } from "@/components/ui/container";
import { TimelineView } from "@/components/timeline-view";
import {
  getAllEvents,
  getAllMaterials,
  getFramingCategoriesByEvent,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Timeline",
  description:
    "The contest over strategic materials in chronological order, from April 2025 — filterable by actor and material.",
};

export default function TimelinePage() {
  const events = getAllEvents();
  const materials = getAllMaterials();

  return (
    <Container className="py-12">
      <PageHeading
        index="01"
        eyebrow="Chronology"
        title="Timeline"
        lead="The acute phase runs from April 2025, when Beijing's first heavy-rare-earth controls landed. Standing frameworks that predate the window — such as the EU Critical Raw Materials Act — are shown as foundational context."
      />
      <div className="mt-10 max-w-3xl">
        <TimelineView
          events={events}
          materials={materials}
          framingByEvent={getFramingCategoriesByEvent()}
        />
      </div>
    </Container>
  );
}
