#!/usr/bin/env python3
"""Bounded accessibility remediation of the Studio v1 design-candidate LibreOffice PDF export.

Writes a separate accessible PDF and a receipt; never touches the source export.
This is a reproducible structure repair, not PDF/UA or WCAG certification.

What it changes (structure tree and marked-content wrappers only):
  * tags one H1 per slide (the slide title) and four real subheadings as H2;
  * puts each slide's title block first in its reading order, H1 leading;
  * gives the three charts Alt text generated from the deck spec, and six
    diagrams one representative Figure each with a description generated from it;
  * re-marks every other text-free unnamed vector as /Artifact (BMC) and drops
    its Figure element and ParentTree slot.

What it must not change: drawn pixels, extracted text, link targets and
rectangles, table structure, document metadata. Every one is asserted.
"""
import argparse
from decimal import ROUND_HALF_UP, Decimal
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import unicodedata

import fitz
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (ArrayObject, ContentStream, DecodedStreamObject, DictionaryObject,
                           NameObject, NullObject, NumberObject, TextStringObject)

HERE = Path(__file__).resolve().parent
SPEC = HERE / 'spec.json'
OUT_DIR = HERE.parents[1] / 'outputs' / 'presentation-studio-v1'
SOURCE = OUT_DIR / 'fi003-mp-materials-10x-financing-studio-v1.pdf'
MANIFEST = OUT_DIR / 'fi003-mp-materials-10x-financing-studio-v1.manifest.json'
OUTPUT = OUT_DIR / 'fi003-mp-materials-10x-financing-studio-v1-accessible.pdf'
RECEIPT = OUT_DIR / 'fi003-mp-materials-10x-financing-studio-v1-accessible.receipt.json'

PAGES = 18
# The unremediated LibreOffice export of the Studio v1 candidate (see the receipt for the pinned hash).
SOURCE_SHA256 = '33e6238d2c239926f93c9c42ae04fe2ed04a333c2954026e5913ace7f6fdfa99'
MINUS = '−'
# (1-based page, MCID) of the chart Figures whose existing Alt is replaced from the spec.
CHARTS = {(6, 0), (7, 5), (8, 0)}  # spec slide = page - 2
# (1-based page, MCID) of one vector kept per diagram to carry the diagram description.
# Timeline axis (4), current-state box of the state diagram (9), milestone axis (11), counterparty hub (12),
# root question of each condition tree (15, 17).
REPRESENTATIVE = {(4, 8), (9, 5), (11, 19), (12, 16), (15, 24), (17, 32)}
# Pinned per-page counts of unnamed text-free vectors re-marked as artifacts.
# Reviewed per page against the rendered slides (rules, markers, connectors, legend swatches,
# bar segments of the three charts, diagram shapes and ledger rules; 1.0 ledgers and criterion cells are native text); any change fails the run.
# Page 1 (cover): the seven text-free vectors of the ledger and its rules (checked against the rendered cover).
# Every ledger amount and status is also set as text beside its bar, so the bars are decorative.
EXPECTED_ARTIFACTS = {1: 7, 2: 5, 3: 4, 4: 20, 5: 5, 6: 9, 7: 6, 8: 7, 9: 14, 10: 5, 11: 24, 12: 12, 13: 4, 14: 4, 15: 28, 16: 4, 17: 36, 18: 4}



def normalized(text):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKC', text).lower())


def children(node):
    value = node.get('/K', [])
    return list(value) if isinstance(value, list) else [value]


def walk(node):
    if isinstance(node, list):
        for item in node:
            yield from walk(item)
    elif hasattr(node, 'get_object'):
        item = node.get_object()
        if isinstance(item, DictionaryObject):
            if '/S' in item:
                yield item
            yield from walk(children(item))


def page_text_map(page):
    stack = []
    result = {}

    def before(op, args, cm, tm):
        if op == b'BDC':
            stack.append(args[1].get('/MCID') if isinstance(args[1], dict) else None)
        elif op == b'BMC':
            stack.append(None)
        elif op == b'EMC':
            assert stack, 'Unbalanced marked content'
            stack.pop()

    def text(value, cm, tm, font, size):
        if value.strip() and stack and stack[-1] is not None:
            result.setdefault(int(stack[-1]), []).append(value)

    page.extract_text(visitor_operand_before=before, visitor_text=text)
    assert not stack
    return {k: normalized(' '.join(v)) for k, v in result.items()}


