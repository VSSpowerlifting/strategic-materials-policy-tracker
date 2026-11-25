import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { ResearchCover } from "@/components/editorial/research-cover";
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
    description: "China continues the suspension of six October 2025 export-control announcements through January 10, 2027, while other licensing rules remain in effect.",
    images: [{
      url: `/research/${SLUG}/opengraph-image`,
      width: 1200,
      height: 630,
      alt: "Stratellar Policy Research: China Extends the Suspension of Six Export-Control Announcements Through January 10, 2027",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: "China continues the suspension of six export-control announcements through January 10, 2027.",
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

const h2 = "article-h2";
const p = "mt-5 font-display text-lg leading-9";
const sectionClass = "scroll-mt-28 border-b border-paper-border py-10";

export default function ChinaSuspensionExtensionPage() {
  return (
    <div data-flush-footer>
      <section className="border-b border-border-strong">
        <Container width="wide" className="article-hero py-12 sm:py-20">
          <a
            href="/research"
            className="font-display text-sm text-muted underline underline-offset-4 hover:text-accent">
            ← Research
          </a>
          <p className="mt-8 font-display text-[0.8125rem] font-medium text-accent">Policy Research</p>
          <h1 className="article-title mt-4 text-foreground">
            {TITLE}
          </h1>
          <p className="standfirst mt-6 max-w-[38rem]">
            On November 9, 2026, China extended the suspension of six October 2025 export-control
            announcements through January 10, 2027. The affected measures cover rare-earth equipment
            and technology, battery materials and industrial diamonds. Earlier rare-earth licensing
            rules and a separate U.S.-directed restriction remain subject to their own provisions.
          </p>
          <p className="mt-6 font-display text-sm text-muted">
            By{" "}
            <Link href="/about" className="underline underline-offset-4 hover:text-accent">
              Benjamin Yang
            </Link>
            {" · "}November 9, 2026{" · "}Research cutoff: November 9, 2026
          </p>
          <ResearchCover
            data-cover="china-export-control-suspension-extension"
            data-frame="banner"
            data-caption="full"
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="mt-12 sm:mt-16"
          />
        </Container>
      </section>

      <section className="bg-paper text-paper-foreground">
        <Container width="wide" className="py-12 sm:py-16">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
            <article className="min-w-0 max-w-4xl">
              <section aria-labelledby="operative-text" className={sectionClass}>
                <h2 id="operative-text" className={h2}>
                  China continues the six-announcement suspension through January 10
                </h2>
                <p className={p}>
                  With the previous suspension due to expire on November 10, 2026, China&apos;s Ministry of
                  Commerce and General Administration of Customs extended the pause on six export-control
                  announcements for a further 61 days. The decision, issued on November 9, keeps the
                  specified measures suspended through January 10, 2027.
                </p>
                <p className={p}>
                  Issued jointly by the two agencies,{" "}
                  <Src href={mofcom.no58of2026}>Announcement No. 58 of 2026</Src> covers four joint
                  announcements (Nos. 55–58 of 2025) and two Ministry of Commerce (MOFCOM)
                  announcements (Nos. 61 and 62 of 2025). The preceding suspension, established by{" "}
                  <Src href={mofcom.no70of2025}>Announcement No. 70 of 2025</Src>, runs through
                  November 10, 2026. The new period begins November 11, leaving no interruption
                  between the two.
                </p>
                <p className={p}>
                  In a single operative sentence, the notice uses the phrase{" "}
                  <span lang="zh-Hans">继续暂停实施</span> to continue the suspension of implementation.
                  The underlying announcements remain intact, with January 10, 2027 specified
                  as the final day of the extended period.
                </p>
              </section>

              <section aria-labelledby="connection" className={sectionClass}>
                <h2 id="connection" className={h2}>
                  The October 2025 measures and the first suspension
                </h2>
                <p className={p}>
                  Published amid an exchange of trade restrictions in October 2025, the six announcements
                  became part of an arrangement reached after subsequent U.S.–China consultations.
                  In an <Src href={mofcom.qa30Oct2025}>October 30 statement</Src>, MOFCOM said that China
                  would suspend the October measures for one year while the United States would
                  suspend its “50% rule” for the same period. As the{" "}
                  <Src agency="U.S. BIS" href={mofcom.bisAffiliates2025}>U.S. Commerce Department explained</Src>,
                  that rule extended certain export restrictions to companies owned at least 50%
                  by listed entities. MOFCOM&apos;s statement describes the 2025 arrangement; the
                  U.S. rule&apos;s subsequent legal position depends on later U.S. measures.
                </p>
                <p className={p}>
                  On November 7, 2025, China implemented its side of the arrangement through{" "}
                  <Src href={mofcom.no70of2025}>Announcement No. 70</Src>, setting November 10, 2026
                  as the last day of the original suspension. The November 9, 2026 notice continues
                  that suspension through January 10, 2027. Although the October consultations
                  provide the background to the initial pause, the new notice gives no explanation
                  for the additional period.
                </p>
                <div className="mt-6 overflow-x-auto border-y border-paper-border">
                  <table className="w-full min-w-[480px] border-collapse text-left font-display text-sm leading-6">
                    <caption className="sr-only">Dates in the 2025 and 2026 suspensions</caption>
                    <thead className="bg-elevated text-paper-foreground">
                      <tr>
                        <th scope="col" className="w-[30%] px-3 py-3 font-semibold">Date</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Event</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeline.map((row, index) => (
                        <tr key={row.date} className={index % 2 === 0 ? "bg-paper" : "bg-card"}>
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
                  The provisions covered by the extension
                </h2>
                <p className={p}>
                  The six announcements cover specified rare-earth separation and processing equipment,
                  ores and chemicals used in mineral processing, five medium and heavy rare-earth
                  elements, and transfers of rare-earth technology and technical assistance.
                  They also address high-energy-density lithium-ion batteries, artificial-graphite
                  anodes and superhard materials, including synthetic-diamond micropowder, wire
                  saws and grinding wheels.
                </p>
                <p className={p}>
                  Their original commencement dates vary. Announcements Nos. 55–58 of 2025 were
                  scheduled to take effect on November 8, 2025, but were suspended the day before.
                  Portions of Nos. 61 and 62 had already taken effect on October 9, while other
                  parts of No. 61 were scheduled to begin later. Those differences remain relevant
                  to assessing the position of each provision after the suspension expires.
                </p>
                <div className="mt-6 overflow-x-auto border-y border-paper-border">
                  <table className="w-full min-w-[720px] border-collapse text-left font-display text-sm leading-6">
                    <caption className="sr-only">
                      The six suspended October 2025 announcements: subject, original effective date and position
                    </caption>
                    <thead className="bg-elevated text-paper-foreground">
                      <tr>
                        <th scope="col" className="w-[17%] px-3 py-3 font-semibold">Announcement</th>
                        <th scope="col" className="w-[38%] px-3 py-3 font-semibold">Subject</th>
                        <th scope="col" className="w-[17%] px-3 py-3 font-semibold">Original effective date</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scope.map((row, index) => (
                        <tr key={row.announcement} className={index % 2 === 0 ? "bg-paper" : "bg-card"}>
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
                  Separate from the October package,{" "}
                  <Src href={mofcom.no18of2025}>Announcement No. 18 of 2025</Src> imposed export
                  licensing requirements on samarium, gadolinium, terbium, dysprosium, lutetium,
                  scandium and yttrium. The two suspension notices cover the six October
                  announcements, leaving the April licensing regime operative as of the
                  November 9 research cutoff. Buyers of those seven elements must therefore
                  continue to assess their orders under the April rules.
                </p>
                <p className={p}>
                  China&apos;s separate restrictions on certain exports to the United States have
                  an earlier suspension deadline.{" "}
                  <Src href={mofcom.no72of2025}>Announcement No. 72 of 2025</Src> suspends
                  paragraph 2 of <Src href={mofcom.no46of2024}>Announcement No. 46 of 2024</Src>
                  through November 27, 2026. That provision says licences are, in principle,
                  not granted for specified U.S.-bound dual-use exports of gallium, germanium,
                  antimony and superhard materials, and calls for stricter end-user and end-use
                  reviews for graphite. Because superhard materials are also addressed by the
                  October 2025 package, the applicable provision and destination matter
                  when assessing an export.
                </p>
              </section>

              <section aria-labelledby="commercial" className={sectionClass}>
                <h2 id="commercial" className={h2}>
                  Procurement and project contracts extending into 2027
                </h2>
                <p className={p}>
                  Consider a hypothetical company preparing to build a rare-earth processing plant.
                  It might order separation equipment and chemical extractants from China while
                  negotiating technical assistance for installation and commissioning.
                  Announcements Nos. 56 and 62 of 2025 cover specified products and services in
                  those categories. For contracts extending beyond January 10, 2027, the company
                  would need to identify the items and services involved, determine whether
                  a licensing provision covers them, and account for the possibility that
                  the suspension will have ended before delivery or technical work begins.
                </p>
                <p className={p}>
                  Announcement No. 61 of 2025 extends the potential compliance questions to some
                  transactions outside China. If implemented, its provisions would require
                  Chinese licences for certain goods exported from other countries when specified
                  Chinese-origin rare-earth inputs account for at least 0.1% of the goods&apos;
                  value, or when certain Chinese-origin rare-earth technology was used to make
                  them. The announcement also addresses Chinese-origin items, foreign military
                  end users, and advanced chips or AI applications with potential military uses.
                </p>
                <p className={p}>
                  For manufacturers purchasing from suppliers in several countries, the relevant
                  information may include an item&apos;s composition, its Chinese-origin content,
                  the technology used in production, the recipient and the intended use.
                  Establishing the licensing position of any particular shipment after
                  January 10 would require those facts, the relevant annexes and whatever
                  legal instruments are then in effect.
                </p>
              </section>

              <section aria-labelledby="uncertainty" className="py-10">
                <h2 id="uncertainty" className={h2}>
                  The November 27 and January 10 deadlines
                </h2>
                <p className={p}>
                  Under Announcement No. 72 of 2025, the suspension of the specified
                  U.S.-directed restrictions ends on November 27, 2026. The six October 2025
                  announcements remain suspended through January 10, 2027, while the April
                  2025 rare-earth licensing requirements continue to operate. A shipment
                  involving superhard materials, for example, may require consideration of
                  more than one provision, depending on the item and destination.
                </p>
                <p className={p}>
                  At the November 9, 2026 research cutoff, the Chinese authorities had published
                  no further extension beyond January 10, 2027. Some of the six announcements
                  were suspended before their scheduled commencement, whereas other provisions
                  had already operated in October 2025. For procurement agreements extending
                  into 2027, the original conditions of the relevant announcement and any
                  subsequent notice will determine which requirements apply when the
                  transaction takes place.
                </p>
              </section>
            </article>

            <aside aria-label="Stratellar records" className="lg:pt-10">
              <div className="border-t border-paper-border pt-5">
                <h2 className="font-display text-sm font-semibold">Stratellar records</h2>
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
          <h2 className="article-h2">Sources</h2>
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
