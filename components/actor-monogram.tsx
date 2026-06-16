import { cn } from "@/lib/utils";

type MonogramSize = "sm" | "md" | "lg";

const SIZES: Record<MonogramSize, string> = {
  sm: "h-8 min-w-[2.75rem] px-1.5 text-sm rounded",
  md: "h-11 min-w-[3.25rem] px-2 text-lg rounded-md",
  lg: "h-16 min-w-[4.5rem] px-3 text-3xl rounded-lg",
};

/**
 * Actor marker — an ISO-code monogram tile in Archivo on the elevated surface
 * with a thin verdigris frame. Deliberately not a flag image.
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
        "inline-flex items-center justify-center border border-accent/35 bg-elevated font-display font-bold tracking-tight text-foreground",
        SIZES[size],
        className,
      )}
    >
      {code}
    </span>
  );
}
