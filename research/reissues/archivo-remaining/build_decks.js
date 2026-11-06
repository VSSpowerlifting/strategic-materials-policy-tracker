/* SMPT Issue 219 - editable slide reconstruction candidates.
 * Publication is withheld pending source/PDF fidelity and Archivo embed check.
 * Runtime: Node 22, pptxgenjs. All charts, tables, text are native PowerPoint.
 */
'use strict';
const pptxgen = require('pptxgenjs');
const fs=require('fs'),path=require('path');
const OUT=process.env.OUT_DIR||__dirname;
fs.mkdirSync(OUT,{recursive:true});
const C={dark:'12110F',panel:'1A1814',paper:'F5F3EE',ink:'1B1915',gray:'5B5548',line:'D8D3C7',gold:'C8993E',gold2:'E3B04B',goldInk:'7A5510',muted:'EFECE6',other:'B9B3A6',beige:'E9E3D7',soft:'E4D6BD',white:'FFFFFF'};
const FONT='Archivo';
const S={rect:'rect',line:'line',roundRect:'roundRect'};
const SW=13.333, SH=7.5;
const U={r001:'https://strategic-materials-policy-tracker.vercel.app/research/tungsten-supply-security',a001:'https://strategic-materials-policy-tracker.vercel.app/research/antimony-supply-resilience',
  uk:'https://www.nationalwealthfund.org.uk/news-and-publications/news/national-wealth-fund-backs-tungsten-west-to-unlock-critical-uk-tungsten-supply/',
  tw:'https://www.tungstenwest.com/investors',
  twTerm:'https://www.lse.co.uk/rns/strategic-investment-by-the-uk-government-nwf-yqliknoaeuaxugf.html',
  twOf:'https://www.lse.co.uk/rns/strategic-tungsten-supply-and-offtake-agreement-oqvcvuui6u6kzx7.html',
  euMoto:'https://abtungsten.es/en/2026/09/18/abenojar-tungsten-inaugura-la-mina-de-tungsteno-y-oro-el-moto/',
  euApt:'https://abtungsten.es/en/2026/10/09/abenojar-tungstens-proposed-apt-plant-designated-as-a-second-european-strategic-project/',
  jogmec:'https://www.jogmec.go.jp/activities/metal/critical-grant.html',
  allied:'https://www.allied-material.co.jp/dcms_media/other/NewsRelease_20260409.pdf',
  mits:'https://news.mmc.co.jp/corporate/en/newsroom/press/news20260909.html',
  mofW:'https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_e623090907fc4e1092f0a4db72f57b95.html',
  usgs:'https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf',
  exim:'https://www.exim.gov/solutions/project-and-structured-finance/transactions',
  sec:'https://www.sec.gov/Archives/edgar/data/1526243/000110465926097134/ppta-20260630x10q.htm',
  inl:'https://inl.gov/news-release/inl-hosts-ribbon-cutting-for-pilot-plant-supporting-domestic-antimony-production/',
  mofSb:'https://www.mofcom.gov.cn/zfxxgk/fdzdgknr/ztfl/dwmygl/art/2024/art_c37e7a6e7438428c951e2b1e488dc47e.html',
  evidence:'https://strategic-materials-policy-tracker.vercel.app/research/applied-001/antimony-evidence-and-assumptions.md'};
