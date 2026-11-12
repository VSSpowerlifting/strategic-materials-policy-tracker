/**
 * Photograph registry. Every image the site shows is listed here with what it depicts, when it was taken, its
 * catalogue identifier, the credit its publisher asks for and the basis on which it may be reused. A plate is
 * always rendered with its caption, so an image is never read as evidence of something it does not show.
 *
 * Rules: public-domain or openly licensed documentary imagery only; no generated images; `shows` says exactly
 * what is in frame and `limits` says what a reader might wrongly assume is there. A file is added to
 * `public/photography/` only together with its entry here.
 */
export interface Photograph {
  /** Local path under `public/`, or an HTTPS URL at the verified publishing source. */
  src: string;
  width: number;
  height: number;
  /** Text alternative: what the picture looks like, not what it means. */
  alt: string;
  /** Named site. */
  site: string;
  /** Where the site is. */
  place: string;
  /** What is in frame, as the publisher's caption identifies it. */
  shows: string;
  /** What the picture does not show, where a reader could assume otherwise. */
  limits?: string;
  /** ISO date the image was acquired. */
  acquired: string;
  /** Human-readable date where only a year/month is verified. */
  dateLabel?: string;
  /** Publisher's catalogue identifier. */
  photoId: string;
  credit: string;
  /** Catalogue page for the image. */
  sourceUrl: string;
  /** Basis for reuse, with the page that states it. */
  rights: { statement: string; url: string };
  /** CSS `object-position` that keeps the subject in frame when the plate is cropped. */
  focus?: string;
}

