"""Set v2 package theme, thin horizontal table rules, metadata and reading descriptions."""
import sys,zipfile
from pathlib import Path
from lxml import etree as E
p=Path(sys.argv[1]);A='http://schemas.openxmlformats.org/drawingml/2006/main';N={'a':A,'p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
palette={'dk1':'12110F','lt1':'EFECE6','dk2':'1A1814','lt2':'F5F3EE','accent1':'C8993E','accent2':'E3B04B','accent3':'928A7D','accent4':'5B5548','accent5':'D8D3C7','accent6':'7A5510','hlink':'7A5510','folHlink':'7A5510'}
with zipfile.ZipFile(p) as z:entries=[(i,z.read(i.filename)) for i in z.infolist()]
with zipfile.ZipFile(p,'w') as z:
 for info,data in entries:
  if info.filename.startswith('ppt/theme/') and info.filename.endswith('.xml'):
   r=E.fromstring(data)
   for tag,color in palette.items():
    for node in r.findall('.//a:clrScheme/a:'+tag,N):
     for child in list(node):node.remove(child)
     E.SubElement(node,'{'+A+'}srgbClr',val=color)
   for node in r.findall('.//a:majorFont/a:latin',N):node.set('typeface','Georgia')
   for node in r.findall('.//a:minorFont/a:latin',N):node.set('typeface','Arial')
   data=E.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)
  elif info.filename.startswith('ppt/slides/slide') and info.filename.endswith('.xml'):
   r=E.fromstring(data)
   for prop in r.findall('.//a:tbl/a:tr/a:tc/a:tcPr',N):
    for edge in ('lnL','lnR','lnT','lnB'):
     tag='{'+A+'}'+edge;ln=prop.find(tag)
     if ln is None:ln=E.SubElement(prop,tag)
     ln.set('w','6350')
     for c in list(ln):ln.remove(c)
     if edge in ('lnL','lnR'):E.SubElement(ln,'{'+A+'}noFill')
     else:E.SubElement(E.SubElement(ln,'{'+A+'}solidFill'),'{'+A+'}srgbClr',val='D8D3C7')
   for i,node in enumerate(r.findall('.//p:cNvPr',N)):
    if 'descr' not in node.attrib:node.set('descr',node.get('name','Editable financial exhibit')+'; all financial values are available as editable text or chart data.')
   data=E.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)
  elif info.filename=='docProps/core.xml':
   r=E.fromstring(data)
   for tag,value in [('title',"Inside Tungsten West's £71 Million Restart Financing"),('subject','Presentation v2 candidate. Research cutoff 4 November 2026.'),('creator','Benjamin Yang / Strategic Materials Policy Tracker')]:
    q='{http://purl.org/dc/elements/1.1/}'+tag;node=r.find(q)
    if node is None:node=E.SubElement(r,q)
    node.text=value
   data=E.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)
  z.writestr(info,data)
