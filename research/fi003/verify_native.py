#!/usr/bin/env python3
"""Reconcile preserved native Sheets effectiveValue readbacks to Python inputs.

Live connector recipe is in README. This read-only check needs no credentials.
"""
import json
from pathlib import Path
import model

ROOT=Path(__file__).resolve().parent
OUT=ROOT/'outputs/fi003-model-v1'


def value(cell):
    effective=cell.get('effectiveValue',{})
    assert 'errorValue' not in effective,effective
    return next((effective[k] for k in ['numberValue','stringValue','boolValue'] if k in effective),'')


def same(actual,expected):
    return isinstance(actual,(float,int)) and abs(actual-float(expected))<=1e-7 if isinstance(expected,(float,int)) else actual==expected


def main():
    spec=json.loads((OUT/'model_spec.json').read_text())
    data=json.loads((ROOT/'inputs.json').read_text())
    native=json.loads((OUT/'native-restored.json').read_text())
    cells=native['cells']; count=0; links=0
    assert list(cells)==list(spec['sheets'])
    for sheet,config in spec['sheets'].items():
        for addr,item in config['cells'].items():
            cell=cells[sheet].get(addr,{})
            assert 'errorValue' not in cell.get('effectiveValue',{}),sheet+'!'+addr
            if 'value' in item:
                assert same(value(cell),item['value']),(sheet,addr,value(cell),item['value'])
            if 'formula' in item:
                assert cell.get('userEnteredValue',{}).get('formulaValue'),sheet+'!'+addr
                assert same(value(cell),item['expected']),(sheet,addr,value(cell),item['expected'])
                count+=1
                if item['kind']=='link':
                    target=item['formula'].split('"')[1]
                    assert target.startswith('https://') and cell.get('hyperlink')==target,(sheet,addr)
                    links+=1
    for key,control in spec['controls'].items():
        sheet,addr=control['cell'].split('!'); cell=cells[sheet][addr]
        assert same(value(cell),control['baseline']),key
        assert cell.get('dataValidation'),key
    for row,(key,item) in enumerate(data['facts'].items(),18):
        assert same(value(cells['Guide_Sources']['B'+str(row)]),float(item['value'])),key
    scenarios=json.loads((OUT/'native-scenarios.json').read_text())['reports']
    assert len(scenarios)==len(spec['scenarios'])
    for report,case in zip(scenarios,spec['scenarios']):
        assert report['name']==case['name'] and report['overrides']==case['overrides']
        expected=json.loads(json.dumps(model.scenario(data,case['overrides']),default=model.default))
        assert set(r['cell'] for r in report['checks'])==set(expected)
        for check in report['checks']:
            assert same(check['actual'],expected[check['cell']]),(report['name'],check)
        assert not report['failures'] and not report['errors'] and report['pass']
        assert report['historicalAnchors']==76 and report['unchangedFacts']==70
    print(f'PASS: native Sheets {count} formulas, {links} HTTPS links, 11 restored controls, 70 facts, {len(scenarios)} scenarios')


if __name__=='__main__': main()
