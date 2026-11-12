/**
 * TypeScript loader for the single publication token source,
 * docs/design/publication-tokens.json. Decks, exhibits and social covers import
 * from here; nothing else in the publication tooling should hard-code a hex.
 * `hex()` returns six digits without '#', the form pptxgenjs expects.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

export const TOKENS_PATH = path.resolve(__dirname, "..", "..", "docs", "design", "publication-tokens.json");

export type PaletteName =
  | "plaster" | "chalk" | "elevated" | "plate" | "graphite" | "slate" | "faint"
  | "border" | "borderStrong" | "malachite" | "hematite" | "ochre";

export type SeriesName = "graphite" | "malachite" | "hematite" | "lapis" | "ochre" | "plum";

export interface PublicationTokens {
  version: string;
  palette: Record<PaletteName, { hex: string; site: string; role: string }>;
  seriesOrder: SeriesName[];
  series: Record<SeriesName, { hex: string; dash: string | null }>;
  seriesExtraDashes: string[];
  neutrals: { dark: string; mid: string; light: string };
  sequentialRamp: { name: string; steps: string[] };
  contrast: { vsPlate: Record<string, number>; vsPlaster: Record<string, number>; rules: string[] };
  type: {
    editorial: { family: string; weights: number[] };
    text: { family: string; weights: number[] };
    mono: { family: string };
  };
  geometry: {
    slide: { widthIn: number; heightIn: number };
    memo: { page: string; marginIn: number };
    social: { widthPx: number; heightPx: number };
  };
}

export const tokens: PublicationTokens = JSON.parse(readFileSync(TOKENS_PATH, "utf8"));

const strip = (value: string) => value.replace(/^#/, "").toUpperCase();

/** Palette colour as six uppercase hex digits, no '#'. */
export const hex = (name: PaletteName): string => strip(tokens.palette[name].hex);
/** Series ink as six uppercase hex digits, no '#'. */
export const seriesHex = (name: SeriesName): string => strip(tokens.series[name].hex);
/** Functional grey for non-focus marks and fills; never text. */
export const neutralHex = (name: "dark" | "mid" | "light"): string => strip(tokens.neutrals[name]);
export const rampHex = (): string[] => tokens.sequentialRamp.steps.map(strip);
export const FONT_EDITORIAL = tokens.type.editorial.family;
export const FONT_TEXT = tokens.type.text.family;
export const FONT_MONO = tokens.type.mono.family;

/** WCAG 2.x relative luminance and contrast ratio for two '#rrggbb' or 'rrggbb' colours. */
export function luminance(colour: string): number {
  const n = strip(colour);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(n.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Office theme colour scheme (`<a:clrScheme>`) built from the tokens, so a shape, chart or hyperlink
 * a person adds in PowerPoint starts from the SMPT palette, not Office blue and orange.
 * dk1/lt1 are the default text and light-text colours; accents follow the chart series order.
 */
export function themeColourScheme(): string {
  const c = (tag: string, value: string) => `<a:${tag}><a:srgbClr val="${value}"/></a:${tag}>`;
  return (
    `<a:clrScheme name="SMPT Studio">${c("dk1", hex("graphite"))}${c("lt1", hex("plate"))}${c("dk2", hex("slate"))}${c("lt2", hex("plaster"))}` +
    `${c("accent1", hex("malachite"))}${c("accent2", hex("hematite"))}${c("accent3", hex("ochre"))}` +
    `${c("accent4", seriesHex("lapis"))}${c("accent5", seriesHex("plum"))}${c("accent6", neutralHex("mid"))}` +
    `${c("hlink", hex("malachite"))}${c("folHlink", hex("slate"))}</a:clrScheme>`
  );
}

/** Replace a theme part's colour scheme with the SMPT one; other theme content is untouched. */
export function brandThemeXml(xml: string): string {
  return xml.replace(/<a:clrScheme[\s\S]*?<\/a:clrScheme>/, themeColourScheme());
}
