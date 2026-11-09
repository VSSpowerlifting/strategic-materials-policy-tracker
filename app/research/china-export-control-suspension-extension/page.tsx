import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { site } from "@/lib/site";

const SLUG = "china-export-control-suspension-extension";
const TITLE = "China Extends the Suspension of Six Export-Control Announcements Through January 10, 2027";
const DESCRIPTION =
  "With the November 10 deadline one day away, China has extended its pause on six October 2025 export-control announcements through January 10, 2027. Earlier rare-earth controls and a separate U.S.-directed measure have different deadlines.";

export const metadata: Metadata = {
  title: `${TITLE} — Policy Research`,
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
  { label: "MOFCOM and General Administration of Customs, Announcement No. 58 of 2026 (November 9, 2026)", url: mofcom.no58of2026 },
  { label: "MOFCOM and General Administration of Customs, Announcement No. 70 of 2025 (November 7, 2025)", url: mofcom.no70of2025 },
  { label: "MOFCOM, Announcement No. 72 of 2025 (November 9, 2025)", url: mofcom.no72of2025 },
  { label: "MOFCOM, Announcement No. 46 of 2024 (December 3, 2024)", url: mofcom.no46of2024 },
  { label: "MOFCOM and General Administration of Customs, Announcement No. 18 of 2025 (April 4, 2025)", url: mofcom.no18of2025 },
  { label: "MOFCOM and General Administration of Customs, Announcement No. 55 of 2025 (superhard materials)", url: mofcom.no55of2025 },
  { label: "MOFCOM and General Administration of Customs, Announcement No. 56 of 2025 (rare-earth equipment and materials)", url: mofcom.no56of2025 },
  { label: "MOFCOM and General Administration of Customs, Announcement No. 57 of 2025 (medium and heavy rare earths)", url: mofcom.no57of2025 },
  { label: "MOFCOM and General Administration of Customs, Announcement No. 58 of 2025 (lithium batteries and graphite anodes)", url: mofcom.no58of2025 },
  { label: "MOFCOM, Announcement No. 61 of 2025 (overseas-related rare-earth items)", url: mofcom.no61of2025 },
  { label: "MOFCOM, Announcement No. 62 of 2025 (rare-earth technologies)", url: mofcom.no62of2025 },
  { label: "MOFCOM spokesperson answers on the Kuala Lumpur consultation arrangement (October 30, 2025)", url: mofcom.qa30Oct2025 },
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
    original: "November 8, 2025",
    position: "Suspended from November 7, 2025, before its scheduled start",
  },
  {
    announcement: "No. 56 of 2025",
    subject:
      "Rare-earth production and processing equipment; raw and auxiliary materials including ores, flotation reagents and extractants",
    original: "November 8, 2025",
    position: "Suspended from November 7, 2025, before its scheduled start",
  },
  {
    announcement: "No. 57 of 2025",
    subject: "Medium and heavy rare earths: holmium, erbium, thulium, europium and ytterbium",
    original: "November 8, 2025",
    position: "Suspended from November 7, 2025, before its scheduled start",
  },
  {
    announcement: "No. 58 of 2025",
    subject:
      "Lithium-ion batteries of at least 300 Wh/kg; cathode materials and precursors; artificial-graphite anode materials; related equipment and production technology",
    original: "November 8, 2025",
    position: "Suspended from November 7, 2025, before its scheduled start",
  },
  {
    announcement: "No. 61 of 2025, item 1(3)",
    subject: "Chinese-origin Annex 1 items",
    original: "October 9, 2025 (on publication)",
    position: "Operative before November 7, 2025; suspended from that date",
  },
  {
    announcement: "No. 61 of 2025, items 1(1) and 1(2)",
    subject: "A 0.1%-by-value threshold (1(1)); Chinese-origin technology used abroad (1(2))",
    original: "December 1, 2025",
    position: "Suspended before its scheduled start",
  },
  {
    announcement: "No. 61 of 2025, items 2 to 7",
    subject:
      "End-user and end-use provisions, including presumed denial for foreign military users and for listed importers or end users, case-by-case review for advanced chips and potentially military AI, and a humanitarian exemption",
    original: "No separate date stated in the text",
    position: "Included in the suspension from November 7, 2025",
  },
  {
    announcement: "No. 62 of 2025",
    subject:
      "Rare-earth technologies and technical support, including transfer through licensing, investment, joint research, employment and consulting",
    original: "October 9, 2025 (on issue)",
    position: "Operative for about 29 days before the suspension",
  },
] as const;

