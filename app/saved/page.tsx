import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading } from "@/components/ui/container";
import { SavedEventsExplorer } from "@/components/saved-events-explorer";

export const metadata: Metadata = {
  title: "Saved events",
  description:
    "A reader's own local list of events, kept in this browser only — no account, nothing sent anywhere. Distinct from the project's own /watchlist of monitored sources.",
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
            personal convenience, not the project&apos;s own research routine — for the sources
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
