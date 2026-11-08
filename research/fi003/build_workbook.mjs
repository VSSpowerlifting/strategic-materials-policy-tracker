// FI003 authoring entry point. Run with the bundled Node runtime; see README.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(path.join(process.env.FI003_NODE_MODULES || process.cwd()+'/node_modules','../package.json'));
const { Workbook, SpreadsheetFile } = await import(require.resolve('@oai/artifact-tool'));

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'outputs/fi003-model-v1');
const spec = JSON.parse(await fs.readFile(path.join(out, 'model_spec.json'), 'utf8'));
const wb = Workbook.create();
const ink='#252421', paper='#FBFAF7', band='#F0EEE8', gold='#98752D';
const formats={number:'#,##0.000;(#,##0.000);"—"',precise:'#,##0.000000;(#,##0.000000);"—"',
  integer:'#,##0;(#,##0);"—"',year:'0',percent:'0.00%;(0.00%);"—"',date:'dd mmm yyyy',text:'@'};
for (const name of Object.keys(spec.sheets)) wb.worksheets.add(name);
const extent = {};
for (const [name, config] of Object.entries(spec.sheets)) {
  const sh=wb.worksheets.getItem(name);
  const maxRow=Math.max(...Object.keys(config.cells).map(a=>Number(a.match(/\d+$/)[0])));
  const maxCol=name==='Guide_Sources'?8:6;
  extent[name]={rows:maxRow,cols:maxCol};
  const area=sh.getRangeByIndexes(0,0,maxRow,maxCol);
  area.format.font={name:'Arial',size:10,color:ink};
  area.format.fill='#FFFFFF';
  area.format.wrapText=true;
  area.format.verticalAlignment='center';
  area.format.rowHeightPx=34;
  sh.showGridLines=false;
  sh.freezePanes.freezeRows(4);
  sh.freezePanes.freezeColumns(1);
  sh.tabColor=name==='Checks'?'#77736B':gold;
  const widths=name==='Guide_Sources'?[235,135,165,115,100,400,100,120]:
    name==='Checks'?[330,150,150,100,105,420]:
    ['Credit','Liquidity'].includes(name)?[280,140,150,240,100,140]:[330,160,180,420,120,170];
  for (let c=0;c<widths.length;c++) sh.getRangeByIndexes(0,c,maxRow,1).format.columnWidthPx=widths[c];
  const values=Array.from({length:maxRow},()=>Array(maxCol).fill(null));
  for (const [addr,item] of Object.entries(config.cells)) {
    const col=addr.charCodeAt(0)-65, row=Number(addr.slice(1))-1;
    if ('value' in item) values[row][col]=item.value;
  }
  area.values=values;
  for (const range of config.merges) sh.getRange(range).merge();
  for (const [addr,item] of Object.entries(config.cells)) {
    const cell=sh.getRange(addr);
    if (item.formula) cell.formulas=[[item.formula]];
    if (item.format) cell.setNumberFormat(formats[item.format]);
    if (item.formula) {
      cell.format.font.color=item.formula.includes('!')?'#287246':'#202020';
      cell.format.horizontalAlignment=typeof item.expected==='number'?'right':'left';
    }
    if (['fact','control','anchor'].includes(item.kind) && typeof item.value==='number') {
      cell.format.font.color=item.kind==='anchor'?ink:'#1755A1';
      cell.format.horizontalAlignment='right';
    }
    if(item.kind==='title') {cell.format.font={name:'Arial',size:14,bold:true,color:ink};}
    if(item.kind==='header') {cell.format.fill=band;cell.format.font.bold=true;}
    if(item.kind==='section') {cell.format.fill=band;cell.format.font={name:'Arial',size:10,bold:true,color:ink};}
    if(item.kind==='control') {cell.format.fill='#FFF0C9';cell.format.font.color='#1755A1';cell.format.font.bold=true;}
    if(item.kind==='output') {cell.format.font.bold=true;}
    if(item.kind==='link') {cell.format.font={name:'Arial',size:10,bold:true,color:'#75551D',underline:'single'};}
  }
  sh.getRange('A1:F1').format.rowHeightPx=31;
  sh.getRange('A1:F1').format.fill=paper;
  sh.getRange('A2:F3').format.rowHeightPx=23;
  sh.getRange('A4:F4').format.font.size=9;
  sh.getRange('A4:F4').format.font.color='#625D53';
  for (const row of config.sections) {
    sh.getRange(`A${row}:F${row}`).format.fill=band;
    sh.getRange(`A${row}:F${row}`).format.borders={bottom:{style:'thin',color:'#D0CCC3'}};
    sh.getRange(`A${row}:F${row}`).format.rowHeightPx=30;
  }
  for (const validation of config.validations) {
    const {cell,...rule}=validation;
    sh.dataValidations.add({range:cell,rule});
  }
  // Sized per content class, not a blanket autofit that makes notes enormous.
  if(name==='Guide_Sources') {
    sh.getRange('A7:H14').format.rowHeightPx=38;
    sh.getRange(`A18:H${spec.fact_rows[1]}`).format.rowHeightPx=63;
    sh.getRange(`A${spec.source_rows[0]}:H${spec.source_rows[1]}`).format.rowHeightPx=58;
  }
  if(name==='Financing') {sh.getRange('A28:F33').format.rowHeightPx=92; sh.getRange('A31:F31').format.rowHeightPx=130;}
  if(name==='Support') sh.getRange('A45:F52').format.rowHeightPx=82;
  if(['Credit','Liquidity'].includes(name)) {
    for(const [addr,item] of Object.entries(config.cells)) {
      if(addr.startsWith('D') && item.value && String(item.value).length>70 && !config.merges.some(m=>m.split(':')[0]===addr)) {
        const row=Number(addr.slice(1));
        sh.getRange(`A${row}:F${row}`).format.rowHeightPx=64;
      }
    }
    if(name==='Credit') sh.getRange('A7:F10').format.rowHeightPx=48;
    if(name==='Liquidity') sh.getRange('A7:F10').format.rowHeightPx=48;
  }
  for(const [addr,item] of Object.entries(config.cells)) {
    if(item.kind==='note' && !addr.startsWith('B')) {
      const merged=config.merges.find(r=>r.split(':')[0]===addr);
      if(merged) {
        const [start,end]=merged.split(':');
        const rowCount=Number(end.match(/\d+/)[0])-Number(start.match(/\d+/)[0])+1;
        if(rowCount===1 && String(item.value).length>160) sh.getRange(merged).format.rowHeightPx=44;
      }
    }
  }
  sh.getRange(`A1:${String.fromCharCode(64+maxCol)}${maxRow}`).conditionalFormats.addCustom('A1="INVALID"',{
    fill:'#FBE5E3',font:{color:'#9B1C1C',bold:true}});
}
const checks=wb.worksheets.getItem('Checks');
checks.getRange(spec.check_status_range).conditionalFormats.addCustom('E8="FAIL"',{fill:'#FBE5E3',font:{color:'#9B1C1C',bold:true}});
await wb.recalculate();

