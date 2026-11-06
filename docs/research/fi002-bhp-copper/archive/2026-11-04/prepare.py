"""FI002 source-backed inputs and independently calculated analytical content.
Run with the bundled Python. No live-site files are inputs or outputs.
"""
from pathlib import Path
import json, csv, math

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output'
OUT.mkdir(exist_ok=True)
DATE = '2026-11-04'
BASE = 'https://www.bhp.com/-/media/documents/'
sources = [
 ['S01','BHP','FY2026 results presentation','2026-08-18',BASE+'media/reports-and-presentations/2026/260818_bhpresultsfortheyearended30june2026_presentation.pdf','FY2026; FY2027-35 guidance','Slides 19-22, 28, 35-36, 40, 50','Capital, project ranges, IRR methodology, cash-flow scope','Management guidance','Verified primary','Forward-looking; UBS assumptions reproduced by BHP, not independently surveyed','Link and paraphrase; no third-party graphics'],
 ['S02','BHP','FY2026 results exchange release','2026-08-18',BASE+'media/reports-and-presentations/2026/260818_bhpresultsfortheyearended30june2026_exchangerelease.pdf','FY2026; FY2025 comparative','PDF pp. 4-5, 7, 19, 21-24','Results, distributions, Jansen, asset metrics','Reported / management guidance','Verified primary','Asset and statutory segment tables have different equity-accounting boundaries','Link; reproduce selected facts only'],
 ['S03','BHP','Annual Report 2026','2026-08-18',BASE+'investors/annual-reports/2026/260818_bhpannualreport2026.pdf','Years ended 30 June 2026 / 2025','PDF pp. 22, 30, 36-37, 132, 136, 153, 163-165','Historical financials; FCF; liquidity; consolidation; commitments','Reported financials','Verified primary, selected sections','Audited statements govern accounting; EBITDA/FCF are non-IFRS; not a full audit by SMPT','Link; selected data, no full-report redistribution'],
 ['S04','SEC / BHP','FY2026 Form 20-F filing index','2026-08-18','https://www.sec.gov/Archives/edgar/data/811809/000119312526354647/0001193125-26-354647-index.htm','FY ended 2026-06-30','Index filing/period dates; main document bhp-20260630.htm','Filing identity and date','Filing metadata','Index verified; main HTML inaccessible','Main HTML exceeded retrieval size limit; no claim of full 20-F inspection','Link only'],
 ['S05','BHP','September 2026 quarterly operational review','2026-10-20',BASE+'media/reports-and-presentations/2026/261020_bhpoperationalreviewforthequarterended30september2026-pdf.pdf','Q1 FY2027','PDF pp. 1-2, 5','400.7 kt; $7.01/lb; asset guidance; $0.8bn gross pre-commitment','Reported unaudited / guidance','Verified primary','Provisional pricing and finalisation adjustments; guidance is fiscal, GS is calendar','Selected facts; link to issuer'],
 ['S06','BHP','Escondida asset page','Undated; retrieved 2026-11-04','https://www.bhp.com/what-we-do/global-locations/chile/escondida','Current asset description','Escondida at a glance','BHP 57.5%; Rio Tinto 30%; JECO combined 12.5%','Issuer description','Verified primary','Not a source for parent cash remittance entitlement','Link and paraphrase'],
 ['S07','BHP','Environmental permit submission announcement','2026-03-17','https://www.bhp.com/news/articles/03/escondida--bhp-submits-environmental-permit-to-build-a-new-concentrator-plant','March project plan','Project description','March $4.4-5.9bn; 220-260ktpa; replacement of Los Colorados','Management plan','Verified primary','Submission is not environmental approval or FID','Link and paraphrase'],
 ['S08','World Investment Institute','Copper: Goldman Sachs Raises Price Forecast on US-China Competition','2026-10-25','https://wiinstitute.org/copper-goldman-sachs-raises-price-forecast-on-us-china-competition/','Attributed GS research dated 2026-10-19','Forecast table; market mechanisms; risks','2027 $15,400/t vs $13,800/t; end-2026 $14,700/t','Secondary reporting of bank forecast','Verified public secondary, original unavailable','Original GS report not obtained; reported forwards are historical secondary data','Independent paraphrase; no proprietary charts or full report'],
 ['S09','International Copper Association Australia','Copper Weekly Brief - 22 October 2026','2026-10-22','https://copper.com.au/news/mining/copper-weekly-brief-22-october-2026/','October 2026 market reporting','Supply and demand outlook table','Corroborates GS forecasts; reports global ICSG surplus vs ex-US deficit','Secondary market commentary','Verified public secondary','Possible common source; corroboration does not constitute independent primary GS verification','Paraphrase selected facts'],
 ['S10','Goldman Sachs','Public Goldman Sachs Research hub','Retrieved 2026-11-04','https://www.goldmansachs.com/insights/goldman-sachs-research','Public hub','Research listing / targeted site search','Attempt to locate authorized original October 19 copper note','Research access check','Hub inspected; specific original not located','Do not characterize the hub as verifying $15,400','Link only'],
 ['S11','FinancialJuice','Goldman Sachs: Copper','Retrieved 2026-11-04','https://www.financialjuice.com/News/9812752/Goldman-Sachs-Copper.aspx','Unconfirmed','Accessible page shell','Starting lead only','Access check','No substantive forecast text accessible','Excluded from numerical support','No content redistributed'],
 ['S12','World Bank','Commodity Markets Outlook, October 2026','2026-10-27','https://thedocs.worldbank.org/en/doc/2ac43f46629cf90c2ea5b8929a343593-0050012026/original/CMO-October-2026.pdf','CY2026-28 forecasts','Table 1, PDF p.21 (printed p.13)','Copper 2026 $13,200; 2027 $13,000; 2028 $12,500/t','Independent institutional forecast','Verified primary','Different price definition and forecast assumptions; not market consensus or long-term price','Attribute World Bank; original SMPT exhibits'],
 ['S13','ICSG','April 2026 forecast download landing page','2026-04-23; page updated 2026-10-23','https://icsg.org/download/2026-04-23-press-release-icsg-copper-market-forecast-2026-2027/','April publication','Landing-page dates','Temporal check on candidate ICSG source','Source coverage','Landing page verified, not used as October numerical evidence','Update timestamp cannot establish October forecast contents','Link only'],
 ['S14','SEA Chile','Antofagasta project evaluation article','Retrieved 2026-11-04','https://www.sea.gob.cl/noticias/sea-antofagasta-director-regional-destaca-evaluacion-de-proyectos-por-mas-de-us28-mil','October 2026 lead','Search result / page returned navigation','Environmental approval cross-check','Access check','Substantive article not retrieved','No independent permit-status conclusion; use BHP submission/admission wording','No copied material'],
 ['S15','GBM','Public copper forecast coverage linked by WII','Retrieved 2026-11-04','https://gbm.com/media/noticia/goldman-sachs-revisa-al-alza-su-prevision-sobre-el-precio-del-cobre/','Unconfirmed','HTTP 403','GS verification attempt','Access check','Inaccessible','Excluded from numerical support','No copied material'],
]
headers=['source_id','issuer','document_title','document_date','url','reporting_period','locator','claim_supported','classification','verification_status','uncertainty','redistribution']
with (OUT/'SMPT_FI002_Evidence_Register.csv').open('w',newline='') as f:
 w=csv.writer(f); w.writerow(headers); w.writerows(sources)

