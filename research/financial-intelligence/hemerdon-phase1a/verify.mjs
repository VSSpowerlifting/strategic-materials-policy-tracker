// Run with the bundled Node runtime and artifact-tool installed or linked in a parent node_modules.
// This imports the Python-generated workbook, exercises formulas, restores inputs, renders and exports.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {FileBlob, SpreadsheetFile} from '@oai/artifact-tool';

const here = path.dirname(fileURLToPath(import.meta.url));
const input = process.argv[2] || path.join(here, 'hemerdon-financial-model.xlsx');
const qaDir = process.env.HEMERDON_QA_DIR || '/tmp/smpt-hemerdon/qa';
await fs.mkdir(qaDir, {recursive:true});
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(input));
const sheet = name => wb.worksheets.getItem(name);
const get = (name, cell) => sheet(name).getRange(cell).values[0][0];
const put = (name, cell, value) => {sheet(name).getRange(cell).values = [[value]];};
const close = (actual, expected) => assert.ok(typeof actual === 'number' && Math.abs(actual-expected)<0.01, `${actual} != ${expected}`);
const results = [];
for (const [name, capex, need, stress] of [
  ['Base', 42500000, 111500000, 0],
  ['Upside', 40000000, 109000000, 0],
  ['Downside', 45000000, 114000000, 5750000],
]) {
  put('Assumptions', 'D4', name);
  wb.recalculate();
  close(get('Funding', 'D16'), capex);
  close(get('Operating', 'D20'), need);
  close(get('Funding', 'D23'), stress);
  close(get('Operating', 'D21'), need/254479.5);
  close(get('Historical', 'E11'), 25485511);
  assert.equal(get('Operating', 'D25'), 'Unavailable');
  close(get('August plan','D35'),name==='Downside'?-2000000:13000000);
  results.push({case:name, remainingSpend:capex, coreCash:need, incrementalStress:stress, coverageGBPPerMtu:get('Operating','D21'),augustPlanCashAfterOtherUses:get('August plan','D35')});
}
// Change one case driver; same build and Overview must update.
const old = sheet('Assumptions').getRange('G9').formulas[0][0];
put('Assumptions', 'G9', 76000000);
wb.recalculate();
close(get('Overview','D13'),115000000);
sheet('Assumptions').getRange('G9').formulas=[[old]];
// Missing selected cost must remain missing instead of being silently summed as zero.
put('Assumptions','G9',null);
wb.recalculate();
assert.equal(get('Operating','D20'),'Unavailable');
assert.equal(get('Overview','D14'),'Unavailable');
sheet('Assumptions').getRange('G9').formulas=[[old]];
// Optional price: blank is missing, zero is a real zero-price stress, positive propagates.
put('Assumptions','G18',0);
wb.recalculate();
close(get('Operating','D25'),0);
put('Assumptions','G18',500);
wb.recalculate();
close(get('Operating','D25'),127239750);
put('Assumptions','G18',null);
// An unselected blank must not block Base.
put('Assumptions','D4','Base');
wb.recalculate();
close(get('Overview','D13'),111500000);
// Missing volume and invalid coefficient cannot return a plausible coverage price.
const oldVolume=sheet('Assumptions').getRange('E10').formulas[0][0];
put('Assumptions','E10',null);
wb.recalculate();
assert.equal(get('Operating','D21'),'Unavailable');
sheet('Assumptions').getRange('E10').formulas=[[oldVolume]];
const oldRoyalty=sheet('Assumptions').getRange('E12').formulas[0][0];
put('Assumptions','E12',1);
wb.recalculate();
assert.equal(get('Operating','D21'),'Unavailable');
sheet('Assumptions').getRange('E12').formulas=[[oldRoyalty]];
// Accordion availability is explicitly hypothetical and bounded.
put('Assumptions','D4','Downside');
put('Assumptions','G15',10000000);
wb.recalculate();
close(get('Funding','D23'),0);
put('Assumptions','G15',10000001);
wb.recalculate();
assert.equal(get('Funding','D23'),'Unavailable');
put('Assumptions','G15',0);
put('Assumptions','D4','Base');
wb.recalculate();
// Remove core-loan timing in the original plan only; no change to historical financing.
put('Assumptions','E17',0);
wb.recalculate();
close(get('August plan','D35'),-12000000);
close(get('Funding','D9'),25000000);
put('Assumptions','E17',1);
wb.recalculate();
put('Assumptions','E16',1.1);
wb.recalculate();
assert.equal(get('August plan','D35'),'Unavailable');
put('Assumptions','E16',1);
const oldCapex=sheet('Assumptions').getRange('E8').formulas[0][0];
put('Assumptions','E8',-1);
wb.recalculate();
assert.equal(get('Funding','D23'),'Unavailable');
sheet('Assumptions').getRange('E8').formulas=[[oldCapex]];
wb.recalculate();
for(let r=8;r<=16;r++) close(get('Checks',`D${r}`),0);
close(get('Checks','D21'),-1000000);
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:300},summary:'Formula error scan'});
await fs.writeFile(path.join(qaDir,'error-scan.ndjson'),errors.ndjson);
const ranges={Overview:'C2:F27',Assumptions:'C2:J19',Funding:'C2:E28','August plan':'C2:E37',Operating:'C2:F28',Historical:'C2:H20',Evidence:'C2:M12',Sources:'C2:L11',Checks:'C2:E21'};
for(const [sheetName,range] of Object.entries(ranges)){
  const rendered=await wb.render({sheetName,range,scale:1.3});
  await fs.writeFile(path.join(qaDir,`${sheetName}.png`),new Uint8Array(await rendered.arrayBuffer()));
}
await (await SpreadsheetFile.exportXlsx(wb)).save(input);
await fs.writeFile(path.join(path.dirname(input),'model-results.json'),JSON.stringify({cutoff:'2026-11-04',engine:'@oai/artifact-tool; not native Excel',scenarios:results,formulaReconciliations:9,knownAugustUsesRoundingDifferenceGBP:-1000000,scenarioMutationChecks:['selected cost','missing selected cost','unselected missing price','blank/zero/positive price','missing volume','100% royalty','hypothetical accordion and ceiling','original-plan core-loan timing','original-plan receipt timing','receipt fraction above100%','negative capex'],nativeExcelVerified:false},null,2)+'\n');
console.log(JSON.stringify({scenarios:results,errorScan:errors.ndjson,qaDir},null,2));
