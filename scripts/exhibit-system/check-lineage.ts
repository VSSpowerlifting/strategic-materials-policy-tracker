// Preflight for the optional research deck lineage contract.
// Example: npm run exhibits:lineage:check -- research/my-case/deck-spec.json
import { loadResearchDeck } from "./research-deck";

function main(): void {
  const [file, ...extra] = process.argv.slice(2);
  if (!file || extra.length) {
    console.error("usage: npm run exhibits:lineage:check -- <research-spec.json>");
    process.exitCode = 2;
    return;
  }
  try {
    const deck = loadResearchDeck(file);
    if (!deck.lineage) {
      console.error("lineage HOLD: no versioned lineage block in the research spec");
      process.exitCode = 1;
      return;
    }
    const l = deck.lineage;
    console.log(JSON.stringify({
      state: "METADATA VALIDATED — NOT RESEARCH APPROVAL",
      version: l.version,
      research_cutoff: l.research_cutoff,
      model_files_hash_verified: l.models.length,
      model_outputs_declared: l.models.reduce((n, m) => n + m.outputs.length, 0),
      claims: l.claims.length,
      analytical_slides: l.slides.length,
      figures: l.slides.reduce((n, s) => n + s.figures.length, 0),
      financial_relations: l.slides.reduce((n, s) => n + s.relations.length, 0),
    }, null, 2));
  } catch (e: unknown) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
