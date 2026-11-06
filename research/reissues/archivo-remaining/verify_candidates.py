#!/usr/bin/env python3
"""Review-only checks for the reconstructed R001/A001 Archivo slide decks.
Original PDFs are comparison references; source/binary publication remains unchanged.
"""
from __future__ import annotations
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from zipfile import ZipFile

import fitz
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3] if len(Path(__file__).resolve().parents) >= 4 else Path.cwd()
NAMES = {
    'r001': 'SMPT_R001_Tungsten_Archivo_Candidate',
    'a001': 'SMPT_A001_Antimony_Archivo_Candidate',
}
REFERENCE = {
    'r001': 'public/research/r001/tungsten-supply-security-slides.pdf',
    'a001': 'public/research/applied-001/antimony-supply-resilience.pdf',
}
REQUIRED = {
    'r001': ['71m', '36m', '25m', '10m', 'JAPAN', 'El Moto', 'September', 'China', '4 February 2025'],
    'a001': ['91%', '55%', '45%', '5 months', '30%', '2.296m', '4.134m', '16.50 t', '12.45 t'],
}
NS = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'}

def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()

def tokens(text: str) -> Counter[str]:
    return Counter(re.findall(r'(?:[$£¥]\s?)?\d+(?:[.,]\d+)?\s?(?:%|m|bn|t|years|months)?', text, re.I))

def pptx_evidence(src: Path) -> dict:
    with ZipFile(src) as z:
        names = z.namelist()
        slides = sorted((n for n in names if re.fullmatch(r'ppt/slides/slide\d+\.xml', n)), key=lambda s:int(re.search(r'\d+',s).group()))
        assert len(slides) == 8, (src, len(slides))
        text_nodes = 0; images = 0; shape_nodes = 0; font_refs = set(); slide_text=[]
        for part in slides:
            root=ET.fromstring(z.read(part))
            slide_text.append(' '.join((e.text or '') for e in root.findall('.//a:t',NS)))
            text_nodes += len(root.findall('.//a:t',NS))
            shape_nodes += len(root.findall('.//p:sp',NS))
            images += len(root.findall('.//p:pic',NS))
            for a in root.findall('.//a:latin',NS):
                if a.attrib.get('typeface'): font_refs.add(a.attrib['typeface'])
        links=[]
        for rel in [n for n in names if re.fullmatch(r'ppt/slides/_rels/slide\d+\.xml\.rels',n)]:
            root=ET.fromstring(z.read(rel))
            for elt in root:
                if elt.attrib.get('TargetMode')=='External':
                    tgt=elt.attrib.get('Target','')
                    if tgt.startswith(('http:','https:')): links.append(tgt)
        assert text_nodes >= 100, (src.name,text_nodes)
        assert images == 0, (src.name,'raster image shapes found',images)
        assert font_refs == {'Archivo'}, (src.name,'font references',font_refs)
        assert len(links) >= 4, (src.name,'source hyperlinks',len(links))
        return {'slides':len(slides),'editable_text_nodes':text_nodes,'native_shape_nodes':shape_nodes,'raster_picture_shapes':images,
                'specified_fonts':sorted(font_refs),'hyperlink_count':len(links),'external_hyperlinks':sorted(set(links)),
                'per_slide_text':[len(t) for t in slide_text]}

def pdf_evidence(src:Path, required:list[str], *, require_archivo:bool) -> tuple[dict,list[Image.Image]]:
    doc=fitz.open(src)
    assert doc.page_count==8,(src,len(doc))
    all_text=' '.join(p.get_text() for p in doc)
    missing=[t for t in required if t.casefold() not in all_text.casefold()]
    assert not missing,(src.name,'missing critical terms',missing)
    fonts=sorted({f[3] for p in doc for f in p.get_fonts(full=True)})
    if require_archivo:
        assert any('Archivo' in s for s in fonts),(src.name,fonts)
        assert not any('NotoSans' in s for s in fonts),(src.name,'render substituted Archivo',fonts)
    outside=[];annots=[];images=[]
    for i,page in enumerate(doc):
        for block in page.get_text('dict')['blocks']:
            if block['type']!=0: continue
            for lin in block['lines']:
                for sp in lin['spans']:
                    box=fitz.Rect(sp['bbox'])
                    if not page.rect.contains(box) and box.get_area()>0:
                        outside.append((i+1,sp['text'][:45],tuple(round(z,1) for z in box)))
        annots += [l.get('uri') for l in page.get_links() if l.get('uri','').startswith('https://')]
        pix=page.get_pixmap(matrix=fitz.Matrix(0.61,0.61),alpha=False)
        images.append(Image.frombytes('RGB',(pix.width,pix.height),pix.samples))
    assert len(annots)>=4,(src.name,'PDF source hyperlinks',annots)
    assert not outside,(src.name,'out-of-bounds text',outside[:10])
    return {'pages':doc.page_count,'embedded_fonts':fonts,'pdf_hyperlinks':len(annots),
            'missing_critical_tokens':missing,'out_of_bounds_spans':outside,'selected_text_characters':len(all_text),
            'amount_and_date_tokens':sorted(tokens(all_text).keys())},images

