import { socialCard } from "@/lib/social-card";

// The default link preview: the reversed lockup, the tagline and the marker-bed field on the Seam ground.
// Artwork source: `ogDefault()` in scripts/brand/build-brand-assets.mjs. Rebuild with `npm run brand:build`.
export const alt = "Stratellar: Strategic Materials Intelligence. Materials. Policy. Capital.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return socialCard("og-default.png");
}
