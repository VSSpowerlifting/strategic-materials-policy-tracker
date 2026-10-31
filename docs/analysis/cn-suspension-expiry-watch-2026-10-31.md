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
    "updatedAt": "2026-10-31",
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
        "dateAccessed": "2026-10-31",
        "sourceType": "official",
        "confidence": "primary",
        "notes": "Page generated 2026-10-30 16:25 (MakeTime). First page lists items dated 2026-09-29 to 2026-10-29, including Nos. 44, 46, 48–53 of 2026; none amends or extends Announcement No. 70 of 2025. Negative evidence only, valid as of the access date."
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
    "reviewerNotes": "Recommendation: do NOT promote this as its own event. It is better held as monitoring evidence until MOFCOM/GACC publish (or fail to publish) an implementing announcement before 10 November 2026. If one appears, code that announcement as the event and cite this reading as context. If none appears by 10 November, the No. 70 event and its control-measure status histories need a reviewer decision on what the official record shows.",
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
  }
]
```