function pptx(name){let p=new pptxgen();p.layout='LAYOUT_WIDE';p.author='Benjamin Yang / Strategic Materials Policy Tracker';p.subject=name;p.title=name;p.company='Strategic Materials Policy Tracker';p.lang='en-US';p.theme={headFontFace:FONT,bodyFontFace:FONT,lang:'en-US'};return p;}
function shape(s, x,y,w,h,fill,line=fill,rad=false){s.addShape(rad?S.roundRect:S.rect,{x,y,w,h,rectRadius:0.08,line:{color:line,width:0.4},fill:{color:fill}});}
function txt(s,t,x,y,w,h,size=18,color=C.ink,bold=false,options={}){s.addText(t,{x,y,w,h,fontFace:FONT,fontSize:size,color,bold,margin:0,breakLine:false,fit:'shrink',valign:'mid',...options});}
function line(s,x1,y1,x2,y2,color=C.line,width=1){s.addShape(S.line,{x:x1,y:y1,w:x2-x1,h:y2-y1,line:{color,width,beginArrowType:'none',endArrowType:'none'}});}
function dot(s,x,y,d=0.14,color=C.gold){s.addShape('ellipse',{x,y,w:d,h:d,line:{color},fill:{color}})}
function linkText(s,label,url,x,y,w=5.5,h=0.2,col=C.gray,size=9.5){txt(s,label,x,y,w,h,size,col,false,{hyperlink:{url},underline:{color:col,style:'sng'}})}
function pg(p,i,total,series,dark=false){let s=p.addSlide();s.background={color:dark?C.dark:C.paper};const fg=dark?C.muted:C.gray;
  line(s,0.58,7.09,12.76,7.09,dark?'413D35':C.line,0.6);
  txt(s,'STRATEGIC MATERIALS POLICY TRACKER',0.58,7.14,4.3,0.17,8.2,fg,true,{charSpacing:1.3});
  txt(s,series,6.5,7.14,3.8,0.17,8.2,fg,false,{align:'right'});
  txt(s,`${String(i).padStart(2,'0')} / ${String(total).padStart(2,'0')}`,11.45,7.14,1.29,0.17,8.5,fg,true,{align:'right'});
  return s;}
