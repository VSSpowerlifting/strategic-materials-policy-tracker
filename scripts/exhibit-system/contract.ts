// Small runtime-contract helpers for fixture data. Pure; no dependencies.

export class ContractError extends Error {}

export function obj(x: unknown, path: string): Record<string, unknown> {
  if (typeof x !== "object" || x === null || Array.isArray(x)) {
    throw new ContractError(`${path}: expected object`);
  }
  return x as Record<string, unknown>;
}

export function arr(x: unknown, path: string, min = 1): unknown[] {
  if (!Array.isArray(x)) throw new ContractError(`${path}: expected array`);
  if (x.length < min) throw new ContractError(`${path}: expected at least ${min} item(s)`);
  return x;
}

export function str(x: unknown, path: string): string {
  if (typeof x !== "string" || x.trim() === "") {
    throw new ContractError(`${path}: expected non-empty string`);
  }
  return x;
}

export function optStr(x: unknown, path: string): string | undefined {
  return x === undefined || x === null ? undefined : str(x, path);
}

export function num(x: unknown, path: string): number {
  if (typeof x !== "number" || !Number.isFinite(x)) {
    throw new ContractError(`${path}: expected finite number`);
  }
  return x;
}

export function optNum(x: unknown, path: string): number | undefined {
  return x === undefined || x === null ? undefined : num(x, path);
}

export function bool(x: unknown, path: string): boolean {
  if (typeof x !== "boolean") throw new ContractError(`${path}: expected boolean`);
  return x;
}

export function oneOf<T extends string>(x: unknown, allowed: readonly T[], path: string): T {
  const s = str(x, path);
  if (!(allowed as readonly string[]).includes(s)) {
    throw new ContractError(`${path}: "${s}" is not one of ${allowed.join(", ")}`);
  }
  return s as T;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
export function isoDate(x: unknown, path: string): string {
  const s = str(x, path);
  if (!ISO.test(s) || Number.isNaN(Date.parse(`${s}T00:00:00Z`))) {
    throw new ContractError(`${path}: expected ISO date YYYY-MM-DD`);
  }
  return s;
}

export function strList(x: unknown, path: string, min = 1): string[] {
  return arr(x, path, min).map((v, i) => str(v, `${path}[${i}]`));
}

export function numList(x: unknown, path: string, min = 1): number[] {
  return arr(x, path, min).map((v, i) => num(v, `${path}[${i}]`));
}

/** Shared header carried by most quantitative fixtures. */
export interface Measure {
  unit: string;
}
export function measure(o: Record<string, unknown>, path: string): Measure {
  return { unit: str(o.unit, `${path}.unit`) };
}
