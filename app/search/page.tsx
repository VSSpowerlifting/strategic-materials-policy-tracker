import type { Metadata } from "next";
import { Container, PageHeading } from "@/components/ui/container";
import { SearchExplorer } from "@/components/search-explorer";
import { buildSearchIndex } from "@/lib/search";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search strategic-material policy, finance, controls, projects, organizations, programmes and original sources by name, precise ID and original-language text.",
};

export default function SearchPage() {
  const docs = buildSearchIndex();

  return (
    <Container className="py-12">
      <PageHeading
        title="Search the corpus"
        lead="Exact document numbers, organization names or original-language text."
      />
      <div className="mt-10">
        <SearchExplorer docs={docs} />
      </div>
    </Container>
  );
}
