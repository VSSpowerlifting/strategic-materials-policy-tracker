# Market monitor sources — research notes (2026-11-09)

Working notes for the `/markets` expansion (PR #232 follow-on). They record what
was checked against each primary, so ingest constants and series metadata can be
re-verified. Values below are transcribed from the source files named; the
ingest scripts re-read the pinned files, so these notes are not the data source.

## 1. World Bank Pink Sheet (monthly) — unchanged from PR #232

- File: `CMO-Historical-Data-Monthly.xlsx`,
  <https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx>
- SHA-256 `3c8d9d8dbb48342fdbf24777c39a8ce8964cc2fd0958f72f6779e6e4ad99cde2`, 587,760 bytes;
  re-downloaded 2026-11-09 and the hash still matches.
- Release 2026-11-03; last observation 2026-10; next release 2026-12-02. CC BY 4.0.
- Series kept: aluminium, copper, nickel (LME, US$/t). Stored window from 2005-01.

## 2. IMF Primary Commodity Price System (PCPS), monthly

- Query (SDMX 2.1):
  `https://api.imf.org/external/sdmx/2.1/data/IMF.RES,PCPS,latest/G001.PCOBA+PPALLA+PREODOM.USD.M?startPeriod=2005-01&detail=full`
- Pinned raw response committed at
  `data/markets/imf-pcps/raw/pcps-PCOBA-PPALLA-PREODOM-USD-M.xml`,
  SHA-256 `3f005120ad83924285cc548a1a1c6503e953ba9477c79d65c3071c11220ee7dd`, 102,066 bytes.
- Header: dataflow `IMF.RES:PCPS` v9.0.0; `UPDATE_DATE` and `PUBLICATION_DATE`
  2026-10-06; response prepared 2026-11-09T23:04:21Z. The IMF landing page
  (<https://www.imf.org/en/research/commodity-prices>) shows "Excel Database: October 2026".
- Dataset attributes: `LICENSE` = "© International Monetary Fund Copyright. All Rights
  Reserved. https://www.imf.org/external/terms.htm"; suggested citation "International
  Monetary Fund. Primary Commodity Price System (PCPS), https://data.imf.org/en/datasets//IMF.RES:PCPS."
- Terms (<https://www.imf.org/en/about/copyright-and-terms>) permit download, derivative
  works, publication and distribution of Data on condition of accurate attribution
  ("Source: International Monetary Fund, Database Name, <URL>"), no infringement of data
  integrity, and an explicit statement when data are materially transformed. Data provided
  "as is". The monitor stores values unchanged (period format normalised from `YYYY-Mmm`
  to `YYYY-MM` only) and states this in the manifest.
- Method (PCPS technical documentation, Jan 2019): monthly values are averages of weekly or
  daily values.

| Code | Series kept | Spec as documented | Coverage | Cross-check |
| --- | --- | --- | --- | --- |
| PCOBA | Cobalt | Tech doc: "Cobalt, minimum 99.80% purity, LME spot price", USD/mt. Codelist conflicts ("US dollars per pound", "U.S. cathodes, spot"). | 2005-01 to 2026-09, 261 obs | 2021–24 annual means converted to $/lb (23.24, 28.92, 15.55, 11.94) track USGS LME cash (23.17, 28.83, 15.48, 11.84), confirming LME and US$/t. |
| PPALLA | Palladium | "Palladium, LME spot price, USD/troy ounce" (codelist oddly says "per troy ounce of gold"). | 2005-01 to 2026-09, 261 obs | 2021–24 annual means 2398.15, 2107.40, 1339.51, 982.92 vs USGS 2419.18, 2133.81, 1351.66, 994.90 (within ~1.3%; different source assessment). |
| PREODOM | Rare-earth carbonate | "Rare earth carbonate REO 42–45% purity, USD/metric ton", source Shanghai Metal Market. Codelist adds "Dom" (undefined; read as China domestic). | 2012-06 to 2026-09, 172 obs | No independent cross-check. Mixed-REO intermediate; not an NdPr, Nd or Pr price. |

Not used: PLITH (lithium) — documentation conflicts ("Lithium Metal ≥99%, battery grade"
vs "industrial grade"), values near US$145k/t look like metal rather than carbonate, and no
underlying source is named; recorded as a coverage-gap reason. IMF aluminium, copper and
nickel duplicate the World Bank series with different specs (skipped). Chromium, manganese,
vanadium and molybdenum are outside `data/seed/materials.json` (skipped).

## 3. USGS Mineral Commodity Summaries 2026 data release, annual

- DOI <https://doi.org/10.5066/P1WKQ63T>; ScienceBase item `696a75d5d4be0228872d3bf8`.
  File `MCS2026_Commodities_Data.csv`:
  <https://www.sciencebase.gov/catalog/file/get/696a75d5d4be0228872d3bf8?f=__disk__eb%2F4d%2Fd1%2Feb4dd129d4f08cfba010a8b11cbbd2d88bbefdcb>
- SHA-256 `582a0aa231aea53d8a97dc8d1cd3dfa5f885cf3760353e3d029d7f0ae4fbaaf5`,
  MD5 `36185ff3742087e1dd90c52fe634fe12`, 3,189,010 bytes, Windows-1252 encoded.
- Rights: "This work is marked with the Creative Commons Zero v1.0 Universal (CC0-1.0)
  public domain dedication." Published 2026-02-06; item last updated 2026-05-27
  (report version 1.3, May 2026; report DOI 10.3133/mcs2026).
- Citation: National Minerals Information Center, 2026, U.S. Geological Survey Mineral
  Commodity Summaries 2026 Data Release: U.S. Geological Survey data release,
  https://doi.org/10.5066/P1WKQ63T.
- Years 2021–2025; every 2025 value carries the note "Estimated." Underlying price sources
  are named in the MCS chapter PDFs (read via pdftotext), not in the CSV.

| Material | Label (verbatim, abridged) | Unit | 2021 | 2022 | 2023 | 2024 | 2025e | Type / note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Aluminium | ingot, average U.S. market (spot) | ¢/lb | 138.5 | 152.6 | 125.9 | 129.5 | 180 | Assessment (Platts Metals Week) |
| Antimony | metal, average | $/lb | 5.31 | 6.18 | 5.49 | 10.24 | 25 | Assessment; min 99.65%, CIF (Argus) |
| Boron | avg unit value of combined imports, CIF | $/t | 394 | 485 | 606 | 574 | 540 | Trade unit value |
| Cobalt | U.S. spot, cathode | $/lb | 24.21 | 30.78 | 17.20 | 16.77 | 21 | Assessment (Platts) |
| Cobalt | LME, cash | $/lb | 23.17 | 28.83 | 15.48 | 11.84 | 15 | Exchange |
| Copper | U.S. producer, cathode | ¢/lb | 432.3 | 410.8 | 395.3 | 431.8 | 490 | COMEX + premium |
| Copper | COMEX, high-grade, first position | ¢/lb | 424.3 | 400.7 | 385.7 | 421.6 | 480 | Exchange |
| Copper | LME, grade A, cash | ¢/lb | 422.5 | 399.8 | 384.8 | 414.7 | 440 | Exchange |
| Gallium | avg unit value of imports | $/kg | 277 | 432 | 365 | 439 | 580 | Unit value (Census, HTS 8112.92.1000) |
| Germanium | metal, avg European, min 99.999% | $/kg | 1,187 | 1,294 | 1,392 | 1,991 | 4,100 | Assessment (Argus) |
| Germanium | dioxide, avg European | $/kg | 770 | 828 | 883 | 1,281 | 2,500 | Assessment (Argus) |
| Graphite | flake, avg unit value of imports | $/t | 1,330 | 1,200 | 1,080 | 1,050 | 1,000 | Unit value, at foreign ports |
| Graphite | lump and chip (Sri Lanka) | $/t | 2,010 | 2,590 | 2,380 | 2,810 | 2,600 | Unit value |
| Graphite | amorphous | $/t | 629 | 563 | 607 | 535 | 470 | Unit value |
| Lithium | annual average-real, battery-grade carbonate | $/t | 11,700 | 63,700 | 39,000 | 11,800 | 9,000 | Assessment (Benchmark; spot + long-term contracts). "Real" undefined in source. |
| Nickel | LME, cash | $/t | 18,476 | 25,815 | 21,495 | 16,812 | 15,000 | Exchange ($/lb duplicate row skipped) |
| Niobium | avg unit value, ferroniobium | $/kg | 21 | 25 | 25 | 26 | 26 | Trade unit value |
| Palladium | Engelhard unfabricated | $/troy oz | 2,419.18 | 2,133.81 | 1,351.66 | 994.90 | 1,100 | Assessment (Platts) |
| Rare earths | NdPr oxide, min 99%, FOB | $/kg | 92 | 124 | 75 | 55 | 69 | Assessment (Argus); location not stated |
| Rare earths | Neodymium oxide, min 99.5%, FOB | $/kg | 98 | 134 | 78 | 56 | 73 | Assessment (Argus) |
| Rare earths | Mischmetal, FOB | $/kg | 5.66 | 6.52 | 5.47 | 5.45 | 5.62 | Assessment (Argus) |
| Rare earths | Terbium oxide, min 99.99%, FOB | $/kg | 1,340 | 2,050 | 1,300 | 812 | 1,010 | Assessment (Argus, Asian Metal) |
| Rare earths | Dysprosium oxide, min 99.5%, FOB | $/kg | 410 | 382 | 330 | 257 | 239 | Assessment (Argus, Asian Metal) |
| Tantalum | tantalite, per kg Ta2O5 content | $/kg | 158 | 196 | 170 | 167 | 180 | Assessment; source changes: CRU 2021, IREM 2022–24, Asian Metal 2025 (source breaks) |
| Tungsten | concentrate, in-warehouse Rotterdam, per mtu WO3 | $/mtu | 225 | 275 | 258 | 252 | 380 | Assessment (Argus); 1 mtu WO3 = 7.93 kg W |

Excluded: ytterbium (outside material scope); alumina (no matching material record).

## 4. Consequences for the monitor

- Monthly (World Bank + IMF) and annual (USGS) series are never drawn on one axis.
- Unit values are labelled "trade unit value", never "price".
- A change ending on a 2025 estimate is flagged; a change across a stated source break is not computed.
- No unit or currency conversion is stored or displayed; the cross-checks above are notes only.
- Coverage gaps remaining after this release: praseodymium on its own (NdPr covers it jointly),
  monthly series for lithium, graphite, tungsten, antimony, gallium, germanium.
