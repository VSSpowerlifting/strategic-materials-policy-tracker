#!/usr/bin/env python3
"""Reconstruct editable, prepublication Archivo slide candidates from approved PDFs."""
import hashlib, io, json, math, re, shutil, subprocess, tempfile
from collections import Counter
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET
import fitz
from PIL import Image, ImageDraw
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import MSO_ANCHOR
from pptx.util import Pt

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"research/legacy-archivo-review-20261106"
CASES=[
 ("r001","public/research/r001/tungsten-supply-security-slides.pdf","R001_Tungsten_Archivo_candidate"),
 ("applied001","public/research/applied-001/antimony-supply-resilience.pdf","Applied_001_Antimony_Archivo_candidate")
]
def sh(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def U(x): return int(Pt(float(x)))
def C(x):
    if isinstance(x,(tuple,list)): return RGBColor(*(max(0,min(255,round(a*255))) for a in x[:3]))
    return RGBColor((int(x)>>16)&255,(int(x)>>8)&255,int(x)&255)
def sty(shape,fill=None,line=None,weight=0):
    if fill is None: shape.fill.background()
    else:
        shape.fill.solid()
        shape.fill.fore_color.rgb=C(fill)
    if line is None or weight<=0: shape.line.fill.background()
    else:
        shape.line.color.rgb=C(line)
        shape.line.width=Pt(max(.1,weight))
def path(slide,pts,fill=None,line=None,w=.2,closed=False):
    if len(pts)<2 or any(not math.isfinite(x) or not math.isfinite(y) for x,y in pts): return False
    if len(pts)==2 and fill is None and not closed:
        s=slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT,U(pts[0][0]),U(pts[0][1]),U(pts[1][0]),U(pts[1][1]))
        sty(s,None,line,w)
    else:
        builder=slide.shapes.build_freeform(round(pts[0][0]*100),round(pts[0][1]*100),scale=Pt(1)/100)
        builder.add_line_segments([(round(x*100),round(y*100)) for x,y in pts[1:]],close=closed)
        s=builder.convert_to_shape()
        sty(s,fill if closed else None,line,w)
    return True
def bez(a,b,c,d):
    p=[(a.x,a.y)]
    for i in range(1,17):
        t=i/16
        p.append(((1-t)**3*a.x+3*(1-t)**2*t*b.x+3*(1-t)*t*t*c.x+t**3*d.x,
                  (1-t)**3*a.y+3*(1-t)**2*t*b.y+3*(1-t)*t*t*c.y+t**3*d.y))
    return p
def drawings(slide,page,stats):
    for draw in page.get_drawings():
        fill,line=draw.get("fill"),draw.get("color")
        width=draw.get("width") or .2
        for item in draw.get("items",[]):
            kind=item[0]
            try:
                if kind=="re":
                    r=fitz.Rect(item[1])
                    if r.is_empty: continue
                    shp=slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,U(r.x0),U(r.y0),U(r.width),U(r.height))
                    sty(shp,fill,line,width)
                elif kind=="l":
                    a,b=item[1:3]
                    if not path(slide,[(a.x,a.y),(b.x,b.y)],None,line,width): raise ValueError()
                elif kind=="c":
                    if not path(slide,bez(*item[1:5]),fill,line,width,fill is not None): raise ValueError()
                elif kind=="qu":
                    q=item[1]
                    if not path(slide,[(q.ul.x,q.ul.y),(q.ur.x,q.ur.y),(q.lr.x,q.lr.y),(q.ll.x,q.ll.y)],fill,line,width,True): raise ValueError()
                else: raise ValueError()
                stats["native_vectors"]+=1
            except Exception: stats["unhandled_vectors"].append(kind)
def images(slide,page,doc,stats):
    for info in page.get_image_info(xrefs=True):
        r=fitz.Rect(info["bbox"])
        xref=info.get("xref")
        if not xref or r.is_empty or r.is_infinite:
            stats["unhandled_images"]+=1
            continue
        try:
            pix=fitz.Pixmap(doc,xref)
            if pix.n>4: pix=fitz.Pixmap(fitz.csRGB,pix)
            slide.shapes.add_picture(io.BytesIO(pix.tobytes("png")),U(r.x0),U(r.y0),U(r.width),U(r.height))
            stats["native_images"]+=1
        except Exception: stats["unhandled_images"]+=1
