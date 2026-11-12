/**
 * Font-resolution guard for publication builds. A deck, memo or cover must not
 * quietly render in a substitute face, so a missing family stops the build.
 * PowerPoint cannot embed fonts; the PDF export is the canonical, font-embedded
 * form (verify with `pdffonts`). No font binaries are committed or shipped.
 *
 * `SMPT_ALLOW_MISSING_FONTS=1` downgrades the failure to a warning. Use it only
 * for structure-only runs (tests, editability checks); never for a deliverable.
 */
import { execFileSync } from "node:child_process";

import { FONT_EDITORIAL, FONT_TEXT } from "./tokens";

let cache: string | null = null;

function installedFamilies(): string {
  if (cache === null) {
    try {
      cache = execFileSync("fc-list", [":", "family"], { encoding: "utf8" });
    } catch {
      cache = "";
    }
  }
  return cache;
}

export function fontResolves(family: string): boolean {
  return installedFamilies()
    .split("\n")
    .some((line) => line.split(",").some((name) => name.trim().toLowerCase() === family.toLowerCase()));
}

export function missingFonts(families: string[] = [FONT_EDITORIAL, FONT_TEXT]): string[] {
  return families.filter((f) => !fontResolves(f));
}

/** Throws when a required family does not resolve, unless SMPT_ALLOW_MISSING_FONTS=1. */
export function assertFonts(families: string[] = [FONT_EDITORIAL, FONT_TEXT]): void {
  const missing = missingFonts(families);
  if (!missing.length) return;
  const message =
    `Required publication font(s) not installed: ${missing.join(", ")}. ` +
    "Install them locally (nothing is committed to the repository) or set SMPT_ALLOW_MISSING_FONTS=1 " +
    "for a structure-only run. A deliverable must never be built with a substitute face.";
  if (process.env.SMPT_ALLOW_MISSING_FONTS === "1") {
    console.warn(`warning: ${message}`);
    return;
  }
  throw new Error(message);
}
