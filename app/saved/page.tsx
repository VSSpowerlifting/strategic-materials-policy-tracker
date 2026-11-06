import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading } from "@/components/ui/container";
import { SavedEventsExplorer } from "@/components/saved-events-explorer";

export const metadata: Metadata = {
  title: "Saved events",
  description:
    "A personal event list stored locally in this browser. Separate from SMPT’s official-source watchlist.",
};

export default function SavedEventsPage() {
  return (
    <Container className="py-12">
      <PageHeading
        index="01"
        eyebrow="Your list"
        title="Saved events"
        lead={
          <>
            Events you have chosen to keep track of, stored only in this browser. This is a
            personal browsing, separate from the project&apos;s official-source monitoring — for the sources
            this project actively monitors, see{" "}
            <Link href="/watchlist" className="text-accent hover:text-accent-strong">
              /watchlist
            </Link>
            .
          </>
        }
      />
      <div className="mt-10">
        <SavedEventsExplorer />
      </div>
    </Container>
  );
}
