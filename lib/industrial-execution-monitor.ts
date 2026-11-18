import { getProjectMilestoneById, getSourceById } from "@/lib/data";

type SourceDocument = {
  label: string;
  url: string;
  publishedOn: string;
};

function reviewedMilestoneSource(milestoneId: string) {
  const milestone = getProjectMilestoneById(milestoneId);
  const source = milestone && getSourceById(milestone.sourceId);
  if (!source?.datePublished) {
    throw new Error(`Monitor milestone ${milestoneId} needs a dated canonical source`);
  }
  return { url: source.url, publishedOn: source.datePublished };
}

export const monitorSources = {
  mpAnnouncement: {
    label: "MP partnership release",
    url: "https://mpmaterials.com/news/mp-materials-announces-transformational-public-private-partnership-with-the-department-of-defense-to-accelerate-u-s-rare-earth-magnet-independence/",
    publishedOn: "2025-07-10",
  },
  mpSite: {
    label: "MP site selection",
    url: "https://mpmaterials.com/news/mp-materials-selects-northlake-texas-as-the-site-of-10x-a-new-us-rare-earth-magnet-manufacturing-campus/",
    publishedOn: "2026-02-26",
  },
  mpQ3: {
    label: "MP Q3 10-Q",
    url: "https://s25.q4cdn.com/570172628/files/content_files/10Q-MP-Q3-2026-Earnings-FINAL.pdf",
    publishedOn: "2026-11-06",
  },
  mpCall: {
    label: "MP Q3 earnings call transcript",
    url: "https://stockanalysis.com/stocks/mp/transcripts/726799-q3-2026/",
    publishedOn: "2026-11-05",
  },
  neoGrant: {
    label: "Neo grant release",
    url: "https://www.neomaterials.com/neo-performance-materials-european-grant/",
    publishedOn: "2022-11-09",
  },
  neoGroundbreaking: {
    label: "Neo groundbreaking release",
    url: "https://www.neomaterials.com/neo-launches-construction-of-re-magnet-manufacturing-plant/",
    publishedOn: "2023-07-07",
  },
  neoQ4: {
    label: "Neo 2024 MD&A",
    url: "https://www.neomaterials.com/wp-content/uploads/2025/03/NPM-12.31.2024-MDA-vF2.pdf#page=8",
    publishedOn: "2025-03-18",
  },
  neoQ2: {
    label: "Neo Q2 results",
    url: "https://www.neomaterials.com/neo-performance-materials-reports-second-quarter-2026-results/",
    publishedOn: "2026-08-11",
  },
  neoShipments: {
    label: "Neo production release",
    ...reviewedMilestoneSource("mil-ee-neo-narva-commercial-production-reported-2026"),
  },
  neoQ3: {
    label: "Neo Q3 MD&A",
    url: "https://www.neomaterials.com/wp-content/uploads/2026/11/Q326-MDA-11-09-vF.pdf#page=9",
    publishedOn: "2026-11-09",
  },
  usarInvestor: {
    label: "USAR investor presentation",
    url: "https://www.sec.gov/Archives/edgar/data/1970622/000121390025012473/ea023078101ex99-1_inflect2.htm",
    publishedOn: "2025-02-12",
  },
  usarCommissioning: {
    label: "USAR commissioning release",
    ...reviewedMilestoneSource("mil-us-usar-stillwater-phase1a-commissioning-started"),
  },
  usarQ3Results: {
    label: "USAR Q3 results",
    url: "https://www.sec.gov/Archives/edgar/data/1970622/000197062226000066/exhibit991-earningsrelease.htm",
    publishedOn: "2026-11-09",
  },
  usarQ3Filing: {
    label: "USAR Q3 10-Q",
    url: "https://www.sec.gov/Archives/edgar/data/1970622/000197062226000072/usar-20260930.htm",
    publishedOn: "2026-11-12",
  },
} satisfies Record<string, SourceDocument>;

export type MonitorCitation = {
  source: keyof typeof monitorSources;
  locator: string;
};

