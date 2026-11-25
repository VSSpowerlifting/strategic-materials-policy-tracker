import { socialCard } from "@/lib/social-card";

// Artwork source: the `china-export-control-suspension-extension` entry of RESEARCH_CARDS in
// scripts/brand/build-brand-assets.mjs. The card carries the article's category, title, author and date.
export const alt =
  "Stratellar Policy Research: China Extends the Suspension of Six Export-Control Announcements Through January 10, 2027";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return socialCard("research/china-export-control-suspension-extension.png");
}