LB=2204.6226218488
hist=[
 ['Group revenue',51262,58760,'US$m','S03 PDF p.136'],
 ['Group underlying EBITDA',25978,32947,'US$m','S03 PDF p.136'],
 ['Copper statutory segment revenue',22530,29031,'US$m','S03 PDF p.136'],
 ['Copper statutory segment underlying EBITDA',12326,18187,'US$m','S03 PDF p.136'],
 ['Group copper production (mixed reporting basis)',2017,1953,'kt','S03 PDF p.30'],
 ['Realised copper price',4.25,5.74,'US$/lb','S03 PDF p.30'],
 ['Capital and exploration cash expenditure',9794,10257,'US$m','S03 PDF p.37'],
 ['Net operating cash flow',18692,21778,'US$m','S03 PDF p.37'],
 ['Net investing cash flow',-13350,-12011,'US$m','S03 PDF p.37'],
 ['Reported free cash flow',5342,9767,'US$m','S03 PDF p.37'],
 ['Net debt',12924,8694,'US$m','S03 PDF p.22'],
 ['BHP dividends paid (cash-flow statement)',6403,6756,'US$m','S03 PDF p.132'],
 ['NCI dividends paid',1873,2355,'US$m','S03 PDF p.132'],
 ['Escondida revenue (100%, consolidated)',13177,17054,'US$m','S03 PDF p.163'],
 ['Escondida underlying EBITDA (100%)',8593,12440,'US$m','S02 PDF pp.21-22'],
 ['Escondida net operating cash flow (100%)',6263,7551,'US$m','S03 PDF p.163'],
 ['Iron ore underlying EBITDA',14396,14529,'US$m','S03 PDF p.36'],
 ['Coal underlying EBITDA',573,832,'US$m','S03 PDF p.36'],
 ['Group and unallocated EBITDA',-1317,-601,'US$m','S03 PDF p.36'],
 ['Cash and equivalents',11894,18532,'US$m','S03 PDF pp.164-165'],
 ['Contracted capital commitments',4785,4300,'US$m','S03 PDF p.153'],
 ['Undrawn revolving credit facility',5500,5500,'US$m','S03 PDF p.22'],
]
# Scenario assumptions: near-term price, production multiplier, long-term price,
# gross capex factor, operating delay. These are independent screens, not forecasts.
scenarios=[['Base',13000,1,4.76*LB,1,0],['Upside',15400,1.05,13000,1,0],['Downside',11000,.9,8500,1,0],['Delay',13000,1,4.76*LB,1,1],['Overrun',13000,1,4.76*LB,1.2,0],['Combined stress',11000,.9,8500,1.2,2]]
def screen(price=4.76*LB, cap=5850, delay=0, cost=4000, tax=.35, rate=.1, life=20):
 pvcap=sum(cap/5/(1+rate)**n for n in range(1,6))
 factor=sum(1/(1+rate)**n for n in range(6+delay,6+delay+life))
 annual=pvcap/factor
 return dict(pv_capex=pvcap,annuity_factor=factor,required_cf=annual,required_kt=annual*1000/((price-cost)*(1-tax)))
