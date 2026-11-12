// Original editable SMPT evidence slides. Model 1.0 is read, never rewritten.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const here=path.dirname(fileURLToPath(import.meta.url));
const runtime=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if(!runtime)throw new Error('CODEX_PRIMARY_RUNTIME_NODE_MODULES must identify the bundled runtime');
const require=createRequire(path.join(runtime,'fi003.cjs'));
const {Presentation,PresentationFile}=await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
const d=JSON.parse(await fs.readFile(path.join(here,'slide-manifest.json'),'utf8'));
const work=path.dirname(here),build=process.env.FI003_DECK_BUILD||path.join(here,'.build-v05');
const out=process.env.FI003_DECK_OUTPUT||path.join(work,'outputs','presentation-draft-v05');
await fs.mkdir(build,{recursive:true});await fs.mkdir(out,{recursive:true});
const deck=Presentation.create({slideSize:{width:1280,height:720}});
const c={paper:'#F5F3EE',ink:'#1B1915',muted:'#5B5548',gold:'#7A5510',char:'#12110F',light:'#EFECE6',rule:'#D8D3C7',band:'#EAE6DC',neutral:'#817B70'};
deck.theme.defaultFont='Archivo';
deck.theme.colorScheme={name:'SMPT Archivo',themeColors:{accent1:c.gold,accent2:c.neutral,accent3:c.muted,accent4:c.char,accent5:'#E3B04B',accent6:c.rule,bg1:c.paper,bg2:c.char,tx1:c.ink,tx2:c.light,dk1:c.char,dk2:'#1A1814',lt1:c.paper,lt2:c.light,hlink:c.gold,folHlink:c.gold}};
// LibreOffice applies the inherited hyperlink color even to explicitly colored
// runs. A cover-only master gives links sufficient contrast on graphite.
const coverMaster=deck.masters.add('SMPT graphite cover');
coverMaster.setColorMap({bg1:'lt1',tx1:'dk1',bg2:'lt2',tx2:'dk2',accent1:'accent1',accent2:'accent2',accent3:'accent3',accent4:'accent4',accent5:'accent5',accent6:'accent6',hlink:'accent5',folHlink:'accent5'});
const coverLayout=deck.layouts.add('SMPT graphite cover');
coverLayout.setParentLayoutId(coverMaster.id);
const shapes=[],tableOwners=[],chartOwners=[];
function box(s,name,t,x,y,w,h,size=24,bold=false,color=c.ink){
 const a=s.shapes.add({name,geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{style:'solid',fill:'none',width:0}});
 a.text=t;a.text.style={typeface:'Archivo',fontSize:size,bold,color,verticalAlignment:'top',insets:0};
 shapes.push({slide:deck.slides.items.length,name,text:t,x,y,w,h,fontSize:size});return a;
}
function rect(s,name,x,y,w,h,fill,lineFill='none',lineWidth=0){return s.shapes.add({name,geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:lineFill,width:lineWidth}});}
function rule(s,y,x=56,w=1168,color=c.rule){rect(s,'rule-'+y,x,y,w,1,color);}
function table(s,rows,{x=56,y=218,w=1168,h=340,widths,size=21}={}){
 tableOwners.push(deck.slides.items.length);
 const t=s.tables.add({rows:rows.length,columns:rows[0].length,left:x,top:y,width:w,height:h,values:rows,columnWidths:widths});
 t.borders.assign({style:'solid',fill:c.rule,width:.6});
 t.cells.block({row:0,column:0,rowCount:rows.length,columnCount:rows[0].length}).assign({margins:{left:12,right:12,top:10,bottom:8},anchor:'top'});
 for(let r=0;r<rows.length;r++)for(let col=0;col<rows[0].length;col++){
  const cell=t.getCell(r,col);cell.fill=r===0?c.char:r%2?c.paper:c.band;
  cell.text.style={typeface:'Archivo',fontSize:r===0?20:size,bold:r===0,color:r===0?c.light:c.ink};
 }
 return t;
}
function note(s,t,y=567,h=65){box(s,'interpretation',t,56,y,1168,h,22);}
function caveat(s,t,y=625,h=33){box(s,'qualification',t,56,y,1168,h,14.5,false,c.muted);}
function footer(s,m,dark=false){
 const color=dark?'#E3B04B':c.gold;
 const sourceNames={S01:'MP 8-K',S02:'Transaction agreement',S03:'10X offtake',S04:'NdPr PPA',S06:'Equity prospectus',S07:'Underwriting agreement',S09:'Credit agreement',S11:'MP 2025 10-K',S13:'MP Q2 10-Q',S15:'J.P. Morgan account',S17:'Apple 8-K',S19:'MP Q3 10-Q'};
 const a=box(s,'sources','',56,669,1100,38,13,false,dark?c.light:c.muted);
 const runs=m.source_refs.map(([id,loc],i)=>{
  const src=d.sources.find(x=>x.id===id);
  return {run:`${i%2?'  ·  ':''}${id} ${sourceNames[id]||src.title} (${src.publication_or_filing_date}), ${loc}`,style:{typeface:'Archivo',fontSize:'13px',underline:'sng',color},link:{uri:src.url,isExternal:true}};
 });
 a.text.set(runs.length>2?[runs.slice(0,2),runs.slice(2)]:[runs]);
 box(s,'page',String(m.number).padStart(2,'0'),1182,672,42,24,15,false,dark?c.light:c.muted);
 s.speakerNotes.text=`${m.title}\n${m.scope}\n${m.note}\n${m.caveat||''}\nClaims: ${m.claim_ids.join(', ')}\nModel 1.0: ${m.model_ref}\nBaseline controls and SHA-256 provenance: presentation/slide-manifest.json\n`+
 m.source_refs.map(([id,loc])=>{const v=d.sources.find(x=>x.id===id);return `${id}: ${v.title}, ${v.publication_or_filing_date}. ${loc}. ${v.url}`;}).join('\n')+
 '\nResearch cutoff 2026-11-06. Agent-assisted SMPT research draft. Human financial/publication approval pending. No affiliation or institutional endorsement.';
}
function add(m){const s=deck.slides.add();s.background.fill=c.paper;
 box(s,'series','SMPT   /   FINANCIAL INTELLIGENCE 003',56,25,1100,24,14,true,c.gold);
 box(s,'headline',m.title,56,68,1168,110,38,true);
 rule(s,187,56,1168,c.gold);
 box(s,'scope',m.scope,56,198,1168,30,16,false,c.muted);
 return s;
}
function nativeBars(s,m,{x=56,y=270,w=1168,h=265,max=275,percent=false}={}){
 chartOwners.push(m.number);
 s.charts.add('bar',{position:{left:x,top:y,width:w,height:h},categories:m.chart.categories,
  series:m.chart.series.map((a,i)=>({...a,fill:i===0?c.neutral:c.gold,valuesFormatCode:percent?'0.00%':'0'})),
  barOptions:{direction:'bar',grouping:'stacked',gapWidth:85,overlap:100},hasLegend:true,
  legend:{position:'bottom',textStyle:{typeface:'Archivo',fontSize:18,fill:c.ink}},
  chartFill:c.paper,plotAreaFill:c.paper,
  xAxis:{min:0,max,majorUnit:percent?.25:50,numberFormatCode:percent?'0%':'0',textStyle:{typeface:'Archivo',fontSize:16,fill:c.ink},majorGridlines:{style:'solid',fill:c.rule,width:.6}},
  yAxis:{min:0,max,majorUnit:percent?.25:50,numberFormatCode:percent?'0%':'0',textStyle:{typeface:'Archivo',fontSize:18,fill:c.ink},majorGridlines:null},
  dataLabels:{showValue:!percent,position:'center',numberFormatCode:percent?'0.00%':'0',textStyle:{typeface:'Archivo',fontSize:19,bold:true,fill:'#FFFFFF'}}});
}
for(const m of d.slides){
 console.log('Authoring',m.number,m.kind);
 let s;
 if(m.kind==='cover'){
  s=deck.slides.add();s.setLayout(coverLayout);s.background.fill=c.char;
  box(s,'series','SMPT   /   FINANCIAL INTELLIGENCE 003',64,42,1140,28,17,true,'#E3B04B');
  box(s,'headline',m.title,64,164,1145,135,59,true,c.light);
  box(s,'subtitle',m.scope,64,317,1140,100,42,true,c.light);
  rect(s,'identity-rule',64,444,100,3,'#E3B04B');
  box(s,'summary',m.note,64,475,1140,85,24,false,c.light);
  box(s,'author',m.author+'\n'+m.version+'\nSource cutoff 6 November 2026',64,575,1050,75,19,false,c.light);
  footer(s,m,true);continue;
 }
 s=add(m);
 if(m.kind==='answer'){
  const ys=[242,348,454];
  m.findings.forEach(([value,t],i)=>{box(s,'finding-value-'+i,value,56,ys[i],275,80,i===2?28:42,true,c.gold);box(s,'finding-copy-'+i,t,352,ys[i],850,82,25);if(i<2)rule(s,ys[i]+91);});
  note(s,m.note,557,55);caveat(s,m.caveat,620,38);
  }else if(m.kind==='sequence'){
  // Equal spacing is schematic; statuses remain explicit in the event copy.
  rule(s,292,56,1168,c.gold);
  m.events.forEach(([date,label,copy],i)=>{const x=56+i*296;
   box(s,'date-'+i,date,x,246,272,30,23,true,c.gold);
   rect(s,'event-marker-'+i,x,286,12,12,c.gold);
   box(s,'event-'+i,label,x,320,268,60,25,true);
   box(s,'event-copy-'+i,copy,x,390,268,123,22);
  });
  box(s,'spacing','Sequence schematic; spacing does not represent elapsed time',56,529,1168,26,15,false,c.muted);
  note(s,m.note,568,57);caveat(s,m.caveat,630,33);
 }else if(m.kind==='alternatives'){
  m.rows.slice(1).forEach(([label,copy],i)=>{const y=241+i*78;
   box(s,'rank-'+i,String(i+1).padStart(2,'0'),56,y,55,40,28,true,c.gold);
   box(s,'explanation-'+i,label.replace(/^\d+\. /,''),132,y,414,65,22,true);
   box(s,'evidence-'+i,copy,584,y,640,65,21);
   if(i<3)rule(s,y+68,132,1092);
  });note(s,m.note,563,55);caveat(s,m.caveat,628,36);
 }else if(m.kind==='timing'){
  box(s,'pretrigger','Before the trigger',56,242,465,31,24,true,c.gold);
  box(s,'liquidity','At least $500m unrestricted contractual cash / Cash Equivalents',56,286,465,71,24);
  box(s,'trigger','Trigger: earlier delivery of either',592,242,632,31,24,true,c.gold);
  box(s,'trigger-a','A certificate showing ≥$400m covenant EBITDA over four quarters',592,286,632,57,22);
  box(s,'trigger-b','Required Q2 2027 financial statements',592,354,632,35,22);
  rule(s,403);
  box(s,'assumed-date','Illustrative delivery: 15 Aug 2027',56,422,510,31,22,true);
  box(s,'first-test','First quarter ending after delivery: 30 Sep 2027',56,463,510,58,22);
  box(s,'posttrigger','From the earnings-test stage',592,422,632,31,22,true,c.gold);
  box(s,'earnings-tests','Leverage ≤4.00× and cash-interest coverage ≥3.00×, subject to terms',592,463,632,58,22);
  box(s,'commission','Management expectation: 2028',56,533,510,28,20,true);
  box(s,'commission-limit','10X begins commissioning, distinct from the commercial operation date (COD)',592,533,632,43,18);
  note(s,m.note,585,45);caveat(s,m.caveat,639,26);
 }else if(m.kind==='states'){
  box(s,'pre-cod','Before commercial operation',56,243,1168,32,24,true);
  box(s,'withheld','Operating threshold withheld',56,283,1168,29,22,false,c.muted);
  rule(s,324);
  chartOwners.push(m.number);
  s.charts.add('bar',{position:{left:56,top:343,width:1168,height:169},categories:m.chart.categories,
   series:m.chart.series.map(a=>({...a,fill:c.gold,valuesFormatCode:'0.0'})),
   barOptions:{direction:'column',grouping:'clustered',gapWidth:150},hasLegend:false,
   chartFill:c.paper,plotAreaFill:c.paper,
   xAxis:{textStyle:{typeface:'Archivo',fontSize:19,fill:c.ink},majorGridlines:null},
   yAxis:{min:0,max:175,majorUnit:50,numberFormatCode:'0',textStyle:{typeface:'Archivo',fontSize:16,fill:c.muted},majorGridlines:{style:'solid',fill:c.rule,width:.6}},
   dataLabels:{showValue:true,position:'center',numberFormatCode:'0.0',textStyle:{typeface:'Archivo',fontSize:22,bold:true,fill:'#FFFFFF'}}});
  box(s,'threshold-basis','50% annual capacity estimate / target    ·    Full amount: $140m × 1.02⁴',56,526,1168,29,19,false,c.muted);
  note(s,m.note,570,55);caveat(s,m.caveat,631,34);
 }else if(m.kind==='decisions'){
  m.rows.slice(1).forEach(([owner,action],i)=>{const y=244+i*101;
   box(s,'action-number-'+i,String(i+1).padStart(2,'0'),56,y,60,42,31,true,c.gold);
   box(s,'decision-owner-'+i,owner,142,y,340,82,23,true);
   box(s,'decision-condition-'+i,action,534,y,690,82,22);
   if(i<2)rule(s,y+89,142,1082);
  });note(s,m.note,566,55);caveat(s,m.caveat,631,33);
 }else if(m.kind==='economics'){
  chartOwners.push(m.number);
  s.charts.add('doughnut',{position:{left:56,top:242,width:490,height:294},
   categories:m.render_chart.categories,
   series:m.render_chart.series.map(a=>({...a,valuesFormatCode:'0.00%',points:[{idx:0,fill:c.neutral},{idx:1,fill:c.gold}]})),
   doughnutOptions:{holeSize:66,firstSliceAngle:270},hasLegend:false,
   chartFill:c.paper,plotAreaFill:c.paper,dataLabels:{showValue:false,showPercent:false}});
  table(s,m.rows.slice(0,3),{x:592,y:242,w:632,h:149,widths:[330,302],size:20});
  box(s,'existing-ownership',m.chart.series[0].name,592,412,632,33,27,true,c.neutral);
  box(s,'offering-ownership',m.chart.series[1].name,592,458,632,33,27,true,c.gold);
  box(s,'growth',m.rows[3].join(': '),592,510,632,30,21,true);
  note(s,m.note,575,50);caveat(s,m.caveat,630,32);
 }else if(m.kind==='support'){
  // Four documented relationships, with no implied magnitude or cash flow.
  const positions=[[56,242],[802,242],[56,405],[802,405]];
  // Thin neutral connectors sit behind editable source text.
  rule(s,378,480,25,c.rule);rule(s,378,757,25,c.rule);
  rect(s,'left-relationship-spine',480,300,1,170,c.rule);
  rect(s,'right-relationship-spine',782,300,1,170,c.rule);
  [300,470].forEach(y=>{rule(s,y,460,20,c.rule);rule(s,y,782,20,c.rule);});
  box(s,'recipient','MP Materials',514,345,256,42,31,true,c.gold);
  m.rows.slice(1).forEach(([instrument,addressed,retained],i)=>{const [x,y]=positions[i];
   box(s,'support-instrument-'+i,instrument,x,y,420,34,23,true,c.gold);
   box(s,'addressed-exposure-'+i,addressed,x,y+41,420,48,20,true);
   box(s,'retained-exposure-'+i,retained,x,y+96,420,66,19);
  });
  box(s,'diagram-key','Contract relationships; connector widths carry no financial magnitude',56,568,1168,21,14,false,c.muted);
  note(s,m.note,594,48);caveat(s,m.caveat,645,20);
 }else if(m.kind==='capacity'){
  nativeBars(s,m,{y:250,h:296});
  note(s,m.note,564,58);caveat(s,m.caveat,629,32);
 }else if(m.kind==='covenant'){
  table(s,m.rows,{y:241,h:290,widths:[280,888],size:20});
  box(s,'formula',m.example,56,540,1168,33,22,true,c.gold);
  note(s,m.note,581,46);caveat(s,m.caveat,631,32);
 }else if(m.kind==='conversion'){
  box(s,'formula',m.equation,56,240,1168,63,42,true,c.gold);
  box(s,'formula-labels',m.equation_labels,56,306,1168,31,18,false,c.muted);
  table(s,m.rows,{y:349,h:207,widths:[665,503],size:20});
  note(s,m.note,565,56);caveat(s,m.caveat,629,32);
 }else if(m.kind==='bridge'){
  // A true waterfall made from native editable data bars. All heights use a
  // common zero-based scale; exact seven movements are kept in the manifest.
  const {labels,values}=m.waterfall,x0=97,dx=126,bw=69,base=519,scale=260/1900;
  rule(s,base,x0-20,1129,c.muted);
  [0,500,1000,1500].forEach(v=>{const y=base-v*scale;rule(s,y,x0-20,1129,c.rule);box(s,'axis-'+v,String(v),56,y-10,44,24,15,false,c.muted);});
  let cumulative=values[0];
  values.forEach((v,i)=>{const total=i===0||i===values.length-1;
   const from=total?0:cumulative,to=total?v:cumulative+v;
   const top=base-Math.max(from,to)*scale,height=Math.abs(to-from)*scale;
   rect(s,'waterfall-'+i,x0+i*dx,top,bw,height,total?c.gold:([2,4].includes(i)?c.ink:c.neutral));
   const label=total?v:(v>=0?'+':'−')+Math.abs(v).toFixed(1);
   box(s,'bar-value-'+i,total?v.toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:1}):label,x0+i*dx-22,top-29,120,25,17,true,c.ink);
   box(s,'bar-label-'+i,labels[i],x0+i*dx-20,530,116,45,15,false,c.muted);
   if(i>0&&!total)cumulative=to;
   if(i<values.length-1)rule(s,base-(total?v:to)*scale,x0+i*dx+bw,dx-bw,c.neutral);
  });
  note(s,m.note,584,47);caveat(s,m.caveat,639,26);
 }else{
  const dense=m.kind==='roles'||m.kind==='support';
  const widths=m.kind==='roles'?[205,470,493]:m.kind==='support'?[300,375,493]:m.kind==='states'?[360,553,255]:m.kind==='decisions'?[340,828]:[365,803];
  const h=m.kind==='states'?291:310;
  table(s,m.rows,{y:242,h,widths,size:dense?20:21});
  note(s,m.note,242+h+14,m.kind==='methods'?42:59);caveat(s,m.caveat,632,31);
  if(m.kind==='methods'){
   const a=box(s,'research-links','',56,609,1168,22,15);
   const base=`https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/${d.reviewed_head}/research/fi003/`;
   a.text.set([[...[["Working model 1.0 (XLSX)","outputs/fi003-model-v1/recalculated/FI003_Working_Model_v1.xlsx"],["Claim ledger","evidence.csv"],["Original-source register","sources.json"]].map(([label,url],i)=>({run:(i?'   ·   ':'')+label,style:{typeface:'Archivo',fontSize:'15px',underline:'sng',color:c.gold},link:{uri:base+url,isExternal:true}}))]]);
  }
 }
 footer(s,m);
}
await fs.writeFile(path.join(build,'shape-manifest.json'),JSON.stringify(shapes,null,2));
const candidatePath=path.join(build,'candidate.pptx');
await(await PresentationFile.exportPptx(deck)).save(candidatePath);
execFileSync(process.env.CODEX_PRIMARY_RUNTIME_PYTHON||'python3',[path.join(here,'finish_package.py'),candidatePath],{stdio:'inherit'});
const skill=process.env.FI003_PRESENTATION_SKILL||'/root/.codex/skills/builtins/presentations';
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const finalPath=path.join(out,'SMPT_FI003_JPMorgan_MP_Draft_v05.pptx');
await finalizePresentation({workspaceDir:work,candidatePath,finalPath,
 pythonExecutable:process.env.CODEX_PRIMARY_RUNTIME_PYTHON,
 integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit',...tableOwners.flatMap(n=>['--require-native-table-slide',String(n)])],
 explicitTotalSlideCount:15,requiredNativeTableOwnerSlides:tableOwners,requiredNativeChartOwnerSlides:chartOwners,
 materializeLiteralChartWorkbooks:true,fontPolicy:{basis:'user_request',families:['Archivo']},verifyArtifactToolImport:true,
 receiptPath:path.join(build,'package-validation.json')});
// Artifact previews are supplementary. The exact exported PPTX is separately
// rendered through LibreOffice to the matching selectable-text PDF.
console.log(JSON.stringify({pptx:finalPath,slides:15,tableOwners,chartOwners}));
