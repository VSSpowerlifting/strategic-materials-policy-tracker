import Link from "next/link";
import { Section } from "@/components/ui/container";
import { formatDate, formatDateLong } from "@/lib/format";
import {
  magnetFacilities,
  monitorSources,
  monitorUpdate,
  type MonitorCitation,
} from "@/lib/industrial-execution-monitor";

function Citations({ citations }: { citations: readonly MonitorCitation[] }) {
  return (
    <ul aria-label="Sources" className="mt-1.5 space-y-1 text-xs leading-5 text-faint">
      {citations.map(({ source, locator }) => {
        const { label, publishedOn, url } = monitorSources[source];
        return (
          <li key={`${source}-${locator}`}>
            <a href={url} className="link-quiet font-medium text-accent" target="_blank" rel="noopener noreferrer">
              {label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            {" · "}
            <time dateTime={publishedOn}>{formatDate(publishedOn)}</time>
            {" · "}{locator}
          </li>
        );
      })}
    </ul>
  );
}

export function IndustrialExecutionMonitor() {
  return (
    <Section
      id="industrial-execution-monitor"
      title="Industrial Execution Monitor"
      description="Three publicly backed rare-earth magnet plants, from construction to customer delivery."
      className="mt-12"
    >
      <p className="mb-3 text-xs text-faint">
        Evidence reviewed through <time dateTime={monitorUpdate.researchCutoff}>{formatDateLong(monitorUpdate.researchCutoff)}</time>
      </p>
      <article aria-labelledby="execution-monitor-update" className="mb-6 border-l-2 border-accent bg-elevated px-4 py-4 sm:px-5">
        <p className="text-xs font-medium text-muted">
          First update · <time dateTime={monitorUpdate.date}>{formatDateLong(monitorUpdate.date)}</time>
        </p>
        <h3 id="execution-monitor-update" className="mt-1 font-display text-lg font-semibold">{monitorUpdate.title}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{monitorUpdate.finding.text}</p>
        <Citations citations={monitorUpdate.finding.citations} />
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          <strong className="font-semibold text-foreground">SMPT assessment.</strong>{" "}
          {monitorUpdate.evidenceToWatch}
        </p>
      </article>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-y-0">
        {magnetFacilities.map(({ projectId, name, location, reported, schedule, context, next }) => (
          <article
            key={projectId}
            aria-labelledby={`monitor-${projectId}`}
            className="min-w-0 border border-border bg-plate lg:row-span-4 lg:grid lg:grid-rows-subgrid"
          >
            <header className="border-t-2 border-accent px-4 py-3">
              <h3 id={`monitor-${projectId}`} className="font-display text-base font-semibold leading-snug">
                <Link href={`/projects/${projectId}`} className="link-quiet text-accent">{name}</Link>
              </h3>
              <p className="mt-1 text-xs text-faint">{location}</p>
            </header>

            <div className="border-t px-4 py-3 text-sm leading-6 text-muted">
              <h4 className="font-semibold text-foreground">Reported progress</h4>
              <p className="mt-1">
                <strong className="font-medium text-foreground">{reported.timing}.</strong>{" "}
                {reported.text}
              </p>
              <Citations citations={reported.citations} />
            </div>

            <div className="border-t px-4 py-3 text-sm leading-6 text-muted">
              <h4 className="font-semibold text-foreground">Schedule</h4>
              <p className="mt-1 font-medium text-foreground">{schedule.milestone} · {schedule.phase}</p>
              <ol className="mt-2 space-y-2.5">
                {schedule.targets.map((target, index) => (
                  <li key={target.citations[0].source}>
                    <p>
                      <strong className="font-medium text-foreground">
                        {index === 0 ? "Earliest target" : index === schedule.targets.length - 1 ? "Latest target" : "Interim target"}{" · "}
                        {target.timing}.
                      </strong>{" "}
                      {target.text}
                    </p>
                    <Citations citations={target.citations} />
                  </li>
                ))}
              </ol>
              {schedule.outcome ? (
                <div className="mt-2.5">
                  <p>
                    <strong className="font-medium text-foreground">Reported outcome · {schedule.outcome.timing}.</strong>{" "}
                    {schedule.outcome.text}
                  </p>
                  <Citations citations={schedule.outcome.citations} />
                </div>
              ) : null}
              <p className="mt-2.5">
                <strong className="font-medium text-foreground">SMPT assessment.</strong>{" "}
                {schedule.assessment}
              </p>
              {context ? (
                <details className="mt-2">
                  <summary className="min-h-11 w-fit cursor-pointer py-2.5 text-accent underline underline-offset-4">
                    Earlier disclosures
                  </summary>
                  <p>{context.text}</p>
                  <Citations citations={context.citations} />
                </details>
              ) : null}
            </div>

            <div className="border-t px-4 py-3 text-sm leading-6 text-muted">
              <h4 className="font-semibold text-foreground">Next evidence to watch</h4>
              {next.target ? (
                <>
                  <p className="mt-1">
                    <strong className="font-medium text-foreground">Issuer target · {next.target.timing}.</strong>{" "}
                    {next.target.text}
                  </p>
                  <Citations citations={next.target.citations} />
                </>
              ) : null}
              <p className="mt-2">
                <strong className="font-medium text-foreground">SMPT assessment.</strong>{" "}
                {next.evidenceToWatch}
              </p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
