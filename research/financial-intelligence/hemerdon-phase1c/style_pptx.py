"""Apply SMPT hyperlink colors to the generated theme before package validation."""
import sys, zipfile
from pathlib import Path
from lxml import etree as ET
p=Path(sys.argv[1]);ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
with zipfile.ZipFile(p) as z:entries=[(i,z.read(i.filename)) for i in z.infolist()]
with zipfile.ZipFile(p,'w') as z:
 for info,data in entries:
  if info.filename.startswith('ppt/theme/') and info.filename.endswith('.xml'):
   root=ET.fromstring(data)
   for tag in ['hlink','folHlink']:
    for n in root.findall('.//a:'+tag,ns):
     for child in list(n):n.remove(child)
     ET.SubElement(n,'{'+ns['a']+'}srgbClr',val='73571F')
   data=ET.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True)
  z.writestr(info,data)
