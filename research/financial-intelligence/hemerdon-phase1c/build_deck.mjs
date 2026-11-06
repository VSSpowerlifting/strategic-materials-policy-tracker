// Run a temporary copy with bundled node_modules linked in its parent. No source edits.
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
process.on('uncaughtException',e=>{console.error(e.message);process.exit(1);});
const out=path.resolve(process.argv[2]);
const build=path.resolve(process.argv[3]||'/tmp/smpt-hemerdon-phase1c/build');
const skill='/Users/benjaminyang/.codex/plugins/cache/openai-primary-runtime/presentations/26.1030.10813/skills/presentations';
const runtime='/Users/benjaminyang/.cache/codex-runtimes/codex-primary-runtime/dependencies';
const {finalizePresentation,applyPresentationChartFont}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const data=JSON.parse(await fs.readFile(path.join(out,'publication-exhibits.json'),'utf8'));
const sources=JSON.parse(await fs.readFile(path.join(out,'../hemerdon-phase1a/sources.json'),'utf8'));
const ref=Object.fromEntries(Object.entries(data.sourceAliases).map(([k,id])=>[k,sources.find(s=>s.id===id)]));
const facts=JSON.parse(await fs.readFile(path.join(out,'../hemerdon-phase1a/evidence.json'),'utf8')).facts;
const value=id=>Number(facts.find(f=>f.id===id).value);
const P={bg:'#12110f',surface:'#1a1814',elevated:'#232019',cream:'#efece6',accent:'#e3b04b',brand:'#c8993e',paper:'#f5f3ee',ink:'#1b1915',muted:'#5b5548',rule:'#d8d3c7',gold:'#7a5510'};
const content=JSON.parse(await fs.readFile(path.join(out,'publication-content.json'),'utf8'));
const pres=Presentation.create({slideSize:{width:1280,height:720}});
const darkSlides=new WeakSet();
function text(s,str,x,y,w,h,size=23,bold=false,color){
 const sh=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 sh.text=str;sh.text.style={typeface:'Archivo',fontSize:size,bold,color:color||(darkSlides.has(s)?P.cream:P.ink),verticalAlignment:'top'};return sh;
}
function rule(s,y,x=64,w=1140){
 s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:1},fill:darkSlides.has(s)?P.brand:P.rule,line:{fill:'none',width:0}});
}
function base(title,idx,srcs,note='',section='FINANCING AND EXECUTION'){
 const s=pres.slides.add();const dark=idx===1||idx===10;if(dark)darkSlides.add(s);
 s.background.fill=dark?P.bg:P.paper;
 text(s,'SMPT',64,26,95,30,22,true,dark?P.accent:P.gold);
 text(s,`FINANCIAL INTELLIGENCE 001   /   ${section}`,175,31,1020,24,14,false,dark?P.cream:P.muted);
 rule(s,65);
 if(title)text(s,title,64,91,1130,92,35,true);
 text(s,'Inside Tungsten West’s Restart Financing   /   Research cutoff 4 November 2026',64,678,1050,22,13,false,dark?P.cream:P.muted);
 text(s,String(idx).padStart(2,'0'),1170,678,45,22,14,false,dark?P.accent:P.muted);
 rule(s,662);
 const linkColor=dark?P.accent:P.gold,muted=dark?P.cream:P.muted;
 const foot=text(s,'',64,633,1140,27,13,false,muted);
 foot.text=[{runs:[{run:'Sources: ',style:{typeface:'Archivo',fontSize:'13px',color:muted}},...srcs.flatMap(k=>[{run:k,style:{typeface:'Archivo',fontSize:'13px',bold:true,underline:'sng',color:linkColor},link:{uri:ref[k].url,isExternal:true}},{run:'   ',style:{fontSize:'13px'}}]),{run:note,style:{typeface:'Archivo',fontSize:'13px',color:muted}}]}];
 s.speakerNotes.text=srcs.map(k=>`${k}: ${ref[k].title}. ${ref[k].url}`).join('\n')+'\n'+note+'\nControlling evidence: Phase 1B acceptance 772f2f4c02631f533a0a893849c9bedb8a6ff8ad. Source dates and locators are retained in the evidence appendix. Independent analyst interpretation unless attributed.';
 return s;
}
function table(s,rows,x=64,y=200,w=1140,h=360,widths=null,size=22){
 const dark=darkSlides.has(s);
 const t=s.tables.add({rows:rows.length,columns:rows[0].length,left:x,top:y,width:w,height:h,values:rows,...(widths?{columnWidths:widths}:{})});
 t.borders.assign({fill:dark?P.brand:P.rule,width:.5,style:'solid'});
 for(let r=0;r<rows.length;r++)for(let c=0;c<rows[0].length;c++){
  const cell=t.getCell(r,c);cell.fill=r===0?(dark?P.elevated:P.bg):(dark?(r%2?P.surface:P.bg):(r%2?P.cream:P.paper));
  cell.text.style={typeface:'Archivo',fontSize:size,bold:r===0,color:r===0?(dark?P.accent:P.cream):(dark?P.cream:P.ink)};
 }
 return t;
}
function chart(s,cats,vals,x,y,w,h,outlinedLast=false){
 const negative=Math.min(...vals)<0;
 const ch=s.charts.add('bar',{position:{left:x,top:y,width:w,height:h},categories:cats,
  series:[{name:'GBP million',values:vals,fill:P.gold,...(outlinedLast?{points:[{idx:0,fill:P.ink},{idx:1,fill:P.ink},{idx:2,fill:P.paper,line:{style:'dashed',fill:P.gold,width:2}}]}:{})}],hasLegend:false,
  barOptions:{direction:'column',grouping:'clustered',gapWidth:90},
  dataLabels:{showValue:true,position:'outEnd',textStyle:{fontSize:21,fill:P.ink},numberFormatCode:vals.every(Number.isInteger)?'0':(vals.some(n=>n%0.5!==0)?'0.00':'0.0')},
  yAxis:{line:{fill:P.rule,width:.5},min:negative?-5:0,max:negative?20:Math.ceil(Math.max(...vals)*1.22),majorUnit:Math.max(...vals)<=4?1:(Math.max(...vals)<=15?5:10),numberFormatCode:'0',textStyle:{fontSize:17,fill:P.muted},majorGridlines:{fill:P.rule,width:.5}},
  xAxis:{line:{fill:P.rule,width:.5},tickLabelPosition:'low',textStyle:{fontSize:18,fill:P.ink}},chartFill:P.paper,plotAreaFill:P.paper});
 applyPresentationChartFont(ch,{fontFamily:'Archivo'});return ch;
}
let s=base('',1,['S1','S2','S3'],'Independent research   /   Review edition','HEMERDON');
text(s,"Inside Tungsten West's\n£71 Million Restart Financing",64,140,1135,145,49,true);
text(s,content.subtitle,64,315,1110,88,29,false,P.cream);
text(s,'How does government capital change the restart pathway, and which dependencies shape commercial execution?',64,443,1080,87,28);
rule(s,551,64,180);
text(s,'£61m gross core financing',64,578,620,43,29,true,P.accent);
text(s,'£10m additional lending capacity remains uncommitted',690,583,510,42,21,false,P.cream);
s=base('NWF capital supports the restart with a short loan horizon',2,['S1','S2','S4'],'Gross financing and October management guidance','EXECUTIVE FINDINGS');
table(s,[['Financial result','Economic implication'],['£61m gross equity and core debt','Capital supports redevelopment and replaces earlier short-term finance. The loan adds a repayment obligation during the ramp.'],['£40–45m remaining project spend','Execution still draws cash. October guidance excludes operating costs and needs a dated payment schedule.'],['£5.75m incremental analyst stress','Capex, delay and rate exposure test the sensitivity of uses. Funding headroom requires a complete cash bridge.']],64,205,1140,340,[370,770],22);
text(s,"Management reports a fully funded restart. The next financial test is the conversion of commissioning into dependable customer collections.",64,574,1135,51,23);
s=base('Commissioning progress creates a route to commercial receipts',3,['S2','S6','S7'],'Issuer reports and guidance. Financial years end 31 March.','OPERATING MILESTONES');
table(s,[['Date / horizon','Development','Cash conversion still to demonstrate'],['15 September 2026','Processing commencement announced','Sustained throughput and recovery into payable output.'],['23 September 2026','Elmet: 1,000t contained WO3 annually for eight years','Variable APT-linked pricing, delivery and customer payment.'],['October 2026','Coarse-gravity wet commissioning reported achieved','Repeatable performance and operating cost per payable unit.'],['FY2028 guidance','More than 3,300t WO3 and 600t tin','Production and shipments reconciled to invoices and collections.']],64,205,1140,395,[215,440,485],21);
s=base('The £71m headline combines £61m core and £10m uncommitted',4,['S1','S2','S3'],'GBP million. Gross transaction financing; full core-loan draw disclosed by 2 September.','CAPITAL STRUCTURE');
chart(s,['Equity','Core loan','Uncommitted\naccordion'],[value('hfi-nwf-equity')/1e6,value('hfi-nwf-loan')/1e6,value('hfi-nwf-accordion')/1e6],64,225,660,330,true);
table(s,[['Financing status','Interpretation'],['£61m gross core','£36m equity and £25m loan. Equity shares residual risk; the loan requires repayment.'],['£10m uncommitted','Outlined capacity requires agreement and would add debt.']],780,210,425,310,[170,255],22);
text(s,'£61m',780,546,160,50,38,true);
text(s,'core gross transaction financing',946,551,260,50,22);
s=base('Short tenor and margin steps increase the cost of delay',5,['S1','S2','S4','S8'],'Announced terms and October disclosure. Exact executed maturity remains unresolved.','DEBT AND SECURITY');
table(s,[['Term / document','Supported disclosure','Financial consequence'],['366-day tenor','Agreement-date versus drawdown origin differs','A precise repayment calendar requires the definitive facility.'],['Loan pricing','SONIA + 5.5pp initially; +1pp each quarter','Later collections can coincide with a rising financing margin.'],['Group security deed','Dated 28 August; four group chargors and GLAS trustee','Financed-equipment exclusions make creditor scope and priority material.'],['Facility linkage','Referenced loan agreement leaves lender unnamed','NWF attribution remains an inference. Recovery analysis needs the full documents.']],64,205,1140,395,[220,450,470],21);
s=base('October spend guidance needs to be mapped to cash payments',6,['S1','S2','S5','S10'],'GBP million. Remaining project expenditure excludes operating costs.','EXPENDITURE AND LIQUIDITY');
chart(s,['Lower end','Midpoint\nconvention','Upper end'],[40,data.findings.remainingMidpointGBP/1e6,45],64,220,655,325);
text(s,'£25–35m in FY2027',775,215,425,44,28,true);
text(s,'Company guidance places the balance in the following year.',775,269,425,61,23);
rule(s,356,775,425);
text(s,'31 March audited cash',775,383,425,35,25,true);
text(s,'£25.486m general-use group cash\n£14.912m separately restricted escrow',775,432,425,88,23);
text(s,'Net financing receipts, bridge repayment and subsequent operating and capital flows determine later cash headroom.',64,574,1140,50,23);
s=base('Cost stress and receipt timing test separate exposures',7,['S1','S2','S4'],'GBP million. Separate dated sensitivities, with no combined current-gap inference.','MODEL SENSITIVITIES');
text(s,'October increment above £42.5m',64,197,545,35,25,true);
chart(s,['Capex','Delay','Rate'],[2.5,3,.25],64,242,545,250);
text(s,'£5.75m incremental stress',64,519,545,37,27,true);
text(s,'Company delay sensitivity £3m. Analyst rate proxy: 1% × £25m × one year. No accordion draw.',64,563,545,61,20);
text(s,'Original August plan ending cash',670,197,535,35,25,true);
chart(s,['Planned\nreserve','No receipts\nstated totals','No receipts\nrounded detail'],[13,data.findings.augustNoReceiptsStatedGBP/1e6,data.findings.augustNoReceiptsDetailGBP/1e6],670,242,535,250);
text(s,'£15m anticipated receipts deferred',670,519,535,37,26,true);
text(s,'Approximately £2m / £1m negative cash, depending on rounding convention. This tests the original plan.',670,563,535,61,20);
s=base('Payable production and collections determine cash generation',8,['S2','S7'],'FY2028 selected cash reference and fixed model coefficients','COMMERCIAL CONVERSION');
table(s,[['Conversion stage','Economic dependence','Evidence to monitor'],['Production and recovery','Payable volume drives receipts','Sustained throughput and contained WO3 shipments.'],['Delivery and acceptance','Contract pricing and settlement determine revenue','Quality, discounts and invoice terms.'],['Customer collections','Working capital affects cash available for debt service','Receivable ageing, payment dates and bank receipts.'],['Repayment or refinancing','Reliable cash must align with contractual payments','Monthly forecast through executed maturity.']],64,205,1140,300,[280,400,460],21);
text(s,'£111.5m',64,528,500,46,35,true,P.gold);
text(s,'Selected annual cash reference',64,578,600,28,21);
text(s,'£438.15/mtu',800,528,390,46,35,true,P.gold);
text(s,'Tungsten-only coverage reference',800,578,410,28,21);
text(s,'Excludes tin/aggregate receipts, restart and growth capex, tax and working capital. Full break-even and DSCR remain unestablished.',64,612,1140,19,15);
s=base('Capital providers need different evidence from the same ramp',9,['S1','S2','S4','S8'],'Independent financial interpretation','INSTITUTIONAL IMPLICATIONS');
table(s,[['Capital provider','Decision exposure','Diligence priority'],['Equity investors','Residual cash returns and future dilution','Payable output, collections and any further financing terms.'],['Project lenders','Repayment date, collateral and replacement capital','Executed facility, creditor priority, monthly cash and equipment-debt schedule.'],['Public capital providers','Instrument returns and dependable strategic supply','Capital deployment into commissioned capacity, then verified delivery.']],64,205,1140,330,[255,420,465],22);
text(s,'A reconciled liquidity and debt schedule would allow operating progress to be assessed against financial obligations.',64,574,1135,51,23);
s=base('Collections and refinancing are the next financing tests',10,['S1','S2','S4','S7'],'Independent assessment   /   Prepared for final publication review','CONCLUSION');
table(s,[['Indicator','Stronger financial position','Pressure on the timetable'],['Liquidity and expenditure','Cash reconciled to dated obligations','Rising unpaid commitments or restricted cash.'],['Operating conversion','Sustained output and timely collections','Recovery, acceptance or customer-payment delays.'],['Loan repayment','Cash cover or replacement capital agreed','An approaching maturity with financing unresolved.']],64,205,1140,300,[235,435,470],22);
text(s,'Government capital supports the restart pathway',64,543,1135,40,30,true,P.accent);
text(s,'Current liquidity, valuation and repayment sufficiency remain open diligence questions.',64,589,1135,30,21);
await fs.mkdir(build,{recursive:true});
const candidate=path.join(build,'candidate.pptx');
await (await PresentationFile.exportPptx(pres)).save(candidate);
execFileSync(path.join(runtime,'python/bin/python3'),[path.join(out,'style_pptx.py'),candidate]);
for(const [i,sl] of pres.slides.items.entries()){
 const png=await pres.export({slide:sl,format:'png',scale:1.25});
 await fs.writeFile(path.join(build,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));
}
const delivery=path.join(out,'SMPT_FI001_Hemerdon_Strategy_Deck.pptx');
await fs.mkdir(path.join(out,'.build','final'),{recursive:true});
const final=path.join(out,'.build','final',`deck-${Date.now()}.pptx`);
// A fresh final path is required by the finalizer. Existing output is retained as a revision in /tmp.
try{await fs.rename(final,path.join(build,`previous-${Date.now()}.pptx`));}catch(e){if(e.code!=='ENOENT')throw e;}
await fs.mkdir(path.join(out,'.build'),{recursive:true});
const localCandidate=path.join(out,'.build','candidate.pptx');
await fs.copyFile(candidate,localCandidate);
const result=await finalizePresentation({workspaceDir:out,candidatePath:localCandidate,finalPath:final,
 pythonExecutable:path.join(runtime,'python/bin/python3'),
 integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit',...[2,3,4,5,8,9,10].flatMap(n=>['--require-native-table-slide',String(n)])],
 explicitTotalSlideCount:10,requiredNativeTableOwnerSlides:[2,3,4,5,8,9,10],requiredNativeChartOwnerSlides:[4,6,7],
 materializeLiteralChartWorkbooks:true,fontPolicy:{basis:'user_request',families:['Archivo']},verifyArtifactToolImport:true,
 receiptPath:path.join(out,'.build',`deck-validation-${Date.now()}.json`)});
await fs.copyFile(final,delivery);
await fs.writeFile(path.join(build,'deck-validation.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({finalPath:delivery,receiptPath:result.receiptPath},null,2));
