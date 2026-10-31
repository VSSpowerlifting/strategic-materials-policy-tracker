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

**Leads not yet checked:** MOFCOM's 2026 control-list announcements for Japanese entities (No. 11, 24 February; No. 28) and EU entities (No. 30, 24 July) should be screened for materials firms.

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
  }
]
```
