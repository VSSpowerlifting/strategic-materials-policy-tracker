// Deck-composition review: deterministic checks over a deck's slide sequence.
//
//   npm run exhibits:review                       # the demo deck spec
//   npm run exhibits:review -- path/to/slide-specs.json [--strict]
//
// Accepts three manifest shapes:
//   1. an exhibit-system deck spec ({title, cover_lines, slides:[{fixture,label}]});
//   2. a presentation-v2 slide-specs dict ({slides:[{title, scope, kind, sourceLine, mechanism, ...}]});
//   3. an executive-slide-content array ([{title, exhibit, visibleReferences, mechanismAndMaterialLimit, ...}]).
//
// The checks are the "objective" and "heuristic" rows of the Editorial
// Authenticity standard, section 5. They never grant PASS: gates A–E stay human.
// `reviewDeck` is pure so it is unit-tested without the CLI.
import fs from "node:fs";
import path from "node:path";
import { loadDeckSpec, loadFixture, loadRegistry, type PatternSpec } from "./registry";
import { DEMO_DECK_SPEC, REPO } from "./paths";

export type Severity = "HOLD" | "REVIEW" | "INFO";

export interface ReviewSlide {
  index: number;
  title: string;
  subtitle?: string;
  annotation?: string;
  source?: string;
  /** Pattern id (deck spec) or free-text exhibit kind (external manifests). */
  kind: string;
  family?: string;
  tier?: string;
  tableReason?: string;
  /** Cover, divider, closing or appendix slides: exempt from exhibit checks. */
  structural: boolean;
}

export interface Finding {
  severity: Severity;
  rule: string;
  slide?: number;
  message: string;
}

export interface DeckReview {
  shape: "deck-spec" | "slide-specs" | "slide-content";
  slides: ReviewSlide[];
  findings: Finding[];
  familyCounts: Record<string, number>;
}

export const SLIDE_CAP = 20;

/** Boilerplate headline phrases (gate B review triggers, not proof of anything). */
export const STOCK_PHRASES = [
  "key takeaways",
  "overview",
  "deep dive",
  "game changer",
  "game-changer",
  "landscape",
  "unlock",
  "navigating",
  "the road ahead",
  "a closer look",
  "why it matters",
  "what this means",
  "in conclusion",
] as const;

/** Contrastive-negation patterns from section 1 of the standard. */
export const NEGATION_PATTERNS: readonly RegExp[] = [
  /\bnot (just|merely|simply|only)\b[^.]*\bbut\b/i,
  /\bisn'?t (just|merely|simply)\b/i,
  /\bmore than (just|a|an)\b/i,
  /\bgoes beyond\b/i,
  /\bthe question is not whether\b/i,
  /\brather than merely\b/i,
  /\bis no longer enough\b/i,
  /\bthis is not about\b/i,
];

const STRUCTURAL_KIND = /\b(cover|title|closing|close|appendix|divider|section|agenda|contents)\b/i;
const TABLE_KIND = /\b(table|matrix|ledger|grid)\b/i;

const asStr = (x: unknown): string | undefined => (typeof x === "string" && x.trim() ? x.trim() : undefined);

function joinRefs(x: unknown): string | undefined {
  if (Array.isArray(x)) {
    const parts = x.map((v) => (typeof v === "string" ? v : typeof v === "object" && v ? JSON.stringify(v) : "")).filter(Boolean);
    return parts.length ? parts.join("; ") : undefined;
  }
  return asStr(x);
}