def number_tree(node):
    result = {}
    if '/Nums' in node:
        nums = node['/Nums']
        result.update({int(nums[i]): nums[i + 1].get_object() for i in range(0, len(nums), 2)})
    for kid in node.get('/Kids', []):
        result.update(number_tree(kid.get_object()))
    return result


def mcids(node):
    return [int(k) for k in children(node) if isinstance(k, NumberObject)]


def first_page(node, page_index):
    for n in walk([node]):
        if '/Pg' in n:
            return page_index[n.raw_get('/Pg').idnum]
    return None


def snapshot(reader):
    nodes = list(walk(reader.trailer['/Root']['/StructTreeRoot']['/K']))
    return {'roles': Counter(str(n['/S']) for n in nodes),
            'figures': [str(n.get('/Alt', '')) for n in nodes if n['/S'] == '/Figure']}


# ---------------------------------------------------------------- Alt text

def fmt(value, dp, signed=False):
    # Round the exact binary value half up, as the deck builder's toFixed and
    # toLocaleString do, so the Alt matches the drawn label (420.25 -> 420.3).
    text = f'{Decimal(abs(value)).quantize(Decimal(1).scaleb(-dp), ROUND_HALF_UP):,}'
    if not signed:
        return (MINUS if value < 0 else '') + text
    return (MINUS if value < 0 else '+') + text


def day(iso):
    y, m, d = (int(x) for x in iso.split('-'))
    return f'{d} {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][m - 1]} {y}'


def chart_alt(slide):
    data = slide['exhibit']['data']
    pattern = slide['pattern']
    unit = data.get('unit')
    if pattern == 'waterfall':
        dp = data['dp']
        steps = '; '.join(f"{s['label']} {fmt(s['delta'], dp, signed=True)}" for s in data['steps'])
        alt = (f"Waterfall bridge, {unit}: {data['start']['label']} {fmt(data['start']['value'], dp)}; "
               f"{steps}; {data['end']['label']} {fmt(data['end']['value'], dp)}.")
        return alt
    if pattern == 'stacked-bar':
        dp = data['dp']
        comps = data['components']
        rows = '; '.join(f"{r['label']}: " + ', '.join(f'{c} {fmt(v, dp)}' for c, v in zip(comps, r['values']))
                         + f" (total {fmt(sum(r['values']), dp)})" for r in data['rows'])
        return f"Stacked bar chart, {unit}, {' and '.join(comps)} at {len(data['rows'])} reported dates. {rows}."
    raise AssertionError(('No chart Alt rule', pattern))


def diagram_alt(slide):
    data = slide['exhibit']['data']
    pattern = slide['pattern']
    if pattern == 'two-lane-timeline':
        lanes = '. '.join(f"{lane['name']} lane: " + '; '.join(f"{e['label']}, {e['kind']}, {day(e['date'])}" for e in lane['events'])
                          for lane in data['lanes'])
        dates = sorted(e['date'] for lane in data['lanes'] for e in lane['events'])
        return (f"Two-lane timeline on a day-count scale, {day(dates[0])} to {day(dates[-1])}, "
                f"each event marked by its status. {lanes}.")
    if pattern == 'condition-tree':
        nodes = {n['id']: n for n in data['nodes']}

        def nested(node_id):
            # Bracket each nested question so its branches read as one unit.
            n = nodes[node_id]
            if n['kind'] == 'outcome':
                return n['label']
            parts = [f"if {b['label']}, {nested(b['to'])}" for b in n['branches']]
            return f"({n['label'].rstrip('?')}: " + '; '.join(parts) + ')'

        root = nodes[data['nodes'][0]['id']]
        parts = [f"if {b['label']}, {nested(b['to'])}" for b in root['branches']]
        # The framing comes from the slide's own subtitle: the clause-arithmetic tree and the
        # reversal-trigger tree say different things about what the branches are.
        alt = (f"Decision tree. {slide['exhibit']['subtitle'].rstrip('.')}. "
               + f"{root['label']} " + '; '.join(parts) + '.')
        if data.get('highlightOutcomeId'):
            alt += f" Highlighted outcome: {nodes[data['highlightOutcomeId']]['label']}."
        return alt
    if pattern == 'evidence-milestone-strip':
        years = sorted({m['date'][:4] for m in data['milestones']})
        marks = '; '.join(f"{m['label']}, {m['state']}, {day(m['date'])}" for m in data['milestones'])
        return (f"Milestone timeline on a day-count scale, {years[0]} to {years[-1]}; reported dates come from filings "
                f"contractual dates from the credit agreement, and conditional dates apply only if a stated term is met. {marks}.")
    if pattern == 'counterparty-map':
        spokes = '; '.join(f"{p['label']}: {p['role']}" for p in data['parties'])
        return (f"Hub-and-spoke diagram with {data['hub']} at the centre and {len(data['parties'])} spokes "
                f"of equal length that carry no magnitude. {spokes}.")
    if pattern == 'state-diagram':
        states = {s['id']: s for s in data['states']}
        named = '; '.join(f"{s['label']}" + (f" ({s['note']})" if s.get('note') else '') for s in data['states'])
        moves = '; '.join(f"{states[t['from']]['label']} to {states[t['to']]['label']} on {t['label']}" for t in data['transitions'])
        return (f"State diagram. {slide['exhibit']['subtitle'].rstrip('.')}. States: {named}. "
                f"Current state as of {day(data['asOf'])}: {states[data['currentId']]['label']}. Transitions: {moves}.")
    raise AssertionError(('No diagram Alt rule', pattern))