def text(slide,page,stats):
    for block in page.get_text("dict")["blocks"]:
        if block.get("type")!=0: continue
        for line in block.get("lines",[]):
            spans=line.get("spans",[])
            for index,span in enumerate(spans):
                word=span.get("text","")
                if not word.strip(): continue
                x0,y0,x1,y1=span["bbox"]
                if x1<=x0 or y1<=y0: continue
                right=spans[index+1]["bbox"][0] if index+1<len(spans) else page.rect.x1-3
                width=max(x1-x0+4,min(page.rect.x1-x0-2,right-x0-1))
                box=slide.shapes.add_textbox(U(x0),U(y0-.6),U(width),U(max((y1-y0)*1.35,span.get("size",12)*1.55)))
                frame=box.text_frame
                frame.word_wrap=False
                frame.margin_left=frame.margin_right=frame.margin_top=frame.margin_bottom=0
                frame.vertical_anchor=MSO_ANCHOR.TOP
                p=frame.paragraphs[0]
                p.space_before=p.space_after=Pt(0)
                p.line_spacing=1
                r=p.add_run()
                r.text=word
                r.font.name="Archivo"
                r.font.size=Pt(max(4,float(span.get("size",10))))
                r.font.bold=bool(span.get("flags",0)&16) or "bold" in span.get("font","").lower()
                r.font.italic=bool(span.get("flags",0)&2) or "italic" in span.get("font","").lower()
                r.font.color.rgb=C(span.get("color",0))
                stats["text_nodes"]+=1
def links(slide,page,stats):
    for item in page.get_links():
        url=item.get("uri","")
        if not url.startswith(("http://","https://")): continue
        box=fitz.Rect(item["from"])
        if box.is_empty or box.is_infinite: stats["unhandled_links"].append(url); continue
        sh=slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,U(box.x0),U(box.y0),U(max(box.width,.2)),U(max(box.height,.2)))
        sh.fill.background()
        sh.line.fill.background()
        sh.click_action.hyperlink.address=url
        stats["hyperlinks"].append(url)
