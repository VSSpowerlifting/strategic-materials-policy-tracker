import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Link-preview cards are drawn once by `npm run brand:build` (type outlined from the bundled Spectral and
 * Archivo files, so no card depends on a system font) and committed under `public/brand/social/`. The
 * `opengraph-image` routes serve those files unchanged, which keeps the long-standing `/opengraph-image` URLs
 * and means the preview a platform fetches is the artwork that was reviewed.
 */
export const SOCIAL_CARD_SIZE = { width: 1200, height: 630 } as const;
export const SOCIAL_CARD_TYPE = "image/png";

export async function socialCard(file: string): Promise<Response> {
  const png = await readFile(join(process.cwd(), "public/brand/social", file));
  return new Response(new Uint8Array(png), { headers: { "Content-Type": SOCIAL_CARD_TYPE } });
}
