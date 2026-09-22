import type { Metadata } from "next";
import { Container, PageHeading } from "@/components/ui/container";
import { SearchExplorer } from "@/components/search-explorer";
import { buildSearchIndex } from "@/lib/search";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search every record in the tracker — events, materials, actors, framing claims, sources and the watchlist — including original-language text.",
};

export default function SearchPage() {
  const docs = buildSearchIndex();

  return (
    <Container className="py-12">
      <PageHeading
        index="01"
        eyebrow="Find"
        title="Search the corpus"
        lead="One index across every record type, including original-language titles and quotes. The index is built from the same loaders the pages use, so search can never surface something the rest of the site would not."
      />
      <div className="mt-10">
        <SearchExplorer docs={docs} />
      </div>
    </Container>
  );
}
