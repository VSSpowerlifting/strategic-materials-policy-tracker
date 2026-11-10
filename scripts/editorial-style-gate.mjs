#!/usr/bin/env node
/**
 * Diff-aware editorial gate for published SMPT research pages.
 * CI cannot judge natural voice or verify a human actually inspected a preview.
 * It requires a fresh, page-hash-bound editorial attestation and scans edited
 * JSX paragraphs/headings for high-risk writing patterns.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const RULES = [
  ["rhetorical-negation", /\bnot\s+(?:just|only|merely)\b.{0,120}?\bbut\b/gi,
    "State the substantive finding directly, or document a necessary distinction."],
  ["contrast-after-punctuation", /[;,]\s*(?:it|this|that|they|these)\s+(?:does|do|is|are|can|will)\s+not\b/gi,
    "Describe the operative status directly instead of manufacturing contrast."],
  ["contrast-absence", /\bbut\s+(?:offers?|provides?|gives?|identifies?|includes?)\s+no\b/gi,
    "State what the source establishes; report material omissions naturally."],
  ["artificial-alternative", /\b(?:rather than|instead of)\b/gi,
    "Use a direct positive statement or explain why the distinction matters."],
  ["process-narration", /\b(?:this (?:article|analysis|report|section)\s+(?:examines|explores|looks at|does not|shows)|the table\s+(?:shows|keeps|demonstrates)|our (?:analysis|framework)\s+(?:shows|suggests))\b/gi,
    "Write the actual finding rather than describing the article's method."],
  ["empty-significance", /\b(?:important implications|raises important questions|it(?: is|'s) worth noting)\b/gi,
    "Name the actual regulatory date, condition, investment, or consequence."],
];

function plainProse(text) {
  return text.replace(/\{\s*(?:" "|' ')\s*\}/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\{[^{}]*\}/g, " ")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

function lineAt(source, offset) {
  return 1 + (source.slice(0, offset).match(/\n/g) || []).length;
}

/* JSX link text remains readable; JSX attributes and code expressions are ignored. */
export function extractProseBlocks(source) {
  const blocks = [];
  const re = /<(p|h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/g;
  for (const m of source.matchAll(re)) {
    const text = plainProse(m[2]);
    if (text) blocks.push({
      kind: m[1], text,
      startLine: lineAt(source, m.index),
      endLine: lineAt(source, m.index + m[0].length - 1),
    });
  }
  return blocks;
}

/* Bind attestation to ALL page source, including metadata and data-driven tables. */
export function pageHash(source) {
  return createHash("sha256").update(source).digest("hex");
}

export function parseChangedLineRanges(diff) {
  const ranges = [];
  const re = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm;
  for (const m of diff.matchAll(re)) {
    const start = Math.max(1, Number(m[1]));
    const count = m[2] === undefined ? 1 : Number(m[2]);
    ranges.push({ start, end: start + Math.max(1, count) - 1 });
  }
  return ranges;
}

export function reviewPathForPage(path) {
  const article = /^app\/research\/([^/]+)\/page\.tsx$/.exec(path);
  if (article) return "docs/editorial/reviews/" + article[1] + ".json";
  if (path === "app/research/page.tsx") return "docs/editorial/reviews/research-index.json";
  return null;
}

export function scanChangedProse(source, ranges) {
  const blocks = extractProseBlocks(source).filter(block =>
    ranges.some(range => block.startLine <= range.end && block.endLine >= range.start));
  const findings = [];
  for (const block of blocks) {
    for (const [rule, pattern, suggestion] of RULES) {
      for (const match of block.text.matchAll(pattern)) {
        findings.push({ rule, match: match[0].trim(), paragraph: block.text,
          line: block.startLine, suggestion });
      }
    }
  }
  return { blocks, findings, hash: pageHash(source) };
}

export function validateReview(review, file, hash) {
  const errors = [];
  if (review?.article !== file) errors.push("article must equal " + file);
  if (review?.pageSha256 !== hash) errors.push("pageSha256 is stale; repeat review after page changes");
  if (typeof review?.reviewer !== "string" ||
      review.reviewer.trim().length < 3 ||
      /^(ai|chatgpt|codex|claude|bot)$/i.test(review.reviewer.trim())) {
    errors.push("reviewer must identify the person who actually performed the review");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(review?.reviewDate ?? "")) {
    errors.push("reviewDate must be YYYY-MM-DD");
  }
  for (const key of ["readAllCopy", "desktopPreview", "mobilePreview", "sourceLinksAndFacts"]) {
    const check = review?.checks?.[key];
    if (check?.verified !== true || typeof check.notes !== "string" ||
        check.notes.trim().length < 16) {
      errors.push("checks." + key + " requires verified:true and specific notes (16+ characters)");
    }
  }
  if (!Array.isArray(review?.exceptions)) errors.push("exceptions must be an array");
  return errors;
}

/* Material legal negations can be kept only with a concrete, local rationale. */
export function unresolvedFindings(findings, exceptions) {
  const permitted = Array.isArray(exceptions) ? exceptions : [];
  return findings.filter(item => !permitted.some(x =>
    x?.rule === item.rule &&
    typeof x?.excerpt === "string" && x.excerpt.trim().length >= 18 &&
    item.paragraph.includes(x.excerpt.trim()) &&
    typeof x?.reason === "string" && x.reason.trim().length >= 35
  ));
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }).trimEnd();
}

