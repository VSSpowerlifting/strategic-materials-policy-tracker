"""Build bounded Google Sheets changes from the verified local model; no network."""
from pathlib import Path
from openpyxl import load_workbook
from openpyxl.utils.cell import range_boundaries
import json
R=Path(__file__).resolve().parents[1];w=load_workbook(R/'output/SMPT_FI002_BHP_Copper_Model.xlsx',data_only=False)
targets=[('00 Model Guide',1425618556,'C9:J26'),('01 Source Register',858976077,'C5:N26'),('04 Operating Sensitivity',909877359,'C12:F55'),('07 Funding Capacity',54538197,'C5:N30'),('08 Scenarios and Decisions',1974982556,'C33:K41'),('09 Decision Dashboard',1455852591,'C5:N20'),('10 Model Validation',42424646,'C20:E23')]
req=[]
for name,id,a1 in targets:
 c0,r0,c1,r1=range_boundaries(a1);rows=[]
 for row in w[name][a1]:
  vals=[]
  for c in row:
   val=c.value;v={}
   if val is not None:v['userEnteredValue']={('formulaValue'if c.data_type=='f'else'boolValue'if isinstance(val,bool)else'numberValue'if isinstance(val,(int,float))else'stringValue'):val}
   vals.append(v)
  rows.append({'values':vals})
 req.append({'updateCells':{'range':{'sheetId':id,'startRowIndex':r0-1,'endRowIndex':r1,'startColumnIndex':c0-1,'endColumnIndex':c1},'rows':rows,'fields':'userEnteredValue'}})
for id,rows,end in [(909877359,[38,49],6),(54538197,[5,18],5),(1974982556,[33],11),(1455852591,[5],5)]:
 for r in rows:req.append({'repeatCell':{'range':{'sheetId':id,'startRowIndex':r-1,'endRowIndex':r,'startColumnIndex':2,'endColumnIndex':end},'cell':{'userEnteredFormat':{'backgroundColor':{'red':.149,'green':.145,'blue':.137},'textFormat':{'bold':True,'foregroundColor':{'red':1,'green':1,'blue':1}}}},'fields':'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat'}})
req.append({'repeatCell':{'range':{'sheetId':1455852591,'startRowIndex':5,'endRowIndex':13,'startColumnIndex':3,'endColumnIndex':4},'cell':{'userEnteredFormat':{'numberFormat':{'type':'NUMBER','pattern':'#,##0.0;(#,##0.0);"-"'}}},'fields':'userEnteredFormat.numberFormat'}})
req.append({'repeatCell':{'range':{'sheetId':1974982556,'startRowIndex':33,'endRowIndex':41,'startColumnIndex':5,'endColumnIndex':11},'cell':{'userEnteredFormat':{'backgroundColor':{'red':1,'green':.945,'blue':.84},'textFormat':{'foregroundColor':{'red':.09,'green':.31,'blue':.6}},'numberFormat':{'type':'NUMBER','pattern':'#,##0.0'}}},'fields':'userEnteredFormat'}})
req.append({'updateDimensionProperties':{'range':{'sheetId':858976077,'dimension':'ROWS','startIndex':20,'endIndex':26},'properties':{'pixelSize':123},'fields':'pixelSize'}})
req.append({'repeatCell':{'range':{'sheetId':858976077,'startRowIndex':20,'endRowIndex':26,'startColumnIndex':2,'endColumnIndex':14},'cell':{'userEnteredFormat':{'wrapStrategy':'WRAP'}},'fields':'userEnteredFormat.wrapStrategy'}})
req.extend([{'repeatCell':{'range':{'sheetId':1974982556,'startRowIndex':33,'endRowIndex':41,'startColumnIndex':5,'endColumnIndex':6},'cell':{'userEnteredFormat':{'numberFormat':{'type':'PERCENT','pattern':'0.0%'}}},'fields':'userEnteredFormat.numberFormat'}},{'repeatCell':{'range':{'sheetId':1455852591,'startRowIndex':13,'endRowIndex':14,'startColumnIndex':3,'endColumnIndex':5},'cell':{'userEnteredFormat':{'wrapStrategy':'WRAP'}},'fields':'userEnteredFormat.wrapStrategy'}},{'updateDimensionProperties':{'range':{'sheetId':1455852591,'dimension':'ROWS','startIndex':13,'endIndex':14},'properties':{'pixelSize':62},'fields':'pixelSize'}}])
print(json.dumps(req,separators=(',',':')))
