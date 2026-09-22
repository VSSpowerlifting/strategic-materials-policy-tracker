"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

/**
 * Copyable citation for a record, plus links to the machine formats.
 *
 * The distinction the copy makes is the point: this cites the *record*, which
 * is this project's coding of an instrument. Anyone making a claim about what a
 * government did should cite that government's own text, which is why the
 * source list sits directly above this block on the page.
 */
export function CiteBlock({
  plain,
  eventId,
  primaryUrls,
}: {
  plain: string;
  eventId: string;
  primaryUrls: string[];
}) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(text: string, which: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      window.setTimeout(() => setCopied((c) => (c === which ? null : c)), 2000);
    } catch {
      // Clipboard can be unavailable (insecure context, denied permission).
      // The text is selectable on the page, so failing quietly is fine.
      setCopied(null);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="font-display font-semibold tracking-tight">Cite this record</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
        This cites the record — the project&apos;s coding of the instrument. For a claim about what
        a government actually did, cite the primary document itself; the sources above carry the
        canonical URLs.
      </p>

      <p className="mt-3 select-all rounded-md border border-border bg-elevated p-3 font-mono text-xs leading-5 text-muted">
        {plain}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => copy(plain, "plain")}
          className="rounded-md border border-border px-3 py-1.5 font-display text-xs text-foreground transition-colors hover:border-accent/50 hover:text-accent"
        >
          {copied === "plain" ? "Copied" : "Copy citation"}
        </button>
        {primaryUrls.length > 0 ? (
          <button
            type="button"
            onClick={() => copy(primaryUrls.join("\n"), "urls")}
            className="rounded-md border border-border px-3 py-1.5 font-display text-xs text-foreground transition-colors hover:border-accent/50 hover:text-accent"
          >
            {copied === "urls" ? "Copied" : `Copy ${primaryUrls.length} source URL${primaryUrls.length === 1 ? "" : "s"}`}
          </button>
        ) : null}
        <span className="ml-1 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
          Whole corpus:
        </span>
        {[
          ["BibTeX", "/api/cite/bibtex"],
          ["RIS", "/api/cite/ris"],
          ["CSL-JSON", "/api/cite/csl"],
        ].map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="font-display text-xs text-accent hover:text-accent-strong"
          >
            {label}
          </a>
        ))}
        <a
          href={`/api/v1/events/${eventId}`}
          className="font-display text-xs text-accent hover:text-accent-strong"
        >
          JSON
        </a>
      </div>
    </Card>
  );
}
