import { cn } from "@/lib/utils";

type MonogramSize = "sm" | "md" | "lg";

const SIZES: Record<MonogramSize, string> = {
  sm: "h-8 min-w-[2.75rem] px-1.5 text-sm",
  md: "h-11 min-w-[3.25rem] px-2 text-lg",
  lg: "h-16 min-w-[4.5rem] px-3 text-3xl",
};

/**
 * Actor marker — an ISO-code monogram in Archivo on the plate surface inside a
 * hairline frame. Deliberately not a flag image.
 */
export function ActorMonogram({
  code,
  size = "md",
  className,
}: {
  code: string;
  size?: MonogramSize;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center border border-border-strong bg-plate font-display font-semibold tracking-tight text-foreground",
        SIZES[size],
        className,
      )}
    >
      {code}
    </span>
  );
}