def text_of(page): return page.get_text(sort=True)
def nums(t): return re.findall(r"(?<!\w)(?:[$£€]\s*)?\d+(?:[.,]\d+)*(?:\s*%|\s*[A-Za-z]{0,2})?",t)
def contact(doc,target):
    ims=[]
    for page in doc:
        pix=page.get_pixmap(matrix=fitz.Matrix(.6,.6),alpha=False)
        ims.append(Image.frombytes("RGB",(pix.width,pix.height),pix.samples))
    w=max(x.width for x in ims);h=max(x.height for x in ims)
    canvas=Image.new("RGB",(4*(w+20)+20,2*(h+40)+20),"#eeeae3")
    draw=ImageDraw.Draw(canvas)
    for i,im in enumerate(ims):
        x=20+(i%4)*(w+20);y=20+(i//4)*(h+40)
        canvas.paste(im,(x,y))
        draw.text((x,y+h+7),f"Slide {i+1}",fill="#252421")
    canvas.save(target,quality=90,optimize=True)
def export(master,dest):
    with tempfile.TemporaryDirectory(prefix="smpt-archivo-") as td:
        subprocess.run(["libreoffice","-env:UserInstallation="+(Path(td)/"profile").as_uri(),"--headless","--convert-to","pdf:impress_pdf_Export","--outdir",td,str(master)],check=True,timeout=240)
        generated=Path(td)/(master.stem+".pdf")
        if not generated.exists(): raise RuntimeError("Exported PDF absent")
        shutil.copy2(generated,dest)
def counts(path):
    with ZipFile(path) as z:
        files=sorted((p for p in z.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml",p)),key=lambda p:int(re.search(r"slide(\d+)",p).group(1)))
        out=[]
        for p in files:
            root=ET.fromstring(z.read(p))
            ns={"a":"http://schemas.openxmlformats.org/drawingml/2006/main","p":"http://schemas.openxmlformats.org/presentationml/2006/main"}
            out.append({"native_text":len(root.findall(".//a:t",ns)),"native_shapes":len(root.findall(".//p:sp",ns)),"native_pictures":len(root.findall(".//p:pic",ns))})
        return out
def rebuild(name,rel,stem):
    original=ROOT/rel
    src=fitz.open(original)
    if src.page_count!=8: raise RuntimeError(name+": expected eight slides")
    rect=src[0].rect
    if any(abs(p.rect.width-rect.width)>.5 or abs(p.rect.height-rect.height)>.5 for p in src): raise RuntimeError("Page-size mismatch")
    deck=Presentation()
    deck.slide_width=U(rect.width);deck.slide_height=U(rect.height)
    stats=[]
    for p in src:
        slide=deck.slides.add_slide(deck.slide_layouts[6])
        slide.background.fill.solid()
        slide.background.fill.fore_color.rgb=RGBColor(255,255,255)
        record={"native_vectors":0,"unhandled_vectors":[],"native_images":0,"unhandled_images":0,"text_nodes":0,"hyperlinks":[],"unhandled_links":[]}
        drawings(slide,p,record);images(slide,p,src,record);text(slide,p,record);links(slide,p,record)
        stats.append(record)
    deck.core_properties.title=name.upper()+" — editable Archivo review candidate"
    deck.core_properties.author="Strategic Materials Policy Tracker"
    pp=OUT/(stem+".pptx");pdf=OUT/(stem+".pdf")
    deck.save(pp);export(pp,pdf)
    dst=fitz.open(pdf)
    if dst.page_count!=8: raise RuntimeError("Exported page count mismatch")
    old_links=[set(x.get("uri","") for x in p.get_links() if x.get("uri","").startswith(("http://","https://"))) for p in src]
    new_links=[set(x.get("uri","") for x in p.get_links() if x.get("uri","").startswith(("http://","https://"))) for p in dst]
    missing_links={str(i+1):sorted(a-b) for i,(a,b) in enumerate(zip(old_links,new_links)) if a-b}
    missing_numbers={str(i+1):dict(Counter(nums(text_of(a)))-Counter(nums(text_of(b)))) for i,(a,b) in enumerate(zip(src,dst)) if Counter(nums(text_of(a)))-Counter(nums(text_of(b)))}
    retained=[round(len(re.sub(r"\s+","",text_of(b)))/max(1,len(re.sub(r"\s+","",text_of(a)))),3) for a,b in zip(src,dst)]
    fonts=sorted({f[3] for page in dst for f in page.get_fonts(full=True)})
    contact(src,OUT/(stem+"-source-contact.jpg"));contact(dst,OUT/(stem+"-archivo-contact.jpg"))
    audit={"case":name,"source":rel,"source_sha256":sh(original),"candidate_pptx_sha256":sh(pp),"candidate_pdf_sha256":sh(pdf),"slides":8,"embedded_fonts":fonts,"original_source_links":sum(map(len,old_links)),"candidate_source_links":sum(map(len,new_links)),"missing_source_links":missing_links,"missing_numeric_tokens":missing_numbers,"minimum_text_retention":min(retained),"text_retention_by_page":retained,"editable_counts":counts(pp),"conversion_stats":stats}
    (OUT/(stem+"-qa.json")).write_text(json.dumps(audit,ensure_ascii=False,indent=2)+"\n")
    return audit
def main():
    OUT.mkdir(parents=True,exist_ok=True)
    from reissue_archivo_decks import install_archivo
    install_archivo()
    reports=[rebuild(*case) for case in CASES]
    errors=[]
    lines=["# Legacy research decks — Archivo editable candidates","","REVIEW ONLY. No public files, URLs, research claims, or cutoff dates were changed.","",
        "Authoritative inputs: the published eight-page PDFs, R001 publication record,",
        "and the existing evidence workbooks and Applied 001 assumptions register.","",
        "Editable spans and PDF vector primitives were reconstructed into native",
        "PowerPoint objects. These are candidates rather than original authoring files;",
        "curve paths are approximated with editable polylines and require visual review.",""]
    for a in reports:
        lines += ["## "+a["case"].upper(),"","- Source: "+a["source"],
         "- Original SHA256: "+a["source_sha256"],
         "- Candidate PPTX SHA256: "+a["candidate_pptx_sha256"],
         "- Candidate PDF SHA256: "+a["candidate_pdf_sha256"],
         "- Embedded PDF fonts: "+", ".join(a["embedded_fonts"]),
         "- Source URL targets: "+str(a["original_source_links"])+"; candidate: "+str(a["candidate_source_links"]),
         "- Minimum extracted text retention: "+str(a["minimum_text_retention"]),
         "- Editable native text elements: "+str(sum(x["native_text"] for x in a["editable_counts"])),""]
        if not any("Archivo" in x for x in a["embedded_fonts"]): errors.append(a["case"]+": Archivo absent")
        if a["missing_source_links"]: errors.append(a["case"]+": links dropped")
        if a["missing_numeric_tokens"]: errors.append(a["case"]+": numeric text changed")
        if a["minimum_text_retention"]<.95: errors.append(a["case"]+": text below 95% retention")
        if any(x["unhandled_vectors"] or x["unhandled_images"] for x in a["conversion_stats"]): errors.append(a["case"]+": unsupported graphics")
    lines+=["## Approval gate","","Inspect source and candidate contact sheets and all sixteen slides at full size.",
       "Check text wrapping, quantitative exhibits, charts, font sizes and citations.",
       "Do not merge or change live downloads before explicit human visual sign-off.","",
       "## Automated blockers","","- "+("\n- ".join(errors) if errors else "None. Manual approval still required."),""]
    (OUT/"REVIEW.md").write_text("\n".join(lines))
    (OUT/"RESULT.json").write_text(json.dumps({"blocking":errors,"cases":[{"name":a["case"],"fonts":a["embedded_fonts"],"missing_links":a["missing_source_links"],"missing_numeric_tokens":a["missing_numeric_tokens"],"minimum_text_retention":a["minimum_text_retention"]} for a in reports]},indent=2)+"\n")
    print("RESULT_JSON "+json.dumps({"blocking":errors}))
if __name__=="__main__": main()
