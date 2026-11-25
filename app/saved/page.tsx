import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading } from "@/components/ui/container";
import { SavedEventsExplorer } from "@/components/saved-events-explorer";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Saved events",
  alternates: { canonical: "/saved" },
  description:
    "A personal event list stored locally in this browser. Separate from Stratellar’s official-source watchlist.",
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
      <p className="mt-4 text-sm text-muted">
        Events saved before the move remain in your{" "}
        <a href={`${site.legacyUrl}/saved`} className="link-quiet">original saved list</a>.
      </p>
      <div className="mt-10">
        <SavedEventsExplorer />
      </div>
    </Container>
  );
}
