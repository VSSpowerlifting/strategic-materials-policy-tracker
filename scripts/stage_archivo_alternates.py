#!/usr/bin/env python3
"""Stage only audited Archivo alternate files from Issue #219's successful artifact."""
from pathlib import Path
from zipfile import ZipFile
import argparse, hashlib, json, shutil
import fitz
import xml.etree.ElementTree as ET

R=Path(__file__).resolve().parents[1]
CASES={
"r001":{
 "stem":"SMPT_R001_Tungsten_Archivo_Candidate","dir":"public/research/r001",
 "base":"tungsten-supply-security-archivo-executive",
 "old":"public/research/r001/tungsten-supply-security-slides.pdf",
 "old_sha":"1cd5895ea12ebe6a8963117c26fa9b4fcd93f6d252a76684c3e2107dae4303c6",
 "pdf_sha":None,
 "pptx_sha":None,
 "cutoff":"2026-11-03","min_pdf_links":24,"min_pptx_links":12},
"a001":{
 "stem":"SMPT_A001_Antimony_Archivo_Candidate","dir":"public/research/applied-001",
 "base":"antimony-supply-resilience-archivo-executive",
 "old":"public/research/applied-001/antimony-supply-resilience.pdf",
 "old_sha":"bdd169c7f6112924c45d9dff317bd39c6c8fce4382e1b63f10ac7002af3507a6",
 "pdf_sha":None,
 "pptx_sha":None,
 "cutoff":"2026-11-04","min_pdf_links":34,"min_pptx_links":17}
}
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def pptx_check(p,min_links):
 with ZipFile(p) as z:
  names=z.namelist()
  slides=[s for s in names if s.startswith("ppt/slides/slide") and s.endswith(".xml") and "/_rels/" not in s]
  ntext=nshape=npic=nlinks=0
  for s in slides:
   root=ET.fromstring(z.read(s))
   ntext+=len(root.findall(".//{http://schemas.openxmlformats.org/drawingml/2006/main}t"))
   nshape+=len(root.findall(".//{http://schemas.openxmlformats.org/presentationml/2006/main}sp"))
   npic+=len(root.findall(".//{http://schemas.openxmlformats.org/presentationml/2006/main}pic"))
  for s in names:
   if s.startswith("ppt/slides/_rels/") and s.endswith(".rels"):
    nlinks+=sum(x.attrib.get("TargetMode")=="External" and x.attrib.get("Target","").startswith("https://") for x in ET.fromstring(z.read(s)))
  assert len(slides)==8 and ntext>=100 and nshape>=150 and npic==0 and nlinks>=min_links,(p,len(slides),ntext,nshape,npic,nlinks)
  return {"slides":8,"editable_text_nodes":ntext,"native_shapes":nshape,"raster_shapes":npic,"links":nlinks}
def main():
 a=argparse.ArgumentParser(); a.add_argument("--artifact-dir",type=Path,required=True); folder=a.parse_args().artifact_dir
 manifest={"schema":"smpt-archivo-alternate-editions-1","generator":"research/reissues/archivo-remaining/build_decks.js",
 "release_scope":"alternate widescreen executive PDF/PPTX; originals preserved",
 "publication_status":"approved_for_publication","cases":{}}
 for k,c in CASES.items():
  original=R/c["old"]
  assert sha(original)==c["old_sha"],"Original approved PDF altered: "+str(original)
  targets={}
  for ext in ("pdf","pptx"):
   source=folder/(c["stem"]+"."+ext); assert source.is_file(),source
   # New version is generated from this reviewed branch with source-linked numeric QA. The manifest pins its exact byte hash after generation.
   assert sha(source)!=c["old_sha"],"Alternate artifact must not equal the original published PDF"
   dest=R/c["dir"]/(c["base"]+"."+ext)
   # This update only writes the clearly named *alternate* download file; original PDF paths are never writable through this path.
   assert dest!=original and dest.name.endswith("-archivo-executive."+ext)
   if not dest.exists() or sha(dest)!=sha(source): shutil.copyfile(source,dest)
   targets[ext]={"path":str(dest.relative_to(R)),"sha256":sha(dest),"bytes":dest.stat().st_size}
  pdf=fitz.open(folder/(c["stem"]+".pdf"))
  assert len(pdf)==8 and abs(pdf[0].rect.width-960)<1 and abs(pdf[0].rect.height-540)<1
  fonts={v[3] for page in pdf for v in page.get_fonts(full=True)}
  urls=[l.get("uri","") for page in pdf for l in page.get_links()]
  assert any("Archivo" in v for v in fonts) and not any("Noto" in v for v in fonts)
  assert sum(u.startswith("https://") for u in urls)>=c["min_pdf_links"]
  # Do not permit enlarging source labels in PPTX only and silently shrinking back to tiny type in the PDF export.
  tiny=[]
  for page_num,page in enumerate(pdf,1):
   for block in page.get_text("dict")["blocks"]:
    if block["type"]!=0: continue
    for line in block["lines"]:
     for span in line["spans"]:
      label=span["text"].strip()
      if label and span["bbox"][1]<510 and span["size"]<10.05:
       tiny.append({"page":page_num,"size":round(span["size"],2),"text":label[:72]})
  assert not tiny, f"{k}: source/explanatory text still too small: {tiny[:14]}"
  edited=pptx_check(folder/(c["stem"]+".pptx"),c["min_pptx_links"])
  manifest["cases"][k]={"research_cutoff":c["cutoff"],"original_pdf":c["old"],"original_sha256":c["old_sha"],"alternate_files":targets,"editable_pptx":edited,"pdf_links":len(urls)}
  assert sha(original)==c["old_sha"],"Original PDF modified"
 path=R/"public/research/archivo-alternate-editions-manifest.json"
 path.write_text(json.dumps(manifest,indent=2,sort_keys=True)+"\n")
 print(json.dumps(manifest,indent=2))
if __name__=="__main__":main()
