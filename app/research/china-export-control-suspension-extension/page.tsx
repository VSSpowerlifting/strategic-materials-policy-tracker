import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { site } from "@/lib/site";

const SLUG = "china-export-control-suspension-extension";
const TITLE = "China Continues the Suspension of Six October 2025 Export-Control Announcements to 10 January 2027";
const DESCRIPTION =
  "Joint Announcement No. 58 of 2026 continues the suspension of six October 2025 announcements from 11 November 2026 to 10 January 2027. What the text says, what stays suspended or in force, and what it leaves open.";

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
    position: "Suspended from 7 November 2025, before the scheduled date; suspension continued to 10 January 2027",
  },
  {
    announcement: "No. 56 of 2025",
    subject:
      "Rare-earth production and processing equipment; raw and auxiliary materials including ores, flotation reagents and extractants",
    original: "8 November 2025",
    position: "Suspended from 7 November 2025, before the scheduled date; continued to 10 January 2027",
  },
  {
    announcement: "No. 57 of 2025",
    subject: "Medium and heavy rare earths: holmium, erbium, thulium, europium and ytterbium",
    original: "8 November 2025",
    position: "Suspended from 7 November 2025, before the scheduled date; continued to 10 January 2027",
  },
  {
    announcement: "No. 58 of 2025",
    subject:
      "Lithium-ion batteries of at least 300 Wh/kg; cathode materials and precursors; artificial-graphite anode materials; related equipment and production technology",
    original: "8 November 2025",
    position: "Suspended from 7 November 2025, before the scheduled date; continued to 10 January 2027",
  },
  {
    announcement: "No. 61 of 2025, item 1(3)",
    subject: "Chinese-origin Annex 1 items",
    original: "9 October 2025 (on publication)",
    position: "In effect until 7 November 2025; suspended since; continued to 10 January 2027",
  },
  {
    announcement: "No. 61 of 2025, items 1(1) and 1(2)",
    subject: "A 0.1%-by-value threshold (1(1)); Chinese-origin technology used abroad (1(2))",
    original: "1 December 2025",
    position: "Suspended before the scheduled date; continued to 10 January 2027",
  },
  {
    announcement: "No. 61 of 2025, items 2 to 7",
    subject:
      "End-user and end-use provisions, including presumed denial for foreign military users and for listed importers or end users, case-by-case review for advanced chips and potentially military AI, and a humanitarian exemption",
    original: "No separate date stated in the text",
    position: "Suspended from 7 November 2025; continued to 10 January 2027",
  },
  {
    announcement: "No. 62 of 2025",
    subject:
      "Rare-earth technologies and technical support, including transfer through licensing, investment, joint research, employment and consulting",
    original: "9 October 2025 (on issue)",
    position: "In effect about 29 days; suspended from 7 November 2025; continued to 10 January 2027",
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
            Joint Announcement No. 58 of 2026 continues the suspension of six October 2025 announcements from 11
            November 2026 to 10 January 2027. The April 2025 rare-earth controls under Announcement No. 18 are not among
            the suspended announcements.
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
                  Announcement No. 58 of 2026: operative text
                </h2>
                <p className={p}>
                  On 9 November 2026 the Ministry of Commerce (MOFCOM) and the General Administration of Customs issued{" "}
                  <Src href={mofcom.no58of2026}>Joint Announcement No. 58 of 2026</Src>. Its operative text is one
                  sentence. With approval, from 11 November 2026 to 10 January 2027, Announcements Nos. 55, 56, 57 and 58
                  of 2025 (MOFCOM and Customs) and Nos. 61 and 62 of 2025 (MOFCOM) continue to be suspended (
                  <span lang="zh-Hans">继续暂停实施</span>). The announcement names no approving body, gives no rationale
                  and contains no repeal or amendment wording.
                </p>
                <p className={p}>
                  The new period begins the day after the first one ends.{" "}
                  <Src href={mofcom.no70of2025}>Announcement No. 70 of 2025</Src>, issued on 7 November 2025, suspended
                  the same six announcements until 10 November 2026. The continued period runs 61 days, counting both
                  dates; the first ran for roughly twelve months.
                </p>
              </section>

              <section aria-labelledby="scope" className={sectionClass}>
                <h2 id="scope" className={h2}>
                  What is suspended and what remains in force
                </h2>
                <p className={p}>
                  The operative term is <span lang="zh-Hans">暂停实施</span>, “suspend implementation”. The six
                  announcements stay published, and neither the 2025 nor the 2026 announcement amends or repeals them.
                  The table sets out each announcement, its original effective date and its position.
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
                  Neither No. 70 of 2025 nor the 2026 announcement lists{" "}
                  <Src href={mofcom.no18of2025}>Announcement No. 18 of 2025</Src> (4 April 2025), which controls
                  samarium, gadolinium, terbium, dysprosium, lutetium, scandium and yttrium; this article found no
                  instrument suspending it. The 2026 announcement does not alter that licensing and does not describe
                  how licences are handled.
                </p>
                <p className={p}>
                  A separate suspension has its own end date. Paragraph 2 of{" "}
                  <Src href={mofcom.no46of2024}>Announcement No. 46 of 2024</Src>, a measure directed at the United
                  States as the 2024 announcement frames it, provides that licences for gallium, germanium, antimony and
                  superhard-material dual-use items going to the United States are in principle not granted, with
                  stricter end-user and end-use review for graphite.{" "}
                  <Src href={mofcom.no72of2025}>Announcement No. 72 of 2025</Src> (MOFCOM alone, 9 November 2025)
                  suspended that paragraph until 27 November 2026, and the 2026 announcement does not mention it.
                  Superhard materials therefore sit under two suspensions with different end dates: No. 55 of 2025 until
                  10 January 2027 and paragraph 2 of No. 46 of 2024 until 27 November 2026.
                </p>
              </section>

              <section aria-labelledby="connection" className={sectionClass}>
                <h2 id="connection" className={h2}>
                  How the 2025 and 2026 instruments connect
                </h2>
                <p className={p}>
                  The October 2025 announcements each record State Council approval. No. 70 of 2025 is one sentence,
                  states no rationale and names no approving body, as the 2026 announcement also does. Context for the
                  first suspension comes from a{" "}
                  <Src href={mofcom.qa30Oct2025}>MOFCOM spokesperson’s answers of 30 October 2025</Src>, which said the
                  United States would suspend its 50% penetration rule for one year and that China would suspend the
                  export-control measures it published on 9 October for one year and study detailed arrangements. The
                  answers name no announcement numbers.
                </p>
                <p className={p}>
                  The 2026 announcement does not mention a bilateral arrangement. Linking it to the Kuala Lumpur
                  arrangement rests on the 2025 spokesperson statements alone.
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
                  Commercial interpretation
                </h2>
                <p className={p}>
                  This section describes which legal provisions are suspended. It does not estimate effects on prices,
                  supply or any firm.
                </p>
                <p className={p}>
                  <strong>Analysis: procurement and planning.</strong> For buyers the change is the planning horizon.
                  A contract that runs past 10 January 2027 sits under a suspension whose end date is stated and whose
                  continuation is not addressed. Had the suspension not applied, the overseas provisions of No. 61 would
                  have required a Chinese licence for foreign exports of items meeting a 0.1%-by-value threshold or made
                  with specified Chinese technologies. Whether a given product meets those tests depends on its
                  composition and process, which this article does not assess. Buyers of batteries, cathode and anode
                  materials and superhard materials face the same date under Nos. 58 and 55 of 2025. Which date governs
                  a given shipment is set by the underlying announcements’ own provisions, not by No. 58 of 2026.
                </p>
                <p className={p}>
                  <strong>Analysis: investment.</strong> If the suspension ended, No. 56 (equipment, ores and reagents)
                  and No. 62 (technology and related support) would apply to exports from China of the listed items.
                  This article does not compare those items with any project’s equipment or technology. A financing or
                  offtake timeline that extends beyond 10 January 2027 runs against provisions whose position after that
                  date no published instrument states.
                </p>
              </section>

              <section aria-labelledby="uncertainty" className="py-10">
                <h2 id="uncertainty" className={h2}>
                  Regulatory uncertainty around 10 January 2027
                </h2>
                <p className={p}>
                  No published instrument states the position after 10 January 2027. The 2026 announcement says nothing
                  about a further extension, a lapse or a replacement, and nothing about how the original effective
                  dates (8 November 2025 for Nos. 55 to 58, 1 December 2025 for No. 61 items 1(1) and 1(2)) would apply
                  if the suspension ended. It states a 61-day period, inclusive of both dates, and nothing about any
                  later one. The shorter period could reflect many causes, and the text states none.
                </p>
                <p className={p}>
                  Two end dates, 27 November 2026 and 10 January 2027, fall about six weeks apart, each governed by its
                  own announcement. The text of any later instrument is what will establish the position after
                  10 January 2027.
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
