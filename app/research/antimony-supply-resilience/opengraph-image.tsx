import { socialCard } from "@/lib/social-card";

// Artwork source: the `antimony-supply-resilience` entry of RESEARCH_CARDS in scripts/brand/build-brand-assets.mjs.
// The card carries the study's category, title, author and date.
export const alt =
  "Stratellar Strategy & Finance: U.S. Antimony Supply Resilience, 2027–2031";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return socialCard("research/antimony-supply-resilience.png");
}
