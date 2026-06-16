import Link from "next/link";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-lg border bg-card", className)}>{children}</div>
  );
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
        "group block rounded-lg border bg-card transition-colors hover:border-border-strong hover:bg-elevated",
        className,
      )}
    >
      {children}
    </Link>
  );
}
