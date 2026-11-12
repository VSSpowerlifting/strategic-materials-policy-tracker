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
  /** Path under `public/`. */
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
} as const satisfies Record<string, Photograph>;

export type PhotographId = keyof typeof photographs;

/**
 * Cover for each publication, keyed by its route segment. A cover is either a registered photograph or a
 * typographic plate: a large mark with one line under it, both taken from the publication's own subject.
 */
export type ResearchCover =
  | { kind: "photo"; photo: PhotographId }
  | { kind: "mark"; mark: string; line: string };

export const researchCovers: Record<string, ResearchCover> = {
  "escondida-copper": { kind: "photo", photo: "escondida-tailings" },
  "china-export-control-suspension-extension": { kind: "mark", mark: "10 Jan 2027", line: "Suspension continued through" },
  "hemerdon-financing": { kind: "mark", mark: "W", line: "Tungsten, element 74" },
  "antimony-supply-resilience": { kind: "mark", mark: "Sb", line: "Antimony, element 51" },
  "tungsten-supply-security": { kind: "mark", mark: "74", line: "Tungsten, atomic number" },
};
