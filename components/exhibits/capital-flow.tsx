/**
 * Capital-flow exhibit for one event: who provides what to whom, and whether each recorded row is
 * cash paid, a commitment not yet paid, contingent support, a commercial term, private money or a
 * row that has ended. The model and every classification rule live in lib/capital-flow; nothing
 * here is specific to an event, and no amount is ever added to another.
 */
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buildCapitalFlowModel } from "@/lib/capital-flow";
import { buildCapitalFlowTimeline } from "@/lib/capital-flow-timeline";
import { CapitalFlowInteractive } from "./capital-flow-interactive";
import { ReplayControls, ReplayLegend } from "./capital-flow-replay";
import { CapitalFlowReplay, ListedStatus, ReplayAsOf } from "./capital-flow-replay-state";

export function CapitalFlowExhibit({
  eventId,
  headingLevel = 2,
  density = "full",
  className,
}: {
  eventId: string;
  headingLevel?: 2 | 3;
  /** "summary" is for pages where the exhibit is a preview: the diagram stands without the list of rows under it. */
  density?: "full" | "summary";
  className?: string;
}) {
  const model = buildCapitalFlowModel(eventId);
  if (!model || !model.hasIdentifiedParties) return null;
  // Dated states of the same lines, for the status replay. One step means the record shows no change to replay.
  const timeline = buildCapitalFlowTimeline(model);
  const headlines = Object.fromEntries([...model.flows, ...model.listed].map((r) => [r.id, r.headline]));

  const Heading = headingLevel === 2 ? "h2" : "h3";
  const Sub = headingLevel === 2 ? "h3" : "h4";
  const titleId = `capflow-title-${model.eventId}`;

  return (
    // `data-motion-kind` keeps the site-wide entrance off the exhibit: its lines have their own draw.
    <figure className={cn("@container", className)} aria-labelledby={titleId} data-motion-kind="flow">
      <CapitalFlowReplay timeline={timeline} headlines={headlines}>
        <figcaption className="title-block">
          <Heading id={titleId} className="display-3 text-foreground">
            Paid, promised or conditional
          </Heading>
          <p className="mt-2 max-w-2xl text-pretty font-display text-sm leading-6 text-muted">
            <Link href={model.eventHref} className="link-quiet">
              {model.eventTitle}
            </Link>
            , {model.eventDateLabel}. <ReplayAsOf latestLabel={model.asOfLabel} />
          </p>
          <hr className="sheet-rule mt-6 w-full" data-centre="" />
        </figcaption>

        <section className="mt-6" aria-label="Key">
          <ReplayLegend latest={model.legend} />
        </section>

        {/* The dates sit directly above the lines they change, and their bar is bounded by this block. */}
        <div>
          <ReplayControls titleId={titleId} headingLevel={headingLevel} latestLegend={model.legend} />
          <div className="mt-8">
            <CapitalFlowInteractive model={model} headingLevel={headingLevel} density={density} />
          </div>
        </div>

        {model.listed.length ? (
          <section className="mt-8" aria-labelledby={`${titleId}-listed`}>
            <Sub id={`${titleId}-listed`} className="label border-b border-border-strong pb-2">
              Also recorded for this event, not drawn
            </Sub>
            <ul>
              {model.listed.map((row) => (
                <li key={row.id} className="border-b border-border py-3 font-display text-sm leading-6">
                  <span className="tnum font-semibold text-foreground">{row.headline}</span>
                  <span className="text-muted">
                    {row.providerText ? `. ${row.providerText}` : ""}
                    {row.recipientText ? ` to ${row.recipientText}` : ""}. <ListedStatus id={row.id} latestText={row.status.text} />.{" "}
                    {row.reason}{" "}
                  </span>
                  <Link href={row.href} className="link-quiet">
                    Commitment details
                  </Link>
                  {row.sources.length ? (
                    <span className="text-muted">
                      . Source:{" "}
                      {row.sources.map((s, i) => (
                        <span key={s.id}>
                          {i > 0 ? "; " : null}
                          <a href={s.url} rel="noreferrer" className="link-quiet">
                            {s.title}
                          </a>
                        </span>
                      ))}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-6 font-display text-xs leading-5 text-faint">
          <p>
            Each amount is quoted as its source states it, in the original currency, and no amount is added to another.
            Line style shows the kind of relationship, not the size of the amount.
          </p>
          <p className="mt-2">
            Sources:{" "}
            {model.sources.map((s, i) => (
              <span key={s.id}>
                {i > 0 ? "; " : null}
                <a href={s.url} rel="noreferrer" className="link-quiet">
                  {s.title}
                </a>
                {s.published ? ` (${s.published})` : ""}
              </span>
            ))}
            .
          </p>
        </div>
      </CapitalFlowReplay>
    </figure>
  );
}
