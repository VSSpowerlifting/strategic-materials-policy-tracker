/**
 * F5-O3b: create a local browser-viewable HTML document using the *real*
 * Lattice Register Tailwind+PostCSS source, without a Next route or server.
 *
 * The one-page artifact is generated only in the gitignored human-review
 * directory. Build/SSR success is NOT a browser or source-review receipt.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import {
  getAllControlMeasures,getAllEvents,getAllFinancialCommitments,
  getAllProjectDesignations,getAllProjectMilestones,getAllProjects,getAllSources,
} from "../lib/data";
import { site } from "../lib/site";
import { buildF5ObservatoryScaffold } from "../lib/f5-observatory-scaffold";
import { PrivateObservatoryReview } from "../components/observatory/private-observatory-review";

export const F5_PREVIEW_DIRECTORY = ".project-execution-review";
export const F5_PREVIEW_HTML = "observatory-preview.html";
export const F5_PREVIEW_QA = "observatory-qa-plan.json";
export const F5_PREVIEW_WIDTHS = [320, 768, 1440] as const;

export type F5PreviewQaPlan = {
  schemaVersion:"f5-local-browser-qa-plan-1";
  audience:"local_maintainer_only";
  artifactSha256:string;
  corpusCutoff:string;
  publicReleaseAuthorized:false;
  originalSourcesIndependentlyReviewed:false;
  browserQaCompleted:false;
  releaseReceiptPresent:false;
  platform:"local_file_without_public_route";
  viewports:readonly {width:number; height:number; outcome:"not_run"}[];
  manualChecks:readonly {id:string; description:string; outcome:"not_run"}[];
  limitations:readonly string[];
};

const manualChecks=[
  ["no_unintended_horizontal_overflow","At 320, 768 and 1440px, verify document stays within viewport except the intentionally scrollable comparison table."],
  ["comparison_keyboard_scroll","Focus comparison region with Tab and confirm horizontal scrolling works with keyboard, including 320px."],
  ["headings_and_navigation","Check heading order, row/column headers, native links, focus visibility and section jump targets."],
  ["source_link_identity","Open sample original publisher links and independently inspect exact source pinpoints and publisher identity."],
  ["null_physical_dates","Unknown physical event dates remain unknown and distinct from source publication/reviewer dates."],
  ["finance_vs_activity","Ensure no summed monetary amount, inferred payout, causal arrow or grant-paid physical progress appears."],
  ["missing_evidence_language","Missing source-reviewed milestones are called an evidence gap, never a project failure or inactivity."],
  ["contrast_and_screen_reader","Inspect real foreground/background contrast and screen-reader table, source-list and casefile navigation."],
  ["small_screen_reading","At 320px check wrap of long project names, finance labels, source URLs and hover/focus targets."],
] as const;

const sha256=(s:string)=>createHash("sha256").update(s,"utf8").digest("hex");

/** Escape a style close-tag even though repository CSS is trusted. */
function cssForStyleTag(css:string):string {
  return css.replace(/<\/style/gi,"<\\/style");
}

/** Pure except for reading the existing tracked CSS. No output files or HTTP. */
export async function buildF5LocalBrowserPreview():Promise<{
  html:string;qaPlan:F5PreviewQaPlan;stylesheetBytes:number;
}>{
  const model=buildF5ObservatoryScaffold({
    events:getAllEvents(),finances:getAllFinancialCommitments(),
    controls:getAllControlMeasures(),designations:getAllProjectDesignations(),
    milestones:getAllProjectMilestones(),projects:getAllProjects(),
    sources:getAllSources(),
  },site.lastUpdated);
  if(model.publicReleaseAuthorized!==false||model.architecture.publicationRouteEnabled!==false||
     model.sourceReviewedCasefilesReadyForManualQa!==0||
     model.cases.length!==4)
    throw new Error("F5 local browser preview refuses changed publication or reviewed-outcome baseline");
  const body=renderToStaticMarkup(createElement(PrivateObservatoryReview,{model}));
  if(!body.includes('data-f5-private-review="true"')||
     body.includes("<script")||
     !body.includes("Publication gate: CLOSED"))
    throw new Error("F5 preview refused an unexpected SSR document");

  // Use the project's existing CSS pipeline, not a duplicate or approximate
  // mini-theme. It compiles Tailwind v4 classes and the real Lattice tokens.
  const stylesheetPath=path.resolve(process.cwd(),"app/globals.css");
  const raw=await readFile(stylesheetPath,"utf8");
  const processed=await postcss([tailwindcss()]).process(raw,{from:stylesheetPath});
  const css=processed.css;
  if(!css.includes("--bg: #12110f")||
     !css.includes("--accent: #e3b04b")||
     !css.includes("overflow-x: auto")||
     !css.includes("grid-template-columns"))
    throw new Error("F5 preview styling not compiled from current Lattice Register Tailwind source");
  // Locally generated page uses system serif/sans/mono fallbacks in place of
  // Next.js self-hosted font assets. No external fonts or network required.
  const fontFallbacks=`:root { --font-archivo: Arial, Helvetica, sans-serif; --font-newsreader: Georgia, "Times New Roman", serif; --font-jetbrains: "Courier New", monospace; }`;
  const head=[
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex, nofollow, noarchive">',
    '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; script-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; img-src data:; base-uri &#39;none&#39;; form-action &#39;none&#39;">',
    '<title>SMPT Observatory | LOCAL INTERNAL PREVIEW — NOT PUBLISHED</title>',
    "<style>",
    cssForStyleTag(fontFallbacks+"\n"+css),
    "</style>",
    "</head>",
    '<body class="antialiased">',
  ].join("\n");
  const html=head+"\n"+body+"\n</body>\n</html>\n";
  // The hash is only of generated preview bytes. Never treat it as an
  // independent publisher checksum or a reviewer signoff.
  const qaPlan:F5PreviewQaPlan={
    schemaVersion:"f5-local-browser-qa-plan-1",
    audience:"local_maintainer_only",
    artifactSha256:sha256(html),
    corpusCutoff:model.curatedCorpusCutoff,
    publicReleaseAuthorized:false,
    originalSourcesIndependentlyReviewed:false,
    browserQaCompleted:false,
    releaseReceiptPresent:false,
    platform:"local_file_without_public_route",
    viewports:F5_PREVIEW_WIDTHS.map(width=>({width,height:width===320?720:width===768?1024:900,outcome:"not_run"})),
    manualChecks:manualChecks.map(([id,description])=>({id,description,outcome:"not_run"})),
    limitations:[
      "This is a local HTML file, not a Next.js page, deployment, or public Observatory route.",
      "Local system font fallbacks may differ from self-hosted fonts on the live site; inspect typography again before release.",
      "SSR and Tailwind CSS compilation do not prove real browser layout, color contrast, keyboard access or screen-reader quality.",
      "The generated SHA-256 pins preview bytes, not original publisher content or an independent human review.",
      "No physical milestones are approved; missing reviewed evidence does not prove site inactivity.",
      "All checks default not_run and must not be replaced by machine-generated human signoff.",
    ],
  };
  return {html,qaPlan,stylesheetBytes:Buffer.byteLength(css,"utf8")};
}
