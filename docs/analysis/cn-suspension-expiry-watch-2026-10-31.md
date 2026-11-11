# China's 10 November 2026 suspension expiry: source watch

**Research note, 31 October 2026. No published data changed. Both records below are unverified drafts that need a source-verifier verdict and maintainer approval before any promotion.**

## Why this note exists

MOFCOM & GACC Announcement No. 70 of 2025 suspended the six 9 October 2025 announcements (Nos. 55, 56, 57, 58, 61, 62) through **10 November 2026**. The published records for those measures (`china-rare-earth-expansion-2025-10`, `china-rare-earth-suspension-2025-11`, `evt-cn-mofcom-56/57/58/62-2025`) and their control-measure status histories all end on that date, and several say the corpus "records nothing yet about what follows." The corpus held no China event dated 2026 when this note was written.

## Finding 1: an extension was agreed, but no instrument has amended No. 70 yet

**Source (read in full):** [商务部美大司负责人解读第八轮中美经贸磋商成果](https://www.mofcom.gov.cn/syxwfb/art/2026/art_d9ea01824fc44fd8a29f7dc3f8ca9c72.html), MOFCOM press office, 28 September 2026.

Section 八, verbatim:

> 2025年10月，中美双方在吉隆坡就解决各自关切的经贸问题达成联合安排，将双方各自部分关税和非关税措施暂停实施至2026年11月10日。本次经贸磋商中，中美双方同意在将吉隆坡经贸磋商联合安排延期至2027年1月10日的基础上，继续积极探讨这一事项，旨在达成双方同意的解决方案。

Self translation: "In October 2025 the two sides reached a joint arrangement in Kuala Lumpur on economic and trade issues of concern to each, suspending some tariff and non-tariff measures of each side until 10 November 2026. In this round, the two sides agreed, on the basis of extending the Kuala Lumpur joint arrangement to 10 January 2027, to continue actively discussing the matter with the aim of a mutually agreed solution."

What the text does **not** do:

- It does not name Announcement No. 70, any of the six October 2025 announcements, or rare earths.
- It is an explanatory reading by a department official, not a numbered MOFCOM or MOFCOM/GACC announcement.

**Negative check:** MOFCOM's [policy-release listing](https://www.mofcom.gov.cn/zwgk/zcfb/index.html) (page generated 2026-10-30 16:25, items dated 29 September to 29 October 2026, including Nos. 44, 46 and 48 to 53 of 2026) contains no announcement amending or extending No. 70. This is valid only as of the access date.

**Secondary sources disagree** and are not evidence: one (doofinancial.com.au) says the six-announcement suspension was extended to 10 January 2027; another (fxstreet.com, 14 October 2026) says the 28 September extension does not explicitly mention the rare-earth restrictions.

**Recommendation:** do not code the 28 September reading as its own event. Hold it as monitoring context. If MOFCOM/GACC publish an implementing announcement, code that announcement as the event and update the status histories from it. If nothing appears by 10 November, the status of the six measures after that date needs an explicit reviewer decision based on what the official record shows, not on press coverage.

**Related date:** Announcement No. 72 of 2025 suspends Article 2 of Announcement No. 46 of 2024 (the US-specific gallium, germanium, antimony and superhard-materials ban) only until **27 November 2026** (`evt-cn-us-ban-2024`). Whether the January extension reaches it is unknown.

## Finding 2: MOFCOM Announcement No. 23 of 2026 lists MP Materials and USA Rare Earth

**Source (read in full, with annex):** [商务部公告2026年第23号 公布将10家美国实体列入出口管制管控名单的决定](https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_dfa9cc5c1e004d7fbb86f83d249e7986.html), issued by MOFCOM's 安全与管制局, dated 22 June 2026.

- Legal basis: the Export Control Law and the Dual-Use Items Export Control Regulations.
- Stated purpose, verbatim: 为维护国家安全和利益，履行防扩散等国际义务.
- Operative clause 一, verbatim: 禁止出口经营者对上述10家实体出口两用物项，禁止任何国家和地区的组织和个人将原产于中国的两用物项转移或提供给上述实体；正在开展的相关出口活动应当立即停止。
- Clause 二: exports genuinely needed in special circumstances require an application to MOFCOM.
- Effective on publication.
- Annex items 9 and 10: 芒廷帕斯材料公司 (MP Materials Corp.), Las Vegas, NV; 美国稀土公司 (USA Rare Earth, Inc.), Stillwater, OK, common names USAR, USARE. Both are already in the registry as `org-mp-materials` and `org-usa-rare-earth`. The other eight entities are drone, defence and maritime firms.

**Open methodology question:** the instrument names no material. Its reach to rare earths runs through the general dual-use list (which includes the seven elements of Announcement No. 18 of 2025). Should `affectedMaterialIds` stay empty with the link carried by the named organizations, or list the No. 18 elements? The draft leaves it empty.

**Related listings:** see Finding 3.

## Result, 11 November 2026: the suspension was continued to 10 January 2027

**Instrument:** [商务部、海关总署公告2026年第58号](https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_91466027f465467985942a639a9485f4.html), dated and posted 9 November 2026 by MOFCOM's 安全与管制局. Read in full on both the main MOFCOM page and the [export-control catalogue copy](https://aqygzj.mofcom.gov.cn/qdml/art/2026/art_5c9199b52ff24171aeef73a10576815b.html); the texts are identical. The whole operative text:

> 经批准，自2026年11月11日起至2027年1月10日，商务部、海关总署公告2025年第55号、56号、57号、58号，及商务部公告2025年第61号、62号继续暂停实施。

Self translation: "As approved, from 11 November 2026 to 10 January 2027, MOFCOM/GACC Announcements Nos. 55, 56, 57 and 58 of 2025 and MOFCOM Announcements Nos. 61 and 62 of 2025 continue to be suspended."

What it settles:

- **All six** October 2025 announcements are covered, named one by one.
- **No gap:** No. 70's window ended on 10 November; this one starts on 11 November.
- **End date 10 January 2027**, matching MOFCOM's 28 September reading. The 20 January date in press coverage was wrong.
- It gives no reason, and does not mention Announcement No. 18 of 2025, which was never suspended.

**Naming hazard:** `src-mofcom-58` already means Announcement No. 58 **of 2025** (batteries and graphite anodes). The new source must be promoted as `src-mofcom-58-2026`.

**Announcement No. 72 of 2025** (suspends Article 2 of No. 46 of 2024 until 27 November 2026): nothing on either MOFCOM list addresses it yet. The same day MOFCOM also issued 商务部令2026年第4号, continuing a suspension of countermeasures against five US subsidiaries of Hanwha Ocean for two months; that is a shipbuilding matter outside SMPT's scope.

### Proposed reviewer decision (not applied; seed unchanged)

`npm run validate` now warns on exactly these 19 control rows: each has a status that ran out on 10 November with no later entry.

| # | Change | Records |
|---|---|---|
| 1 | Promote `cand-cn-mofcom-58-2026` as a new event with its own control row, source `src-mofcom-58-2026` | new |
| 2 | Append `{status: suspended, date: 2026-11-11, until: 2027-01-10, sourceId: src-mofcom-58-2026}` with the verbatim sentence as `note` | 18 control rows under Nos. 56, 57, 58, 61, 62 of 2025 |
| 3 | Append `{status: expired, date: 2026-11-11, sourceId: src-mofcom-70}`; No. 70's own text set its window to 10 November, so the expiry needs no other source | `ctl-cn-ree-2025-11-suspension` |
| 4 | Change `policyStatus` from `active`; `superseded` plus `supersededByEventId` is the closest existing label (`ended` requires no replacement). Maintainer call | `china-rare-earth-suspension-2025-11` |
| 5 | Rewrite the "records nothing yet about what follows 10 November 2026" sentences | 6 event summaries and significance notes |
| 6 | Approved corpus refresh: the instrument postdates `site.lastUpdated` (2026-10-17) | `lib/site.ts` |

**Date convention to choose (item 2):** the existing `scheduled` entries are dated by publication. Dating the new entry 11 November (effective) avoids overlapping No. 70's window; dating it 9 November (publication) matches the earlier convention but overlaps by two days.

**Recommendation:** reject `cand-cn-kl-arrangement-extension-2026` as an event and cite the 28 September reading only as context.

## Recheck, 8 November 2026 (two days before expiry)

- **No instrument yet.** MOFCOM's [policy-release listing](https://www.mofcom.gov.cn/zwgk/zcfb/index.html), regenerated 6 November, adds only two anti-dumping investigations (Nos. 56 and 57 of 2026) and a shipping-insurance guideline. The [export-control catalogue](https://aqygzj.mofcom.gov.cn/qdml/) has not been regenerated since 26 October. Nos. 54 and 55 of 2026 are n-propanol trade-remedy reviews, unrelated.
- **Official silence.** The full transcript of MOFCOM's [5 November press briefing](https://www.mofcom.gov.cn/xwfbzt/2026/swbzklxxwfbh2026n11y5r/index.html) never mentions rare earths, export controls, No. 70 or the deadline.
- **Press reports conflict on the new date.** VOA Chinese (6 November) says the truce now ends on 20 January 2027; MOFCOM's own 28 September text says 10 January 2027. Neither date has an implementing announcement behind it yet.
- **What this means for coding:** if no announcement appears by 10 November, the official record will show No. 70's suspension period ending with no published replacement, alongside an agreed but unimplemented political extension. That state needs an explicit reviewer decision, not an inferred status. The 11 November recheck will record what happened.

## Finding 3: screening the other 2026 MOFCOM entity listings

Each announcement below was read in full on 31 October 2026. The listing texts give names (and usually addresses) only, so any scope link rests on the listed firm's own description, which is weaker evidence than the instrument itself.

| Announcement | Date | List | In SMPT scope? |
| --- | --- | --- | --- |
| [No. 11](https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_b5159a773124428a9813884015d1b8b3.html) | 24 Feb 2026 | Control list, 20 Japanese entities | No. Defence and aerospace entities; the text says they take part in enhancing Japan's military strength. |
| [No. 12](https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_bac18400512d408a8d4c2f964e36ac11.html) | 24 Feb 2026 | **Watch list**, 20 Japanese entities | Lead. Includes **TDK** (its product site describes NEOREC neodymium magnets) and **Mitsubishi Materials** (its site describes a tungsten business). A watch-list entry tightens licensing; it is not a ban. |
| [No. 23](https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_dfa9cc5c1e004d7fbb86f83d249e7986.html) | 22 Jun 2026 | Control list, 10 US entities | Yes (Finding 2). |
| [No. 27](https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_df87be1437044874a35f85cf6e076f3d.html) | 29 Jun 2026 | Control list, 20 Japanese entities | No. Defence research institutes and contractors. |
| [No. 28](https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_c2ab731429dc4bc3ba8696cd0e6ad857.html) | 29 Jun 2026 | Watch list, 20 Japanese entities | No. Includes nuclear-fuel firms, outside the material set. |
| [No. 30](https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_2c9a32aa73bf4f5ea80ffa83e62fb259.html) | 24 Jul 2026 | Control list, 14 EU entities | Lead. Includes **Sindlhauser Materials GmbH**, whose own homepage says it supplies sputter targets of bonded rare-earth metals and LaB6 ceramics. Lafert, Garnet and Antraco Chemie not yet screened. |

**Methodology decision needed first:** SMPT has so far coded China's material-based controls, not entity listings. Before promoting any of Nos. 12, 23 or 30, the maintainer should decide whether entity listings are in scope, and whether the link to scope may rest on the listed firm's own business description. Drafts `cand-cn-mofcom-12-2026` and `cand-cn-mofcom-30-2026` hold the details.

## Out of scope, checked and set aside

MOFCOM/MOST Announcement No. 48 of 2026 (16 October) proposes adding 40 AI, biomedicine and photovoltaic technologies to the Catalogue of Technologies Prohibited or Restricted from Export, with interim pre-export registration. None falls within SMPT's material set.

## Watch plan

Recheck MOFCOM [policy releases](https://www.mofcom.gov.cn/zwgk/zcfb/index.html) and the [export-control catalogue](https://aqygzj.mofcom.gov.cn/qdml/) around 7 to 11 November 2026 (No. 70 itself was issued on 7 November 2025), and again before 27 November 2026.

## Draft candidate records

The working copies live in the git-ignored `data/candidates/candidates.json`. This copy exists so the drafts survive outside a local checkout. To restore, paste the array into that file and run `npm run validate`.

```json
[
  {
    "candidateId": "cand-cn-mofcom-23-2026",
    "status": "draft",
    "createdBy": "policy-researcher",
    "createdAt": "2026-10-31",
    "updatedAt": "2026-10-31",
    "proposedEvent": {
      "date": "2026-06-22",
      "jurisdiction": "china",
      "issuingBody": "MOFCOM",
      "titleOriginal": "商务部公告2026年第23号 公布将10家美国实体列入出口管制管控名单的决定",
      "titleOriginalLang": "zh",
      "titleEn": "MOFCOM Announcement No. 23 of 2026: decision to add 10 US entities to the export-control control list",
      "titleEnSource": "self",
      "documentNumber": "MOFCOM Announcement No. 23 (2026)",
      "policyStatus": "in_force",
      "mechanism": [
        "export_control"
      ],
      "affectedMaterialIds": [],
      "affectedSectors": [],
      "summary": "Adds ten US entities to China's export-control control list (出口管制管控名单) under the Export Control Law and the Dual-Use Items Export Control Regulations. Exporters may not export dual-use items to the listed entities, and organisations and individuals of any country or region may not transfer or provide Chinese-origin dual-use items to them; related exports already under way must stop immediately. Where export is genuinely necessary in special circumstances, the exporter must apply to MOFCOM. Effective from publication on 22 June 2026. The annex lists Aveox, Red Cat Holdings, Teal Drones, IMSAR, Jaia Robotics, Ball Aerospace & Technologies, Oshkosh Defense, L3Harris Maritime Services, MP Materials Corp. and USA Rare Earth, Inc.",
      "analyticalSignificance": "Not yet coded. Draft note for reviewer: the instrument names no material; its reach to rare earths runs through the general dual-use list, which currently includes the seven elements controlled by Announcement No. 18 of 2025. The text gives only the national-security and non-proliferation justification; any retaliation reading would have to rest on timing and must stay out of the quoted anchor.",
      "sourceIds": [
        "cand-src-mofcom-23-2026"
      ],
      "intakeMode": "backfill"
    },
    "proposedFraming": [],
    "proposedSources": [
      {
        "id": "cand-src-mofcom-23-2026",
        "title": "商务部公告2026年第23号 公布将10家美国实体列入出口管制管控名单的决定",
        "publisher": "中华人民共和国商务部 (Ministry of Commerce, PRC)",
        "url": "https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_dfa9cc5c1e004d7fbb86f83d249e7986.html",
        "language": "zh",
        "datePublished": "2026-06-22",
        "dateAccessed": "2026-10-31",
        "sourceType": "official",
        "confidence": "primary",
        "notes": "Chinese primary, full text and annex read 2026-10-31. 发布单位 安全与管制局; 发文日期 2026年06月22日. Justification clause verbatim: 为维护国家安全和利益，履行防扩散等国际义务. Operative clause 一: 禁止出口经营者对上述10家实体出口两用物项，禁止任何国家和地区的组织和个人将原产于中国的两用物项转移或提供给上述实体；正在开展的相关出口活动应当立即停止. Annex items 9 and 10: 芒廷帕斯材料公司（MP Materials Corp.）, 1700 S Pavilion Center Drive Eighth Floor, Las Vegas, NV; 美国稀土公司（USA Rare Earth, Inc.）, 100 W Airport Rd, Stillwater, OK, common names USAR, USARE. Lead first seen in a secondary chronology (Tsinghua PBCSF CIFER, 2026 China–US trade-dispute timeline); that page is not cited as evidence."
      }
    ],
    "verification": {
      "verdict": "pending"
    },
    "classification": {
      "proposedFramingCategories": [
        "national_security"
      ],
      "confidence": "medium",
      "evidence": "Stated purpose: 为维护国家安全和利益，履行防扩散等国际义务 (self translation: 'to safeguard national security and interests and fulfil international obligations such as non-proliferation'). No other rationale appears in the text.",
      "ambiguityFlags": [
        "Material scope is not stated in the instrument; affectedMaterialIds left empty pending a methodology decision",
        "Whether to add 'countermeasure' as a mechanism: the text does not say so"
      ]
    },
    "reviewerNotes": "Only the two rare-earth entities (org-mp-materials, org-usa-rare-earth, both already in the registry) bring this within SMPT scope; the other eight are drone, defence and maritime firms. The corpus currently holds no China event dated 2026.",
    "openQuestions": [
      "Material scope: should a control-list designation that names no material carry affectedMaterialIds (e.g. the No. 18 seven), or stay empty with the link made only through the named organizations?",
      "Sectors: the annex identifies defence and drone firms, but the instrument assigns no sector. Code 'defense' or leave empty?",
      "Should this be one event, or should SMPT also code the 2026 Japanese (No. 11, 24 Feb; No. 28) and EU (No. 30, 24 Jul) control-list announcements if any listed entity is a materials firm?",
      "Has MOFCOM published any later removal or licence decision for MP Materials or USA Rare Earth? Not checked."
    ],
    "promotion": {
      "promoted": false,
      "promotedEventId": null,
      "promotedAt": null,
      "approvedBy": null
    }
  },
  {
    "candidateId": "cand-cn-kl-arrangement-extension-2026",
    "status": "draft",
    "createdBy": "policy-researcher",
    "createdAt": "2026-10-31",
    "updatedAt": "2026-11-11",
    "proposedEvent": {
      "date": "2026-09-28",
      "jurisdiction": "china",
      "issuingBody": "MOFCOM (Department of American and Oceanian Affairs, via MOFCOM press office)",
      "titleOriginal": "商务部美大司负责人解读第八轮中美经贸磋商成果",
      "titleOriginalLang": "zh",
      "titleEn": "MOFCOM Department of American and Oceanian Affairs official explains the outcomes of the eighth round of China–US economic and trade consultations",
      "titleEnSource": "self",
      "documentNumber": null,
      "mechanism": [
        "trade_action"
      ],
      "affectedMaterialIds": [],
      "affectedSectors": [],
      "summary": "Draft. Section 8 of MOFCOM's reading of the 20–23 September 2026 New York and Washington consultations states that the October 2025 Kuala Lumpur joint arrangement had suspended some tariff and non-tariff measures of each side until 10 November 2026, and that in this round the two sides agreed, on the basis of extending the Kuala Lumpur joint arrangement to 10 January 2027, to continue actively discussing the matter with the aim of a mutually agreed solution. The text does not name Announcement No. 70 of 2025, the October 2025 export-control announcements, or rare earths. As of 31 October 2026 no numbered MOFCOM or MOFCOM/GACC announcement amending the 10 November 2026 end date of Announcement No. 70 appears in MOFCOM's policy-release listing.",
      "analyticalSignificance": "Not yet coded.",
      "sourceIds": [
        "cand-src-mofcom-8th-round-reading-2026"
      ]
    },
    "proposedFraming": [],
    "proposedSources": [
      {
        "id": "cand-src-mofcom-8th-round-reading-2026",
        "title": "商务部美大司负责人解读第八轮中美经贸磋商成果",
        "publisher": "中华人民共和国商务部 (Ministry of Commerce, PRC) — 商务部新闻办公室",
        "url": "https://www.mofcom.gov.cn/syxwfb/art/2026/art_d9ea01824fc44fd8a29f7dc3f8ca9c72.html",
        "language": "zh",
        "datePublished": "2026-09-28",
        "dateAccessed": "2026-10-31",
        "sourceType": "official",
        "confidence": "primary",
        "notes": "Full text read 2026-10-31. Page header: 来源 商务部新闻办公室, 2026-09-28 09:00. Section 八 verbatim: 2025年10月，中美双方在吉隆坡就解决各自关切的经贸问题达成联合安排，将双方各自部分关税和非关税措施暂停实施至2026年11月10日。本次经贸磋商中，中美双方同意在将吉隆坡经贸磋商联合安排延期至2027年1月10日的基础上，继续积极探讨这一事项，旨在达成双方同意的解决方案。 This is an official explanatory reading, not a numbered announcement, and it does not name Announcement No. 70 or the rare-earth measures. Secondary coverage disagrees on whether it covers the rare-earth suspension (doofinancial.com.au says yes; fxstreet.com, 14 Oct 2026, says the extension does not explicitly mention the rare-earth restrictions); neither is evidence."
      },
      {
        "id": "cand-src-mofcom-policy-release-list-2026-10-30",
        "title": "政策发布 (MOFCOM policy-release listing)",
        "publisher": "中华人民共和国商务部 (Ministry of Commerce, PRC)",
        "url": "https://www.mofcom.gov.cn/zwgk/zcfb/index.html",
        "language": "zh",
        "datePublished": null,
        "dateAccessed": "2026-11-08",
        "sourceType": "official",
        "confidence": "primary",
        "notes": "First access 2026-10-31: Page generated 2026-10-30 16:25 (MakeTime). First page lists items dated 2026-09-29 to 2026-10-29, including Nos. 44, 46, 48–53 of 2026; none amends or extends Announcement No. 70 of 2025. Negative evidence only, valid as of the access date. Recheck 2026-11-08: Page generated 2026-11-06 17:27 (MakeTime). Items added since the 2026-10-31 check: Nos. 56 and 57 of 2026 (anti-dumping investigations, 6 November) and a seven-agency shipping-insurance guideline (6 November). None amends or extends Announcement No. 70 of 2025. The export-control catalogue page (aqygzj.mofcom.gov.cn/qdml/, generated 2026-10-26) still lists No. 70 as its latest entry on the October 2025 package. Nos. 54 and 55 of 2026, absent from this listing, are n-propanol anti-dumping and countervailing expiry reviews (titles per a news reproduction, not read on MOFCOM). Negative evidence only, valid as of the access date."
      },
      {
        "id": "cand-src-mofcom-press-2026-11-05",
        "title": "商务部召开例行新闻发布会（2026年11月5日）",
        "publisher": "中华人民共和国商务部 (Ministry of Commerce, PRC)",
        "url": "https://www.mofcom.gov.cn/xwfbzt/2026/swbzklxxwfbh2026n11y5r/index.html",
        "language": "zh",
        "datePublished": "2026-11-05",
        "dateAccessed": "2026-11-08",
        "sourceType": "official",
        "confidence": "primary",
        "notes": "Full transcript read 2026-11-08 (spokesperson 黄玲). No question or answer mentions rare earths, export controls, Announcement No. 70, the 10 November date or the Kuala Lumpur arrangement. The only US question concerned agricultural purchases; the answer ties them to the '300亿对300亿' reciprocal tariff arrangement."
      }
    ],
    "verification": {
      "verdict": "pending"
    },
    "classification": {
      "confidence": "low",
      "ambiguityFlags": [
        "Announcement, not an adopted legal instrument",
        "Does not name the instrument whose end date it would change"
      ]
    },
    "reviewerNotes": "Recommendation: do NOT promote this as its own event. It is better held as monitoring evidence until MOFCOM/GACC publish (or fail to publish) an implementing announcement before 10 November 2026. If one appears, code that announcement as the event and cite this reading as context. If none appears by 10 November, the No. 70 event and its control-measure status histories need a reviewer decision on what the official record shows. Recheck 2026-11-08: still no numbered announcement amending No. 70, and MOFCOM's 5 November briefing is silent on it. News coverage (VOA Chinese, 6 November) reports a US–China call urging implementation and states the truce was extended to 20 January 2027, which contradicts MOFCOM's own 10 January 2027; neither is evidence of an instrument. Result 2026-11-11: MOFCOM/GACC published Announcement No. 58 of 2026 on 9 November, continuing the suspension of all six announcements from 11 November 2026 to 10 January 2027. That instrument is drafted as cand-cn-mofcom-58-2026. Recommendation: reject this candidate as its own event and cite the 28 September reading only as context, as planned.",
    "openQuestions": [
      "Does the extension cover the No. 70 suspension? The text says only 'some tariff and non-tariff measures of each side' (双方各自部分关税和非关税措施).",
      "Recheck MOFCOM policy releases and the export-control catalogue (aqygzj.mofcom.gov.cn/qdml/) daily from 7 to 11 November 2026.",
      "Announcement No. 72 of 2025 suspends Article 2 of No. 46 of 2024 only until 27 November 2026 (see evt-cn-us-ban-2024); does the same extension reach it?",
      "Does the US side's 50% affiliates-rule suspension (secondary sources say also extended to 10 January 2027) belong in a separate US candidate?"
    ],
    "promotion": {
      "promoted": false,
      "promotedEventId": null,
      "promotedAt": null,
      "approvedBy": null
    }
  },
  {
    "candidateId": "cand-cn-mofcom-12-2026",
    "status": "draft",
    "createdBy": "policy-researcher",
    "createdAt": "2026-10-31",
    "updatedAt": "2026-10-31",
    "proposedEvent": {
      "date": "2026-02-24",
      "jurisdiction": "china",
      "issuingBody": "MOFCOM",
      "titleOriginal": "商务部公告2026年第12号 公布将20家日本实体列入关注名单",
      "titleOriginalLang": "zh",
      "titleEn": "MOFCOM Announcement No. 12 of 2026: adding 20 Japanese entities to the watch list",
      "titleEnSource": "self",
      "documentNumber": "MOFCOM Announcement No. 12 (2026)",
      "policyStatus": "in_force",
      "mechanism": [
        "export_control",
        "dual_use_license"
      ],
      "affectedMaterialIds": [],
      "affectedSectors": [],
      "summary": "Adds 20 Japanese entities whose end users and end uses of dual-use items cannot be verified to MOFCOM's watch list (关注名单), under the Export Control Law and the Dual-Use Items Export Control Regulations. Exports of dual-use items to them may not use general licences or registration-based export certificates; single-licence applications must include a risk-assessment report on the listed entity and a written commitment that the items will not be used for any purpose that helps enhance Japan's military strength, and the review period is not bound by Article 17(1) of the Regulations. MOFCOM will apply stricter end-user and end-use review and will not approve exports involving Japanese military users or uses or any other end use that helps enhance Japan's military strength. Listed entities that fulfil verification obligations under Article 26 may apply for removal. Effective from publication on 24 February 2026. The annex includes Mitsubishi Materials Corporation (item 8) and TDK Corporation (item 12).",
      "analyticalSignificance": "Not yet coded. A watch-list entry is a stricter licensing regime, not a prohibition; it must not be described as an export ban.",
      "sourceIds": [
        "cand-src-mofcom-12-2026"
      ],
      "intakeMode": "backfill"
    },
    "proposedFraming": [],
    "proposedSources": [
      {
        "id": "cand-src-mofcom-12-2026",
        "title": "商务部公告2026年第12号 公布将20家日本实体列入关注名单",
        "publisher": "中华人民共和国商务部 (Ministry of Commerce, PRC)",
        "url": "https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_bac18400512d408a8d4c2f964e36ac11.html",
        "language": "zh",
        "datePublished": "2026-02-24",
        "dateAccessed": "2026-10-31",
        "sourceType": "official",
        "confidence": "primary",
        "notes": "Full text and annex read 2026-10-31. 发文日期 2026年02月24日. Opening clause verbatim: 决定将斯巴鲁株式会社等无法核实两用物项最终用户、最终用途的20家日本实体列入关注名单. No stated national-security purpose clause, unlike the control-list announcements. Annex item 8: 三菱材料株式会社（Mitsubishi Materials Corporation）; item 12: TDK株式会社（TDK Corporation）; item 15: 东金株式会社（Tokin Corporation）. Annex gives names only, no addresses."
      }
    ],
    "verification": {
      "verdict": "pending"
    },
    "classification": {
      "confidence": "low",
      "ambiguityFlags": [
        "Scope link rests on the listed companies' own product descriptions, not on the instrument",
        "Watch list, not control list: stricter review, not a ban"
      ]
    },
    "reviewerNotes": "Scope leads, from search excerpts of company pages (read in full before relying on them): TDK's product site describes its NEOREC neodymium (NdFeB) magnet series (https://product.tdk.com/en/products/magnet/magnet/neodymium/index.html); Mitsubishi Materials describes a tungsten business and tungsten recycling (https://www.mmc.co.jp/corporate/en/business/tungsten/). Neither company is in the organization registry. The companion control-list announcement of the same date, No. 11, lists only defence and aerospace entities and is out of scope.",
    "openQuestions": [
      "Does SMPT code entity listings at all, and if so what links a listing to scope: the instrument, or the listed firm's own business?",
      "If coded, should the four 2026 listings (Nos. 12, 23, 30 and any later) be separate events or one series record?"
    ],
    "promotion": {
      "promoted": false,
      "promotedEventId": null,
      "promotedAt": null,
      "approvedBy": null
    }
  },
  {
    "candidateId": "cand-cn-mofcom-30-2026",
    "status": "draft",
    "createdBy": "policy-researcher",
    "createdAt": "2026-10-31",
    "updatedAt": "2026-10-31",
    "proposedEvent": {
      "date": "2026-07-24",
      "jurisdiction": "china",
      "issuingBody": "MOFCOM",
      "titleOriginal": "商务部公告2026年第30号 公布将14家欧盟实体列入出口管制管控名单",
      "titleOriginalLang": "zh",
      "titleEn": "MOFCOM Announcement No. 30 of 2026: adding 14 EU entities to the export-control control list",
      "titleEnSource": "self",
      "documentNumber": "MOFCOM Announcement No. 30 (2026)",
      "policyStatus": "in_force",
      "mechanism": [
        "export_control"
      ],
      "affectedMaterialIds": [],
      "affectedSectors": [],
      "summary": "Adds 14 entities in Italy, Germany, France, Poland, the Netherlands, the Czech Republic, Bulgaria and Lithuania to China's export-control control list under the Export Control Law and the Dual-Use Items Export Control Regulations. Exporters may not export dual-use items to them, and foreign organisations and individuals may not transfer or provide dual-use items originating in the PRC to them; related activities under way must stop immediately. Export genuinely needed in special circumstances requires an application to MOFCOM. Effective from publication on 24 July 2026. The annex includes Sindlhauser Materials GmbH (Kempten, Germany, item 3).",
      "analyticalSignificance": "Not yet coded.",
      "sourceIds": [
        "cand-src-mofcom-30-2026"
      ],
      "intakeMode": "backfill"
    },
    "proposedFraming": [],
    "proposedSources": [
      {
        "id": "cand-src-mofcom-30-2026",
        "title": "商务部公告2026年第30号 公布将14家欧盟实体列入出口管制管控名单",
        "publisher": "中华人民共和国商务部 (Ministry of Commerce, PRC)",
        "url": "https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_2c9a32aa73bf4f5ea80ffa83e62fb259.html",
        "language": "zh",
        "datePublished": "2026-07-24",
        "dateAccessed": "2026-10-31",
        "sourceType": "official",
        "confidence": "primary",
        "notes": "Full text and annex read 2026-10-31. 发文日期 2026年07月24日. Justification clause verbatim: 为维护国家安全和利益，履行防扩散等国际义务. Operative clause 一 verbatim: 禁止出口经营者向上述14家实体出口两用物项，禁止境外组织和个人将原产于中华人民共和国的两用物项转移或提供给上述14家实体；正在开展的相关活动应当立即停止。 Note the wording differs from No. 23 of 2026 (境外组织和个人 here; 任何国家和地区的组织和个人 there). Annex item 3: 辛德豪瑟材料有限公司（Sindlhauser Materials GmbH）, Daimlerstraße 68, Kempten, Germany."
      }
    ],
    "verification": {
      "verdict": "pending"
    },
    "classification": {
      "proposedFramingCategories": [
        "national_security"
      ],
      "confidence": "low",
      "ambiguityFlags": [
        "Scope link rests on the listed company's own description, not on the instrument"
      ]
    },
    "reviewerNotes": "Sindlhauser's own English homepage (read in full 2026-10-31, https://www.sindlhauser.de/en/) says it has supplied, since 1995, 'materials for coating such as sputter targets made from oxide and non-oxide ceramics or bonded rare earth metals, as well as metals and alloys', and lists tungsten, tantalum and molybdenum components and LaB6 (lanthanum hexaboride) ceramic and cathodes. The other 13 entities were not screened against their own sources; several (Lafert, Garnet, Antraco Chemie) need checking before ruling them out. Secondary coverage (biggo.com) links Sindlhauser to Chinese rare-earth export controls; not evidence.",
    "openQuestions": [
      "Same methodology question as cand-cn-mofcom-12-2026.",
      "Screen Lafert S.p.A., Garnet S.r.l. and Antraco Chemie-Handelsgesellschaft against their own sources."
    ],
    "promotion": {
      "promoted": false,
      "promotedEventId": null,
      "promotedAt": null,
      "approvedBy": null
    }
  },
  {
    "candidateId": "cand-cn-mofcom-58-2026",
    "status": "draft",
    "createdBy": "policy-researcher",
    "createdAt": "2026-11-11",
    "updatedAt": "2026-11-11",
    "proposedEvent": {
      "date": "2026-11-09",
      "jurisdiction": "china",
      "issuingBody": "MOFCOM / GACC",
      "titleOriginal": "商务部、海关总署公告2026年第58号 公布继续暂停实施商务部、海关总署公告2025年第55号、56号、57号、58号及商务部公告2025年第61号、62号的决定",
      "titleOriginalLang": "zh",
      "titleEn": "MOFCOM & GACC Announcement No. 58 of 2026: decision to continue suspending Announcements Nos. 55, 56, 57, 58, 61 and 62 of 2025 (to 10 January 2027)",
      "titleEnSource": "self",
      "documentNumber": "MOFCOM & GACC Announcement [2026] No. 58",
      "policyStatus": "in_force",
      "mechanism": [
        "export_control",
        "trade_action"
      ],
      "affectedMaterialIds": [
        "rare-earth-elements",
        "ndfeb-magnets",
        "graphite",
        "lithium",
        "cobalt",
        "nickel"
      ],
      "affectedSectors": [
        "defense",
        "semiconductor",
        "energy",
        "battery",
        "industrial"
      ],
      "summary": "Continues the suspension of the whole 9 October 2025 control package (Announcements No. 55, 56, 57, 58, 61 and 62 of 2025) from 11 November 2026 to 10 January 2027. The previous suspension under Announcement No. 70 of 2025 ran to 10 November 2026, so the new period begins the following day with no gap. The text is one operative sentence; it gives no reason and does not mention Announcement No. 18 of 2025, which was never suspended.",
      "analyticalSignificance": "Not yet coded. Draft note for reviewer: the end date matches MOFCOM's 28 September 2026 reading of the eighth round of consultations (Kuala Lumpur arrangement extended to 10 January 2027); a press report giving 20 January 2027 was wrong.",
      "sourceIds": [
        "cand-src-mofcom-58-2026"
      ]
    },
    "proposedFraming": [],
    "proposedSources": [
      {
        "id": "cand-src-mofcom-58-2026",
        "title": "商务部、海关总署公告2026年第58号 公布继续暂停实施商务部、海关总署公告2025年第55号、56号、57号、58号及商务部公告2025年第61号、62号的决定",
        "publisher": "中华人民共和国商务部 (Ministry of Commerce, PRC)",
        "url": "https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_91466027f465467985942a639a9485f4.html",
        "language": "zh",
        "datePublished": "2026-11-09",
        "dateAccessed": "2026-11-11",
        "sourceType": "official",
        "confidence": "primary",
        "notes": "Full text read 2026-11-11. 发布单位 安全与管制局; 发布文号 商务部 海关总署2026年第58号; 发文日期 2026年11月09日; posted 2026-11-09 16:00. Operative text verbatim, in full: 经批准，自2026年11月11日起至2027年1月10日，商务部、海关总署公告2025年第55号、56号、57号、58号，及商务部公告2025年第61号、62号继续暂停实施。 Identical copy on the export-control bureau catalogue page https://aqygzj.mofcom.gov.cn/qdml/art/2026/art_5c9199b52ff24171aeef73a10576815b.html (read 2026-11-11). On promotion use id src-mofcom-58-2026: src-mofcom-58 is already Announcement No. 58 of 2025 (batteries and graphite anodes)."
      }
    ],
    "verification": {
      "verdict": "pending"
    },
    "classification": {
      "confidence": "medium",
      "ambiguityFlags": [
        "policyStatus of the No. 70 event after 10 November 2026 is a reviewer decision (see reviewerNotes)"
      ]
    },
    "reviewerNotes": "Proposed reviewer decision (no seed edited). (1) Promote this as a new event with its own control row, citing src-mofcom-58-2026. (2) Append one statusHistory entry to each of the 18 control rows that now say 'suspended until 2026-11-10' under Announcements 56, 57, 58, 61 and 62 of 2025: {status: suspended, date: 2026-11-11, sourceId: src-mofcom-58-2026, until: 2027-01-10, note: the verbatim operative sentence}. Using the effective date (11 Nov) rather than the publication date (9 Nov) keeps the No. 70 and No. 58 windows from overlapping; the existing 'scheduled' entries use publication dates, so the maintainer should pick one convention. (3) Append {status: expired, date: 2026-11-11, sourceId: src-mofcom-70, until: null} to ctl-cn-ree-2025-11-suspension: No. 70's own text set its window to 10 November 2026 (至2026年11月10日), so the expiry rests on No. 70 itself, and the continuation is recorded on the new event's own control row. npm run validate already warns on all 19 rows (the 18 plus this one). (4) The No. 70 event's policyStatus 'active' is now stale. 'ended' does not fit (defined as no continuing effect and no replacement); 'superseded' with supersededByEventId pointing to the new event is the closest existing label, though No. 58 continues rather than replaces No. 70. Maintainer call; do not create a new label. (5) Update the summaries and analyticalSignificance of china-rare-earth-expansion-2025-10, china-rare-earth-suspension-2025-11 and evt-cn-mofcom-56/57/58/62-2025, which say the corpus records nothing about what follows 10 November 2026. (6) Publication date 2026-11-09 is after site.lastUpdated (2026-10-17), so this needs a separately approved corpus refresh.",
    "openQuestions": [
      "Intake mode: this was caught by scheduled monitoring after monitoring began, which fits 'monitored' (discoveredAt 2026-11-11, officialPublicationDate 2026-11-09), but the validator then requires verificationStatus 'verified' and full lifecycle dates. Maintainer to decide.",
      "Also update lastCheckedAt on watch-cn-mofcom-policy-releases and watch-cn-mofcom-export-control-catalogue (both null) in the same release?"
    ],
    "promotion": {
      "promoted": false,
      "promotedEventId": null,
      "promotedAt": null,
      "approvedBy": null
    }
  }
]
```
