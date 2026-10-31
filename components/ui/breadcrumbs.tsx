import Link from "next/link";
import { cn } from "@/lib/utils";

export type Crumb = { href?: string; label: string };

/**
 * Where a detail page sits in its research journey. The last crumb is the page itself and is never a link, so
 * the trail always reads parent › … › here.
 */
export function Breadcrumbs({ items, className }: { items: readonly Crumb[]; className?: string }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" className={cn("font-display text-sm text-muted", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-2">
              {last || !c.href ? (
                <span aria-current={last ? "page" : undefined} className={cn("min-w-0 truncate", last && "text-foreground")}>
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="hover:text-foreground">
                  {c.label}
                </Link>
              )}
              {last ? null : (
                <span aria-hidden className="text-faint">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