base=screen()
outputs=[]
for name,np,vol,lp,capfac,delay in scenarios:
 s=screen(lp,5850*capfac,delay)
 q=1575*.95
 price_effect=q*vol*(np-5.74*LB)/1000
 volume_effect=q*(vol-1)*(5.74*LB-4000)/1000
 ebitda=(price_effect+volume_effect)*.95
 cfo=ebitda*.65
 # Incremental minority claim on Escondida only, proportional to the cash shock.
 minority=cfo*1050/1575*.425
 residual=21778+cfo-11000-1754-6756-2355-minority
 outputs.append(dict(name=name,price=np,volume=vol,longprice=lp,capex=5850*capfac,delay=delay,ebitda=ebitda,cash=cfo,minority=minority,funding_residual=residual,**s))
gs_gross=1575*.95*1600/1000
gs_ebitda=gs_gross*.95
gs_cash=gs_ebitda*.65
key=dict(lb=LB,base=base,scenarios=outputs,gs_gross=gs_gross,gs_ebitda=gs_ebitda,gs_cash=gs_cash,gs_revision=1600/13800,latest_realised=7.01*LB,gs_vs_latest=15400/(7.01*LB)-1)
data=dict(date=DATE,sources=sources,source_headers=headers,historical=hist,scenario_inputs=scenarios,key=key)
(ROOT/'build'/'inputs.json').write_text(json.dumps(data,indent=2))

