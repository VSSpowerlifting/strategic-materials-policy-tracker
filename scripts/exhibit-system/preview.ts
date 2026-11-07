// Builds a throwaway preview deck from named fixtures, for renderer development.
//
//   npx tsx scripts/exhibit-system/preview.ts <out.pptx> <fixture-stem> [<fixture-stem> ...]
//
// Writes only the given output path (use a scratch directory); never touches
// the committed gallery, demo deck or manifest.
import path from "node:path";
import { buildDeck, type DeckEntry } from "./build-gallery";
import { loadFixture } from "./registry";

async function main(): Promise<void> {
  const [out, ...stems] = process.argv.slice(2);
  if (!out || stems.length === 0) {
    console.error("usage: preview.ts <out.pptx> <fixture-stem> [...]");
    process.exit(2);
  }
  const entries: DeckEntry[] = stems.map((s) => ({ fixture: loadFixture(s), label: `PREVIEW · ${s.toUpperCase()}` }));
  const manifest = await buildDeck(entries, { title: "Renderer preview", lines: stems }, path.resolve(out));
  console.log(`preview: ${manifest.length} slides → ${out}`);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
