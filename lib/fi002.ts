/** Approved FI002 publication metadata. No tracker facts or master Drive IDs. */
export const fi002 = {
  title:
    "Goldman Sachs’ Copper Outlook and BHP’s $6 Billion Escondida Decision",
  path: "/research/escondida-copper",
  cutoff: "2026-11-05",
  description:
    "A look at what Goldman Sachs’ 2027 copper forecast means for BHP’s earnings sensitivity and the proposed Escondida replacement concentrator.",
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
      "In the base case, the model spreads the benefit over 20 years from 2032. It assumes the same annual amount of production preserved or added throughout that period.",
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
      "With only ten years to recover the same capital cost, the required annual benefit rises. Margins and the first production year stay the same as in the base case.",
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
      "When those ten benefit years start in 2034 instead of 2032, the required annual benefit rises again. The capital-spending schedule stays the same.",
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
      "This case combines lower long-term copper prices, 20% higher capital cost and a two-year delay. Because benefits run for 20 years, the annual cash benefit needed is lower than in the ten-year case. The weaker margin still means more production-equivalent tonnes are required.",
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
    detail: "11-slide PDF · findings and decision framework",
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
