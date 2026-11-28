/** Cases selected from a published Controls archive. Existing case URLs pin their release. */
export type ControlBriefCase = {
  slug: string;
  instrumentId: string;
  title: string;
  instrumentLabel: string;
  release: string;
  defaultDates: { from: string; to: string };
  scope: string;
  reviewQuestions: readonly string[];
};

export const controlBriefCases: readonly ControlBriefCase[] = [
  {
    slug: "superhard-materials",
    instrumentId: "evt-cn-mofcom-55-2025",
    title: "Superhard materials",
    instrumentLabel: "China · Announcement No. 55 of 2025",
    release: "2026-11-12",
    defaultDates: { from: "2026-11-10", to: "2026-11-11" },
    scope: "No. 55 names six categories covering certain synthetic diamond powders, single crystals, wire saws and grinding wheels, as well as DCPCVD deposition equipment and process technology. It also contains a customs declaration provision for exporters.",
    reviewQuestions: [
      "For a specific product, verify its characteristics against the numbered item and check the declaration paragraph. The notice uses customs codes as references.",
      "For decisions after the stated suspension window, check the authority for a successor instrument. The archived record establishes the published window through 10 January 2027.",
    ],
  },
  {
    slug: "rare-earth-re-exports",
    instrumentId: "china-rare-earth-expansion-2025-10",
    title: "Rare-earth re-exports",
    instrumentLabel: "China · Announcement No. 61 of 2025",
    release: "2026-11-12",
    defaultDates: { from: "2025-10-09", to: "2025-11-07" },
    scope: "The brief covers Item 1’s licensing provisions for certain rare-earth items traded between jurisdictions outside China and the end-user and end-use decision rules in Items 2–4.",
    reviewQuestions: [
      "Verify Annex 1 and the item’s origin, input value or production technology before applying Item 1 to a specific shipment. The archived clause records leave the annex’s item list untranscribed.",
      "For a decision that depends on the period before 7 November 2025, seek authority evidence for when Items 2–4 began to apply. The archive records their initial dates as unresolved.",
    ],
  },
];

export const controlBriefHref = (item: ControlBriefCase) => `/controls/changes/${item.slug}`;
