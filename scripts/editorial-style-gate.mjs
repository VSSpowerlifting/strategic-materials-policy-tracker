#!/usr/bin/env node
/**
 * Diff-aware editorial gate for published SMPT research pages.
 * CI cannot judge natural voice or verify a human actually inspected a preview.
 * It requires a fresh editorial attestation bound to a page's research content
 * and scans edited JSX paragraphs/headings for high-risk writing patterns.
 *
 * The attestation binds to a content fingerprint, not to the raw file. The
 * fingerprint covers everything a reader or a citation depends on: visible
 * text, metadata, data arrays and tables, numbers, links, image sources, alt
 * text and the page's own logic. It leaves out presentation: class names,
 * inline styles, element and component names, wrapper elements, layout props,
 * anchors and imports used only for markup. A layout or styling change
 * therefore keeps an attestation valid, and any change to the research
 * content, a figure, a citation or source evidence still requires a new one.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

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

/* Exact-source hash. Records made before the content fingerprint carry it as pageSha256. */
export function pageHash(source) {
  return createHash("sha256").update(source).digest("hex");
}

/*
 * Presentation attributes: their values never reach the fingerprint. Keep this
 * list to attributes that cannot carry research content. Anything absent from
 * it counts as content, so an unknown attribute fails safe.
 */
const PRESENTATION_ATTRIBUTES = new Set([
  "className", "class", "style", "id", "key", "ref", "role", "tabIndex",
  "width", "height", "sizes", "priority", "loading", "decoding", "fetchPriority",
  "colSpan", "rowSpan", "scope", "target", "rel", "open",
  "variant", "size", "tone", "align", "layout", "as",
]);
/* aria-* that name or describe something are reader-facing text and stay in the fingerprint. */
const TEXTUAL_ARIA = new Set([
  "aria-label", "aria-description", "aria-roledescription", "aria-valuetext", "aria-placeholder",
]);
/* Attributes whose name is kept beside the value, so swapping two of them is a content change. */
const NAMED_ATTRIBUTES = new Set([
  "href", "src", "srcSet", "poster", "alt", "title", "cite", "dateTime", "lang",
  "download", "content", "name", "value", ...TEXTUAL_ARIA,
]);

export function isPresentationAttribute(name) {
  if (PRESENTATION_ATTRIBUTES.has(name)) return true;
  if (name.startsWith("data-")) return true;
  if (name.startsWith("aria-")) return !TEXTUAL_ARIA.has(name);
  return false;
}

const FINGERPRINT_VERSION = "smpt-editorial-content-v1";

function isJsxNode(node) {
  return ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node);
}

/* A constant that can only hold class names: a string, or an object/array of strings. */
function isClassValue(node) {
  if (!node) return false;
  if (ts.isAsExpression(node) || ts.isParenthesizedExpression(node) || ts.isSatisfiesExpression?.(node)) {
    return isClassValue(node.expression);
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return true;
  if (ts.isArrayLiteralExpression(node)) return node.elements.every(isClassValue);
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.every(p => ts.isPropertyAssignment(p) && isClassValue(p.initializer));
  }
  return false;
}

/* Names referenced anywhere other than a JSX tag position or a presentation attribute. */
function contentReferences(sf) {
  const names = new Set();
  const visit = (node, presentation) => {
    if (ts.isImportDeclaration(node) || ts.isJsxClosingElement(node)) return;
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      for (const attribute of node.attributes.properties) visit(attribute, presentation);
      return;
    }
    if (ts.isJsxAttribute(node)) {
      if (node.initializer) {
        visit(node.initializer, presentation || isPresentationAttribute(node.name.getText(sf)));
      }
      return;
    }
    if (ts.isIdentifier(node)) {
      const declares = ts.isVariableDeclaration(node.parent) && node.parent.name === node;
      if (!presentation && !declares) names.add(node.text);
      return;
    }
    ts.forEachChild(node, child => visit(child, presentation));
  };
  visit(sf, false);
  return names;
}

function importBindings(node) {
  const clause = node.importClause;
  if (!clause) return [];
  const names = [];
  if (clause.name) names.push(clause.name.text);
  const bindings = clause.namedBindings;
  if (bindings && ts.isNamespaceImport(bindings)) names.push(bindings.name.text);
  if (bindings && ts.isNamedImports(bindings)) for (const el of bindings.elements) names.push(el.name.text);
  return names;
}

/*
 * The ordered research content of a page, as tokens. Text split by markup stays
 * split, so adding or removing a link or emphasis around a phrase is a content
 * change; the element used to carry the text is not.
 */
