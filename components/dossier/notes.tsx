import type { DossierPayload } from "@/lib/material-dossier";

/**
 * Editorial notes kept from the earlier page. A ledger-gated field appears only if its review entry passed;
 * the downstream list is exempt from the ledger and carries the same label. Each note carries its field name so
 * a check can tell note text from the heading and the lines around it.
 */
export function NotesSection({ payload }: { payload: DossierPayload }) {
  const { fields, downstream } = payload.notes;
  if (!fields.length && !downstream.length) return null;
  return (
    <section id="notes" className="scroll-mt-24">
      <h2 className="border-b border-border pb-2 font-display text-xl font-semibold">Editorial notes (not coded records)</h2>
      <p className="mt-3 text-sm leading-6 text-muted">Written summaries kept from the earlier page, not coded records. A summary appears only if it passed review against the records above; the downstream-use list is exempt from that review and has not been checked against a source.</p>
      <div className="mt-5 space-y-5">
        {fields.map((f) => (
          <div key={f.field}>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">{f.label}</h3>
            <p data-note-field={f.field} className="mt-1 max-w-prose text-pretty text-base leading-7 text-foreground/90">
              {f.text}
            </p>
          </div>
        ))}
        {downstream.length ? (
          <div>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">Typical downstream uses</h3>
            <ul data-note-field="downstreamIndustries" className="mt-1 space-y-1 leading-6 text-foreground/90">
              {downstream.map((d) => (
                <li key={d} className="flex gap-2">
                  <span aria-hidden className="text-accent">
                    ·
                  </span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