# ---------------------------------------------------------------- repair

def repair(source, output, receipt_path, spec_path, manifest_path):
    assert source.resolve() != output.resolve(), 'Preserve the source export'
    spec = json.loads(spec_path.read_text())
    manifest = json.loads(manifest_path.read_text())
    slides = spec['slides']
    assert len(slides) == PAGES - 1
    source_sha = hashlib.sha256(source.read_bytes()).hexdigest()
    assert source_sha == SOURCE_SHA256, 'Source export is not the reviewed Studio v1 export'

    reader = PdfReader(source)
    before = snapshot(reader)
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    root = writer.root_object['/StructTreeRoot']
    page_index = {p.indirect_reference.idnum: i for i, p in enumerate(writer.pages)}
    texts = [page_text_map(p) for p in writer.pages]
    parent_tree = number_tree(root['/ParentTree'])
    nodes = list(walk(root['/K']))

    def page_of(n):
        return page_index[n.raw_get('/Pg').idnum] if '/Pg' in n else None

    # 1. Headings.
    h1 = {0: normalized(spec['publication_cover']['title'])}
    for i, s in enumerate(slides, start=1):
        h1[i] = normalized(s['exhibit']['title'])
    share = [i for i, s in enumerate(slides, start=1) if s['pattern'] == 'waterfall' and s['exhibit']['data'].get('share')]
    assert share == [5], share
    h2 = {5: [normalized(slides[4]['exhibit']['data']['share']['title'])]}
    for i, s in enumerate(slides, start=1):
        if s['pattern'] == 'exhibit-with-interpretation':
            h2.setdefault(i, []).append(normalized(s['exhibit']['data']['notesHeading']))
    headings = []
    for n in nodes:
        pg = page_of(n)
        ids = mcids(n)
        if n['/S'] != '/P' or pg is None or len(ids) != 1:
            continue
        txt = texts[pg].get(ids[0], '')
        role = '/H1' if txt == h1[pg] else '/H2' if txt in h2.get(pg, []) else None
        if role:
            n[NameObject('/S')] = NameObject(role)
            headings.append({'page': pg + 1, 'mcid': ids[0], 'role': role})
    assert sum(h['role'] == '/H1' for h in headings) == PAGES, headings
    assert sorted(h['page'] for h in headings if h['role'] == '/H1') == list(range(1, PAGES + 1))
    assert sorted((h['page'], h['role']) for h in headings if h['role'] == '/H2') == [
        (2, '/H2'), (5, '/H2'), (6, '/H2'), (10, '/H2')], headings

    # 2. Figures: replace chart Alts, describe representative diagram vectors, artifact the rest.
    alt_changes = []
    figure_ids = {}
    for n in nodes:
        if n['/S'] == '/Figure' and page_of(n) is not None:
            figure_ids.setdefault(page_of(n), []).extend(mcids(n)[:1])
    selected = {}
    removed_ids = set()
    representative_nodes = {}
    for n in nodes:
        if n['/S'] != '/Figure':
            continue
        pg = page_of(n)
        ids = mcids(n)
        assert len(ids) == 1, 'Figure without exactly one own MCID needs manual classification'
        key = (pg + 1, ids[0])
        # Chart Figures keep their exported value-label P kids; anything else must be a bare vector.
        assert key in CHARTS or len(children(n)) == 1, ('Complex figure needs manual classification', key)
        if key in CHARTS:
            slide = slides[pg - 1]
            new = chart_alt(slide)
            # Every number the chart draws (the marked content between this Figure and
            # the page's next Figure) must appear among the Alt's numbers, compared as
            # normalized digit strings, as page texts are.
            later = [f for f in figure_ids[pg] if f > ids[0]]
            stop = min(later) if later else max(texts[pg]) + 1
            # The running page number is exported inside this range in the Studio layout; it is not chart data.
            drawn = [texts[pg][m] for m in range(ids[0], stop) if texts[pg].get(m, '').isdigit() and texts[pg][m] != str(pg + 1)]
            said = {normalized(x) for x in re.findall(r'\d[\d,]*(?:\.\d+)?', new)}
            assert drawn and set(drawn) <= said, ('Chart Alt disagrees with drawn labels', pg + 1, drawn)
            alt_changes.append({'page': pg + 1, 'mcid': ids[0], 'kind': 'chart', 'before': str(n.get('/Alt', '')),
                                'after': new, 'derived_from': f'spec.json slides[{pg - 1}].exhibit.data'})
            n[NameObject('/Alt')] = TextStringObject(new)
        elif key in REPRESENTATIVE:
            assert not n.get('/Alt')
            slide = slides[pg - 1]
            new = diagram_alt(slide)
            alt_changes.append({'page': pg + 1, 'mcid': ids[0], 'kind': 'diagram', 'before': '',
                                'after': new, 'derived_from': f'spec.json slides[{pg - 1}].exhibit.data'})
            n[NameObject('/Alt')] = TextStringObject(new)
            representative_nodes[pg] = n
        elif n.get('/Alt'):
            continue  # an existing meaningful description (the composition doughnut) stays as exported
        else:
            selected.setdefault(pg, set()).add(ids[0])
            removed_ids.add(n.indirect_reference.idnum)
            parent_tree[int(writer.pages[pg]['/StructParents'])][ids[0]] = NullObject()
    assert len([a for a in alt_changes if a['kind'] == 'chart']) == len(CHARTS)
    assert len(representative_nodes) == len(REPRESENTATIVE)

    # Verify each selected wrapper holds only vector drawing, then rewrite only that wrapper.
    artifacts = []
    for pg in sorted(selected):
        ids = selected[pg]
        page = writer.pages[pg]
        stack = []
        seen = set()
        for args, op in ContentStream(page.get_contents(), writer).operations:
            if op == b'BDC':
                mcid = args[1].get('/MCID') if isinstance(args[1], dict) else None
                stack.append(mcid)
                if mcid in ids:
                    assert args[0] == '/Figure'
                    seen.add(int(mcid))
            elif op == b'BMC':
                stack.append(None)
            elif op == b'EMC':
                stack.pop()
            elif any(v in ids for v in stack if v is not None):
                assert op not in (b'Tj', b'TJ', b"'", b'"', b'Do', b'BI', b'INLINE IMAGE', b'sh'), ('Meaningful content', pg, op)
        assert seen == ids
        # Keep the original byte spelling of every number: re-serializing parsed
        # floats can shift antialiasing by one channel level.
        raw = page.get_contents().get_data()
        for mcid in sorted(ids):
            raw, count = re.subn(rb'/Figure\s*<<\s*/MCID\s+' + str(mcid).encode() + rb'\s*>>\s*BDC', b'/Artifact BMC', raw)
            assert count == 1, ('Unexpected content wrapper', pg, mcid)
            artifacts.append({'page': pg + 1, 'mcid': mcid})
        stream = DecodedStreamObject()
        stream.set_data(raw)
        page.replace_contents(stream)
    per_page = Counter(a['page'] for a in artifacts)
    assert dict(sorted(per_page.items())) == EXPECTED_ARTIFACTS, dict(sorted(per_page.items()))

    # 3. Drop removed Figures and emptied Divs.
    def prune(node):
        kept = []
        for child in children(node):
            obj = child.get_object() if hasattr(child, 'get_object') else child
            if isinstance(obj, DictionaryObject) and '/S' in obj:
                if obj.indirect_reference.idnum in removed_ids:
                    continue
                prune(obj)
                if obj['/S'] == '/Div' and not children(obj):
                    continue
            kept.append(child)
        node[NameObject('/K')] = ArrayObject(kept)
    prune(root)

    # 4. Reading order: on each slide the title block comes first (H1, then the
    #    subtitle, then the running labels), then the diagram description, then
    #    the exhibit, source line and interpretation in export order.
    top = children(root)
    pages_of_top = [first_page(t.get_object(), page_index) for t in top]
    assert pages_of_top == sorted(pages_of_top), 'Top-level structure is not page-ordered'
    reordered = []
    order_report = []
    for pg in range(PAGES):
        items = [t for t, p in zip(top, pages_of_top) if p == pg]
        frame = [t for t in items if any(n['/S'] == '/H1' for n in walk([t]))]
        assert len(frame) == 1, ('One title block per slide', pg)
        frame = frame[0]
        if pg > 0:
            # The exporter wraps each text box in its own Div, so the title
            # block is a set of single-paragraph Divs: H1, subtitle and three
            # running labels (section label, draft banner, page number).
            slide = slides[pg - 1]
            subtitle = normalized(slide['exhibit']['subtitle'])
            running = {normalized(slide['label']), 'draftreviewgatespending', str(pg + 1)}

            def single_text(t):
                o = t.get_object()
                kids = children(o)
                if o['/S'] != '/Div' or len(kids) != 1 or isinstance(kids[0], NumberObject):
                    return None
                ids = mcids(kids[0].get_object())
                return texts[pg].get(ids[0]) if len(ids) == 1 else None
            sub = [t for t in items if single_text(t) == subtitle]
            labels = [t for t in items if single_text(t) in running]
            assert len(sub) == 1, ('Subtitle not found', pg)
            assert len(labels) == 3, ('Running labels not found', pg, len(labels))
            head = [frame, sub[0]] + labels
            rest = [t for t in items if all(t is not h for h in head)]
            rep = representative_nodes.get(pg)
            if rep is not None:
                rest = [t for t in rest if t.get_object() is not rep]
                rest.insert(0, rep.indirect_reference)
            items = head + rest
        reordered.extend(items)
        first = next(n for n in walk(items) if n['/S'] in ('/H1', '/H2'))
        assert first['/S'] == '/H1', ('Slide does not open with its H1', pg)
        order_report.append({'page': pg + 1, 'top_level': [str(t.get_object()['/S']) for t in items]})
    assert len(reordered) == len(top) and {id(t.get_object()) for t in reordered} == {id(t.get_object()) for t in top}
    root[NameObject('/K')] = ArrayObject(reordered)

    output.parent.mkdir(parents=True, exist_ok=True)
    tmp = output.with_suffix('.tmp.pdf')
    with tmp.open('wb') as f:
        writer.write(f)
    tmp.replace(output)

    # ------------------------------------------------------------ verification
    result = PdfReader(output)
    after = snapshot(result)
    checks = []
    assert all(after['figures']), 'Every remaining Figure has Alt text'
    assert after['roles']['/Figure'] == len(CHARTS) + len(REPRESENTATIVE) + 1
    for role in ['/Table', '/TR', '/TH', '/TD', '/Link']:
        assert before['roles'][role] == after['roles'][role], (role, 'structure changed')
    assert after['roles']['/H1'] == PAGES and after['roles']['/H2'] == 4
    checks.append('18 H1 slide titles and 4 H2 subheadings; each slide opens with its H1')
    checks.append('Every remaining Figure has Alt text; tables, rows, header and data cells and links preserved')

    final_tree = number_tree(result.trailer['/Root']['/StructTreeRoot']['/ParentTree'])
    final_nodes = list(walk(result.trailer['/Root']['/StructTreeRoot']['/K']))
    live = {n.indirect_reference.idnum for n in final_nodes}
    for i, page in enumerate(result.pages):
        entries = final_tree[int(page['/StructParents'])]
        bdc = []
        for args, op in ContentStream(page.get_contents(), result).operations:
            if op == b'BDC' and isinstance(args[1], dict) and '/MCID' in args[1]:
                m = int(args[1]['/MCID'])
                bdc.append(m)
                target = entries[m].get_object()
                assert isinstance(target, DictionaryObject) and target.indirect_reference.idnum in live, (i, m)
                assert m in mcids(target), (i, m, 'ParentTree points at an element that does not own the MCID')
        for m, slot in enumerate(entries):
            if not isinstance(slot.get_object(), NullObject):
                assert m in bdc, (i, m, 'ParentTree slot without marked content')
        for annot in page.get('/Annots', []):
            a = annot.get_object()
            if a.get('/Subtype') == '/Link':
                owner = final_tree[int(a['/StructParent'])].get_object()
                assert owner['/S'] == '/Link' and owner.indirect_reference.idnum in live
    checks.append('Every MCID resolves through the ParentTree to the live element that owns it; every link annotation resolves to its Link element')

    # Links equal the manifest's per-slide evidence references.
    urls = {e['id']: e['url'] for e in manifest['evidence']}
    expected_links = [[urls[r] for r in spec['publication_cover']['evidence_refs']]] + [[urls[r] for r in s['exhibit']['evidence_refs']] for s in slides]
    original = fitz.open(source)
    final = fitz.open(output)
    assert len(original) == len(final) == PAGES
    for i, (a, b) in enumerate(zip(original, final)):
        assert a.get_text() == b.get_text(), ('Text changed', i)
        assert a.get_pixmap().samples == b.get_pixmap().samples, ('Pixels changed', i)
        la = [(x.get('uri'), tuple(x['from'])) for x in a.get_links()]
        lb = [(x.get('uri'), tuple(x['from'])) for x in b.get_links()]
        assert la == lb, ('Links changed', i)
        assert [u for u, _ in lb] == expected_links[i], ('Links differ from manifest', i)
    checks.append('All pages pixel- and text-identical to the export; link URIs and rectangles unchanged and equal to the manifest evidence references')

    src_root, out_root = reader.trailer['/Root'], result.trailer['/Root']
    assert str(out_root['/Lang']) == 'en-US' and out_root['/MarkInfo']['/Marked'] == True  # noqa: E712 (BooleanObject)
    assert out_root['/ViewerPreferences']['/DisplayDocTitle'] == True  # noqa: E712
    assert dict(result.metadata) == dict(reader.metadata)
    assert out_root['/Metadata'].get_object().get_data() == src_root['/Metadata'].get_object().get_data()
    assert all(p.get('/Tabs') == '/S' for p in result.pages)
    assert result.trailer['/ID'] == reader.trailer['/ID']
    checks.append('Language, Marked, DisplayDocTitle, Info, XMP, structure tab order and file ID unchanged')

    receipt = {
        'status': 'PASS',
        'scope': 'Bounded structure remediation of the Studio v1 export; not PDF/UA or WCAG certification',
        'source_export': source.name,
        'source_export_sha256': source_sha,
        'accessible_pdf': output.name,
        'accessible_pdf_sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
        'spec_sha256': hashlib.sha256(spec_path.read_bytes()).hexdigest(),
        'tooling': {'pypdf': __import__('pypdf').__version__, 'pymupdf': fitz.VersionBind},
        'roles_before': dict(sorted(before['roles'].items())),
        'roles_after': dict(sorted(after['roles'].items())),
        'figures_before': {'total': len(before['figures']), 'without_alt': sum(not a for a in before['figures'])},
        'figures_after': {'total': len(after['figures']), 'without_alt': sum(not a for a in after['figures'])},
        'headings': headings,
        'alt_text': alt_changes,
        'decorative_vectors_artifacted': len(artifacts),
        'artifacts_per_page': {str(k): v for k, v in sorted(per_page.items())},
        'artifacts': artifacts,
        'reading_order': order_report,
        'links': {'count': sum(len(x) for x in expected_links), 'per_page': [len(x) for x in expected_links]},
        'pixel_identical_pages': PAGES,
        'text_identical_pages': PAGES,
        'checks': checks,
        'manual_review_required': [
            'Screen-reader pass (NVDA/JAWS/VoiceOver) of reading order, table navigation and Alt text',
            'Link annotations have no /Contents; the visible evidence ID is the link text',
            'Native Microsoft PowerPoint acceptance of the source deck',
            'Full PDF/UA (ISO 14289) or WCAG audit; no certification is claimed',
        ],
    }
    receipt_path.write_text(json.dumps(receipt, indent=2, ensure_ascii=False) + '\n')
    return receipt



if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--source', type=Path, default=SOURCE)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    parser.add_argument('--report', type=Path, default=RECEIPT)
    args = parser.parse_args()
    r = repair(args.source, args.output, args.report, SPEC, MANIFEST)
    print(json.dumps({k: v for k, v in r.items() if k not in ('artifacts', 'headings', 'reading_order', 'alt_text')}, indent=2, ensure_ascii=False))