function valueAt(target) {
  const [name,addr]=target.split('!');
  return wb.worksheets.getItem(name).getRange(addr).values[0][0];
}
function equal(actual,expected) {
  return typeof expected==='number' ? typeof actual==='number' && Math.abs(actual-expected)<=1e-7 :
    (expected===''?(actual===''||actual===null):actual===expected);
}
const result={version:spec.version,engine:'@oai/artifact-tool (bundled Node runtime)',baseline:[],scenarios:[],formulaCount:0};
for(const [name,config] of Object.entries(spec.sheets)) {
  for(const [addr,item] of Object.entries(config.cells)) if(item.formula) {
    result.formulaCount++;
    const actual=valueAt(name+'!'+addr);
    // HYPERLINK exports correctly but this engine has no evaluator for it.
    // LibreOffice and native Google Sheets must independently verify its value.
    if(item.kind!=='link' && !equal(actual,item.expected)) throw new Error(`Baseline ${name}!${addr}: ${JSON.stringify(actual)} != ${JSON.stringify(item.expected)}`);
  }
}
result.baseline=spec.anchors.map(a=>({cell:a.cell,expected:a.expected,actual:valueAt(a.cell),pass:true}));
const historical=spec.anchors.filter(a=>!a.group);
for(const test of spec.scenarios) {
  for(const [key,control] of Object.entries(spec.controls)) {
    const [name,addr]=control.cell.split('!');
    let value=key in test.overrides?test.overrides[key]:control.baseline;
    if(key==='trigger' && typeof value==='string') value=(Date.parse(value+'T00:00:00Z')-Date.UTC(1899,11,30))/86400000;
    wb.worksheets.getItem(name).getRange(addr).values=[[value]];
  }
  await wb.recalculate();
  for(const [target,expected] of Object.entries(test.expected)) {
    const actual=valueAt(target);
    if(!equal(actual,expected)) throw new Error(`Scenario ${test.name} ${target}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
  }
  for(const anchor of historical) if(!equal(valueAt(anchor.cell),anchor.expected)) throw new Error(`Historical cell changed: ${anchor.cell}`);
  result.scenarios.push({name:test.name,outputs:Object.keys(test.expected).length,historicalAnchors:historical.length,pass:true});
}
for(const control of Object.values(spec.controls)) {
  const [name,addr]=control.cell.split('!');
  wb.worksheets.getItem(name).getRange(addr).values=[[control.baseline]];
}
await wb.recalculate();
for(const anchor of spec.anchors) if(!equal(valueAt(anchor.cell),anchor.expected)) throw new Error('Restore failure '+anchor.cell);
await fs.mkdir(out,{recursive:true});
await fs.writeFile(path.join(out,'artifact-validation.json'),JSON.stringify(result,null,2)+'\n');
const exportScenario=process.argv.find(a=>a.startsWith('--export-scenario='))?.split('=')[1];
if(exportScenario) {
  const test=spec.scenarios.find(s=>s.name===exportScenario);
  if(!test) throw new Error('Unknown scenario '+exportScenario);
  for(const [key,value] of Object.entries(test.overrides)) {
    const [name,addr]=spec.controls[key].cell.split('!');
    wb.worksheets.getItem(name).getRange(addr).values=[[key==='trigger'?(Date.parse(value+'T00:00:00Z')-Date.UTC(1899,11,30))/86400000:value]];
  }
  await wb.recalculate();
}
const output=await SpreadsheetFile.exportXlsx(wb);
const outputPath=exportScenario?path.join(out,'qa',exportScenario+'.xlsx'):path.join(out,'FI003_Working_Model_v1.xlsx');
await fs.mkdir(path.dirname(outputPath),{recursive:true});
await output.save(outputPath);

// All populated areas, split vertically so the reviewer can read the text.
const ranges={Financing:['A1:F25','A26:F42'],Credit:['A1:F26','A27:F38','A39:F55'],
  Liquidity:['A1:F27','A29:F49'],Support:['A1:F27','A29:F42','A43:F56'],
  Guide_Sources:['A1:H17','A18:H40','A41:H63',`A64:H${spec.fact_rows[1]}`,`A${spec.source_rows[0]-2}:H${spec.source_rows[1]}`],
  Checks:['A1:F40','A41:F75',`A76:F${extent.Checks.rows}`]};
if(!process.argv.includes('--no-render')) {
  // Render friendly hyperlink labels only. Actual HYPERLINK formulas and their
  // evaluated labels are verified in LibreOffice and native Sheets, not here.
  for(const [name,config] of Object.entries(spec.sheets)) for(const [addr,item] of Object.entries(config.cells)) {
    if(item.kind==='link') wb.worksheets.getItem(name).getRange(addr).values=[[item.expected]];
  }
  await wb.recalculate();
  await fs.mkdir(path.join(out,'previews'),{recursive:true});
  for(const [name,views] of Object.entries(ranges)) for(let i=0;i<views.length;i++) {
    const image=await wb.render({sheetName:name,range:views[i],scale:1,format:'png'});
    await fs.writeFile(path.join(out,'previews',`${name}-${i+1}.png`),new Uint8Array(await image.arrayBuffer()));
  }
}
console.log(JSON.stringify({file:outputPath,formulaCount:result.formulaCount,
  baselineAnchors:result.baseline.length,scenarios:result.scenarios.length,sheets:Object.keys(spec.sheets)}));