function main(args) {
  if (args[0] === "--hash") {
    const file = args[1];
    if (!file || !existsSync(file)) throw new Error("Usage: npm run editorial:check -- --hash <article-file>");
    console.log(pageHash(readFileSync(file, "utf8")));
    return;
  }

  const base = process.env.EDITORIAL_BASE_SHA || args[0];
  if (!base || /^0{40}$/.test(base)) throw new Error("EDITORIAL_BASE_SHA must be a valid diff base");
  const changed = git(["diff", "--name-only", "--diff-filter=ACMRT",
    base, "HEAD", "--", "app/research", "docs/editorial/reviews"]).split("\n").filter(Boolean);
  const pages = changed.filter(file => reviewPathForPage(file));
  if (!pages.length) {
    console.log("Editorial gate: no published research page changed.");
    return;
  }
  let failures = 0;
  for (const file of pages) {
    const source = readFileSync(file, "utf8");
    const diff = git(["diff", "--unified=0", base, "HEAD", "--", file]);
    const { blocks, findings, hash } = scanChangedProse(source, parseChangedLineRanges(diff));
    const reviewFile = reviewPathForPage(file);
    if (!changed.includes(reviewFile)) {
      console.error("::error file=" + file + "::Publication page changed without a fresh " + reviewFile);
      console.error("Expected pageSha256: " + hash);
      failures++;
      continue;
    }
    let review;
    try { review = JSON.parse(readFileSync(reviewFile, "utf8")); }
    catch (e) {
      console.error("::error file=" + reviewFile + "::Invalid review JSON: " + e);
      failures++;
      continue;
    }
    for (const message of validateReview(review, file, hash)) {
      console.error("::error file=" + reviewFile + "::" + message);
      failures++;
    }
    const pending = unresolvedFindings(findings, review.exceptions);
    for (const f of pending) {
      console.error("::error file=" + file + ",line=" + f.line +
        "::[" + f.rule + "] " + f.match + " — " + f.suggestion);
      failures++;
    }
    console.log("Editorial gate " + file + ": " + blocks.length + " changed paragraphs/headings, " +
      findings.length + " style flags, " + pending.length + " unresolved.");
  }
  if (failures) throw new Error("Editorial publication gate failed with " + failures + " issue(s).");
  console.log("Editorial publication gate passed. Note: CI cannot independently verify a human review.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main(process.argv.slice(2)); }
  catch (e) { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; }
}
