import { Container } from "@/components/ui/container";
import type { DossierPayload } from "@/lib/material-dossier";
import { CapitalControls } from "./capital-controls";
import { EventsSection, RelatedSection } from "./events";
import { DossierHeader } from "./header";
import { NotesSection } from "./notes";
import { RecordsByStage, SupplyChainBand } from "./supply-chain";
import { TimelineSection } from "./timeline";

/** The material dossier: one template for every material, rendered on the server with no client script. */
export function Dossier({ payload }: { payload: DossierPayload }) {
  return (
    <Container className="dossier space-y-14 py-10 sm:py-12" width="wide">
      <DossierHeader payload={payload} />
      <SupplyChainBand payload={payload} />
      <RecordsByStage payload={payload} />
      <CapitalControls payload={payload} />
      <TimelineSection payload={payload} />
      <EventsSection payload={payload} />
      <RelatedSection payload={payload} />
      <NotesSection payload={payload} />
    </Container>
  );
}
