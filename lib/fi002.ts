/** Approved FI002 publication metadata. No tracker facts or master Drive IDs. */
export const fi002 = {
  title:
    "Goldman Sachs’ Copper Outlook and BHP’s $6 Billion Escondida Decision",
  path: "/research/escondida-copper",
  cutoff: "2026-11-05",
  description:
    "Independent SMPT research connecting Goldman Sachs’ copper outlook to BHP’s earnings exposure, Escondida replacement economics and capital allocation.",
  assets: "/research/fi002",
} as const;

/** Precomputed approved screens, not a new valuation or a live forecast. */
export const fi002Screens = [
  {
    name: "Base",
    ktpa: 199,
    exact: 198.76566490611626,
    capital: "$5.85bn",
    price: "$10,494/t",
    years: "20 years · 2032–51",
    benefit: "$839m",
    explanation:
      "Twenty years of assumed benefits lower the annual capital-recovery requirement. Flat incremental production across that period is a modeling assumption.",
  },
  {
    name: "Shorter benefits",
    ktpa: 275,
    exact: 275.3984331796683,
    capital: "$5.85bn",
    price: "$10,494/t",
    years: "10 years · 2032–41",
    benefit: "$1,162m",
    explanation:
      "Halving the benefit period raises the annual requirement. Capital, margin and first production year match the base case.",
  },
  {
    name: "Shorter, later",
    ktpa: 333,
    exact: 333.2321041473987,
    capital: "$5.85bn",
    price: "$10,494/t",
    years: "10 years · 2034–43",
    benefit: "$1,407m",
    explanation:
      "Deferring those ten benefit years by two years raises the requirement further. The capital schedule stays fixed; this isolates later benefits after the duration change.",
  },
  {
    name: "Combined stress",
    ktpa: 416,
    exact: 416.4932802195037,
    capital: "$7.02bn",
    price: "$8,500/t",
    years: "20 years · 2034–53",
    benefit: "$1,218m",
    explanation:
      "Lower long-term copper, 20% more capital and two years of deferred benefits combine. The required money benefit is lower than in the shorter case because benefits last longer; the weaker margin requires more equivalent tonnes.",
  },
] as const;

export const fi002Downloads = [
  {
    file: "report.pdf",
    title: "Flagship research report",
    detail: "14-page PDF · complete argument, exhibits and source guide",
    primary: true,
  },
  {
    file: "model.xlsx",
    title: "Financial model",
    detail: "Editable Excel · 11 tabs · six scenarios · independent copy",
  },
  {
    file: "executive-slides.pdf",
    title: "Executive presentation",
    detail: "12-slide PDF · findings and decision framework",
  },
  {
    file: "executive-slides.pptx",
    title: "Editable presentation",
    detail: "PowerPoint · native charts and tables",
  },
  {
    file: "executive-brief.pdf",
    title: "Executive brief",
    detail: "Two-page PDF · decision and principal findings",
  },
  {
    file: "methodology.md",
    title: "Methodology and model guide",
    detail: "Markdown · definitions, assumptions and calculations",
  },
  {
    file: "evidence-register.csv",
    title: "Evidence register",
    detail: "CSV · sources, locators and access limitations",
  },
  {
    file: "claim-source-matrix.csv",
    title: "Claim–source matrix",
    detail: "CSV · traceability for the principal claims",
  },
  {
    file: "research-package.zip",
    title: "Complete public research package",
    detail: "ZIP · report, model, slides, evidence and calculation CSVs",
  },
] as const;
