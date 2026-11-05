"""Apply the SMPT theme and publication metadata before package validation."""
import sys, zipfile, json
from pathlib import Path
from lxml import etree as ET
p=Path(sys.argv[1]);ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
content=json.loads((Path(__file__).resolve().parent/'publication-content.json').read_text())
palette={'dk1':'12110F','lt1':'EFECE6','dk2':'1A1814','lt2':'F5F3EE','accent1':'C8993E','accent2':'E3B04B','accent3':'232019','accent4':'5B5548','accent5':'D8D3C7','accent6':'7A5510','hlink':'7A5510','folHlink':'7A5510'}
with zipfile.ZipFile(p) as z:entries=[(i,z.read(i.filename)) for i in z.infolist()]
with zipfile.ZipFile(p,'w') as z:
 for info,data in entries:
  if info.filename.startswith('ppt/theme/') and info.filename.endswith('.xml'):
   root=ET.fromstring(data)
   for tag,color in palette.items():
    for n in root.findall('.//a:clrScheme/a:'+tag,ns):
     for child in list(n):n.remove(child)
     ET.SubElement(n,'{'+ns['a']+'}srgbClr',val=color)
   data=ET.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True)
  elif info.filename.startswith('ppt/slides/slide') and info.filename.endswith('.xml'):
   root=ET.fromstring(data)
   dark=info.filename in ('ppt/slides/slide1.xml','ppt/slides/slide10.xml')
   for props in root.findall('.//a:tbl/a:tr/a:tc/a:tcPr',ns):
    for edge in ('lnL','lnR','lnT','lnB'):
     name='{'+ns['a']+'}'+edge;line=props.find(name)
     if line is None:line=ET.SubElement(props,name)
     line.set('w','6350')
     for child in list(line):line.remove(child)
     fill=ET.SubElement(line,'{'+ns['a']+'}solidFill')
     ET.SubElement(fill,'{'+ns['a']+'}srgbClr',val='C8993E' if dark else 'D8D3C7')
     ET.SubElement(line,'{'+ns['a']+'}prstDash',val='solid')
   data=ET.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True)
  elif info.filename=='docProps/core.xml':
   root=ET.fromstring(data)
   for tag,val in [('title',content['title']),('subject',content['subtitle']),('creator','Strategic Materials Policy Tracker')]:
    name='{http://purl.org/dc/elements/1.1/}'+tag
    node=root.find(name)
    if node is None:node=ET.SubElement(root,name)
    node.text=val
   data=ET.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True)
  z.writestr(info,data)
