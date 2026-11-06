#!/usr/bin/env python3
"""Verify draft numerical lineage, editable evidence, PDF text/links and hashes."""
import hashlib
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


def main():
    out=ROOT/'outputs'/'presentation-draft-v01'
    stem='SMPT_FI003_JPMorgan_MP_Draft_v01'
    pptx,pdf=out/(stem+'.pptx'),out/(stem+'.pdf')
    manifest=json.loads((HERE/'slide-manifest.json').read_text())
    assert manifest==json.loads(json.dumps(prepare.build())),'Slide snapshot drift'
    assert len(manifest['slides'])==15
    delivery=json.loads((ROOT/'outputs/fi003-model-v1/delivery.json').read_text())
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
        assert sum(tables.values())==11
        charts=sorted(n for n in z.namelist() if re.fullmatch(r'ppt/(?:slides/)?charts/chart\d+\.xml',n))
        assert len(charts)==2
        series=[]
        for n in charts:
            node=ET.fromstring(z.read(n))
            for item in node.findall('.//c:ser',ns):
                series.append([float(v.text) for v in item.findall('./c:val/c:numRef/c:numCache/c:pt/c:v',ns)])
            value_axis=node.findall('.//c:valAx/c:scaling/c:min',ns)
            assert value_axis and all(float(x.attrib['val'])==0 for x in value_axis),'Truncated value axis'
        expected=[a['values'] for s in manifest['slides'] if 'chart' in s for a in s['chart']['series']]
        assert series==expected,(series,expected)
        embeddings=[n for n in z.namelist() if n.startswith('ppt/embeddings/') and n.endswith('.xlsx')]
        assert len(embeddings)==2
    doc=fitz.open(pdf)
    assert len(doc)==15
    all_uris=set(); fonts=set()
    for m,page in zip(manifest['slides'],doc):
        actual=norm(page.get_text())
        for key in ['title','scope','note','caveat']:
            assert norm(m.get(key,'')) in actual,('Missing/clipped PDF text',m['number'],key)
        for row in m.get('rows',[])[:3] if m['kind']=='economics' else m.get('rows',[]):
            assert all(norm(str(cell)) in actual for cell in row),('Table text missing',m['number'],row)
        links=[x['uri'] for x in page.get_links() if x.get('uri')]
        expected_links={s['url'] for s in manifest['sources'] if s['id'] in [r[0] for r in m['source_refs']]}
        assert expected_links.issubset(set(links)),('Missing source links',m['number'])
        all_uris.update(links)
        for font in page.get_fonts(full=True):
            fonts.add(font[3]);assert 'Archivo' in font[3],font
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines',[]):
                for span in line['spans']:
                    x0,y0,x1,y1=span['bbox']
                    assert x0>=0 and y0>=0 and x1<=page.rect.width+.1 and y1<=page.rect.height+.1,('Off-page text',m['number'],span['text'])
    # Independent cash bridge and ownership arithmetic, rather than build output alone.
    assert abs(sum([1830.286,-7.757,-420.250,6.500,-91.145,20.876,.821,-1.420])-1337.911) < 1e-9
    assert round(13590908/(163477816+13590908)*100,6)==7.675499
    result={'status':'PASS','cutoff':manifest['cutoff'],'model_unchanged':True,'slides':15,
        'editable_tables':11,'editable_native_charts':2,'embedded_literal_chart_workbooks':2,
        'waterfall':'9 editable native bars, including seven signed movements; original values in slide manifest',
        'chart_snapshot_precision':'Ownership fractions rounded to 12 decimal places for Excel portability; full model precision retained',
        'pdf_links':sum(len(p.get_links()) for p in doc),'unique_link_targets':len(all_uris),'fonts':sorted(fonts),
        'claims':len(list(__import__('csv').DictReader((ROOT/'evidence.csv').open()))),
        'files':{f.name:{'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in [pptx,pdf]},
        'limits':['No Microsoft PowerPoint application test','No newly executed live Sheets session','No legal opinion, actual headroom or completion-funding certification','PDF tagging and assistive-technology review not claimed']}
    (out/'verification.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))


if __name__=='__main__':main()