/** Normalise any supported manifest into review slides. */
export function normaliseManifest(
  raw: unknown,
  registry: readonly PatternSpec[],
  fixtureLoader: (stem: string) => { pattern: string; title: string; subtitle: string; annotation: string; source: string },
): { shape: DeckReview["shape"]; slides: ReviewSlide[]; findings: Finding[] } {
  const findings: Finding[] = [];
  const byId = new Map(registry.map((p) => [p.id, p]));

  if (Array.isArray(raw)) {
    findings.push({ severity: "INFO", rule: "shape", message: "Executive slide-content array: no subtitle field, so subtitle checks are skipped." });
    const slides = raw.map((r, i): ReviewSlide => {
      const o = (r ?? {}) as Record<string, unknown>;
      // `exhibit` is either a kind string or an object carrying `kind`.
      const ex = o.exhibit;
      const exhibit = asStr(ex) ?? (ex && typeof ex === "object" ? asStr((ex as Record<string, unknown>).kind) ?? "unspecified exhibit" : undefined);
      const kind = exhibit ?? "cover";
      return {
        index: i + 1,
        title: asStr(o.title) ?? "",
        annotation: asStr(o.mechanismAndMaterialLimit),
        source: joinRefs(o.visibleReferences) ?? joinRefs(o.sourceIds),
        kind,
        structural: !exhibit || STRUCTURAL_KIND.test(kind),
      };
    });
    return { shape: "slide-content", slides, findings };
  }

  const o = (raw ?? {}) as Record<string, unknown>;
  const list = Array.isArray(o.slides) ? (o.slides as unknown[]) : [];

  if ("cover_lines" in o) {
    const slides = list.map((s, i): ReviewSlide => {
      const so = (s ?? {}) as Record<string, unknown>;
      const stem = String(so.fixture ?? "");
      let f: ReturnType<typeof fixtureLoader> | undefined;
      try {
        f = fixtureLoader(stem);
      } catch (e) {
        findings.push({ severity: "HOLD", rule: "fixture", slide: i + 2, message: `fixture "${stem}" failed to load: ${e instanceof Error ? e.message : String(e)}` });
      }
      const p = f ? byId.get(f.pattern) : undefined;
      if (f && !p) findings.push({ severity: "HOLD", rule: "registered-pattern", slide: i + 2, message: `pattern "${f.pattern}" is not in the registry` });
      return {
        // Slide 1 is the generated cover; content starts at 2.
        index: i + 2,
        title: f?.title ?? "",
        subtitle: f?.subtitle,
        annotation: f?.annotation,
        source: f?.source,
        kind: f?.pattern ?? stem,
        family: p ? `${p.family_code}. ${p.family}` : undefined,
        tier: p?.editability.tier,
        tableReason: asStr(so.table_reason),
        structural: false,
      };
    });
    return { shape: "deck-spec", slides: [{ index: 1, title: asStr(o.title) ?? "", kind: "cover", structural: true }, ...slides], findings };
  }

  const slides = list.map((s, i): ReviewSlide => {
    const so = (s ?? {}) as Record<string, unknown>;
    const kind = asStr(so.kind) ?? "unspecified";
    const ext = kind.toLowerCase();
    const p = registry.find((x) => x.id === ext || x.name.toLowerCase() === ext);
    return {
      index: typeof so.slide === "number" ? so.slide : i + 1,
      title: asStr(so.title) ?? "",
      subtitle: asStr(so.scope),
      annotation: asStr(so.mechanism),
      source: asStr(so.sourceLine) ?? joinRefs(so.sourceKeys),
      kind,
      family: p ? `${p.family_code}. ${p.family}` : undefined,
      tier: p?.editability.tier,
      tableReason: asStr(so.tableReason) ?? asStr(so.table_reason),
      structural: STRUCTURAL_KIND.test(kind),
    };
  });
  return { shape: "slide-specs", slides, findings };
}

