// Exhibit selection workflow: question type + data traits + item count → ranked
// registry patterns, each with the reason it matched or was rejected.
//
//   npm run exhibits:select -- --question compare-two-observations --traits two-observations --items 6
//
// Pure: `selectPatterns` takes the registry and a query and returns data, so it
// is tested without the CLI. Selection is advisory — the analyst still checks
// the pattern's use_when / avoid_when against the actual evidence.
import { DATA_TRAITS, QUESTION_TYPES, loadRegistry, type DataTrait, type PatternSpec, type QuestionType } from "./registry";

export interface SelectionQuery {
  question: QuestionType;
  traits: DataTrait[];
  items?: number;
}

export interface Candidate {
  pattern: PatternSpec;
  /** Higher is a closer fit: required traits matched, minus unused traits the pattern needs none of. */
  score: number;
  reasons: string[];
}

export interface Rejection {
  pattern: PatternSpec;
  reasons: string[];
}

export interface SelectionResult {
  matches: Candidate[];
  rejected: Rejection[];
}

export function selectPatterns(registry: readonly PatternSpec[], q: SelectionQuery): SelectionResult {
  const traits = new Set(q.traits);
  const matches: Candidate[] = [];
  const rejected: Rejection[] = [];
  for (const p of registry) {
    const fail: string[] = [];
    if (!p.question_types.includes(q.question)) {
      fail.push(`answers ${p.question_types.join(", ")}, not ${q.question}`);
    }
    const missing = p.requires.filter((t) => !traits.has(t));
    if (missing.length) fail.push(`needs data trait(s) ${missing.join(", ")}`);
    const clash = p.incompatible.filter((t) => traits.has(t));
    if (clash.length) fail.push(`incompatible with ${clash.join(", ")}`);
    if (q.items !== undefined) {
      if (q.items < p.capacity.min_items) fail.push(`needs at least ${p.capacity.min_items} ${p.capacity.what}`);
      if (q.items > p.capacity.max_items) {
        fail.push(`holds at most ${p.capacity.max_items} ${p.capacity.what}; use ${p.table_alternative}`);
      }
    }
    if (fail.length) {
      rejected.push({ pattern: p, reasons: fail });
      continue;
    }
    const used = p.requires.length;
    const primary = p.question_types[0] === q.question ? 1 : 0;
    const reasons = [
      `answers "${p.reader_question}"`,
      used ? `uses ${p.requires.join(", ")}` : "needs no special data trait",
      ...(q.items !== undefined ? [`${q.items} ${p.capacity.what} within ${p.capacity.min_items}–${p.capacity.max_items}`] : []),
    ];
    matches.push({ pattern: p, score: used * 2 + primary, reasons });
  }
  matches.sort((a, b) => b.score - a.score || a.pattern.family_code.localeCompare(b.pattern.family_code) || a.pattern.order - b.pattern.order);
  return { matches, rejected };
}

function parseArgs(argv: string[]): SelectionQuery {
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const question = get("--question");
  if (!question || !(QUESTION_TYPES as readonly string[]).includes(question)) {
    throw new Error(`--question must be one of: ${QUESTION_TYPES.join(", ")}`);
  }
  const traits = (get("--traits") ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  for (const t of traits) {
    if (!(DATA_TRAITS as readonly string[]).includes(t)) throw new Error(`unknown trait "${t}"; allowed: ${DATA_TRAITS.join(", ")}`);
  }
  const itemsRaw = get("--items");
  const items = itemsRaw === undefined ? undefined : Number(itemsRaw);
  if (items !== undefined && !Number.isInteger(items)) throw new Error("--items must be an integer");
  return { question: question as QuestionType, traits: traits as DataTrait[], items };
}

if (require.main === module) {
  try {
    const q = parseArgs(process.argv.slice(2));
    const { matches, rejected } = selectPatterns(loadRegistry(), q);
    console.log(`Question: ${q.question} · traits: ${q.traits.join(", ") || "none"}${q.items !== undefined ? ` · items: ${q.items}` : ""}\n`);
    if (!matches.length) console.log("No registered pattern fits. Consider a table, or record a new pattern proposal.\n");
    matches.forEach((m, i) => {
      console.log(`${i + 1}. ${m.pattern.family_code}. ${m.pattern.name} (${m.pattern.id}) — ${m.pattern.editability.tier}`);
      for (const r of m.reasons) console.log(`     · ${r}`);
      console.log(`     use when: ${m.pattern.use_when[0]}`);
      console.log(`     avoid when: ${m.pattern.avoid_when[0]}`);
      console.log(`     table alternative: ${m.pattern.table_alternative}`);
    });
    const near = rejected.filter((r) => r.pattern.question_types.includes(q.question));
    if (near.length) {
      console.log("\nSame question, rejected:");
      for (const r of near) console.log(`   ${r.pattern.id}: ${r.reasons.join("; ")}`);
    }
    console.log("\nSelection is advisory. Check use_when / avoid_when against the evidence before drafting.");
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}