def montage(images:list[Image.Image],target:Path)->None:
    w,h=images[0].size
    sheet=Image.new('RGB',(4*(w+14)+14,2*(h+34)+14),'#ebe7df')
    draw=ImageDraw.Draw(sheet)
    for i,img in enumerate(images):
        x=14+(i%4)*(w+14);y=14+(i//4)*(h+34)
        sheet.paste(img,(x,y));draw.text((x,y+h+5),f'Slide {i+1}',fill='#1b1915')
    sheet.save(target,quality=88)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--out-dir',type=Path,required=True)
    ap.add_argument('--root',type=Path,default=ROOT)
    ap.add_argument('--allow-font-substitution',action='store_true')
    args=ap.parse_args()
    out=args.out_dir.resolve();root=args.root.resolve();records={}
    for key,stem in NAMES.items():
        ppt=out/(stem+'.pptx');pdf=out/(stem+'.pdf')
        assert ppt.exists() and pdf.exists(),(ppt,pdf)
        native=pptx_evidence(ppt)
        scanned,images=pdf_evidence(pdf,REQUIRED[key],require_archivo=not args.allow_font_substitution)
        montage(images,out/(stem+'-contact.jpg'))
        baseline=root/REFERENCE[key]
        if baseline.is_file():
            reference=fitz.open(baseline)
            base_text=' '.join(p.get_text() for p in reference)
            ref_images=[]
            for pg in reference:
                pix=pg.get_pixmap(matrix=fitz.Matrix(0.61,0.61),alpha=False)
                ref_images.append(Image.frombytes('RGB',(pix.width,pix.height),pix.samples))
            if len(ref_images)==8:
                montage(ref_images,out/(stem+'-baseline-contact.jpg'))
            current_text=' '.join(p.get_text() for p in fitz.open(pdf))
            base_nums=tokens(base_text);current_nums=tokens(current_text)
            reference_report={'pages':reference.page_count,'page_size_points':[round(reference[0].rect.width,2),round(reference[0].rect.height,2)],'bytes':baseline.stat().st_size,'sha256':sha(baseline),
                              'source_tokens_not_in_candidate':sorted((base_nums-current_nums).elements())[:100],
                              'candidate_tokens_not_in_source':sorted((current_nums-base_nums).elements())[:100]}
        else:
            reference_report={'reference_file_available':False,'baseline_pdf':REFERENCE[key]}
        records[key]={'title':stem,'pptx_sha256':sha(ppt),'pdf_sha256':sha(pdf),**native,**scanned,
                      'source_reference_comparison':reference_report}
    (out/'archivo-reissue-qa.json').write_text(json.dumps(records,indent=2,ensure_ascii=False)+'\n')
    lines=['# R001/A001 Archivo Reconstruction Candidate QA','',
           'Generated files are **review candidates only**; public PDFs and historical research remain unchanged.','',
           'Automated checks confirm 8 slides per deck, 100+ editable text nodes, zero raster picture shapes, source hyperlinks, source-text critical anchors, and page bounds.','',
           'The source decks did not have editable masters in the repository. The new argument layouts must pass independent **page-by-page editorial and numeric comparison against the original PDF slides**.','',
           'The new layout paraphrases and reorganizes the full research; it is not a binary-preserving typography-only change.','',
           'Original PDF source text and link-target comparison is supplied where the source files are accessible at CI runtime.','',
           'Source cutoffs are unchanged: R001 November 3, 2026; A001 November 4, 2026. Model results are copied from the published evidence register.','']
    for key,v in records.items():
        lines += [f'## {key.upper()}',f'- PPTX: `{v["pptx_sha256"]}`',f'- PDF: `{v["pdf_sha256"]}`',
                 f'- Editable text runs: {v["editable_text_nodes"]}; native shapes: {v["native_shape_nodes"]}; image shapes: {v["raster_picture_shapes"]}',
                 f'- PPTX source links: {v["hyperlink_count"]}; PDF links: {v["pdf_hyperlinks"]}',
                 f'- Embedded fonts: {", ".join(v["embedded_fonts"])}',
                 f'- PDF pages: {v["pages"]}; slide text out of bounds: {len(v["out_of_bounds_spans"])}','']
    lines += ['## Release gates','',
              '- [ ] Independently inspect all 16 rendered slides against original PDFs (wording, source links, numerical exhibits, as-of qualifiers).',
              '- [ ] Confirm exact original-source hyperlinks and working model references, including workbook formulas where appropriate.',
              '- [ ] Confirm PDF font list includes Archivo Regular + bold/semibold with no substitutions.',
              '- [ ] Confirm responsive reading and legibility of every rendered slide.',
              '- [ ] Obtain author/editorial approval for redesigned layouts and evidence boundaries.',
              '- [ ] Only then archive old versions and update public downloadable PDFs/PPTXs and manifests in a separate publication change.',
              '']
    (out/'ARCHIVO_REISSUE_REVIEW.md').write_text('\n'.join(lines))
    print(json.dumps({k:{f:records[k][f] for f in ['slides','editable_text_nodes','native_shape_nodes','raster_picture_shapes','hyperlink_count','pdf_hyperlinks','embedded_fonts']} for k in records},indent=2))

if __name__=='__main__':main()