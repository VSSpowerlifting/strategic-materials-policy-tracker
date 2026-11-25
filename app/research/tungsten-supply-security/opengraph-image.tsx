import { socialCard } from "@/lib/social-card";

// Artwork source: the `tungsten-supply-security` entry of RESEARCH_CARDS in scripts/brand/build-brand-assets.mjs.
// The card carries the study's category, title, author and date.
export const alt =
  "Stratellar Policy Research: Tungsten Supply Security";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return socialCard("research/tungsten-supply-security.png");
}
