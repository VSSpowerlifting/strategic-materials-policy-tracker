/**
 * Pure helpers for the in-page section marker (`components/ui/section-spy.tsx`). Which lists are tracked, where
 * the reading line sits, and whether a list runs across or down.
 */

/**
 * Section lists that follow the reader: the "On this page" rail on record pages and the section lists of research
 * publications. Any other list opts in with `data-section-nav`.
 */
export const sectionNavSelector = [
  'nav[aria-label="On this page"]',
  'nav[aria-label="Publication sections"]',
  'nav[aria-label="Report sections"]',
  "nav[data-section-nav]",
].join(", ");

/**
 * The reading line, in pixels from the top of the viewport: 30% of the way down the area below the sticky header.
 * The section crossing this line is the one being read.
 */
export function readingLine(viewportHeight: number, headerHeight: number): number {
  const visible = Math.max(0, viewportHeight - headerHeight);
  return Math.round(headerHeight + visible * 0.3);
}

/** "x" when every link sits on one row (within 2px), otherwise "y". */
export function spyAxis(linkTops: readonly number[]): "x" | "y" {
  if (linkTops.length < 2) return "y";
  const first = linkTops[0];
  return linkTops.every((t) => Math.abs(t - first) <= 2) ? "x" : "y";
}
