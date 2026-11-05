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
const P={paper:'#FBFAF7',ink:'#252421',charcoal:'#262523',gold:'#98752D',band:'#F0EEE8',rule:'#D0CCC3',muted:'#605D56'};
const pres=Presentation.create({slideSize:{width:1280,height:720}});
function text(s,str,x,y,w,h,size=23,bold=false,color=P.ink){
 const sh=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 sh.text=str;sh.text.style={typeface:'Arial',fontSize:size,bold,color,verticalAlignment:'top'};return sh;
}
function base(title,idx,srcs,note=''){
 const s=pres.slides.add();s.background.fill=P.paper;
 text(s,'SMPT  /  FINANCIAL INTELLIGENCE 001',64,28,900,24,15,true,P.gold);
 text(s,title,64,78,1140,100,36,true);
 text(s,'Research cutoff 4 November 2026   /   Publication review',64,678,1050,22,14,false,P.muted);
 text(s,String(idx).padStart(2,'0'),1170,678,45,22,14,false,P.muted);
 const foot=text(s,'',64,633,1140,34,14,false,P.muted);
 foot.text=[{runs:[{run:'Sources: ',style:{typeface:'Arial',fontSize:'14px',color:P.muted}},...srcs.flatMap(k=>[{run:k,style:{typeface:'Arial',fontSize:'14px',bold:true,underline:'sng',color:'#73571F'},link:{uri:ref[k].url,isExternal:true}},{run:'   ',style:{fontSize:'14px'}}]),{run:note,style:{typeface:'Arial',fontSize:'14px',color:P.muted}}]}];
 s.speakerNotes.text=srcs.map(k=>`${k}: ${ref[k].title}. ${ref[k].url}`).join('\n')+'\n'+note+'\nControlling evidence: Phase 1B acceptance 772f2f4c02631f533a0a893849c9bedb8a6ff8ad. Financial units and dates are stated on slide. Independent analyst interpretation unless attributed.';
 return s;
}
function table(s,rows,x=64,y=190,w=1140,h=380,widths=null,size=22){
 const t=s.tables.add({rows:rows.length,columns:rows[0].length,left:x,top:y,width:w,height:h,values:rows,...(widths?{columnWidths:widths}:{})});
 t.borders.assign({fill:P.rule,width:.6,style:'solid'});
 for(let r=0;r<rows.length;r++)for(let c=0;c<rows[0].length;c++){
  const cell=t.getCell(r,c);cell.fill=r===0?P.charcoal:(r%2?P.band:P.paper);
  cell.text.style={typeface:'Arial',fontSize:size,bold:r===0,color:r===0?'#FFFFFF':P.ink};
 }
 return t;
}
function chart(s,cats,vals,x,y,w,h,colors=[P.gold],max=null){
 const ch=s.charts.add('bar',{position:{left:x,top:y,width:w,height:h},categories:cats,
  series:[{name:'GBP million',values:vals,fill:colors[0]}],hasLegend:false,
  barOptions:{direction:'column',grouping:'clustered',gapWidth:90},
  dataLabels:{showValue:true,position:'outEnd',textStyle:{fontSize:20,fill:P.ink},numberFormatCode:vals.every(Number.isInteger)?'0':(vals.some(n=>n%0.5!==0)?'0.00':'0.0')},
  yAxis:{min:Math.min(...vals)<0?-5:0,max:max||(Math.min(...vals)<0?20:Math.ceil(Math.max(...vals)*1.22)),majorUnit:Math.max(...vals)<=4?1:(Math.max(...vals)<=15?5:10),numberFormatCode:'0',textStyle:{fontSize:18,fill:P.muted},majorGridlines:{fill:P.rule,width:.5}},
  xAxis:{tickLabelPosition:'low',textStyle:{fontSize:18,fill:P.ink}},chartFill:P.paper,plotAreaFill:P.paper});
 applyPresentationChartFont(ch,{fontFamily:'Arial'});return ch;
}
let s=base('Hemerdon financing and restart risk',1,['S1','S2','S3'],'Independent SMPT research');
text(s,'£71m headline financing package',64,208,1100,60,45,true);
text(s,'Capital structure, remaining expenditure and refinancing exposure at Tungsten West',64,281,1100,70,28);
text(s,'How does government-backed financing change the restart pathway, and which dependencies remain material to commercial execution?',64,390,1100,105,31,true);
text(s,'£61m gross equity and core loan support the restart. The short loan horizon makes production, collections and refinancing central to the financial assessment.',64,520,1110,80,24);
s=base('Capital access improved while execution governs repayment',2,['S1','S2','S4'],'Values in GBP million unless stated');
table(s,[['Financial finding','Commercial implication'],['61 gross equity and core debt','Full core draw disclosed by 2 September. Headline 71 includes 10 uncommitted.'],['40–45 remaining project spend','October management estimate excludes operating costs. Midpoint convention 42.5.'],['5.75 incremental analyst stress','Capex, delay and rate exposure. Current cash and a complete funding gap remain unestablished.']],64,190,1140,330,[420,720],23);
text(s,"Management reports a fully funded restart pathway. The research tests its financing mechanics and selected sensitivities, without finding a current cash shortage.",64,553,1135,64,23);
s=base('Reported processing progress strengthens the restart pathway',3,['S2','S6','S7'],'Issuer reports and guidance. FY ends 31 March.');
table(s,[['Date / horizon','Documented development','Financial implication'],['15 September 2026','Processing commencement announced','Operating activity precedes steady-state cash conversion.'],['23 September 2026','Elmet: 1,000t WO3 per year for eight years','Variable APT-linked price. Nominal contract value is not guaranteed receipts.'],['October 2026','Coarse-gravity wet commissioning reported achieved','Sustained throughput, recovery and costs remain the next tests.'],['FY2028 guidance','More than 3,300t WO3 and 600t tin','Targets require delivery, acceptance and collection.']],64,190,1140,405,[230,430,480],21);
s=base('£61m core financing sits within the £71m headline',4,['S1','S2','S3'],'GBP million. Gross transaction amounts, not remaining cash.');
chart(s,['Equity','Core loan','Uncommitted\naccordion'],[value('hfi-nwf-equity')/1e6,value('hfi-nwf-loan')/1e6,value('hfi-nwf-accordion')/1e6],64,203,660,350);
table(s,[['Instrument','Economic claim'],['£36m equity','Residual risk capital and ownership participation.'],['£25m core loan','Repayment obligation. Full draw disclosed.'],['£10m accordion','Additional potential debt requiring commitment.']],760,195,445,360,[155,290],21);
text(s,'Core gross: £36m + £25m = £61m. Adding the £10m uncommitted accordion reconciles the £71m maximum.',64,570,1135,49,24,true);
s=base('Short tenor and pricing steps make financing time-sensitive',5,['S1','S2','S4','S8'],'October pricing disclosure. Executed facility terms remain required.');
table(s,[['Term or document','Disclosure','Lender diligence implication'],['Tenor','366 days','Agreement-date versus drawdown origin unresolved. Exact maturity unavailable.'],['Pricing','SONIA + 5.5pp initially; +1pp each quarter','Confirm step dates, rate conventions, fees and repayment mechanics.'],['Group security deed','Dated 28 August; filed 1 September','Four group chargors, GLAS trustee, equipment exclusions.'],['Facility attribution','Deed references a loan agreement; lender unnamed','NWF linkage is an inference. Registration does not establish priority or recovery value.']],64,190,1140,405,[235,410,495],21);
s=base('October guidance leaves £40–45m project spending',6,['S1','S2','S5','S10'],'GBP million. Remaining-spend guidance excludes operating costs.');
chart(s,['Lower end','Midpoint\nconvention','Upper end'],[40,data.findings.remainingMidpointGBP/1e6,45],64,205,660,340);
text(s,'£25–35m in FY2027',775,206,425,44,28,true);
text(s,'Company timing guidance places the balance in the following year.',775,262,425,65,23);
text(s,'Latest exact audited cash',775,352,425,35,25,true);
text(s,'£25.486m at 31 March 2026. Separate restricted escrow: £14.912m. Neither is a current liquidity snapshot.',775,402,425,105,23);
text(s,'No current cash bridge can be closed without post-March operating flows, capital payments, financing receipts, bridge repayment and fees.',64,560,1138,65,24);
s=base('Two sensitivities measure different financing exposures',7,['S1','S2','S4'],'GBP million. Analyst counterfactuals over dated disclosures.');
text(s,'Increment above £42.5m reference',64,182,550,35,25,true);
chart(s,['Capex','Delay','Rate'],[2.5,3,.25],64,225,545,260);
text(s,'£5.75m = £2.5m + £3m + £0.25m',64,500,545,39,25,true);
text(s,'Rate proxy: 1% × £25m × one year. No accordion draw assumed.',64,550,545,61,21);
text(s,'Original August plan ending cash',670,182,535,35,25,true);
chart(s,['Planned\nreserve','No receipts\nstated totals','No receipts\nrounded detail'],[13,data.findings.augustNoReceiptsStatedGBP/1e6,data.findings.augustNoReceiptsDetailGBP/1e6],670,225,535,260);
text(s,'All £15m expected receipts deferred',670,500,535,39,25,true);
text(s,'About £2m / £1m deficits depend on rounding convention. Neither is observed cash. Do not add to the £5.75m stress.',670,550,535,70,21);
s=base('Commissioning must convert into collected cash',8,['S2','S7'],'FY2028 reference. GBP unless stated.');
table(s,[['Conversion stage','Financial dependence','Evidence to monitor'],['Production and recovery','Payable volume drives receipts','Sustained throughput and contained WO3 shipments.'],['Contract execution','APT-linked price remains variable','Quality acceptance, discounts and payment dates.'],['Cash generation','Working capital affects available cash','Invoices, receivable ageing and bank collections.'],['Debt service','Short loan horizon overlaps the ramp','Monthly forecast and agreed repayment/refinancing.']],64,190,1140,300,[280,395,465],21);
text(s,'£111.5m midpoint core annual cash reference',64,521,1130,38,27,true);
text(s,'FY2028 selected uses imply £438.15/mtu tungsten-only coverage at fixed coefficients. Excludes tin/aggregate receipts, restart capex, taxes and working capital. This is not full break-even or DSCR.',64,566,1134,60,21);
s=base('Each capital provider faces a different diligence priority',9,['S1','S2','S4','S8'],'Independent financial interpretation');
table(s,[['Stakeholder','Decision exposure','Priority evidence'],['Equity investors','Residual returns, ownership and future dilution','Payable output, cash conversion and further financing terms.'],['Project lenders','Maturity, collateral and repayment source','Executed facility, security priority, monthly cash and fleet-debt schedule.'],['Public capital providers','Capital recovery and strategic delivery','Deployment into commissioned capacity, verified supply and instrument-specific performance.']],64,195,1140,345,[255,420,465],23);
text(s,'£71m of potential financing does not establish investment value or repayment capacity. Those decisions require dated cash flows and the complete contractual capital structure.',64,565,1135,60,24);
s=base('The next assessment turns on collections and refinancing',10,['S1','S2','S4','S7'],'Evidence requirements reflect the frozen research cutoff.');
table(s,[['Indicator','Would strengthen the outlook','Would weaken the outlook'],['Liquidity and capex','Reconciled cash covers dated obligations','Unpaid commitments rise or restrictions absorb cash.'],['Operating conversion','Sustained output and timely collections','Repeated recovery, acceptance or payment delays.'],['Repayment timetable','Cash cover or replacement capital agreed','Material maturity exposure remains unresolved.']],64,190,1140,310,[245,435,460],23);
text(s,'NWF capital supports a credible restart pathway',64,535,1130,40,30,true);
text(s,'The financial test is dependable cash generation within the financing horizon. Current liquidity, valuation and repayment sufficiency remain open diligence questions.',64,581,1135,49,23);
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
 materializeLiteralChartWorkbooks:true,fontPolicy:{basis:'user_request',families:['Arial']},verifyArtifactToolImport:true,
 receiptPath:path.join(out,'.build',`deck-validation-${Date.now()}.json`)});
await fs.copyFile(final,delivery);
await fs.writeFile(path.join(build,'deck-validation.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({finalPath:delivery,receiptPath:result.receiptPath},null,2));
