import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { site } from "@/lib/site";

const SLUG = "china-export-control-suspension-extension";
const TITLE = "China Extends Suspension of Six Export-Control Announcements Through January 2027";
const DESCRIPTION =
  "China extends the suspension of six October 2025 export-control announcements through 10 January 2027. The April rare-earth controls and a separate US-directed measure follow different schedules.";

export const metadata: Metadata = {
  title: `${TITLE} — Policy Analysis 001`,
  description: DESCRIPTION,
  alternates: { canonical: `/research/${SLUG}` },
  openGraph: {
    type: "article",
    url: `${site.url}/research/${SLUG}`,
    siteName: site.name,
    title: TITLE,
    description: DESCRIPTION,
  },
};

const mofcom = {
  no58of2026: "https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_91466027f465467985942a639a9485f4.html",
  no70of2025: "https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_b1ec77dd3f0d4762952904df7cdaadec.html",
  no72of2025: "https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_5c68985a6b1a46778e2e8dbff1bb1601.html",
  no46of2024: "https://www.mofcom.gov.cn/zwgk/zcfb/art/2024/art_3d5e990b43424e60828030f58a547b60.html",
  no18of2025: "https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_9c2108ccaf754f22a34abab2fedaa944.html",
  no55of2025: "https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_949f47563b834dad95b0010f375a892c.html",
  no56of2025: "https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_1315078cebe04210bc35c72a4e7f7967.html",
  no57of2025: "https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_59ec4f6bec0b459aa4a30c4bbd0a41c1.html",
  no58of2025: "https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_79646f0161564975a938fe00fee158d5.html",
  no61of2025: "https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_7fc9bff0fb4546ecb02f66ee77d0e5f6.html",
  no62of2025: "https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_6cb42957741440c6984de696b70df9ae.html",
  qa30Oct2025: "https://www.mofcom.gov.cn/syxwfb/art/2025/art_e8453c07ce374814ba65bdb6ff5813c4.html",
} as const;

const sources = [
  { label: "MOFCOM and General Administration of Customs, Announcement No. 58 of 2026 (9 November 2026)", url: mofcom.no58of2026 },
  { label: "MOFCOM and General Administration of Customs, Announcement No. 70 of 2025 (7 November 2025)", url: mofcom.no70of2025 },
  { label: "MOFCOM, Announcement No. 72 of 2025 (9 November 2025)", url: mofcom.no72of2025 },
  { label: "MOFCOM, Announcement No. 46 of 2024 (3 December 2024)", url: mofcom.no46of2024 },
  { label: "MOFCOM and General Administration of Customs, Announcement No. 18 of 2025 (4 April 2025)", url: mofcom.no18of2025 },
  { label: "MOFCOM and General Administration of Customs, Announcement No. 55 of 2025 (superhard materials)", url: mofcom.no55of2025 },
  { label: "MOFCOM and General Administration of Customs, Announcement No. 56 of 2025 (rare-earth equipment and materials)", url: mofcom.no56of2025 },
  { label: "MOFCOM and General Administration of Customs, Announcement No. 57 of 2025 (medium and heavy rare earths)", url: mofcom.no57of2025 },
  { label: "MOFCOM and General Administration of Customs, Announcement No. 58 of 2025 (lithium batteries and graphite anodes)", url: mofcom.no58of2025 },
  { label: "MOFCOM, Announcement No. 61 of 2025 (overseas-related rare-earth items)", url: mofcom.no61of2025 },
  { label: "MOFCOM, Announcement No. 62 of 2025 (rare-earth technologies)", url: mofcom.no62of2025 },
  { label: "MOFCOM spokesperson answers on the Kuala Lumpur consultation arrangement (30 October 2025)", url: mofcom.qa30Oct2025 },
] as const;

const records = [
  { label: "Event: continuation of the suspension (2026)", href: "/events/china-rare-earth-suspension-extension-2026-11" },
  { label: "Event: first suspension (2025)", href: "/events/china-rare-earth-suspension-2025-11" },
  { label: "Control record: suspension continuation", href: "/controls/ctl-cn-ree-2026-11-suspension-continuation" },
] as const;

