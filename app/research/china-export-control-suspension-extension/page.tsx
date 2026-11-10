import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { site } from "@/lib/site";

const SLUG = "china-export-control-suspension-extension";
const TITLE = "China Extends the Suspension of Six Export-Control Announcements Through January 10, 2027";
const DESCRIPTION =
  "On November 9, 2026, China extended the suspension of six October 2025 export-control announcements through January 10, 2027. The measures cover rare-earth equipment and technology, battery materials and industrial diamonds; other Chinese controls have separate deadlines.";

export const metadata: Metadata = {
  title: `${TITLE} — Policy Research`,
  description: DESCRIPTION,
  alternates: { canonical: `/research/${SLUG}` },
  openGraph: {
    type: "article",
    url: `${site.url}/research/${SLUG}`,
    siteName: site.name,
    title: TITLE,
    description: "China extends six export-control measures through January 10, 2027. What remains restricted, and why the next deadlines matter.",
    images: [{
      url: `/research/${SLUG}/opengraph-image`,
      width: 1200,
      height: 630,
      alt: "China extends its export-control pause — SMPT Policy Research",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: "China extends six export-control measures through January 10, 2027.",
    images: [`/research/${SLUG}/opengraph-image`],
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
  bisAffiliates2025: "https://www.bis.gov/press-release/department-commerce-expands-entity-list-cover-affiliates-listed-entities",
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
  { label: "U.S. Department of Commerce, explanation of the 50% affiliates rule (September 29, 2025)", url: mofcom.bisAffiliates2025 },
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

function Src({ href, children, agency = "MOFCOM" }: { href: string; children: ReactNode; agency?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-paper-accent underline underline-offset-4 hover:text-paper-foreground"
    >
      {children}
      <span className="sr-only"> ({agency}, opens in a new tab)</span>
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
            On November 9, one day before a year-long suspension was set to end, China extended the pause
            on six export-control announcements through January 10, 2027. The decision covers rules on
            rare-earth equipment and technology, battery materials and industrial diamonds, while other
            export restrictions remain on separate schedules.
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
                <h2 id="operative-text" className={h2}>
                  China extends the pause before the November 10 deadline
                </h2>
                <p className={p}>
                  China was approaching a deadline that mattered to businesses buying critical minerals
                  and the equipment used to process them. A suspension covering six export-control
                  announcements was set to end on November 10, 2026. On November 9, Beijing extended
                  it for another 61 days.
                </p>
                <p className={p}>
                  The Ministry of Commerce (MOFCOM) and General Administration of Customs published{" "}
                  <Src href={mofcom.no58of2026}>Announcement No. 58 of 2026</Src>, keeping four joint
                  announcements (Nos. 55–58 of 2025) and two MOFCOM announcements (Nos. 61–62 of 2025)
                  suspended from November 11, 2026, through January 10, 2027. Their earlier suspension,
                  under <Src href={mofcom.no70of2025}>Announcement No. 70 of 2025</Src>, lasts through
                  November 10. The two periods are consecutive, with no gap.
                </p>
                <p className={p}>
                  The single-sentence announcement uses the phrase{" "}
                  <span lang="zh-Hans">继续暂停实施</span>, meaning the measures will “continue to be
                  suspended from implementation.” The six regulations remain on the books, with
                  their implementation suspended through January 10, 2027. The notice records the
                  approved extension and specifies its end date.
                </p>
              </section>

              <section aria-labelledby="connection" className={sectionClass}>
                <h2 id="connection" className={h2}>
                  Why November 10 had become the deadline
                </h2>
                <p className={p}>
                  The six announcements were originally issued on October 9, 2025, during a period
                  of tightening trade restrictions between Washington and Beijing. After subsequent
                  U.S.–China talks,{" "}
                  <Src href={mofcom.qa30Oct2025}>MOFCOM described an arrangement on October 30</Src>:
                  the United States would suspend its “50% rule” for one year, while China would
                  suspend the October 9 export-control measures for the same period and work out
                  further details. The U.S. rule had extended certain export restrictions to
                  companies owned at least 50% by listed entities, as the{" "}
                  <Src agency="U.S. BIS" href={mofcom.bisAffiliates2025}>U.S. Commerce Department explained</Src>.
                  The spokesperson’s statement describes the 2025 arrangement. The U.S. rule’s
                  current status depends on subsequent U.S. measures.
                </p>
                <p className={p}>
                  China gave its part of the arrangement legal effect on November 7, 2025, when{" "}
                  <Src href={mofcom.no70of2025}>Announcement No. 70</Src> suspended the six measures
                  through November 10, 2026. The November 9, 2026 notice extends that period
                  through January 10, 2027. The October 2025 remarks provide the published
                  background for the first suspension; the new instrument establishes the
                  extension’s dates.
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

              <section aria-labelledby="scope" className={sectionClass}>
                <h2 id="scope" className={h2}>
                  Which measures are on hold, and which still apply?
                </h2>
                <p className={p}>
                  The six announcements touch several different supply chains. One covers specified
                  rare-earth production equipment and processing materials, including ores, flotation
                  reagents and extractants. Another concerns rare-earth technologies and technical
                  support. Others address particular medium and heavy rare-earth elements, high-energy-density
                  lithium-ion batteries, artificial-graphite anodes and “superhard materials,”
                  including industrial synthetic diamonds and equipment used to manufacture or work
                  with them.
                </p>
                <p className={p}>
                  Their legal histories differ. Announcements Nos. 55–58 of 2025 were scheduled to
                  begin on November 8, 2025, but were suspended the day before. Parts of Nos. 61 and
                  62 had already become operative on October 9. The original dates matter when
                  assessing what a later change to the suspension would mean for a particular rule.
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
                  Original October 2025 texts:{" "}
                  <Src href={mofcom.no55of2025}>No. 55</Src>,{" "}
                  <Src href={mofcom.no56of2025}>No. 56</Src>,{" "}
                  <Src href={mofcom.no57of2025}>No. 57</Src>,{" "}
                  <Src href={mofcom.no58of2025}>No. 58</Src>,{" "}
                  <Src href={mofcom.no61of2025}>No. 61</Src> and{" "}
                  <Src href={mofcom.no62of2025}>No. 62</Src>.
                </p>
                <p className={p}>
                  China’s earlier rare-earth export controls from April 2025 are separate.{" "}
                  <Src href={mofcom.no18of2025}>Announcement No. 18 of 2025</Src> covers samarium,
                  gadolinium, terbium, dysprosium, lutetium, scandium and yttrium. The suspension
                  notices name the six October measures, while the April licensing requirements
                  remain separately operative as of the November 9 research cutoff. Buyers of
                  those seven elements still need to assess the April requirements.
                </p>
                <p className={p}>
                  A further suspension has its own clock. Under{" "}
                  <Src href={mofcom.no72of2025}>Announcement No. 72 of 2025</Src>, paragraph 2 of{" "}
                  <Src href={mofcom.no46of2024}>Announcement No. 46 of 2024</Src> is suspended
                  through November 27, 2026. That paragraph says licences are, in principle, not
                  granted for specified U.S.-bound dual-use exports of gallium, germanium, antimony
                  and superhard materials, and calls for stricter end-user and end-use reviews for
                  graphite. Superhard materials appear under both the U.S.-directed provision and
                  the separate 2025 controls, even though the suspension deadlines differ.
                </p>
              </section>

              <section aria-labelledby="commercial" className={sectionClass}>
                <h2 id="commercial" className={h2}>
                  What the extension means for procurement and new projects
                </h2>
                <p className={p}>
                  Consider a hypothetical company preparing to build a rare-earth processing plant. Its purchasing
                  plan might include equipment from China, processing chemicals such as extractants,
                  and technical support for installation or production. Announcements Nos. 56 and
                  62 of 2025 cover specified items in those categories. If the company is planning
                  orders or contracts extending beyond January 10, 2027, it has to consider whether
                  the relevant export would fall under a licensing requirement after the suspension
                  period. The requirements turn on the specific equipment, materials or services
                  involved and the provisions covering them.
                </p>
                <p className={p}>
                  The overseas-related provisions of Announcement No. 61 of 2025 introduce a different
                  kind of complexity. If implemented, they would require Chinese licences for certain goods exported
                  from outside China when specified Chinese-origin rare-earth inputs reach at least
                  0.1% of the goods’ value, or when certain Chinese-origin rare-earth technology
                  was used to make them. The announcement also includes rules concerning Chinese-origin
                  items, end users and end uses, including provisions addressing foreign military
                  users and advanced chips or AI applications with potential military use.
                </p>
                <p className={p}>
                  For a buyer, those tests turn on the product’s composition, production process,
                  relevant annexes and intended use. The extension gives firms more time under the
                  existing suspension. For an individual shipment or contract, those facts remain
                  necessary to establish which provisions would apply after the pause ends.
                </p>
              </section>

              <section aria-labelledby="uncertainty" className="py-10">
                <h2 id="uncertainty" className={h2}>
                  The regulatory deadlines after November 9
                </h2>
                <p className={p}>
                  November 27, 2026, marks the scheduled end of the separate suspension affecting
                  the U.S.-directed 2024 provision. January 10, 2027, is the final day of the
                  continued suspension of the six October 2025 announcements. The April 2025
                  rare-earth controls continue on their own regulatory track.
                </p>
                <p className={p}>
                  As of the November 9 research cutoff, China had published no instrument extending
                  the six-measure suspension beyond January 10. The underlying announcements have
                  different commencement provisions, including the November 8, 2025 start originally
                  scheduled for Nos. 55–58, the December 1, 2025 start for No. 61 items 1(1) and
                  1(2), and the October 9, 2025 effective date of No. 62. Future decisions will
                  need to be read against those original terms. The January 10 deadline applies
                  specifically to the six named October 2025 announcements.
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