export function contentTokens(source) {
  const sf = ts.createSourceFile("page.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const referenced = contentReferences(sf);
  const tokens = [];

  const emitAttributes = (attributes) => {
    for (const attribute of attributes.properties) {
      if (ts.isJsxSpreadAttribute(attribute)) { emit(attribute.expression); continue; }
      const name = attribute.name.getText(sf);
      if (isPresentationAttribute(name) || !attribute.initializer) continue;
      if (NAMED_ATTRIBUTES.has(name)) tokens.push("@" + name);
      emit(attribute.initializer);
    }
  };

  const emit = (node) => {
    if (node.kind >= ts.SyntaxKind.FirstJSDocNode && node.kind <= ts.SyntaxKind.LastJSDocNode) return;
    if (ts.isImportDeclaration(node) && !importBindings(node).some(name => referenced.has(name))) return;
    if (ts.isVariableStatement(node) && node.parent === sf &&
        !node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) &&
        node.declarationList.declarations.every(d =>
          ts.isIdentifier(d.name) && !referenced.has(d.name.text) && isClassValue(d.initializer))) return;
    if (ts.isJsxElement(node)) {
      emitAttributes(node.openingElement.attributes);
      node.children.forEach(emit);
      return;
    }
    if (ts.isJsxSelfClosingElement(node)) { emitAttributes(node.attributes); return; }
    if (ts.isJsxFragment(node)) { node.children.forEach(emit); return; }
    if (ts.isJsxText(node)) {
      const text = node.text.replace(/\s+/g, " ").trim();
      if (text) tokens.push("T:" + text);
      return;
    }
    if (ts.isJsxExpression(node)) {
      const inner = node.expression;
      if (!inner) return;
      /* {" "} is JSX spacing, which a formatter adds and removes freely. */
      if ((ts.isStringLiteral(inner) || ts.isNoSubstitutionTemplateLiteral(inner)) && !inner.text.trim()) return;
      emit(inner);
      return;
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      tokens.push("S:" + node.text);
      return;
    }
    if (ts.isParenthesizedExpression(node) && isJsxNode(node.expression)) { emit(node.expression); return; }
    const children = node.getChildren(sf);
    if (!children.length) {
      const kind = node.kind;
      if (kind === ts.SyntaxKind.CommaToken || kind === ts.SyntaxKind.SemicolonToken ||
          kind === ts.SyntaxKind.EndOfFileToken) return;
      tokens.push(node.getText(sf));
      return;
    }
    children.forEach(emit);
  };

  emit(sf);
  return tokens;
}

/* What an attestation binds to: every content token, in order. */
export function contentFingerprint(source) {
  return createHash("sha256")
    .update(FINGERPRINT_VERSION + "\n" + JSON.stringify(contentTokens(source)))
    .digest("hex");
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

/* Inverse of reviewPathForPage, so a changed record is checked against its page. */
export function pageForReviewPath(path) {
  if (path === "docs/editorial/reviews/research-index.json") return "app/research/page.tsx";
  const record = /^docs\/editorial\/reviews\/([^/]+)\.json$/.exec(path);
  return record ? "app/research/" + record[1] + "/page.tsx" : null;
}

export function scanChangedProse(source, ranges, baseSource) {
  /* A paragraph whose words already stood at the base was restyled, not rewritten. */
  const standing = new Set(typeof baseSource === "string"
    ? extractProseBlocks(baseSource).map(block => block.text) : []);
  const blocks = extractProseBlocks(source).filter(block =>
    !standing.has(block.text) &&
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
  /* hash: { content, page }. A bare string is the exact-source hash, as older callers pass it. */
  const expected = typeof hash === "string" ? { page: hash } : (hash ?? {});
  const boundToContent = typeof review?.contentSha256 === "string" &&
    expected.content !== undefined && review.contentSha256 === expected.content;
  const boundToSource = typeof review?.pageSha256 === "string" &&
    expected.page !== undefined && review.pageSha256 === expected.page;
  if (!boundToContent && !boundToSource) {
    errors.push((review?.contentSha256 !== undefined ? "contentSha256" : "pageSha256") +
      " is stale; repeat review after research content changes");
  }
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

function gitShow(revision, file) {
  try {
    return execFileSync("git", ["show", revision + ":" + file],
      { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
  } catch { return null; }
}

function main(args) {
  if (args[0] === "--hash") {
    const file = args[1];
    if (!file || !existsSync(file)) throw new Error("Usage: npm run editorial:check -- --hash <article-file>");
    console.log(contentFingerprint(readFileSync(file, "utf8")));
    return;
  }

  const base = process.env.EDITORIAL_BASE_SHA || args[0];
  if (!base || /^0{40}$/.test(base)) throw new Error("EDITORIAL_BASE_SHA must be a valid diff base");
  const changed = git(["diff", "--name-only", "--diff-filter=ACMRT",
    base, "HEAD", "--", "app/research", "docs/editorial/reviews"]).split("\n").filter(Boolean);
  // A record changed on its own is validated too, so a draft record with
  // unchecked fields cannot pass simply because its page did not change.
  const pages = [...new Set([
    ...changed.filter(file => reviewPathForPage(file)),
    ...changed.map(pageForReviewPath).filter(file => file && existsSync(file)),
  ])];
  if (!pages.length) {
    console.log("Editorial gate: no published research page or review record changed.");
    return;
  }
  let failures = 0;
  for (const file of pages) {
    const source = readFileSync(file, "utf8");
    const baseSource = gitShow(base, file);
    const hashes = { content: contentFingerprint(source), page: pageHash(source) };
    const reviewFile = reviewPathForPage(file);
    if (!changed.includes(reviewFile)) {
      // The page changed and its record did not. That is allowed only when the
      // research content is identical to the base: a presentation-only change.
      if (baseSource !== null && contentFingerprint(baseSource) === hashes.content) {
        console.log("Editorial gate " + file + ": presentation-only change; research content matches the base (" +
          hashes.content.slice(0, 12) + "), so no new review record is required.");
        continue;
      }
      console.error("::error file=" + file + "::Publication content changed without a fresh " + reviewFile);
      console.error("Expected contentSha256: " + hashes.content);
      failures++;
      continue;
    }
    const diff = git(["diff", "--unified=0", base, "HEAD", "--", file]);
    const { blocks, findings } = scanChangedProse(source, parseChangedLineRanges(diff), baseSource);
    let review;
    try { review = JSON.parse(readFileSync(reviewFile, "utf8")); }
    catch (e) {
      console.error("::error file=" + reviewFile + "::Invalid review JSON: " + e);
      failures++;
      continue;
    }
    for (const message of validateReview(review, file, hashes)) {
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
