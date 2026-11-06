#!/usr/bin/env python3
"""Read-only OOXML verification after a real spreadsheet-engine recalculation."""
import argparse
import hashlib
import json
import posixpath
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

ROOT=Path(__file__).resolve().parent
OUT=ROOT/'outputs/fi003-model-v1'
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
    'r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}


def read_xlsx(file):
    result={}
    with ZipFile(file) as z:
        strings=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            strings=[''.join(n.itertext()) for n in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',NS)]
        book=ET.fromstring(z.read('xl/workbook.xml'))
        rels={n.attrib['Id']:n.attrib['Target'] for n in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        for sh in book.findall('s:sheets/s:sheet',NS):
            target=rels[sh.attrib['{'+NS['r']+'}id']]
            target=target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/'+target)
            xml=ET.fromstring(z.read(target)); cells={}
            for node in xml.findall('s:sheetData/s:row/s:c',NS):
                value=node.find('s:v',NS); form=node.find('s:f',NS)
                t=node.get('t'); raw=value.text if value is not None else None
                if t=='s': raw=strings[int(raw)] if raw is not None else ''
                elif t=='inlineStr': raw=''.join(node.find('s:is',NS).itertext())
                elif t not in ['str','e'] and raw is not None: raw=float(raw)
                cells[node.attrib['r']]={'value':raw,'formula':form.text if form is not None else None,'error':t=='e'}
            result[sh.attrib['name']]={'cells':cells,
                'validations':len(xml.findall('s:dataValidations/s:dataValidation',NS)),
                'merges':len(xml.findall('s:mergeCells/s:mergeCell',NS))}
    return result


def verify(file,engine,scenario_name=None):
    spec=json.loads((OUT/'model_spec.json').read_text())
    actual=read_xlsx(file)
    report={'file':str(file),'sha256':hashlib.sha256(Path(file).read_bytes()).hexdigest(),
        'engine':engine,'scenario':scenario_name or 'baseline','checks':[],'tabs':{},'errors':[]}
    assert list(actual)==list(spec['sheets']), 'Tab names/order changed'
    overrides={}
    changed_groups=set()
    if scenario_name:
        case=next(s for s in spec['scenarios'] if s['name']==scenario_name)
        overrides=case['expected']
        for key in case['overrides']:
            changed_groups.add({'draw':'rcf','sofr':'rcf','days':'rcf','minimum':'addback','income':'addback','duplicate':'addback',
                'trigger':'timing','state':'threshold','year':'threshold','capacity':'threshold','benchmark':'ppa'}[key])
            if key=='state': changed_groups.add('ppa')
    for name,sheet in spec['sheets'].items():
        formulas=0
        for addr,item in sheet['cells'].items():
            record=actual[name]['cells'].get(addr,{})
            if record.get('error'): report['errors'].append(name+'!'+addr)
            if 'formula' not in item:
                if not scenario_name and 'value' in item:
                    expected=item['value']; value=record.get('value')
                    ok=(isinstance(value,(int,float)) and abs(value-expected)<=1e-7) if isinstance(expected,(int,float)) else (value==expected or expected=='' and value is None)
                    assert ok,(name,addr,value,expected)
                continue
            formulas+=1
            assert record.get('formula'),f'Formula lost: {name}!{addr}'
            if item.get('kind')=='link':
                assert item['formula'].split('"')[1] in record['formula'],f'Link changed: {name}!{addr}'
            expected=overrides.get(name+'!'+addr,item['expected'])
            if scenario_name and name=='Checks':
                # Separate baseline anchors intentionally change to SCENARIO;
                # business outputs and immutable history are verified directly.
                continue
            value=record.get('value')
            if isinstance(expected,(float,int)):
                ok=isinstance(value,(int,float)) and abs(value-expected)<=1e-7
            else: ok=(value==expected or (expected=='' and value is None))
            report['checks'].append({'cell':name+'!'+addr,'expected':expected,'actual':value,'pass':ok})
            assert ok,f'{name}!{addr}: {value!r} != {expected!r}'
        assert actual[name]['validations']==len(sheet['validations']),f'Validation lost: {name}'
        report['tabs'][name]={'formula_count':formulas,'validation_count':actual[name]['validations'],'merge_count':actual[name]['merges']}
    assert not report['errors'],report['errors']
    report['pass']=True
    return report


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('file',type=Path)
    ap.add_argument('--engine',required=True)
    ap.add_argument('--scenario')
    ap.add_argument('--report',type=Path,required=True)
    args=ap.parse_args()
    report=verify(args.file,args.engine,args.scenario)
    args.report.write_text(json.dumps(report,indent=2)+'\n')
    print(f'PASS: {len(report["checks"])} evaluated formula cells; six tabs; validation retained; no formula errors')


if __name__=='__main__': main()
