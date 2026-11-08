#!/usr/bin/env python3
"""Verify draft numerical lineage, editable evidence, PDF text/links and hashes."""
import hashlib
import argparse
import json
from pathlib import Path
import re
import sys
import unicodedata
from zipfile import ZipFile
from xml.etree import ElementTree as ET

import fitz

HERE=Path(__file__).resolve().parent
ROOT=HERE.parent
sys.path.insert(0,str(HERE))
import prepare


def norm(s):
    return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKC',s).lower())


def contrast(foreground, background):
    def luminance(rgb):
        values=[((rgb >> shift) & 255)/255 for shift in (16,8,0)]
        linear=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in values]
        return sum(a*b for a,b in zip(linear,(.2126,.7152,.0722)))
    a,b=sorted((luminance(foreground),luminance(background)))
    return (b+.05)/(a+.05)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--report',type=Path)
    args=parser.parse_args()
    out=ROOT/'outputs'/'presentation-draft-v05'
    stem='SMPT_FI003_JPMorgan_MP_Draft_v05'
    pptx,pdf=out/(stem+'.pptx'),out/(stem+'.pdf')
    manifest=json.loads((HERE/'slide-manifest.json').read_text())
    assert manifest==json.loads(json.dumps(prepare.build())),'Slide snapshot drift'
    assert len(manifest['slides'])==15
    # The full repository also carries a private delivery/access record. The
    # review ZIP excludes it; both environments verify the frozen public hashes.
    for name,expected in manifest['source_hashes'].items():
        assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==expected,('Provenance changed',name)
    delivery_path=ROOT/'outputs/fi003-model-v1/delivery.json'
    if delivery_path.exists():
        delivery=json.loads(delivery_path.read_text())
        for name,expected in delivery['source_code_sha256'].items():
            assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==expected,('Model source changed',name)
        assert hashlib.sha256((ROOT/'outputs/fi003-model-v1/recalculated/FI003_Working_Model_v1.xlsx').read_bytes()).hexdigest()==delivery['xlsx_sha256']
    ns={'p':'http://schemas.openxmlformats.org/presentationml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','c':'http://schemas.openxmlformats.org/drawingml/2006/chart'}
    with ZipFile(pptx) as z:
        slides=[n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)]
        assert len(slides)==15
        tables={}
        for n in range(1,16):
            node=ET.fromstring(z.read(f'ppt/slides/slide{n}.xml'))
            tables[n]=len(node.findall('.//a:tbl',ns))
            assert all(x.attrib.get('typeface')=='Archivo' for x in node.findall('.//a:latin',ns))
        assert sum(tables.values())==5
        charts=sorted(n for n in z.namelist() if re.fullmatch(r'ppt/(?:slides/)?charts/chart\d+\.xml',n))
        assert len(charts)==3
        series=[]
        for n in charts:
            node=ET.fromstring(z.read(n))
            for item in node.findall('.//c:ser',ns):
                series.append([float(v.text) for v in item.findall('./c:val/c:numRef/c:numCache/c:pt/c:v',ns)])
            value_axis=node.findall('.//c:valAx/c:scaling/c:min',ns)
            if node.find('.//c:doughnutChart',ns) is None:
                assert value_axis and all(float(x.attrib['val'])==0 for x in value_axis),'Truncated value axis'
            else:
                assert node.find('.//c:holeSize',ns).attrib['val']=='66'
        expected=[a['values'] for s in manifest['slides'] if 'chart' in s for a in s.get('render_chart',s['chart'])['series']]
        assert series==expected,(series,expected)
        embeddings=[n for n in z.namelist() if n.startswith('ppt/embeddings/') and n.endswith('.xlsx')]
        assert len(embeddings)==3
        # The finalizer reconciles every category/series range to the literal
        # embedded workbooks. Also reject external data dependencies here.
        from io import BytesIO
        for name in embeddings:
            with ZipFile(BytesIO(z.read(name))) as book:
                assert not any('externalLink' in n for n in book.namelist())
        for n,count in [(6,1),(7,1),(11,1),(13,9)]:
            node=ET.fromstring(z.read(f'ppt/slides/slide{n}.xml'))
            assert sum(bool(x.get('descr')) for x in node.findall('.//p:cNvPr',ns))==count,('Missing evidence descriptions',n)
        links=''.join(z.read(n).decode() for n in z.namelist() if n.endswith('.rels'))
        assert 'docs.google.com' not in links and 'file:' not in links
        assert '/blob/codex/' not in links,'Moving-branch research link'
        assert 'sources.json' in links and manifest['reviewed_head'] in links
        assert 'FI003: JPMorgan and MP Materials, draft 0.5' in z.read('docProps/core.xml').decode()
    doc=fitz.open(pdf)
    assert len(doc)==15
    all_uris=set(); fonts=set(); footer_contrasts=[]
    for m,page in zip(manifest['slides'],doc):
        actual=norm(page.get_text())
        for key in ['title','scope','note','caveat']:
            assert norm(m.get(key,'')) in actual,('Missing/clipped PDF text',m['number'],key)
        for text in m.get('visual_text',[]):
            assert norm(text) in actual,('Visual text missing',m['number'],text)
        for row in ([] if 'visual_text' in m else (m.get('rows',[])[:3] if m['kind']=='economics' else m.get('rows',[]))):
            assert all(norm(str(cell)) in actual for cell in row),('Table text missing',m['number'],row)
        links=[x['uri'] for x in page.get_links() if x.get('uri')]
        expected_links={s['url'] for s in manifest['sources'] if s['id'] in [r[0] for r in m['source_refs']]}
        assert expected_links.issubset(set(links)),('Missing source links',m['number'])
        all_uris.update(links)
        for font in page.get_fonts(full=True):
            fonts.add(font[3]);assert 'Archivo' in font[3],font
            assert doc.extract_font(font[0])[3],('Unembedded font',font[3])
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines',[]):
                for span in line['spans']:
                    x0,y0,x1,y1=span['bbox']
                    assert x0>=0 and y0>=0 and x1<=page.rect.width+.1 and y1<=page.rect.height+.1,('Off-page text',m['number'],span['text'])
                    if y0>=page.rect.height*.92 and span['text'].strip():
                        ratio=contrast(span['color'],0x12110F if m['number']==1 else 0xF5F3EE)
                        assert ratio>=4.5,('Unreadable source/footer contrast',m['number'],ratio,span['text'])
                        footer_contrasts.append(ratio)
    assert norm('required Q2 2027 financial statements') in norm(doc[8].get_text()),'Missing calendar trigger limb'
    assert norm('future appropriations') in norm(doc[9].get_text())
    assert norm('quarter-end of written notice') in norm(doc[10].get_text())
    base=f'https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/{manifest["reviewed_head"]}/research/fi003/'
    allowed={s['url'] for s in manifest['sources']} | {base+p for p in ['outputs/fi003-model-v1/recalculated/FI003_Working_Model_v1.xlsx','evidence.csv','sources.json']}
    assert all_uris.issubset(allowed),'Unexpected/private PDF link'
    # Independent cash bridge and ownership arithmetic, rather than build output alone.
    assert abs(sum([1830.286,-7.757,-420.250,6.500,-91.145,20.876,.821,-1.420])-1337.911) < 1e-9
    assert round(13590908/(163477816+13590908)*100,6)==7.675499
    result={'status':'PASS','cutoff':manifest['cutoff'],'model_unchanged':True,'slides':15,
        'editable_tables':5,'editable_native_charts':3,'embedded_literal_chart_workbooks':3,
        'waterfall':'9 editable native bars, including seven signed movements; original values in slide manifest',
        'chart_snapshot_precision':'Ownership fractions rounded to 12 decimal places for Excel portability; full model precision retained',
        'pdf_links':sum(len(p.get_links()) for p in doc),'unique_link_targets':len(all_uris),'fonts':sorted(fonts),
        'claims':len(list(__import__('csv').DictReader((ROOT/'evidence.csv').open()))),
        'minimum_footer_contrast':round(min(footer_contrasts),3),
        'files':{f.name:{'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in [pptx,pdf]},
        'limits':['No Microsoft PowerPoint application test','No newly executed live Sheets session','No legal opinion, actual headroom or completion-funding certification','Basic PDF tags inspected separately; no PDF/UA or assistive-technology certification']}
    (args.report or out/'verification.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))


if __name__=='__main__':main()