function head(s,kicker,title,scope){txt(s,kicker.toUpperCase(),0.60,0.39,11.8,0.20,10,C.goldInk,true,{charSpacing:1.7});txt(s,title,0.60,0.72,12.05,0.91,29,C.ink,true,{breakLine:false});if(scope)txt(s,scope,0.60,1.66,12.05,0.42,12.8,C.gray,false);line(s,0.59,2.17,12.74,2.17,C.line,0.65);}
function note(s,text,y=6.55){txt(s,text,0.61,y,12.05,0.37,9.6,C.gray,false,{valign:'top'});}
function small(s,text,x,y,w,fs=13,col=C.gray){txt(s,text,x,y,w,0.54,fs,col,false,{valign:'top'})}
function label(s,text,x,y,w=5){txt(s,text.toUpperCase(),x,y,w,0.25,9.7,C.goldInk,true,{charSpacing:1.1});}
function metric(s,value,caption,x,y,w,opts={}){txt(s,value,x,y,w,0.64,31,opts.color||C.ink,true);txt(s,caption,x,y+0.66,w,0.58,12.4,C.gray,false,{valign:'top'});}
function table(s,rows,x,y,width,rowHeights,weights,colAlign=[],fs=14){const total=weights.reduce((a,b)=>a+b,0),w=weights.map(z=>z/total*width);let yp=y;rows.forEach((row,r)=>{const rh=rowHeights[r]||0.65;if(r===0)shape(s,x,yp,width,rh,C.dark);else if(r%2===0)shape(s,x,yp,width,rh,C.beige,C.beige);else shape(s,x,yp,width,rh,C.paper,C.paper);let xp=x;row.forEach((v,c)=>{txt(s,String(v),xp+0.15,yp+0.05,w[c]-0.25,rh-0.1,r===0?11.2:fs,r===0?C.muted:C.ink,r===0||c===0,{align:colAlign[c]||'left',valign:'mid'});xp+=w[c];});if(r>0)line(s,x,yp,x+width,yp,C.line,0.5);yp+=rh;});return yp;}
function pill(s,labelText,x,y,w,color=C.dark,fg=C.muted){shape(s,x,y,w,0.35,color,color,true);txt(s,labelText,x+0.10,y+0.03,w-0.20,0.28,10.6,fg,true,{align:'center'});}
function nativeBar(s,x,y,maxW,height,value,max,color=C.gold){shape(s,x,y,maxW,height,C.beige,C.beige);shape(s,x,y,maxW*value/max,height,color,color);}
function cover(p,series,title,subtitle,date,scope){let s=pg(p,1,8,series,true);shape(s,0.57,0.62,0.085,0.91,C.gold2);txt(s,'SMPT  /  '+series.toUpperCase(),0.83,0.65,10.9,0.32,12,C.gold2,true,{charSpacing:1.1});txt(s,title,0.76,1.58,11.8,2.12,43,C.muted,true,{breakLine:false,valign:'mid'});txt(s,subtitle,0.78,4.11,10.6,0.86,21,C.muted,false,{valign:'top'});line(s,0.79,5.47,12.45,5.47,'504837',0.7);txt(s,'Benjamin Yang',0.79,5.78,4.5,0.34,14,C.muted,true);txt(s,'Research cutoff: '+date,0.79,6.21,7.1,0.25,12,C.other);txt(s,scope,6.65,6.17,5.75,0.28,10.3,C.other,false,{align:'right'});return s;}
async function tungsten(){const p=pptx('Tungsten Supply Security — Archivo editable edition');const series='RESEARCH DOSSIER 001';
cover(p,series,'Tungsten\nSupply Security','Policy, financing and industrial execution across China, the EU, the UK and Japan','3 November 2026','Candidate reissue · original research unchanged');
{
const s=pg(p,2,8,series);head(s,'Comparative judgment','Four policy mechanisms produce different evidence of progress','Selected cases; legal measures, public capital and industrial delivery are assessed separately');
const rows=[['CHINA','EXPORT LICENSING','Item-specific permission governs qualifying tungsten products and technology.'],['EUROPEAN UNION','STRATEGIC PROJECT STATUS','El Moto under construction; a separate APT plant at proposal stage.'],['UNITED KINGDOM','EQUITY + LOAN','NWF core financing combines £36m equity and £25m lending.'],['JAPAN','GRANT DECISIONS','Equipment and conversion awards support powder and recycled feedstock.']];
rows.forEach((r,i)=>{const y=2.50+i*0.91;label(s,r[0],0.75,y,2.6);txt(s,r[1],3.0,y-0.03,3.3,0.42,14,C.ink,true);small(s,r[2],6.65,y-0.07,5.45,12.6);line(s,0.70,y+0.72,12.65,y+0.72,C.line,0.5)});
note(s,'The comparison tracks legal decisions, financial status and physical implementation in the units and scope of each source.');linkText(s,'Research and source register',U.r001,0.61,6.91,3.2,0.15,C.goldInk,8.8);
}
{
const s=pg(p,3,8,series);head(s,'United Kingdom','The £71m NWF headline includes £10m of contingent lending','Tungsten West / Hemerdon; announced August 2026; source amounts in GBP');
const bx=0.75,by=2.70,len=11.7;let px=bx;const vals=[36,25,10],colors=[C.dark,C.gold,C.other];const labs=['£36m equity','£25m core loan','£10m conditional accordion'];for(let i=0;i<3;i++){let w=len*vals[i]/71;shape(s,px,by,w,1.02,colors[i],colors[i]);txt(s,labs[i],px+0.08,by+0.24,w-0.16,0.5,i===2?12.3:16, i===1?C.ink:C.white,true,{align:'center'});px+=w}
metric(s,'£25m','Core loan fully drawn by 2 September 2026, according to FY2026 accounts',0.78,4.16,5.65,{color:C.ink});metric(s,'£10m','Additional accordion remained conditional in the announced package',6.87,4.16,5.4,{color:C.ink});
note(s,'Headline capacity, equity issuance and loan drawdown represent different financing statuses; the core loan also creates repayment exposure.');linkText(s,'NWF (25 Aug) · Issuer terms · FY2026 accounts',U.uk,0.61,6.91,9.0,0.15,C.goldInk,8.8);
}
{
const s=pg(p,4,8,series);head(s,'Hemerdon operating sequence','Processing activity preceded the August public financing announcement','Public chronology establishes sequencing; transaction-level data is needed to assess additional output');
const entries=[['JUL 2026','Processing and phased commissioning reported','Company operational disclosure'],['25 AUG','NWF investment announced','Up to £71m, including contingent capacity'],['2 SEP','Core loan reported fully drawn','By accounts-approval date; transfer date unknown'],['SEP 2026','Eight-year offtake announced','Deliveries and product acceptance remain to be tested']];
const baseX=0.82, gap=0.17, colW=2.78;
line(s,0.98,2.91,12.13,2.91,C.line,1.4);
entries.forEach((e,i)=>{const x=baseX+i*(colW+gap);dot(s,x+0.13,2.80,0.20,i===1?C.gold:C.dark);label(s,e[0],x+0.04,3.24,colW-0.12);txt(s,e[1],x+0.04,3.67,colW-0.12,1.03,16,C.ink,true,{valign:'top'});line(s,x+0.04,4.88,x+colW-0.18,4.88,C.line,0.4);txt(s,e[2],x+0.04,5.11,colW-0.14,0.95,12,C.gray,false,{valign:'top'});});
note(s,'The September offtake adds a contractual conversion route; measurable commercial supply requires reported deliveries and processing performance.');linkText(s,'Tungsten West investor disclosures',U.tw,0.61,6.91,5.2,0.15,C.goldInk,8.8);
}
{
const s=pg(p,5,8,series);head(s,'European Union','Strategic Project status covers very different project stages','Two selected tungsten-linked projects; designation is an administrative status');
const cols=[{x:0.77,title:'EL MOTO',stage:'Construction reported',desc:'Tungsten and gold extraction at Abenójar',detail:'Developer target: first production in Q1 2029',link:U.euMoto},{x:6.83,title:'EU APT TUNGSTEN PLANT',stage:'Proposed / FID pending',desc:'Separate tungsten conversion proposal',detail:'Technical partnerships and final investment decision remain outstanding',link:U.euApt}];
cols.forEach((k,i)=>{shape(s,k.x,2.53,5.66,3.64,C.beige,C.beige);label(s,k.title,k.x+0.24,2.78,5.0);txt(s,k.stage,k.x+0.24,3.30,5.11,0.55,22,C.ink,true);line(s,k.x+0.25,4.10,k.x+5.38,4.10,C.line);txt(s,k.desc,k.x+0.24,4.37,5.12,0.73,16,C.ink);txt(s,k.detail,k.x+0.24,5.30,5.12,0.51,12.7,C.gray);linkText(s,i===0?'Developer construction release':'Developer project disclosure',k.link,k.x+0.24,5.91,5.18,0.18,C.goldInk,9.5);});
note(s,'CRMA permit-processing timelines operate under legal triggers and exceptions. They are distinct from construction, financing or production schedules.');
}
{
const s=pg(p,6,8,series);head(s,'Japan','Grant decisions target downstream conversion and recycled feedstock','JOGMEC decisions and recipient capacity targets; announced amounts shown in JPY');
const vals=[7.5,2], names=['Allied Material','Japan New Metals'], scales=['¥7.5bn grant decision','¥2.0bn grant decision'];vals.forEach((v,i)=>{const y=2.62+i*1.48;txt(s,names[i],0.77,y,3.52,0.35,18,C.ink,true);nativeBar(s,4.30,y,6.0,0.49,v,8,C.gold);txt(s,scales[i],10.53,y,1.96,0.45,14,C.ink,true,{align:'right'});});
line(s,0.75,5.49,12.50,5.49,C.line);small(s,'ALLIED MATERIAL\nPlanned tungsten powder and carbide equipment; approximately 1.5× existing capacity; H1 FY2028 target.',0.80,5.65,5.6,12.7,C.gray);small(s,'JAPAN NEW METALS\nTarget 2,400 tonnes annual APT capacity (WO₃-equivalent); April 2029 schedule.',6.9,5.65,5.56,12.7,C.gray);
note(s,'A grant decision establishes an award milestone. Cash disbursement, installed equipment and qualified output require separate evidence.',6.66);linkText(s,'JOGMEC awards / Mitsubishi Materials',U.jogmec,0.61,6.91,6.6,0.15,C.goldInk,8.8);
}
{
const s=pg(p,7,8,series);head(s,'China','The February 2025 tungsten control operates at item level','MOFCOM/GACC Announcement No. 10 · effective 4 February 2025');
const items=[['CHEMICAL FORMS','Specified APT and tungsten oxides'],['POWDERS + CARBIDES','Product forms meeting stated definitions'],['SOLID FORMS','Listed tungsten metal and alloy forms'],['RELATED TECHNOLOGY','Associated production technology within control scope']];items.forEach((it,i)=>{const y=2.54+i*0.87;txt(s,it[0],0.86,y,3.5,0.35,14,C.goldInk,true);txt(s,it[1],4.31,y,7.53,0.46,17,C.ink);line(s,0.80,y+0.64,12.53,y+0.64,C.line,0.5)});
note(s,'The next implementation evidence is transaction-specific: licensing applications, decisions, processing times, enforcement and shipments.');linkText(s,'Original Chinese announcement',U.mofW,0.61,6.91,5.5,0.15,C.goldInk,8.8);
}
{
const s=pg(p,8,8,series);head(s,'Decision synthesis','Evidence quality improves when financial and physical milestones are tracked separately','Selected diligence priorities for lenders, industrial buyers and policymakers');
table(s,[['MECHANISM','EVIDENCE TO REQUEST','DECISION VARIABLE'],['UK financing','Loan drawdown, maturity terms, expenditure','Liquidity and ramp-up resilience'],['EU designation','Permits, FID, construction schedule','Actual time to productive capacity'],['Japan conversion grants','Payments, installed equipment, saleable output','Available conversion volumes'],['China licensing','Item-specific approvals and shipments','Deliverability and compliance']],0.72,2.61,11.96,[0.63,0.74,0.74,0.74,0.74],[2.25,5.1,4.61],[],13.4);
shape(s,0.75,6.47,11.92,0.43,C.dark);txt(s,'RESEARCH CUTOFF 3 NOV 2026   ·   SOURCE CORPUS 4fc59c7   ·   SOURCE-LEVEL EVIDENCE IN FULL DOSSIER',0.95,6.53,11.5,0.29,9.5,C.muted,false);linkText(s,'Read full research',U.r001,0.64,6.94,3.5,0.13,C.goldInk,8.8);
}
await p.writeFile({fileName:path.join(OUT,'SMPT_R001_Tungsten_Archivo_Candidate.pptx')});}
async function antimony(){const p=pptx('U.S. Antimony Supply Resilience — Archivo editable edition');const series='APPLIED STRATEGY 001';
cover(p,series,'U.S. Antimony\nSupply Resilience','Strategic options for a hypothetical defense manufacturer, 2027–2031','4 November 2026','Illustrative procurement model · 8-slide edition');
{
const s=pg(p,2,8,series);head(s,'Decision recommendation','Qualify a second supply lane, then hold five months of stock','Conditional balanced policy for 100 t/year of contained antimony-equivalent demand');
metric(s,'45%','Target share from an independently qualified alternative international supply lane',0.80,2.77,3.53);metric(s,'5 months','Provisional buyer-qualified reserve: $2.30m at the historical USGS metal proxy',4.86,2.77,3.53);metric(s,'30%','Future domestic offtake target; availability begins only with verified qualified output',8.85,2.77,3.63);
line(s,0.84,4.55,12.42,4.55,C.line);txt(s,'2030 severe interruption',0.86,4.86,5.4,0.34,17,C.ink,true);txt(s,'0 t unfilled under modeled supplier assumptions',0.86,5.33,10.8,0.53,24,C.goldInk,true);small(s,'The policy reverses if qualification or delivery independence fails. The model is a scenario stress test, not an actual purchase instruction.',0.87,6.04,11.25,12.8);
note(s,'USGS historical price proxy; model inputs and assumptions are documented in the public evidence register.',6.63);linkText(s,'Evidence and assumptions',U.evidence,0.61,6.94,4.5,0.13,C.goldInk,8.8);
}
{
const s=pg(p,3,8,series);head(s,'Supply baseline','National import reliance does not establish a buyer’s supplier mix','USGS estimates and historical U.S. antimony import origin, different denominators');
metric(s,'91%','U.S. net import reliance, 2025 estimate',0.78,2.66,5.0);metric(s,'55%','China share of U.S. metal + oxide import origins, 2021–2024',6.95,2.66,5.35);
line(s,0.78,4.16,12.5,4.16,C.line);label(s,'Buyer-specific diligence',0.81,4.46,4.1);const q=[['Form + grade','Contained-Sb conversion and specification'],['Traceability','Mine, smelter and refinery location'],['Qualification','Test results, supply independence and acceptance']];q.forEach((v,i)=>{txt(s,v[0],0.83,4.86+i*0.48,3.17,0.29,13,C.ink,true);txt(s,v[1],4.01,4.86+i*0.48,7.91,0.29,13,C.gray)});
note(s,'EXIM Stibnite authorization ($2.906bn) and an INL processing pilot document industrial development, not buyer-qualified deliveries.');linkText(s,'USGS 2026 · EXIM project register',U.usgs,0.61,6.94,7.1,0.13,C.goldInk,8.8);
}
{
const s=pg(p,4,8,series);head(s,'Four-strategy comparison','Only the balanced strategy meets both modeled 2030 constraints','Severe eight-month disruption; 100 t/year buyer; cash cap $3m; service tolerance ≤5 t unfilled');
const names=['Domestic-led','Diversification-led','Inventory-led','Balanced / conditional'],unfilled=[22.125,16.65,0,0],cash=[0.919,1.378,4.134,2.296];
label(s,'Unfilled antimony-equivalent (t)',0.78,2.40,5.7);names.forEach((n,i)=>{const y=2.83+i*0.86;txt(s,n,0.79,y,2.66,0.34,13.4,C.ink,i===3);nativeBar(s,3.55,y,6.35,0.36,unfilled[i],25,i===3?C.gold:C.dark);txt(s,`${unfilled[i]===0?'0':(Math.round((unfilled[i]+1e-9)*10)/10).toFixed(1)} t`,10.26,y,1.05,0.32,15,C.ink,true,{align:'right'});txt(s,`$${cash[i].toFixed(2)}m stock`,11.32,y,1.23,0.34,11.7,C.gray,false,{align:'right'});});
line(s,3.55,6.31,9.9,6.31,C.line);txt(s,'Threshold: 5 t',9.78,6.23,2.72,0.2,10,C.gray);note(s,'Inventory-led passes continuity but exceeds the illustrative $3m stock limit; balanced passes both only under specified qualification assumptions.',6.57);linkText(s,'Model register / 2030 comparison',U.evidence,0.61,6.94,6.8,0.13,C.goldInk,8.8);
}
{
const s=pg(p,5,8,series);head(s,'Economic trade-off','Five months frees $1.84m of stock cash versus nine months','2030 severe case; annual incremental expense includes sourcing premiums, carry and spot markup');
const rows=[['','BALANCED / CONDITIONAL','INVENTORY-LED'],['Stock months','5 months','9 months'],['Inventory capital','$2.296m','$4.134m'],['Modeled annual increment','$813k','$703k'],['2030 residual unfilled','0 t','0 t']];table(s,rows,0.81,2.57,11.77,[0.60,0.64,0.64,0.64,0.64],[4.55,3.65,3.57],[],15);
shape(s,0.82,6.13,11.69,0.42,C.beige);txt(s,'Trade-off: lower initial working capital at approximately $110k more annual modeled expense',1.0,6.18,11.29,0.3,14,C.ink,true);
note(s,'Initial inventory cash is an asset, not an annual incremental expense; all amounts use hypothetical buyer and historical price inputs.',6.65);
}
{
const s=pg(p,6,8,series);head(s,'Domestic qualification trajectory','The domestic target becomes available only after qualification','Modeled ramp to 30% target share; all values are illustrative buyer sourcing shares');
const entries=[['2027','0%'],['2028','0%'],['2029','0%'],['2030','15%'],['2031','30%']];const bx=1.05,barW=10.35;entries.forEach((e,i)=>{const y=2.52+i*0.70;txt(s,e[0],0.84,y,1.0,0.34,14,C.ink,true);nativeBar(s,2.03,y,9.6,0.39,parseInt(e[1]),30,C.gold);txt(s,e[1],11.96,y,0.63,0.35,15,C.ink,true,{align:'right'})});
small(s,'Until qualified domestic deliveries are available, that target volume is assigned to the incumbent sourcing lane in the model.',0.85,6.21,11.7,13);
note(s,'Actual schedules, plant status, processing specifications and enforceable offtake terms would control a real procurement ramp.',6.64);
}
{
const s=pg(p,7,8,series);head(s,'Reversal conditions','The five-month policy is sensitive to supplier independence','Residual unfilled contained-Sb equivalent in each distinct adverse scenario');
const rows=[['SEVERE TEST','MODELED GAP','OUTCOME AGAINST ≤5 t'],['2027: no qualified alternative','16.50 t','Above tolerance'],['2030: alternative lane 75% curtailed','5.70 t','Above tolerance'],['2030: curtailment + domestic delay','12.45 t','Above tolerance'],['2030: 12-month interruption','15.15 t','Above tolerance']];table(s,rows,0.79,2.55,11.75,[0.64,0.78,0.78,0.78,0.78],[6.25,1.91,3.59],[],14.0);
shape(s,0.81,6.32,11.68,0.39,C.beige);txt(s,'Action: strengthen alternate refinery qualification and retain a sixth-month procurement option',0.96,6.35,11.23,0.30,12.9,C.ink,true);
note(s,'Each test is a separate modeled shock, not an expected forecast or cumulative five-year loss.',6.77);
}
{
const s=pg(p,8,8,series);head(s,'Execution gates','Procurement, Finance and Legal each control a material assumption','Decision rights before firming purchases, inventory funding or domestic offtake');
const rows=[['OWNER','VERIFICATION REQUIRED','TRIGGER'],['Procurement + Engineering','Grade, chain of custody, independent refining, delivery tests','Qualify alternative 45% lane'],['Finance','Actual quoted price, carry, storage, working-capital ceiling','Approve five-month reserve'],['Strategy + Legal','Financing close, processing stage, product acceptance, contract remedies','Stage conditional domestic offtake']];table(s,rows,0.75,2.63,11.85,[0.64,0.88,0.88,0.88],[2.65,5.18,4.02],[],13.4);
small(s,'Sources: USGS MCS 2026; EXIM transaction register; Perpetua 10-Q; Idaho National Laboratory; MOFCOM/GACC announcements; model evidence register (4 Nov 2026).',0.83,6.05,11.69,10.9);
shape(s,0.80,6.55,11.75,0.40,C.dark);txt(s,'ILLUSTRATIVE BUYER CASE  ·  SOURCE CUTOFF 4 NOV 2026  ·  INDEPENDENT SMPT ANALYSIS',1.0,6.59,11.28,0.29,9.6,C.muted,false);linkText(s,'Read case / model',U.a001,0.64,6.94,3.9,0.13,C.goldInk,8.8);
}
await p.writeFile({fileName:path.join(OUT,'SMPT_A001_Antimony_Archivo_Candidate.pptx')});}
Promise.all([tungsten(),antimony()]).catch(e=>{console.error(e);process.exitCode=1});