const scope = [
  {
    announcement: "No. 55 of 2025",
    subject:
      "Superhard materials: synthetic-diamond micropowder and single crystal, wire saws and grinding wheels; DCPCVD equipment and process technology",
    original: "8 November 2025",
    position: "Suspended from 7 November 2025, before its scheduled start",
  },
  {
    announcement: "No. 56 of 2025",
    subject:
      "Rare-earth production and processing equipment; raw and auxiliary materials including ores, flotation reagents and extractants",
    original: "8 November 2025",
    position: "Suspended from 7 November 2025, before its scheduled start",
  },
  {
    announcement: "No. 57 of 2025",
    subject: "Medium and heavy rare earths: holmium, erbium, thulium, europium and ytterbium",
    original: "8 November 2025",
    position: "Suspended from 7 November 2025, before its scheduled start",
  },
  {
    announcement: "No. 58 of 2025",
    subject:
      "Lithium-ion batteries of at least 300 Wh/kg; cathode materials and precursors; artificial-graphite anode materials; related equipment and production technology",
    original: "8 November 2025",
    position: "Suspended from 7 November 2025, before its scheduled start",
  },
  {
    announcement: "No. 61 of 2025, item 1(3)",
    subject: "Chinese-origin Annex 1 items",
    original: "9 October 2025 (on publication)",
    position: "Operative before 7 November 2025; suspended from that date",
  },
  {
    announcement: "No. 61 of 2025, items 1(1) and 1(2)",
    subject: "A 0.1%-by-value threshold (1(1)); Chinese-origin technology used abroad (1(2))",
    original: "1 December 2025",
    position: "Suspended before its scheduled start",
  },
  {
    announcement: "No. 61 of 2025, items 2 to 7",
    subject:
      "End-user and end-use provisions, including presumed denial for foreign military users and for listed importers or end users, case-by-case review for advanced chips and potentially military AI, and a humanitarian exemption",
    original: "No separate date stated in the text",
    position: "Included in the suspension from 7 November 2025",
  },
  {
    announcement: "No. 62 of 2025",
    subject:
      "Rare-earth technologies and technical support, including transfer through licensing, investment, joint research, employment and consulting",
    original: "9 October 2025 (on issue)",
    position: "Operative for about 29 days before the suspension",
  },
] as const;

const timeline = [
  { date: "9 October 2025", event: "Nos. 55, 56, 57, 58, 61 and 62 published; No. 61 item 1(3) and No. 62 take effect" },
  { date: "7 November 2025", event: "No. 70 suspends the six announcements to 10 November 2026" },
  { date: "8 November 2025", event: "Scheduled effective date for Nos. 55, 56, 57 and 58" },
  { date: "9 November 2025", event: "No. 72 suspends paragraph 2 of No. 46 of 2024 to 27 November 2026" },
  { date: "1 December 2025", event: "Scheduled effective date for No. 61 items 1(1) and 1(2)" },
  { date: "9 November 2026", event: "No. 58 of 2026 issued" },
  { date: "10 November 2026", event: "First suspension period ends" },
  { date: "11 November 2026", event: "Continued suspension begins" },
  { date: "27 November 2026", event: "Suspension under No. 72 of 2025 ends" },
  { date: "10 January 2027", event: "Continued suspension ends" },
] as const;

function Src({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-paper-accent underline underline-offset-4 hover:text-paper-foreground"
    >
      {children}
      <span className="sr-only"> (MOFCOM, opens in a new tab)</span>
    </a>
  );
}

const h2 = "font-display text-2xl font-semibold";
const p = "mt-5 font-display text-lg leading-9";
const sectionClass = "scroll-mt-28 border-b border-paper-border py-10";

