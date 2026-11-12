import Link from "next/link";
import { cn } from "@/lib/utils";

/** A quiet sheet: a hairline and the plate surface. Square, no shadow. Use it only where a box says something. */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("border border-border bg-plate", className)}>{children}</div>
  );
}

/**
 * A ruled list of record rows: a structural rule above and below, hairlines between the rows (each row draws
 * its own), and no box. The default container for explorer results.
 */
export function RecordList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("border-y border-border-strong", className)}>{children}</div>;
}

/** A card that is entirely a navigation target, with a hover affordance. */
export function LinkCard({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group block border border-border bg-plate transition-colors hover:border-border-strong hover:bg-elevated",
        className,
      )}
    >
      {children}
    </Link>
  );
}