type Statement = {
  text: string;
  citations: readonly [MonitorCitation, ...MonitorCitation[]];
};

type DatedStatement = Statement & {
  timing: string;
};

type Schedule = {
  phase: string;
  milestone: string;
  targets: readonly [DatedStatement, ...DatedStatement[]];
  outcome?: DatedStatement;
  assessment: string;
};

type Facility = {
  projectId: string;
  name: string;
  location: string;
  reported: DatedStatement;
  schedule: Schedule;
  context?: Statement;
  next: { target?: DatedStatement; evidenceToWatch: string };
};

// Timing preserves the source's precision. Only dates of publication or filing
// belong in publishedOn. Statements here do not enter the reviewed milestone ledger.
export const magnetFacilities: readonly Facility[] = [
  {
    projectId: "prj-us-mp-10x-facility",
    name: "MP Materials · 10X",
    location: "Northlake, Texas",
    reported: {
      timing: "Spring 2026",
      text: "MP Materials reports that construction began at 10X and is underway.",
      citations: [{ source: "mpQ3", locator: "Note 1, p. 6 and Recent Developments, p. 30" }],
    },
    schedule: {
      phase: "10X facility",
      milestone: "Start of commissioning",
      targets: [
        {
          timing: "2028",
          text: "Initial commissioning window.",
          citations: [{ source: "mpAnnouncement", locator: "Opening section, second paragraph" }],
        },
        {
          timing: "2028",
          text: "Reaffirmed at site selection.",
          citations: [{ source: "mpSite", locator: "Paragraph beginning “MP expects to invest”" }],
        },
        {
          timing: "Late 2028",
          text: "The CEO narrowed the window on the Q3 call. The 10-Q gives the year.",
          citations: [
            { source: "mpCall", locator: "Jim Litinsky’s opening remarks" },
            { source: "mpQ3", locator: "MD&A, Our Downstream Operations, p. 32" },
          ],
        },
      ],
      assessment: "The commissioning target narrowed within 2028. The reviewed disclosures give no 10X qualification or first-delivery date.",
    },
    context: {
      text: "The U.S. defense offtake covers future 10X output. MP’s reported magnet production at Independence belongs to a separate facility.",
      citations: [
        { source: "mpQ3", locator: "Note 1, p. 6 and MD&A, Our Downstream Operations, p. 32" },
      ],
    },
    next: {
      evidenceToWatch: "Look for a dated report that production equipment is installed and running at 10X, followed by customer qualification of magnets made there.",
    },
  },
  {
    projectId: "prj-ee-neo-rare-earth-magnet-project",
    name: "Neo Performance Materials · Narva",
    location: "Narva, Estonia",
    reported: {
      timing: "September 2026",
      text: "Neo reports first commercial shipments of sintered magnets to a Tier 1 EV traction motor customer after automotive qualification for the initial program.",
      citations: [
        { source: "neoShipments", locator: "Opening paragraph and Highlights" },
        { source: "neoQ3", locator: "§6, p. 7, European Permanent Magnet Facility" },
      ],
    },
    schedule: {
      phase: "Phase 1A",
      milestone: "Start of commercial production",
      targets: [
        {
          timing: "2026",
          text: "Earliest explicit commercial production target in the reviewed sources.",
          citations: [{ source: "neoQ4", locator: "§6, p. 8, European Permanent Magnet Facility Nearing Completion" }],
        },
        {
          timing: "Second half of 2026",
          text: "Neo expected to launch two to three commercial programs in this window.",
          citations: [{ source: "neoQ2", locator: "Magnequench, Strategic Platform Expansion" }],
        },
      ],
      outcome: {
        timing: "Q3 2026",
        text: "Neo reported that commercial production had started. The exact start day remains undisclosed.",
        citations: [{ source: "neoQ3", locator: "§6, p. 7, European Permanent Magnet Facility" }],
      },
      assessment: "The initial program began within the disclosed 2026 window.",
    },
    context: {
      text: "Neo’s 2022 grant announcement targeted operations in 2025 and its 2023 groundbreaking release targeted first magnet production in 2025. The 2024 MD&A put qualification samples in early 2025 and large-scale commercial production in 2026.",
      citations: [
        { source: "neoGrant", locator: "Opening bullet on the operational target" },
        { source: "neoGroundbreaking", locator: "Opening section, second paragraph" },
        { source: "neoQ4", locator: "§6, p. 8, European Permanent Magnet Facility Nearing Completion" },
      ],
    },
    next: {
      target: {
        timing: "By year-end 2026",
        text: "One to two additional customer programs entering commercial production.",
        citations: [{ source: "neoQ3", locator: "§6, p. 7, European Permanent Magnet Facility" }],
      },
      evidenceToWatch: "Commercial shipments for additional qualified programs or repeat delivery volumes for the first program would show how far Phase 1A has ramped.",
    },
  },
  {
    projectId: "prj-us-usar-stillwater-magnet",
    name: "USA Rare Earth · Stillwater Magnet",
    location: "Stillwater, Oklahoma",
    reported: {
      timing: "By 9 November 2026",
      text: "USA Rare Earth reports that the first magnet finishing line was installed. In September it sold its first Stillwater-made sintered NdFeB blocks to a materials manufacturer.",
      citations: [{ source: "usarQ3Results", locator: "Third Quarter Business Updates, Commenced NdFeB magnet sales" }],
    },
    schedule: {
      phase: "Initial Stillwater magnet operation",
      milestone: "First magnet revenue",
      targets: [
        {
          timing: "First half of 2026",
          text: "Initial target for first revenue from the magnet operation.",
          citations: [{ source: "usarInvestor", locator: "Exhibit 99.1, slide 34, Magnets" }],
        },
      ],
      outcome: {
        timing: "Q3 2026",
        text: "The company first recorded magnet revenue, with initial block sales in September.",
        citations: [
          { source: "usarQ3Filing", locator: "MD&A, Factors Affecting Comparability of Results, p. 33" },
          { source: "usarQ3Results", locator: "Third Quarter Business Updates, Commenced NdFeB magnet sales" },
        ],
      },
      assessment: "First magnet revenue fell in the quarter after the target window closed.",
    },
    context: {
      text: "Phase 1a commissioning was reported in March. The release expected customer order fulfillment in Q2, a separate milestone from recognized revenue.",
      citations: [{ source: "usarCommissioning", locator: "Opening paragraph" }],
    },
    next: {
      target: {
        timing: "Q2 2027",
        text: "Commission Phase 1b, which would bring planned magnet capacity to 1,200 tonnes a year.",
        citations: [{ source: "usarQ3Results", locator: "Key Operational Targets" }],
      },
      evidenceToWatch: "Look for a customer or issuer to confirm qualification and repeat shipments of finished magnets from Stillwater. The first block sales establish initial demand. The reviewed disclosures give no date for qualified finished-magnet shipments.",
    },
  },
];

export const monitorUpdate = {
  date: "2026-11-18",
  researchCutoff: "2026-11-18",
  title: "Stillwater records its first magnet sales",
  finding: {
    text: "USA Rare Earth reports that its first Stillwater sales were sintered magnet blocks. Neo reported shipments after automotive qualification for an initial program at Narva, and MP reported construction underway at 10X.",
    citations: [
      { source: "usarQ3Results", locator: "Third Quarter Business Updates, Commenced NdFeB magnet sales" },
      { source: "neoShipments", locator: "Opening paragraph and Highlights" },
      { source: "mpQ3", locator: "Note 1, p. 6" },
    ],
  },
  evidenceToWatch: "Stillwater’s first sales are the largest change in the comparison. Narva has the clearest evidence of qualified deliveries. Acceptance and repeat shipments of finished magnets from Stillwater would narrow that gap.",
} satisfies {
  date: string;
  researchCutoff: string;
  title: string;
  finding: Statement;
  evidenceToWatch: string;
};