export function reviewSlides(slides: readonly ReviewSlide[], shape: DeckReview["shape"]): { findings: Finding[]; familyCounts: Record<string, number> } {
  const findings: Finding[] = [];
  const add = (severity: Severity, rule: string, message: string, slide?: number) => findings.push({ severity, rule, slide, message });

  if (slides.length > SLIDE_CAP) add("HOLD", "slide-cap", `${slides.length} slides exceeds the ${SLIDE_CAP}-slide cap (all slides, including cover and appendix)`);

  const seen = new Map<string, number>();
  for (const s of slides) {
    const t = s.title.trim();
    if (!t) {
      if (!s.structural) add("HOLD", "title", "missing headline", s.index);
      continue;
    }
    const key = t.toLowerCase().replace(/\s+/g, " ");
    const prev = seen.get(key);
    if (prev !== undefined) add("REVIEW", "duplicate-title", `headline repeats slide ${prev}`, s.index);
    else seen.set(key, s.index);
    if (s.structural) continue;
    if (t.endsWith("?")) add("REVIEW", "question-title", "question-shaped headline; state the finding", s.index);
    if (t.split(/\s+/).length < 4) add("REVIEW", "short-title", `"${t}" is a label, not a finding`, s.index);
    const lower = t.toLowerCase();
    for (const ph of STOCK_PHRASES) if (lower.includes(ph)) add("REVIEW", "stock-phrase", `headline uses "${ph}"`, s.index);
  }

  for (const s of slides) {
    if (s.structural) continue;
    if (!s.source) add("HOLD", "source", "no source line", s.index);
    if (shape !== "slide-content" && !s.subtitle) add("REVIEW", "subtitle", "no subtitle / scope line", s.index);
    if (!s.annotation) add("REVIEW", "annotation", "no interpretation or mechanism text", s.index);
    const prose = [s.title, s.subtitle, s.annotation].filter(Boolean).join(" ");
    for (const re of NEGATION_PATTERNS) {
      const m = prose.match(re);
      if (m) add("REVIEW", "rhetorical-negation", `"${m[0]}" — check for contrastive negation (technical negation is fine)`, s.index);
    }
    const tableish = s.tier === "table" || TABLE_KIND.test(s.kind);
    if (tableish && !s.tableReason) add("REVIEW", "table-reason", `table-type exhibit (${s.kind}) without a recorded reason a chart would not serve`, s.index);
    if (shape !== "deck-spec" && !s.family) add("INFO", "unmapped-kind", `kind "${s.kind}" matches no registry pattern`, s.index);
  }

  // Runs of the same exhibit family (or kind, when unmapped) across content slides.
  const content = slides.filter((s) => !s.structural);
  let run = 1;
  for (let i = 1; i <= content.length; i++) {
    const a = content[i - 1];
    const b = content[i];
    const same = b && (a.family ?? a.kind) === (b.family ?? b.kind);
    if (same) {
      run++;
    } else {
      if (run >= 3) add("REVIEW", "family-run", `${run} consecutive slides use ${a.family ?? a.kind}; check whether the argument needs a different exhibit`, content[i - run].index);
      run = 1;
    }
  }

  const familyCounts: Record<string, number> = {};
  for (const s of content) familyCounts[s.family ?? s.kind] = (familyCounts[s.family ?? s.kind] ?? 0) + 1;
  return { findings, familyCounts };
}

export function reviewDeck(raw: unknown, registry: readonly PatternSpec[] = loadRegistry(), fixtureLoader = loadFixture): DeckReview {
  const n = normaliseManifest(raw, registry, fixtureLoader);
  const r = reviewSlides(n.slides, n.shape);
  const order: Record<Severity, number> = { HOLD: 0, REVIEW: 1, INFO: 2 };
  const findings = [...n.findings, ...r.findings].sort(
    (a, b) => order[a.severity] - order[b.severity] || (a.slide ?? 0) - (b.slide ?? 0),
  );
  return { shape: n.shape, slides: n.slides, findings, familyCounts: r.familyCounts };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const strict = args.includes("--strict");
  const file = path.resolve(args.find((a) => !a.startsWith("--")) ?? DEMO_DECK_SPEC);
  if (file === DEMO_DECK_SPEC) loadDeckSpec(file); // contract-check the spec itself
  const review = reviewDeck(JSON.parse(fs.readFileSync(file, "utf8")));
  console.log(`Deck review · ${path.relative(REPO, file)} · ${review.shape} · ${review.slides.length} slides\n`);
  const counts = { HOLD: 0, REVIEW: 0, INFO: 0 };
  for (const f of review.findings) {
    counts[f.severity]++;
    console.log(`${f.severity.padEnd(6)} ${f.slide !== undefined ? `slide ${String(f.slide).padStart(2)}` : "deck    "}  ${f.rule}: ${f.message}`);
  }
  if (!review.findings.length) console.log("No automated findings.");
  console.log("\nExhibit variety (content slides):");
  for (const [k, v] of Object.entries(review.familyCounts).sort((a, b) => b[1] - a[1])) console.log(`   ${String(v).padStart(2)} × ${k}`);
  console.log(`\n${counts.HOLD} hold · ${counts.REVIEW} review · ${counts.INFO} info`);
  console.log("Automated checks never grant PASS; human gates A–E are required.");
  if (strict && counts.HOLD) process.exit(1);
}
