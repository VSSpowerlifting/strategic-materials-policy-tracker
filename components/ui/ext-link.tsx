import { cn } from "@/lib/utils";

/** External link with a consistent affordance. Opens in a new tab. */
export function ExtLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-baseline gap-0.5 text-accent underline-offset-2 hover:underline",
        className,
      )}
    >
      {children}
      <span aria-hidden className="text-[0.8em]">
        ↗
      </span>
    </a>
  );
}
