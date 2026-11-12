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
        title="Saved events"
        lead={
          <>
            Stored only in this browser. The sources this project monitors are on the{" "}
            <Link href="/watchlist" className="link-quiet">
              watchlist
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