const timeline = [
  { date: "October 9, 2025", event: "Nos. 55, 56, 57, 58, 61 and 62 published; No. 61 item 1(3) and No. 62 take effect" },
  { date: "November 7, 2025", event: "No. 70 suspends the six announcements to November 10, 2026" },
  { date: "November 8, 2025", event: "Scheduled effective date for Nos. 55, 56, 57 and 58" },
  { date: "November 9, 2025", event: "No. 72 suspends paragraph 2 of No. 46 of 2024 to November 27, 2026" },
  { date: "December 1, 2025", event: "Scheduled effective date for No. 61 items 1(1) and 1(2)" },
  { date: "November 9, 2026", event: "No. 58 of 2026 issued" },
  { date: "November 10, 2026", event: "First suspension period ends" },
  { date: "November 11, 2026", event: "Continued suspension begins" },
  { date: "November 27, 2026", event: "Suspension under No. 72 of 2025 ends" },
  { date: "January 10, 2027", event: "Continued suspension ends" },
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
          <p className="mt-8 font-display text-sm font-semibold text-accent">Policy Research</p>
          <h1 className="mt-3 max-w-5xl font-display text-4xl font-medium leading-[1.1] tracking-tight sm:text-6xl">
            {TITLE}
          </h1>
          <p className="mt-6 max-w-3xl font-display text-xl leading-8 text-muted">
            With the November 10 deadline just a day away, China has extended the suspension of six
            export-control announcements from October 2025. The pause now runs through January 10, 2027,
            while earlier rare-earth controls and a separate U.S.-directed measure follow different schedules.
          </p>
          <p className="mt-6 font-display text-sm text-muted">
            By{" "}
            <Link href="/about" className="underline underline-offset-4 hover:text-accent">
              Benjamin Yang
            </Link>
            {" · "}November 9, 2026{" · "}Research cutoff: November 9, 2026
          </p>
        </Container>
      </section>

      <section className="bg-paper text-paper-foreground">
        <Container width="wide" className="py-12 sm:py-16">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
            <article className="min-w-0 max-w-4xl">
              <section aria-labelledby="operative-text" className={sectionClass}>
                <h2 id="operative-text" className={h2}>A decision one day before the deadline</h2>
                <p className={p}>
                  For nearly a year, six of China’s export-control announcements have been on hold.
                  Their suspension was due to end tomorrow, November 10, 2026. With that deadline approaching,
                  Beijing has extended the pause.
                </p>
                <p className={p}>
                  On November 9, China’s Ministry of Commerce (MOFCOM) and General Administration of Customs issued{" "}
                  <Src href={mofcom.no58of2026}>Announcement No. 58 of 2026</Src>.
                  It continues the suspension of four joint announcements (Nos. 55–58 of 2025) and two
                  MOFCOM announcements (Nos. 61–62 of 2025) from November 11, 2026, through January 10, 2027.
                  The earlier suspension under{" "}
                  <Src href={mofcom.no70of2025}>Announcement No. 70 of 2025</Src> runs through November 10,
                  so the two periods meet without a gap.
                </p>
                <p className={p}>
                  The wording matters. The Chinese notice says the measures will{" "}
                  <span lang="zh-Hans">继续暂停实施</span>, or “continue to be suspended from implementation.”
                  It extends a suspension rather than repealing the underlying rules. The new period lasts
                  61 days, counting both its start and end dates. The announcement itself is a single sentence:
                  it records approval of the extension but offers no explanation for the decision or the
                  January 10 endpoint.
                </p>
              </section>

              <section aria-labelledby="scope" className={sectionClass}>
                <h2 id="scope" className={h2}>Which controls are suspended?</h2>
                <p className={p}>
                  The six October 2025 announcements reach across several industries. Some concern the
                  equipment and materials used to process rare earths; others cover particular rare-earth
                  elements, lithium-ion batteries, graphite anodes, synthetic-diamond products, or the
                  transfer of production technology. A company buying a mineral and a company building
                  a processing plant can therefore face very different provisions.
                </p>
                <p className={p}>
                  There is also a timing distinction within the original rules. Four announcements were
                  suspended before their scheduled start dates. Parts of the other two had already taken
                  effect. The table keeps those differences visible rather than treating all six as
                  regulations that were already being enforced.
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
                  Original texts: <Src href={mofcom.no55of2025}>No. 55</Src>,{" "}
                  <Src href={mofcom.no56of2025}>No. 56</Src>,{" "}
                  <Src href={mofcom.no57of2025}>No. 57</Src>,{" "}
                  <Src href={mofcom.no58of2025}>No. 58</Src>,{" "}
                  <Src href={mofcom.no61of2025}>No. 61</Src> and{" "}
                  <Src href={mofcom.no62of2025}>No. 62</Src>, all issued in 2025.
                </p>
                <p className={p}>
                  Crucially, today’s extension does not cover the rare-earth licensing rules introduced
                  in April 2025. Those rules, in{" "}
                  <Src href={mofcom.no18of2025}>Announcement No. 18 of 2025</Src>, cover samarium,
                  gadolinium, terbium, dysprosium, lutetium, scandium, and yttrium. Neither the November 2025
                  suspension nor today’s extension lists Announcement No. 18, and this source review found
                  no separate published instrument suspending it. A headline saying China has paused
                  “rare-earth export controls” misses this difference.
                </p>
                <p className={p}>
                  There is a second deadline, too.{" "}
                  <Src href={mofcom.no72of2025}>Announcement No. 72 of 2025</Src> separately suspends
                  paragraph 2 of{" "}
                  <Src href={mofcom.no46of2024}>Announcement No. 46 of 2024</Src> through November 27, 2026.
                  That paragraph says licences are, in principle, not granted for certain U.S.-bound
                  dual-use exports of gallium, germanium, antimony, and superhard materials; it also calls
                  for stricter end-user and end-use reviews for graphite. Superhard materials appear in
                  both sets of rules, but the U.S.-directed provision reaches its deadline on November 27,
                  while the separate October 2025 announcement remains suspended through January 10, 2027.
                </p>
              </section>

              <section aria-labelledby="connection" className={sectionClass}>
                <h2 id="connection" className={h2}>How the deadline grew out of the trade talks</h2>
                <p className={p}>
                  To understand why November 10 mattered, it helps to return to the U.S.–China trade
                  talks in the fall of 2025. The six announcements were issued on October 9, 2025.
                  Following the talks,{" "}
                  <Src href={mofcom.qa30Oct2025}>a MOFCOM spokesperson said on October 30</Src> that
                  Washington would suspend its export-control “50% rule” for one year, while Beijing
                  would suspend the October 9 measures for the same period and work out further details.
                </p>
                <p className={p}>
                  China then gave the pause a formal regulatory basis in{" "}
                  <Src href={mofcom.no70of2025}>Announcement No. 70 of 2025</Src>, issued on November 7.
                  That instrument set November 10, 2026, as the final day of the original suspension.
                  Today’s announcement provides the next set of dates. It says the continuation was
                  approved, but identifies neither a new negotiating arrangement nor the approving body.
                  The 2025 trade statement explains the context of the first decision; the 2026 notice
                  is the operative text for the extension announced today.
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
                <h2 id="commercial" className={h2}>What this means for buyers and investors</h2>
                <p className={p}>
                  The immediate effect is a longer period under the existing suspension. For manufacturers
                  sourcing materials from China, and for companies investing in new processing capacity,
                  that changes the near-term planning calendar. It does not settle which restrictions
                  might apply to a particular product after January 10, 2027.
                </p>
                <p className={p}>
                  Announcement No. 61 of 2025 illustrates why the details matter. Its overseas-related
                  rare-earth provisions include a proposed licensing requirement for specified items
                  exported from outside China when covered Chinese-origin inputs account for at least
                  0.1% of their value, or when specified Chinese rare-earth technology was used in
                  production. Other provisions address Chinese-origin items, end users, and end uses.
                  Determining whether a shipment falls within those provisions requires examining
                  the product, the applicable annexes, the value calculation, and how it was made.
                </p>
                <p className={p}>
                  Equipment and technology pose a different question. Announcements Nos. 56 and 62 of 2025
                  cover specified rare-earth production and processing equipment, raw and auxiliary
                  materials, and technical know-how. An investor planning a facility that depends on
                  Chinese equipment or technical support may need to assess those rules against the
                  project’s procurement schedule. The original announcements define the covered
                  transactions; the new notice changes the suspension period.
                </p>
              </section>

              <section aria-labelledby="uncertainty" className="py-10">
                <h2 id="uncertainty" className={h2}>The next two dates</h2>
                <p className={p}>
                  November 27, 2026, is the scheduled end of the separate suspension affecting
                  the U.S.-directed provision of the 2024 restrictions. January 10, 2027, is
                  the final day of the new suspension period for the six October 2025 announcements.
                  The overlap in materials can make the two deadlines easy to confuse, but they come
                  from different legal instruments.
                </p>
                <p className={p}>
                  As of this article’s November 9 research cutoff, no published instrument extends the
                  new period beyond January 10. The original rules also have different commencement
                  provisions: Nos. 55–58 were scheduled for November 8, 2025; two provisions of No. 61
                  were scheduled for December 1, 2025; and No. 62 took effect upon issuance on
                  October 9, 2025. Any later regulatory change will need to be read alongside those
                  texts before determining the position for a specific export.
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
