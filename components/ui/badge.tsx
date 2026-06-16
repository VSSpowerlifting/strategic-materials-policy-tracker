import { cn } from "@/lib/utils";
import { TONE_CLASSES, type Tone } from "@/lib/labels";

export function Badge({
  tone = "neutral",
  mono = false,
  className,
  children,
}: {
  tone?: Tone;
  mono?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none",
        mono && "font-mono",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