export const photographs = {
  "escondida-tailings": {
    src: "/photography/escondida-tailings-iss022-e-8282.jpg",
    width: 1800,
    height: 2250,
    alt: "A pale tailings pond with a blue-green pool, held by a long straight dam in brown desert terrain, seen from orbit.",
    site: "Escondida copper mine",
    place: "Atacama Desert, Chile",
    shows: "Tailings impoundment of the Escondida mine complex",
    limits: "The open pits lie to the north, outside the frame; the proposed concentrator is not shown.",
    acquired: "2009-12-09",
    photoId: "ISS022-E-8282",
    credit: "Image courtesy of the Earth Science and Remote Sensing Unit, NASA Johnson Space Center",
    sourceUrl: "https://eol.jsc.nasa.gov/SearchPhotos/photo.pl?mission=ISS022&roll=E&frame=8282",
    rights: {
      statement: "NASA astronaut photography is not protected by copyright unless noted.",
      url: "https://eol.jsc.nasa.gov/FAQ/default.htm",
    },
    focus: "50% 38%",
  },
  "china-rare-earths": {
    src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/REE_deposits.jpg/1280px-REE_deposits.jpg",
    width: 1280,
    height: 960,
    alt: "An excavated rare-earth deposit with bare pale slopes and a lined water basin, surrounded by wooded hills.",
    site: "Rare-earth element deposit",
    place: "China",
    shows: "Rare-earth deposit photographed in China",
    limits: "Photographed in 2016; the image illustrates extraction, not the 2026 export-control announcement or the six regulated product categories.",
    acquired: "2016-05-22",
    photoId: "REE_deposits.jpg",
    credit: "Kevnmh, via Wikimedia Commons; cropped for display",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:REE_deposits.jpg",
    rights: {
      statement: "Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)",
      url: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    focus: "50% 54%",
  },
  "drakelands-aster": {
    src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia19/pia19757/PIA19757.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1134&w=1260",
    width: 1260,
    height: 1134,
    alt: "Satellite view of the Drakelands tungsten-tin mine in the upper right of a wide patchwork of fields and the Plymouth coastline.",
    site: "Drakelands (Hemerdon) tungsten-tin mine",
    place: "Devon, England, United Kingdom",
    shows: "Drakelands mine and its surrounding landscape, imaged from NASA's Terra spacecraft",
    limits: "ASTER image acquired in 2013; it does not depict 2026 restart work or the financing's current execution.",
    acquired: "2013-06-05",
    photoId: "PIA19757",
    credit: "NASA/GSFC/METI/ERSDAC/JAROS and U.S./Japan ASTER Science Team",
    sourceUrl: "https://science.nasa.gov/photojournal/drakelands-mine-england/",
    rights: {
      statement: "NASA Photojournal imagery, distributed for informational and educational reuse with source credit",
      url: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
    },
    focus: "79% 26%",
  },
  "antimony-ingot": {
    src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/57/Antimon_Barren%2C_Deutsches_Museum.JPG/1280px-Antimon_Barren%2C_Deutsches_Museum.JPG",
    width: 1280,
    height: 1131,
    alt: "A flat silver-gray antimony ingot with prominent interlocking crystalline patterns.",
    site: "Deutsches Museum antimony ingot",
    place: "Munich, Germany",
    shows: "A museum specimen of metallic antimony",
    limits: "Museum specimen photographed in 2010; it is not inventory belonging to the hypothetical defense manufacturer in the strategy case.",
    acquired: "2010",
    dateLabel: "2010",
    photoId: "Antimon_Barren, Deutsches_Museum.JPG",
    credit: "High Contrast, via Wikimedia Commons; cropped for display",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Antimon_Barren,_Deutsches_Museum.JPG",
    rights: {
      statement: "Creative Commons Attribution 3.0 Germany (CC BY 3.0 DE)",
      url: "https://creativecommons.org/licenses/by/3.0/de/deed.en",
    },
    focus: "50% 47%",
  },
  "tungsten-usgs": {
    src: "https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/thumbnails/image/hm1-mar2020_0.JPG",
    width: 1000,
    height: 749,
    alt: "A lustrous dark tungsten-bearing mineral crystal with fine parallel ridges against a black background.",
    site: "USGS tungsten mineral photograph",
    place: "United States Geological Survey collection",
    shows: "A tungsten-bearing mineral specimen photographed for the USGS",
    limits: "This mineral specimen is illustrative and does not document output from any of the four jurisdictions' projects.",
    acquired: "2020-03",
    dateLabel: "March 2020 (approx.)",
    photoId: "USGS tungsten photo-contest image",
    credit: "Carlin Green, U.S. Geological Survey",
    sourceUrl: "https://www.usgs.gov/media/images/tungsten",
    rights: {
      statement: "Public domain, as stated by the U.S. Geological Survey",
      url: "https://www.usgs.gov/media/images/tungsten",
    },
    focus: "50% 46%",
  },
} as const satisfies Record<string, Photograph>;

export type PhotographId = keyof typeof photographs;

/**
 * Explicit overrides only: historically published artwork stays fixed.
 * New research publications receive a cover from resolveResearchCover without adding an entry here.
 * Do not add source imagery unless its depiction, licence and attribution are recorded above.
 */
export type ResearchCover =
  | { kind: "photo"; photo: PhotographId }
  | { kind: "mark"; mark: string; line: string };

export const researchCovers: Record<string, ResearchCover> = {
  "escondida-copper": { kind: "photo", photo: "escondida-tailings" },
  "china-export-control-suspension-extension": { kind: "photo", photo: "china-rare-earths" },
  "hemerdon-financing": { kind: "photo", photo: "drakelands-aster" },
  "antimony-supply-resilience": { kind: "photo", photo: "antimony-ingot" },
  "tungsten-supply-security": { kind: "photo", photo: "tungsten-usgs" },
};

// A small approved pool makes automatic assignment predictable and source-traceable.
// Geographic imagery is assigned only when a slug identifies the depicted site or country.
const photoRules = [
  { matches: /\bescondida\b/, photo: "escondida-tailings" },
  { matches: /\b(?:hemerdon|drakelands)\b/, photo: "drakelands-aster" },
  { matches: /\bantimony\b/, photo: "antimony-ingot" },
  { matches: /\b(?:tungsten|wolfram)\b/, photo: "tungsten-usgs" },
] as const satisfies ReadonlyArray<{ matches: RegExp; photo: PhotographId }>;

// Generic plates are automatically assigned when the image library has no precise match.
// Chemical abbreviations are labels, not an assertion about a particular mine or company.
const materialPlates = [
  { matches: /\brare earths?\b|\bree\b/, mark: "REE", line: "Rare-earth elements" },
  { matches: /\bcopper\b/, mark: "Cu", line: "Copper · element 29" },
  { matches: /\blithium\b/, mark: "Li", line: "Lithium · element 3" },
  { matches: /\bnickel\b/, mark: "Ni", line: "Nickel · element 28" },
  { matches: /\bcobalt\b/, mark: "Co", line: "Cobalt · element 27" },
  { matches: /\bgallium\b/, mark: "Ga", line: "Gallium · element 31" },
  { matches: /\bgermanium\b/, mark: "Ge", line: "Germanium · element 32" },
  { matches: /\bgraphite\b/, mark: "C", line: "Graphite · carbon" },
  { matches: /\bmanganese\b/, mark: "Mn", line: "Manganese · element 25" },
  { matches: /\buranium\b/, mark: "U", line: "Uranium · element 92" },
  { matches: /\bplatinum\b/, mark: "Pt", line: "Platinum · element 78" },
] as const;

/**
 * Always return a cover for a research publication, including unknown future slugs.
 * - Existing cover overrides are preserved exactly.
 * - Named sites and broadly illustrative mineral photographs come from the vetted registry.
 * - A Chinese rare-earth deposit is never used to imply a mine in a different jurisdiction.
 * - Everything else receives an original typographic plate; no external image lookup at build time.
 *
 * For a newly published article or research-index card, render <ResearchCover data-cover={slug} />.
 * Adding/changing an automatic cover is presentation work, not research-content approval.
 */
export function resolveResearchCover(slug: string): ResearchCover {
  const key = slug.trim().toLowerCase();
  const manual = researchCovers[key];
  if (manual) return manual;

  const terms = key.replace(/[^a-z0-9]+/g, " ").trim();

  // Site-specific assets take precedence over mineral-generic ones.
  for (const rule of photoRules) {
    if (rule.matches.test(terms)) return { kind: "photo", photo: rule.photo };
  }
  // The existing Chinese rare-earth deposit is country-specific.
  if (/\bchina\b|\bchinese\b/.test(terms) && /\brare earths?\b|\bree\b/.test(terms)) {
    return { kind: "photo", photo: "china-rare-earths" };
  }
  for (const plate of materialPlates) {
    if (plate.matches.test(terms)) {
      return { kind: "mark", mark: plate.mark, line: plate.line };
    }
  }
  return { kind: "mark", mark: "SMPT", line: "Research" };
}

export function researchCoverPhoto(slug: string): Photograph | undefined {
  const cover = resolveResearchCover(slug);
  return cover.kind === "photo" ? photographs[cover.photo] : undefined;
}
