import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { MoneyText } from "@/lib/material-dossier";

/** A row's own amount, in its own currency and qualifier. Never combined with another figure. */
export function Money({ amount, className }: { amount: MoneyText; className?: string }) {
  return (
    <span data-money={amount.text} className={cn("tnum text-foreground", className)}>
      {amount.qualifier ? <span className="text-faint">{amount.qualifier} </span> : null}
      <span className="text-faint">{amount.currency} </span>
      <strong className="font-semibold">{amount.value}</strong>
    </span>
  );
}

/** The amount as the source words it, kept in its own language. */
export function AsStated({ text }: { text: string }) {
  return (
    <span data-as-stated className="block text-xs leading-5 text-faint [overflow-wrap:anywhere]">
      As stated: {text}
    </span>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 shrink-0 items-center rounded border border-border-strong px-1 font-mono text-[10px] text-faint", className)}>
      {children}
    </span>
  );
}

export function SubHeading({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <h4 className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
      {children}
      {note ? <span className="ml-2 normal-case tracking-normal text-faint/80">{note}</span> : null}
    </h4>
  );
}

/** A list that shows its first `limit` items and folds the rest behind a disclosure. */
export function FoldedList<T>({ items, limit, label, render, className }: { items: T[]; limit: number; label: string; render: (item: T) => ReactNode; className?: string }) {
  const shown = items.slice(0, limit);
  const rest = items.slice(limit);
  return (
    <>
      <ul className={className}>{shown.map(render)}</ul>
      {rest.length ? (
        <details className="mt-2 group">
          <summary className="cursor-pointer font-display text-xs font-semibold text-accent hover:text-accent-strong">
            {label} ({items.length})
          </summary>
          <ul className={cn("mt-2", className)}>{rest.map(render)}</ul>
        </details>
      ) : null}
    </>
  );
}
