/**
 * Exact decimal-string arithmetic and formatting for Capital & Control
 * amounts. Amounts are canonical decimal strings (see lib/types.ts); nothing
 * here passes a figure through binary floating point. Kept free of data
 * imports so client components can format figures without bundling the seed.
 */

function splitDecimal(v: string): { int: bigint; scale: number } {
  const [whole, frac = ""] = v.split(".");
  return { int: BigInt(whole + frac), scale: frac.length };
}

const pow10 = (n: number) => BigInt(10) ** BigInt(n);

/** Adds canonical decimal strings exactly; returns a canonical decimal string. */
export function addDecimals(values: readonly string[]): string {
  if (values.length === 0) return "0";
  const parts = values.map(splitDecimal);
  const scale = Math.max(...parts.map((p) => p.scale));
  let sum = BigInt(0);
  for (const p of parts) sum += p.int * pow10(scale - p.scale);
  if (scale === 0) return sum.toString();
  const s = sum.toString().padStart(scale + 1, "0");
  const whole = s.slice(0, s.length - scale);
  const frac = s.slice(s.length - scale).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

/** Compares two canonical decimal strings. */
export function compareDecimals(a: string, b: string): number {
  const pa = splitDecimal(a);
  const pb = splitDecimal(b);
  const scale = Math.max(pa.scale, pb.scale);
  const x = pa.int * pow10(scale - pa.scale);
  const y = pb.int * pow10(scale - pb.scale);
  return x < y ? -1 : x > y ? 1 : 0;
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** "1250000.5" → "1,250,000.5". */
export function groupDecimal(value: string): string {
  const [w, f] = value.split(".");
  return f ? `${groupThousands(w)}.${f}` : groupThousands(w);
}

const SCALES: [number, string][] = [
  [12, "trillion"],
  [9, "billion"],
  [6, "million"],
];

/**
 * A readable rendering of a decimal amount that never rounds a digit away:
 * "400000000" → "400 million", "47668000" → "47.668 million",
 * "8400" → "8,400". Figures with a fractional part are grouped, not scaled.
 */
export function formatDecimalCompact(value: string): string {
  if (value.includes(".")) return groupDecimal(value);
  for (const [digits, word] of SCALES) {
    if (value.length > digits) {
      const whole = value.slice(0, value.length - digits);
      const frac = value.slice(value.length - digits).replace(/0+$/, "");
      return `${groupThousands(whole)}${frac ? `.${frac}` : ""} ${word}`;
    }
  }
  return groupDecimal(value);
}

export function formatMoney(value: string, currency: string): string {
  return `${currency} ${formatDecimalCompact(value)}`;
}

