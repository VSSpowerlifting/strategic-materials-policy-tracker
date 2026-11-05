"""Independent acceptance checks: openpyxl + headless LibreOffice, no producer imports.

Run from any directory with Python containing openpyxl. --input can point to the
preserved Phase 1A workbook or the corrected delivery. Only disposable copies are
recalculated; the input workbook is never written.
"""
import argparse
import hashlib
import json
import math
import shutil
import subprocess
import tempfile
from decimal import Decimal
from pathlib import Path

from openpyxl import load_workbook
from openpyxl.formula.tokenizer import Tokenizer
from openpyxl.utils.cell import range_boundaries

HERE = Path(__file__).resolve().parent
CASE = HERE.parent / 'hemerdon-phase1a'


def run(input_path, output_path, soffice, evidence_path):
    facts = json.loads(evidence_path.read_text())['facts']
    f = {r['id']: r for r in facts}
    v = lambda key: Decimal(f['hfi-' + key]['value'])
    formula_wb = load_workbook(input_path, data_only=False)
    cached = load_workbook(input_path, data_only=True)
    by_id = {formula_wb['Evidence'].cell(r, 3).value: r
             for r in range(8, formula_wb['Evidence'].max_row + 1)}
    errors, structure = [], []
    def check(label, condition, detail=None):
        if not condition:
            errors.append({'check': label, 'detail': detail})
    check('input IDs uniquely match evidence', len(by_id) == len(f) and set(by_id) == set(f))
    for key, fact in f.items():
        raw = formula_wb['Evidence'].cell(by_id[key], 5).value
        if fact['value'] is None:
            check('null input preserved: ' + key, raw is None)
        elif fact['unit'] not in {'text', 'date'}:
            check('numeric input agrees: ' + key, isinstance(raw, (int, float)) and Decimal(str(raw)) == Decimal(fact['value']))
        else:
            check('text input agrees: ' + key, raw == fact['value'])
    edges = {}
    for ws in formula_wb:
        for row in ws:
            for cell in row:
                if cell.data_type != 'f':
                    continue
                key = (ws.title, cell.coordinate)
                deps = []
                for token in Tokenizer(cell.value).items:
                    if token.type != 'OPERAND' or token.subtype != 'RANGE':
                        continue
                    target = token.value
                    if '[' in target:
                        errors.append({'check': 'external workbook dependency', 'detail': target})
                        continue
                    sheet, address = target.rsplit('!', 1) if '!' in target else (ws.title, target)
                    sheet = sheet.strip("'")
                    check('reference resolves', sheet in formula_wb.sheetnames, target)
                    if sheet not in formula_wb.sheetnames:
                        continue
                    check('checks are terminal', ws.title == 'Checks' or sheet != 'Checks', key)
                    left, top, right, bottom = range_boundaries(address)
                    for r in range(top, bottom + 1):
                        for c in range(left, right + 1):
                            deps.append((sheet, formula_wb[sheet].cell(r, c).coordinate))
                edges[key] = deps
    active, visited = set(), set()
    def visit(key):
        if key in active:
            errors.append({'check': 'formula cycle', 'detail': key})
            return
        if key in visited:
            return
        active.add(key)
        for dep in edges.get(key, []):
            visit(dep)
        active.remove(key)
        visited.add(key)
    for key in edges:
        visit(key)
    structure.append({'formulaCount': len(edges), 'sourceInputCount': len(f), 'checksTerminal': not any(e['check'] == 'checks are terminal' for e in errors)})

    coef = v('wo3-fy28') * 100 * v('payability') * (1 - v('royalty'))
    core = v('fleet-service') + v('nwf-service') + v('hargreaves')
    reference = (v('remaining-low') + v('remaining-high')) / 2
    claims = {
        'nwfCoreGrossGBP': str(v('nwf-equity') + v('nwf-loan')),
        'nwfEnvelopeGBP': str(v('nwf-equity') + v('nwf-loan') + v('nwf-accordion')),
        'remainingSpendGBP': [str(v('remaining-low')), str(v('remaining-high'))],
        'downsideIncrementGBP': str(v('remaining-high') - reference + v('delay-cost') + v('nwf-loan') * Decimal('0.01')),
        'augustCashNoReceiptsStatedTotalGBP': str(v('aug-total-sources') - v('aug-revenue') - (v('aug-total-uses') - v('aug-reserve'))),
        'augustCashNoReceiptsRoundedDetailGBP': '-1000000',
    }
    cases = []
    def add(name, edits, expected):
        cases.append((name, edits, expected))
    for name, cap, cost, stress, cash in [
        ('Base', reference, (v('opex-low')+v('opex-high'))/2, 0, 13000000),
        ('Upside', v('remaining-low'), v('opex-low'), 0, 13000000),
        ('Downside', v('remaining-high'), v('opex-high'), Decimal('5750000'), -2000000),
    ]:
        add(name.lower(), [('Assumptions', 'D4', name)], {
            'Funding!D10': Decimal('61000000'), 'Funding!D16': cap,
            'Funding!D23': stress, 'Operating!D20': cost+core,
            'Operating!D21': (cost+core)/coef, 'August plan!D35': cash,
            'Overview!D17': 'Unavailable', 'Historical!E11': Decimal('25485511'),
            **{f'Checks!D{r}': 0 for r in range(8,17)}, 'Checks!D21': -1000000,
        })
    add('changed_active_cost', [('Assumptions','E9',76000000)], {'Overview!D13':115000000})
    add('missing_selected_cost', [('Assumptions','E9',None)], {'Operating!D20':'Unavailable','Overview!D14':'Unavailable'})
    add('unselected_blank', [('Assumptions','G9',None)], {'Operating!D20':111500000})
    add('missing_volume', [('Assumptions','E10',None)], {'Operating!D21':'Unavailable','Checks!D20':'Invalid input'})
    add('zero_volume', [('Assumptions','E10',0)], {'Operating!D21':'Unavailable','Checks!D20':'Invalid input'})
    add('full_royalty', [('Assumptions','E12',1)], {'Operating!D21':'Unavailable'})
    add('zero_payability', [('Assumptions','E11',0)], {'Operating!D21':'Unavailable'})
    add('zero_price', [('Assumptions','E18',0)], {'Operating!D25':0,'Operating!D26':-111500000})
    add('positive_price', [('Assumptions','E18',500)], {'Operating!D25':127239750,'Operating!D26':15739750})
    add('negative_price', [('Assumptions','E18',-1)], {'Operating!D25':'Invalid price','Operating!D26':'Unavailable'})
    add('blank_price', [], {'Operating!D25':'Unavailable'})
    add('negative_capex', [('Assumptions','E8',-1)], {'Funding!D23':'Unavailable'})
    add('missing_capex', [('Assumptions','E8',None)], {'Funding!D23':'Unavailable'})
    add('missing_delay', [('Assumptions','E13',None)], {'Funding!D23':'Unavailable'})
    add('missing_rate', [('Assumptions','E14',None)], {'Funding!D23':'Unavailable'})
    add('accordion_hypothetical', [('Assumptions','D4','Downside'),('Assumptions','G15',10000000)], {'Funding!D23':0,'Funding!D10':61000000})
    add('accordion_over_ceiling', [('Assumptions','E15',10000001)], {'Funding!D23':'Unavailable'})
    add('original_revenue_delayed', [('Assumptions','E16',0)], {'August plan!D35':-2000000,'August plan!D36':15000000,'August plan!D37':2000000})
    add('original_loan_delayed', [('Assumptions','E17',0)], {'August plan!D35':-12000000,'Funding!D9':25000000})
    add('bad_receipt_fraction', [('Assumptions','E16',1.01)], {'August plan!D35':'Unavailable'})
    add('invalid_case', [('Assumptions','D4','Unknown')], {'Funding!D23':'Unavailable','Operating!D21':'Unavailable','Checks!D19':'Invalid input','Checks!D20':'Invalid input'})
    for key, expected in [
        ('nwf-equity', {'Funding!D10':'Unavailable','Overview!D8':'Unavailable'}),
        ('nwf-loan', {'Funding!D10':'Unavailable','Funding!D23':'Unavailable'}),
        ('nwf-accordion', {'Funding!D12':'Unavailable','Funding!D23':'Unavailable'}),
        ('remaining-low', {'Funding!D16':'Unavailable','Funding!D17':'Unavailable'}),
        ('opex-high', {'Operating!D20':'Unavailable'}),
        ('aug-cash-open', {'August plan!D14':'Unavailable','August plan!D35':'Unavailable'}),
        ('aug-revenue', {'August plan!D35':'Unavailable'}),
        ('cash-2026', {'Overview!D16':'Unavailable'}),
    ]:
        add('missing_source_'+key, [('Evidence',f'E{by_id["hfi-"+key]}',None)], expected)
    results = []
    with tempfile.TemporaryDirectory(prefix='smpt-hemerdon-1b-') as temp:
        tmp = Path(temp)
        (tmp/'in').mkdir(); (tmp/'out').mkdir()
        inputs = []
        for name, edits, _ in cases:
            trial = load_workbook(input_path)
            trial['Assumptions']['D4'] = 'Base'
            for sn, address, value in edits:
                trial[sn][address] = value
            file = tmp/'in'/(name+'.xlsx'); trial.save(file); inputs.append(str(file))
        completed = subprocess.run([soffice, '-env:UserInstallation='+ (tmp/'profile').as_uri(), '--headless', '--convert-to', 'xlsx', '--outdir', str(tmp/'out'), *inputs], capture_output=True, text=True, timeout=180)
        check('LibreOffice conversion exit', completed.returncode == 0, completed.stderr[-1000:])
        baseline_differences = []
        for name, _, expected in cases:
            file = tmp/'out'/(name+'.xlsx')
            check('recalculated case exists: '+name, file.exists())
            if not file.exists(): continue
            calc = load_workbook(file, data_only=True)
            observed, failures = {}, []
            for target, value in expected.items():
                sn, address = target.split('!'); actual = calc[sn][address].value
                observed[target] = actual
                same = isinstance(actual,(int,float)) and math.isfinite(actual) and abs(float(actual)-float(value)) < 0.000001 if isinstance(value,(int,float,Decimal)) else actual == value
                if not same:
                    failure = {'case':name,'target':target,'expected':str(value),'observed':actual}
                    failures.append(failure); errors.append({'check':'scenario result','detail':failure})
            if name == 'base':
                for sn,address in edges:
                    a,b = cached[sn][address].value,calc[sn][address].value
                    same = abs(a-b)<0.000001 if isinstance(a,(int,float)) and isinstance(b,(int,float)) else a==b
                    if not same: baseline_differences.append({'cell':sn+'!'+address,'cached':a,'recalculated':b})
                check('cached results agree with independent engine',not baseline_differences,baseline_differences)
            results.append({'case':name,'passed':not failures,'observed':observed})
    out = {
        'researchCutoff':'2026-11-04','inputWorkbook':str(input_path.resolve()),
        'inputSHA256':hashlib.sha256(input_path.read_bytes()).hexdigest(),
        'evidenceSHA256':hashlib.sha256(evidence_path.read_bytes()).hexdigest(),
        'validatorSHA256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'engine':subprocess.check_output([soffice,'--version'],text=True).strip(),
        'nativeExcelVerified':False, 'structure':structure, 'independentClaims':claims,
        'cachedFormulaDifferences':baseline_differences,'caseCount':len(cases),
        'caseResults':results,'failureCount':len(errors),'failures':errors,
    }
    output_path.parent.mkdir(parents=True,exist_ok=True)
    output_path.write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({'cases':len(cases),'failures':len(errors),'formulaCount':len(edges),'cachedDifferences':len(baseline_differences),'output':str(output_path),'details':errors[:20]},indent=2))
    return bool(errors)


if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--input',type=Path,default=CASE/'hemerdon-financial-model.xlsx')
    parser.add_argument('--output',type=Path,default=HERE/'validation-results.json')
    parser.add_argument('--evidence',type=Path,default=CASE/'evidence.json')
    parser.add_argument('--soffice',default=shutil.which('soffice'))
    args=parser.parse_args()
    if not args.soffice: parser.error('LibreOffice soffice executable required')
    raise SystemExit(run(args.input,args.output,args.soffice,args.evidence))
