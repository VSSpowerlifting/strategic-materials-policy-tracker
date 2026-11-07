#!/usr/bin/env python3
"""Reproducibly artifact text-free decoration and tag explicit slide headings.

This is a bounded repair of LibreOffice's tagged export, not PDF/UA certification.
Refuse unnamed figures containing text, images or other XObjects. Preserve all
meaningful evidence descriptions, tables, annotations and original text/drawing.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import unicodedata

import fitz
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ArrayObject, ContentStream, DictionaryObject, NameObject, NullObject, NumberObject, DecodedStreamObject, TextStringObject


def normalized(text):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKC', text).lower())


def children(node):
    value=node.get('/K', [])
    return value if isinstance(value, list) else [value]


def walk(node):
    if isinstance(node, list):
        for item in node: yield from walk(item)
    elif hasattr(node, 'get_object'):
        item=node.get_object()
        if isinstance(item, DictionaryObject):
            if '/S' in item: yield item
            yield from walk(children(item))


def page_text_map(page):
    stack=[]; result={}
    def before(op, args, cm, tm):
        if op==b'BDC': stack.append(args[1].get('/MCID') if isinstance(args[1], dict) else None)
        elif op==b'BMC': stack.append(None)
        elif op==b'EMC':
            assert stack, 'Unbalanced marked content'
            stack.pop()
    def text(value, cm, tm, font, size):
        if value.strip() and stack and stack[-1] is not None:
            result.setdefault(int(stack[-1]), []).append(value)
    page.extract_text(visitor_operand_before=before, visitor_text=text)
    assert not stack
    return {k:normalized(' '.join(v)) for k,v in result.items()}


def number_tree(node):
    result={}
    if '/Nums' in node:
        nums=node['/Nums']; result.update({int(nums[i]):nums[i+1].get_object() for i in range(0,len(nums),2)})
    for kid in node.get('/Kids',[]): result.update(number_tree(kid.get_object()))
    return result


def snapshot(reader):
    nodes=list(walk(reader.trailer['/Root']['/StructTreeRoot']['/K']))
    return {'roles':Counter(str(n['/S']) for n in nodes),
            'alts':[str(n['/Alt']) for n in nodes if n.get('/S')=='/Figure' and '/Alt' in n]}


def repair(source, output, report, manifest_path):
    assert source.resolve()!=output.resolve(), 'Preserve the source export'
    assert not output.exists(), 'Version the successor or use a new staging path'
    manifest=json.loads(manifest_path.read_text())
    reader=PdfReader(source); before=snapshot(reader)
    writer=PdfWriter(); writer.clone_document_from_reader(reader)
    root=writer.root_object['/StructTreeRoot']; nodes=list(walk(root['/K']))
    page_index={p.indirect_reference.idnum:i for i,p in enumerate(writer.pages)}
    mappings=[page_text_map(p) for p in writer.pages]
    parent_tree=number_tree(root['/ParentTree'])
    targets={}; headings=[]
    for i,m in enumerate(manifest['slides']):
        targets[(i,normalized(m['title']))]='/H1'
        if i==0: targets[(i,normalized(m['scope']))]='/H2'
        subheads=[]
        if m['kind']=='sequence':subheads=[v[1] for v in m['events']]
        elif m['kind']=='alternatives':subheads=[row[0][3:] for row in m['rows'][1:]]
        elif m['kind']=='timing':subheads=['Before the trigger','Trigger: earlier delivery of either','From the earnings-test stage','Management expectation: 2028']
        elif m['kind']=='states':subheads=['Before commercial operation']
        elif m['kind']=='decisions':subheads=[row[0] for row in m['rows'][1:]]
        for value in subheads:targets[(i,normalized(value))]='/H2'
    selected={}; removed_ids=set()
    for n in nodes:
        pg=n.get('/Pg');kids=children(n)
        if pg is None:continue
        i=page_index[pg.idnum]
        mcids=[int(k) for k in kids if isinstance(k,NumberObject)]
        if n['/S']=='/Figure' and not n.get('/Alt'):
            assert len(mcids)==1 and len(kids)==1, 'Complex unnamed figure needs manual classification'
            selected.setdefault(i,set()).add(mcids[0]);removed_ids.add(n.indirect_reference.idnum)
            parent_tree[int(writer.pages[i]['/StructParents'])][mcids[0]]=NullObject()
        if n['/S']=='/P' and len(mcids)==1:
            key=(i,mappings[i].get(mcids[0],''))
            if key in targets:
                n[NameObject('/S')]=NameObject(targets[key]);headings.append({'page':i+1,'mcid':mcids[0],'role':targets[key]})
    assert sum(h['role']=='/H1' for h in headings)==15, 'Every slide needs its main heading'
    # Verify and replace only the marked-content wrapper of text-free vectors.
    artifacts=[]
    for i,ids in selected.items():
        page=writer.pages[i]; content=ContentStream(page.get_contents(),writer)
        stack=[];seen=set()
        for index,(args,op) in enumerate(content.operations):
            if op==b'BDC':
                mcid=args[1].get('/MCID') if isinstance(args[1],dict) else None
                stack.append(mcid)
                if mcid in ids:
                    assert args[0]=='/Figure'
                    content.operations[index]=([NameObject('/Artifact')],b'BMC');seen.add(mcid)
                    artifacts.append({'page':i+1,'mcid':int(mcid)})
            elif op==b'BMC':stack.append(None)
            elif op==b'EMC':stack.pop()
            elif any(v in ids for v in stack if v is not None):
                assert op not in (b'Tj',b'TJ',b"'",b'"',b'Do',b'BI',b'INLINE IMAGE'), ('Unnamed figure contains meaningful content',i,op)
        assert seen==ids
        # Keep the original numeric/color spelling byte-for-byte. Serializing
        # parsed PDF floats can change antialiasing by one channel level.
        raw=page.get_contents().get_data()
        for mcid in ids:
            pattern=rb'/Figure\s*<<\s*/MCID\s+'+str(mcid).encode()+rb'\s*>>\s*BDC'
            raw,count=re.subn(pattern,b'/Artifact BMC',raw)
            assert count==1, ('Unexpected content wrapper',i,mcid)
        stream=DecodedStreamObject();stream.set_data(raw);page.replace_contents(stream)
    def prune(node):
        kept=[]
        for child in children(node):
            obj=child.get_object() if hasattr(child,'get_object') else child
            if isinstance(obj,DictionaryObject) and '/S' in obj:
                if obj.indirect_reference.idnum in removed_ids:continue
                prune(obj)
                if obj['/S']=='/Div' and not children(obj):continue
            kept.append(child)
        node[NameObject('/K')]=ArrayObject(kept)
    prune(root)
    writer.root_object[NameObject('/Lang')]=reader.trailer['/Root'].get('/Lang',TextStringObject('en-US'))
    output.parent.mkdir(parents=True,exist_ok=True)
    with output.open('wb') as f:writer.write(f)
    result_reader=PdfReader(output);after=snapshot(result_reader)
    assert before['alts']==after['alts'] and len(after['alts'])==12
    assert after['roles']['/Figure']==12
    for role in ['/Table','/TH','/TD','/Link']:
        assert before['roles'][role]==after['roles'][role],(role,'structure changed')
    # Confirm all remaining MCIDs have a live ParentTree entry and matching role.
    final_tree=number_tree(result_reader.trailer['/Root']['/StructTreeRoot']['/ParentTree'])
    for page in result_reader.pages:
        entries=final_tree[int(page['/StructParents'])]
        for args,op in ContentStream(page.get_contents(),result_reader).operations:
            if op==b'BDC' and isinstance(args[1],dict) and '/MCID' in args[1]:
                target=entries[int(args[1]['/MCID'])].get_object()
                assert isinstance(target,dict) and '/S' in target
    original=fitz.open(source);final=fitz.open(output)
    assert len(original)==len(final)==15
    for a,b in zip(original,final):
        assert a.get_text()==b.get_text(), 'Text changed during tagging'
        assert a.get_pixmap().samples==b.get_pixmap().samples, 'Visible pixels changed during tagging'
        assert [(x.get('uri'),x['from']) for x in a.get_links()]==[(x.get('uri'),x['from']) for x in b.get_links()]
    receipt={'status':'PASS','source_export_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
             'final_pdf_sha256':hashlib.sha256(output.read_bytes()).hexdigest(),
             'decorative_vectors_artifacted':len(artifacts),'artifacts':artifacts,'headings':headings,
             'roles_before':dict(before['roles']),'roles_after':dict(after['roles']),
             'preserved_meaningful_evidence_descriptions':len(after['alts']),
             'pixel_identical_pages':15,'text_identical_pages':15,
             'preserved_links':sum(len(p.get_links()) for p in final),
             'checks':['Text-free vector classification','Figure removal and ParentTree slot repair','All main slide headings H1; selected actual subheadings H2','Remaining content MCIDs resolve to structure entries','Table/header/cell and link counts preserved','All pages pixel and text identical to export','Annotation destinations and rectangles unchanged'],
             'manual_review_required':['Native Microsoft PowerPoint','Screen-reader reading order and navigation','Full accessibility audit / PDF-UA certification; not claimed']}
    report.write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps({k:v for k,v in receipt.items() if k not in ('artifacts','headings')},indent=2))


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('source',type=Path);parser.add_argument('output',type=Path);parser.add_argument('--report',type=Path,required=True)
    args=parser.parse_args();repair(args.source,args.output,args.report,Path(__file__).with_name('slide-manifest.json'))