export default function ChinaSuspensionExtensionPage() {
  return (
    <div data-flush-footer>
      <section className="border-b border-border-strong">
        <Container width="wide" className="py-12 sm:py-20">
          <Link
            href="/research"
            className="font-display text-sm text-muted underline underline-offset-4 hover:text-accent"
          >
            ← Research
          </Link>
          <p className="mt-8 font-display text-sm font-semibold text-accent">Policy Analysis 001</p>
          <h1 className="mt-3 max-w-5xl font-display text-4xl font-medium leading-[1.1] tracking-tight sm:text-6xl">
            {TITLE}
          </h1>
          <p className="mt-6 max-w-3xl font-display text-xl leading-8 text-muted">
            China has kept six October 2025 export-control announcements on hold through 10 January 2027.
            The April 2025 rare-earth controls remain separate, as does another suspension affecting exports to the United States.
          </p>
          <p className="mt-6 font-display text-sm text-muted">
            By{" "}
            <Link href="/about" className="underline underline-offset-4 hover:text-accent">
              Benjamin Yang
            </Link>
            {" · "}9 November 2026{" · "}Research cutoff: 9 November 2026
          </p>
        </Container>
      </section>

      <section className="bg-paper text-paper-foreground">
        <Container width="wide" className="py-12 sm:py-16">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
            <article className="min-w-0 max-w-4xl">
              <section aria-labelledby="operative-text" className={sectionClass}>
                <h2 id="operative-text" className={h2}>
                  China extends the pause to 10 January 2027
                </h2>
                <p className={p}>
                  On 9 November 2026, China’s Ministry of Commerce (MOFCOM) and General Administration of Customs
                  issued <Src href={mofcom.no58of2026}>Announcement No. 58 of 2026</Src>, extending the suspension
                  of six export-control announcements from October 2025. The decision covers joint
                  Announcements Nos. 55–58 and MOFCOM Announcements Nos. 61–62. They continue to be suspended
                  (<span lang="zh-Hans">继续暂停实施</span>) from 11 November 2026 through 10 January 2027.
                </p>
                <p className={p}>
                  The previous suspension, set out in <Src href={mofcom.no70of2025}>Announcement No. 70 of 2025</Src>,
                  lasts through 10 November 2026. The extension starts the next day, leaving no gap.
                  The new period is 61 days long, including both dates. The announcement itself is one
                  sentence: it says the extension was approved, but gives no reason for the decision
                  or the shorter period.
                </p>
              </section>

              <section aria-labelledby="scope" className={sectionClass}>
                <h2 id="scope" className={h2}>
                  What the extension covers
                </h2>
                <p className={p}>
                  The six announcements deal with different parts of the supply chain, from rare-earth processing
                  equipment and technology to lithium batteries, graphite anodes and superhard materials.
                  The operative term <span lang="zh-Hans">暂停实施</span> means “suspend implementation”;
                  the announcements themselves have not been repealed. Their original effective dates
                  differ, as the table shows. All six remain suspended through 10 January 2027.
                </p>
                <div className="mt-6 overflow-x-auto border-y border-paper-border">
                  <table className="w-full min-w-[720px] border-collapse text-left font-display text-sm leading-6">
                    <caption className="sr-only">
                      The six suspended October 2025 announcements: subject, original effective date and position
                    </caption>
                    <thead className="bg-paper-foreground text-paper">
                      <tr>
                        <th scope="col" className="w-[17%] px-3 py-3 font-semibold">Announcement</th>
                        <th scope="col" className="w-[38%] px-3 py-3 font-semibold">Subject</th>
                        <th scope="col" className="w-[17%] px-3 py-3 font-semibold">Original effective date</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scope.map((row, index) => (
                        <tr key={row.announcement} className={index % 2 === 0 ? "bg-paper" : "bg-[#ebe8e0]"}>
                          <th scope="row" className="border-t border-paper-border px-3 py-3 align-top font-semibold">
                            {row.announcement}
                          </th>
                          <td className="border-t border-paper-border px-3 py-3 align-top">{row.subject}</td>
                          <td className="border-t border-paper-border px-3 py-3 align-top">{row.original}</td>
                          <td className="border-t border-paper-border px-3 py-3 align-top">{row.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 font-display text-sm leading-7 text-paper-muted">
                  Texts: <Src href={mofcom.no55of2025}>No. 55</Src>, <Src href={mofcom.no56of2025}>No. 56</Src>,{" "}
                  <Src href={mofcom.no57of2025}>No. 57</Src>, <Src href={mofcom.no58of2025}>No. 58</Src>,{" "}
                  <Src href={mofcom.no61of2025}>No. 61</Src> and <Src href={mofcom.no62of2025}>No. 62</Src> of 2025.
                </p>
                <p className={p}>
                  The April 2025 rare-earth controls follow a different track.
                  <Src href={mofcom.no18of2025}>Announcement No. 18 of 2025</Src> covers samarium,
                  gadolinium, terbium, dysprosium, lutetium, scandium and yttrium. Neither suspension
                  decision includes it, and the source review found no separate instrument suspending
                  those controls.
                </p>
                <p className={p}>
                  Another deadline comes sooner for a measure directed at the United States.
                  <Src href={mofcom.no72of2025}>Announcement No. 72 of 2025</Src> suspends paragraph 2
                  of <Src href={mofcom.no46of2024}>Announcement No. 46 of 2024</Src> through 27 November 2026.
                  That paragraph provides that licences are, in principle, not granted for US-bound
                  dual-use exports of gallium, germanium, antimony and superhard materials, and requires
                  stricter end-user and end-use reviews for graphite. Superhard materials therefore
                  appear under two different suspensions: the US-directed provision ends on 27 November,
                  while No. 55 of 2025 remains suspended through 10 January 2027.
                </p>
              </section>

              <section aria-labelledby="connection" className={sectionClass}>
                <h2 id="connection" className={h2}>
                  The link to the 2025 trade talks
                </h2>
                <p className={p}>
                  The original October 2025 announcements cited State Council approval. In
                  <Src href={mofcom.qa30Oct2025}>a statement on 30 October 2025</Src>, a MOFCOM
                  spokesperson described a China–US arrangement: Washington would suspend its
                  50% penetration rule for one year, while Beijing would suspend the export-control
                  measures announced on 9 October for the same period and study detailed arrangements.
                  <Src href={mofcom.no70of2025}>Announcement No. 70 of 2025</Src> subsequently
                  established the first suspension period.
                </p>
                <p className={p}>
                  The 2025 statement explains the context of that first pause. The November 2026
                  notice provides the new dates without identifying a further negotiating arrangement
                  or the body that approved the extension.
                </p>
                <div className="mt-6 overflow-x-auto border-y border-paper-border">
                  <table className="w-full min-w-[480px] border-collapse text-left font-display text-sm leading-6">
                    <caption className="sr-only">Dates in the 2025 and 2026 suspensions</caption>
                    <thead className="bg-paper-foreground text-paper">
                      <tr>
                        <th scope="col" className="w-[30%] px-3 py-3 font-semibold">Date</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Event</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeline.map((row, index) => (
                        <tr key={row.date} className={index % 2 === 0 ? "bg-paper" : "bg-[#ebe8e0]"}>
                          <th scope="row" className="border-t border-paper-border px-3 py-3 align-top font-semibold">
                            {row.date}
                          </th>
                          <td className="border-t border-paper-border px-3 py-3 align-top">{row.event}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section aria-labelledby="commercial" className={sectionClass}>
                <h2 id="commercial" className={h2}>
                  What the deadline means for buyers and investors
                </h2>
                <p className={p}>
                  For manufacturers and procurement teams, the extension provides more time to plan purchases under
                  the existing suspension. Contracts and deliveries extending beyond 10 January 2027
                  still need a contingency plan. One suspended measure, No. 61 of 2025, would require
                  Chinese licences for certain overseas exports of goods meeting a 0.1%-by-value threshold
                  for specified Chinese-origin rare-earth items or made using specified Chinese technologies.
                  Whether a product meets either test depends on its composition and production process.
                </p>
                <p className={p}>
                  The question also matters for new processing investments. Nos. 56 and 62 of 2025 cover specified
                  equipment, raw and auxiliary materials, technologies and technical support. Projects
                  sourcing those items from China after 10 January may face different licensing
                  requirements if the suspension is not continued. The original announcements, rather
                  than the extension alone, determine which provisions apply to a particular shipment.
                </p>
              </section>

              <section aria-labelledby="uncertainty" className="py-10">
                <h2 id="uncertainty" className={h2}>
                  Two deadlines to watch
                </h2>
                <p className={p}>
                  The separate suspension affecting the US-directed 2024 restrictions is scheduled to end
                  on 27 November 2026. The six October 2025 announcements remain suspended through
                  10 January 2027. The measures overlap on some materials, but the two deadlines
                  arise from different legal instruments.
                </p>
                <p className={p}>
                  As of the 9 November research cutoff, China had published no decision extending the newer
                  suspension beyond 10 January. The original announcements also carry different
                  commencement provisions, including 8 November 2025 for Nos. 55–58 and
                  1 December 2025 for No. 61 items 1(1) and 1(2). Any later change will need to
                  be assessed against the text of the relevant official instrument.
                </p>
              </section>
            </article>

            <aside aria-label="SMPT records" className="lg:pt-10">
              <div className="border-t border-paper-border pt-5">
                <h2 className="font-display text-sm font-semibold">SMPT records</h2>
                <ul className="mt-4 space-y-3">
                  {records.map((record) => (
                    <li key={record.href}>
                      <Link
                        href={record.href}
                        className="font-display text-base font-semibold text-paper-accent underline underline-offset-4 hover:text-paper-foreground"
                      >
                        {record.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      <section className="border-t border-border-strong">
        <Container width="wide" className="py-12 sm:py-16">
          <h2 className="font-display text-2xl font-semibold">Sources</h2>
          <ul className="mt-6 max-w-3xl space-y-3">
            {sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display text-sm text-accent underline underline-offset-4 hover:text-foreground"
                >
                  {source.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </div>
  );
}