claims=[
 ['C01','2027 $15,400/t is a publicly reported GS forecast, up from $13,800/t','S08; S09','Forecast tables','Secondary corroborated; original unavailable'],
 ['C02','FY26 copper underlying EBITDA $18,187m; group $32,947m','S03','PDF pp.36,136','Primary verified'],
 ['C03','54% contribution excludes Group and unallocated items','S03','PDF p.36 footnote 3','Primary verified; 54.2% recalculated'],
 ['C04','Escondida capex $5.4-6.3bn nominal, output 230-270ktpa facility total','S01','Slides 28,36,40','Management guidance; incremental benefit undisclosed'],
 ['C05','16-18% IRR uses UBS May 2026 long-term $4.76/lb copper','S01','Slide 36, slide 28 footnote 3','Guidance verified; IRR not replicated'],
 ['C06','$0.8bn gross pre-commitment approved, not full FID','S05; S01','Quarter pp.1-2; presentation slide28','Primary verified; not added to approximate $0.5bn BHP share'],
 ['C07','World Bank 2027 copper forecast $13,000/t','S12','Table1 PDF p.21','Primary forecast verified'],
 ['C08',f'Base required production benefit {base["required_kt"]:.1f}ktpa','SMPT assumptions; S01','Model 06 and Methodology','Derived investment screen; not actual project forecast'],
 ['C09',f'GS revision gross annualised sales exposure ${gs_gross/1000:.2f}bn','S05 volumes plus SMPT 95% sales factor','Model 04','Derived; mixed calendar/fiscal sensitivity, not forecast'],
 ['C10','Historical FCF = operating plus signed investing CF','S03','PDF p.37','9767 = 21778 - 12011, capex already included'],
 ['C11','BHP controls and fully consolidates Escondida, with 42.5% NCI','S03; S06','PDF p.163; asset page','Primary verified; economic pro rata is separate'],
 ['C12','Stage engineering and commitment, preserve replacement readiness','SMPT analysis','Memo pp.5-6; model thresholds','Conditional analyst recommendation'],
]
with (OUT/'SMPT_FI002_Claim_Source_Matrix.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['claim_id','claim','source_ids','locator','status']);w.writerows(claims)

charter='''# FI002 research charter and feasibility assessment

Information cutoff: 4 November 2026, America/New_York. Worktree dd32 at 2286648f3bbb699eee5b6171f334792ffa2d545d, detached and initially clean. Origin: VSSpowerlifting/strategic-materials-policy-tracker. No dependent PR named. Research-only assignment, no production edits or distribution authorization.

The decision is whether to retain the Escondida replacement schedule, accelerate selected work, or stage irreversible commitments before the targeted CY2027-28 FID. BHP has approved readiness funding, not the entire new concentrator.

Public disclosures support historical corporate and segment financials, gross asset results, project ranges and management return guidance. They do not provide the counterfactual Los Colorados decline curve, project tax depreciation, annual construction draws, incremental operating costs, recovery curve, incremental by-product cash flow or complete project cash flows. A credible independent project IRR or bankable DCF cannot be built from these inputs.

The quantitative structure therefore combines annualised price-volume sensitivity, a corporate cash-use illustration and a capital-recovery threshold. It asks how much production must be preserved or added relative to a no-build counterfactual. It does not assign all facility output to incremental mine growth.

Competing hypotheses: A, higher prices relax funding constraints (supported directionally). B, 2027 prices have limited direct bearing on 2030s project returns (supported by horizon mismatch). C, replacement and execution dominate the project decision (supported, magnitude remains conditional). D, portfolio commitments constrain sequencing (supported by Jansen and group capex). These can all hold together. The alternative that unconditional acceleration maximizes value cannot be established without permitting, engineering and counterfactual evidence.

Coverage map: S01-S07 support issuer/project analysis; S08-S11/S15 address GS verification; S12 supplies a competing institutional price; S13-S14 record limitations of supplementary checks. The SEC index was inspected, but its large main filing could not be retrieved in full. Annual-report sections provide the accounting evidence. A targeted search found no inspected later official project estimate superseding October's review by the cutoff; this is not a comprehensive absence claim. The November Copper SA site visit is a refresh trigger, not assumed new evidence.

Design reference: docs/research/SMPT_RESEARCH_PUBLICATION_HOUSE_STYLE.md, adopted 4 November 2026. Existing studies and public binaries remain unchanged. No existing FI model was found in the targeted repository/selected Drive search. Research conclusions are ready for editorial assessment as a conditional decision study, not a lender investment appraisal.
'''
(ROOT/'Research_Charter.md').write_text(charter)

method=f'''# SMPT FI002 modeling and methodology appendix

Cutoff: {DATE}. Currency: US dollars. Workbook cash amounts: US$m, production: kt, prices: US$/t unless labelled US$/lb. One metric tonne equals {LB:.10f} avoirdupois pounds. All analytical values use unrounded inputs. Presentation rounding does not alter calculations.

## Classification and source hierarchy
Reported facts use historical financial statements. Management ranges and forecasts remain guidance. The GS figure is attributed public secondary reporting, corroborated in ICAA, not direct bank-report verification. BHP cites UBS consensus as of May 2026, which is a dated assumption disclosed by BHP, not a newly verified consensus. Blue numeric cells are editable assumptions or transcribed inputs. Calculations are formulas. Every factual schedule has source IDs and locators. Assumptions use SMPT labels and pale gold input fills. No proprietary bank chart, model or original research is reproduced.

## Accounting reconciliation
BHP controls Escondida and fully consolidates its results. 57.5% is used only for explicitly labelled economic attribution. Gross capex midpoint $5,850m implies $3,363.75m BHP pro rata economic cost. Cash funding and timing need not equal that proportion. Antamina is equity accounted. The workbook keeps its BHP share of production separate from consolidated sales sensitivity.

FY26 copper EBITDA $18,187m divided by $32,947m total group EBITDA is 55.2%. BHP's published 54% contribution uses a denominator excluding Group and unallocated items: 18,187 / (18,187 + 14,529 + 832) = 54.2%. These are different denominators, not a source error. The statutory segment revenue $29,031m differs from the asset-management table's $31,553m before equity-accounting adjustments. Do not mix them.

Reported FCF = operating cash flow + signed investing cash flow: 21,778 + (-12,011) = 9,767. Capital and exploration $10,257m is already embedded in investing CF. The residual $1,754m of net investing outflow is a historical calibration including other investing items, not an additional sanctioned project budget. Silver streaming $4,300m is a financing liability receipt in the cash-flow statement, not recurring operating cash generation. Cash-flow dividends $6,756m differ from note 19's $6,761m because of accounting/currency timing. FY26 declared returns of about $8.7bn are not the cash amount paid in FY26.

## Annualised operating sensitivity
FY27 asset guidance midpoints: Escondida 1,050kt gross, Spence 220kt, Copper SA 305kt and Antamina 130kt BHP share. Consolidated asset volume = 1,575kt. Adding equity-accounted Antamina gives 1,705kt, 20kt below the separately published group range midpoint 1,725kt. Guidance ranges are not required to add at their midpoints. No unexplained volume plug is used.

Sales proxy = consolidated production x 95% assumed payable/sales factor. The factor bundles inventory, payable and timing differences and is not a disclosed BHP conversion. Price effects use the selected price minus FY26 realised $5.74/lb converted to $/t. Volume effects value changed volume at baseline price less $4,000/t assumed avoidable cash cost. Combined EBITDA change = [Q x volume multiplier x price change + Q x (volume multiplier - 1) x (baseline price - avoidable cost)] x (1 - 5% price-linked leakage). Cash change applies a 35% illustrative marginal cash-tax rate and no working-capital change. These rates are analytical assumptions, not Chilean statutory rates or BHP sensitivities. By-product price/volume effects default to zero change and cannot be inferred from copper revenue. Copper SA by-products make a copper-only cost model incomplete.

The isolated GS revision is $1,600/t, or 11.6%, at fixed volume. Gross consolidated sales exposure = 1,575kt x 95% x $1,600/t / 1,000 = ${gs_gross:,.2f}m. EBITDA proxy = ${gs_ebitda:,.2f}m, cash proxy = ${gs_cash:,.2f}m. Antamina's gross price exposure is computed separately. CY2027 prices applied to FY27 volume scales are an annualised sensitivity, not a FY27 or CY2027 earnings forecast. No price is assumed achieved. Q1 FY27 $7.01/lb = ${7.01*LB:,.0f}/t, slightly above the GS 2027 number, so the revision is not necessarily a further windfall from current realised prices.

## Capital-recovery screen
The base uses $5,850m gross nominal capex, evenly paid at year ends 2027-31, a 10% nominal discount rate and first full benefit in 2032. It conservatively includes the full budget without deducting pre-commitment approval, because approval does not establish sunk expenditure. Operating benefit lasts 20 years by independent assumption. BHP's 230-270ktpa range covers average facility output in FY34-43, not a disclosed 20-year profile. Flat 2032 benefits omit ramp-up and therefore can overstate early benefits. The explicit delayed cases partly test this risk but are not an engineering ramp-up forecast.

PV(capex) = sum of annual capex / (1+r)^t, using end-2026 as valuation origin. The annual-benefit factor = sum of 1/(1+r)^t over the selected operating years. Required annual after-tax cash benefit = PV(capex) / factor. Required preserved/incremental tonnes = required cash / [(long-term copper price - all-in cash burden) x (1 - tax)]. The $4,000/t burden includes assumed operating cost, sustaining capital, treatment/freight and royalty allowance net of any assumed credits. It is a hypothetical levelized net cost, not the mine's reported C1 cost. Tax is a flat cash wedge with no depreciation shield. Working capital, closure, sunk-cost optimization, leases and other commercial commitments are not separately modeled. They must be covered by a revised burden or explicit cash flows before sanction analysis.

Base required benefit is ${base['required_cf']:,.0f}m per year and {base['required_kt']:.1f}ktpa at $4.76/lb, or {base['required_kt']/250:.1%} of a 250ktpa facility midpoint. This is a minimum levelized equivalent benefit screen. Only production actually lost under the no-build counterfactual, plus genuine improvements, can satisfy it. It is neither a project NPV nor a reproduced IRR. BHP's 16-18% IRR is recorded as guidance, never reverse engineered.

Long-term base $10,494/t approximately is anchored to BHP's quoted $4.76/lb consensus, then held flat nominal solely for the screen. Downside $8,500 and upside $13,000 are independent stress assumptions, not 2030s World Bank forecasts. Near-term prices never automatically feed long-term prices. All cases can be edited independently.

Delay cases keep construction spending fixed and shift all 20 benefit years, with no terminal value. This isolates benefit deferral but may understate loss if reserves impose a fixed closure date. Overrun adds 20% to total capex. Combined stress uses $8,500/t long-term price, 20% overrun and two-year benefit delay. Sensitivity tables use direct, auditable annuity formulas because the individual threshold calculation is simple. Native Excel TABLE dependencies are unnecessary.

## Funding and strategic options
Funding is an illustrative cash-use bridge: historical CFO + copper cash shock - $11,000m capex - historical other investing calibration - cash dividends - NCI distributions - incremental Escondida minority share of the copper cash shock. It does not project statutory net debt. Group CFO is not uniformly ownership scaled. JV cash remittances, other commodity changes, debt maturities, financing, lease additions and currency are not forecast. NCI cash shock assumes proportional eventual distribution, not a legal right or current payment. The $20bn net-debt target upper bound minus historical debt is a policy cushion, not a committed borrowing line. Cash plus undrawn RCF is a dated liquidity inventory, not all deployable cash.

Maintain assumes the selected illustrative schedule. Accelerate brings the five-year capex and full-benefit start one year forward and adds a 10% cost premium. Stage shifts both one year later and adds 5% escalation. These are transparent option screens, not feasible construction plans. Required benefit changes combine discounting and cost effects. Earliest-year cash relief from staging is $1,170m gross ($673m pro rata BHP), but lost replacement production can overwhelm that relief. An annual delay-loss illustration uses analyst-selected 50% of 250ktpa at risk, independent of the threshold calculation. Engineering, permits and no-build production determine whether any option is feasible.

## Reproduction and limits
Run build/prepare.py, build/build.mjs, then build/render_documents.py with the bundled runtimes. The JSON inputs and formula manifest preserve assumptions and cell lineage. build/verify.py independently recalculates the screen using Python and reads the exported workbook. Source PDFs are linked, not bundled. The SEC main HTML was unavailable because of a retrieval-size limit. The original GS research and independent permit decision were not obtained. The absence of a later inspected update does not prove no update exists. Refresh these before public release. The package is a conditional strategy study suitable for editorial review, not investment-grade project due diligence.
'''
(OUT/'SMPT_FI002_Methodology.md').write_text(method)

abstract='''Goldman Sachs’ publicly reported $15,400/t average copper forecast for 2027 strengthens the case for testing BHP’s funding flexibility, but it does not settle the economics of Escondida’s New Concentrator. The plant replaces Los Colorados and targets first production in 2031-32. BHP’s 16-18% return guidance uses a much lower long-term copper assumption of $4.76/lb. This study separates annualised operating exposure from a transparent capital-recovery screen. A $1,600/t forecast revision implies $2.39bn of gross consolidated sales exposure at the assumed sales conversion and FY27 asset guidance scale, before costs, taxes and minority claims. The project screen identifies the level of production that must be preserved or added to recover capital under alternative prices, construction costs and delays. Public disclosures cannot establish that counterfactual benefit. The most defensible approach preserves engineering and permitting readiness while staging irreversible commitments against verified replacement economics, execution readiness and portfolio funding demands.'''
summary=f'''# SMPT FI002 publication summary

## Final title
Goldman Sachs’ Copper Call and BHP’s Escondida Decision: Fund Readiness, Test Replacement Value

Subtitle: Independent financial and capital-allocation analysis. Information cutoff 4 November 2026. Goldman Sachs and BHP are research subjects. Neither sponsors, commissions or endorses this work.

## Abstract
{abstract}

## Three principal findings
1. The reported GS revision is material to annualised cash exposure, but $15,400/t is already close to BHP's Q1 FY27 realised $7.01/lb. A future benchmark forecast does not equal incremental EBITDA.
2. The base screen requires {base['required_kt']:.1f}ktpa of genuine preserved/incremental production equivalent, about {base['required_kt']/250:.0%} of the 250ktpa facility midpoint. Public information does not establish that benefit.
3. Retain readiness and the replacement timetable, with staged commitments before FID. Acceleration needs evidence that avoided production loss exceeds its execution premium. Unconditional deferral can destroy replacement value.

## SMPT contribution
The original contribution is a decision framework connecting geographically segmented copper availability and policy-induced inventory incentives to corporate funding, then separating that near-term exposure from the counterfactual industrial output needed to justify a replacement asset. The analysis distinguishes nominal capital estimates, approved readiness funding, economic ownership, consolidated reporting and realized physical performance.

## Review sequence
Read the 12-slide deck, then the six-page memo. Inspect the model guide and dashboard, source register, operating sensitivity, project threshold and scenario comparison. Use the methodology, claim matrix and quality review to challenge assumptions. The complete package remains private pending editorial authorization.

## Publication-readiness decision
READY FOR EDITORIAL REVIEW as a conditional capital-allocation study. No publication authorization. A claim to independent project valuation or a definitive FID recommendation remains unsupported. Before public release: refresh dated market and permit status, retain explicit secondary attribution for GS (or obtain authorized original verification), and approve the assumption-dependent threshold framing. A bankable project conclusion additionally requires the Los Colorados counterfactual, ramp-up, cost, fiscal and annual draw schedules.

## Executive decision gate
1. Established: material near-term copper exposure, separated reporting bases, and the production-benefit hurdle implied by transparent assumptions.
2. GS matters to financial flexibility, not as a guaranteed further increase from the latest realized price.
3. Long-term margins, preserved output, capital scope, timing and taxes drive project economics.
4. Stage commitments and preserve readiness, subject to the stated investment conditions.
5. Change the recommendation when verified lost output, permit readiness, costs or portfolio cash needs change the hurdle.
6. Actual project NPV/IRR and the optimal sanction date remain limited by disclosure.
7. Credible for SMPT editorial review with the qualification above. Public distribution still requires authorization.
8. Demonstrates reproducible mining capital screening, source-led financial reconciliation and industrial-policy scenario analysis.
9. Next capability: a reusable replacement-versus-expansion counterfactual model with dated funding and minority-interest bridges; apply it to the next BHP Copper SA disclosure after obtaining its technical inputs.
'''
(OUT/'SMPT_FI002_Publication_Summary.md').write_text(summary)
print(json.dumps(key,indent=2))
