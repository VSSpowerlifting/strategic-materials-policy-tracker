import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Workbook,SpreadsheetFile,FileBlob} from '@oai/artifact-tool';
const build=path.dirname(fileURLToPath(import.meta.url));
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(path.join(build,'native-readback.xlsx')));
const views=[];
for(const s of wb.worksheets.items){
 const range=s.name.startsWith('00')?'C2:J26':s.name.startsWith('01')?'C5:F9':s.name.startsWith('04')?'C38:F55':s.name.startsWith('06')?'C2:H21':s.name.startsWith('08')?'C33:K41':s.name.startsWith('09')?'C2:F20':'C2:I29';
 const b=await wb.render({sheetName:s.name,range,scale:1.15,format:'png'});
 await fs.writeFile(path.join(build,'native-'+s.name.slice(0,2)+'.png'),new Uint8Array(await b.arrayBuffer()));
 views.push({sheet:s.name,range});
}
await fs.writeFile(path.join(build,'native-render-views.json'),JSON.stringify(views,null,2));
console.log('Rendered exported native Sheet:',views.length,'tabs.');
