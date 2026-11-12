"""Regression checks for the draft 1.0 candidate accessible PDF against its receipt, manifest and source register.

These checks read the committed files only. They cover structure, not accessibility
conformance: no PDF/UA, WCAG or screen-reader result is implied.
"""
import hashlib
import json
import unittest
from collections import Counter
from pathlib import Path

try:
    from pypdf import PdfReader
    from pypdf.generic import ContentStream, DictionaryObject, NumberObject
except ImportError:  # pragma: no cover - environment without pypdf
    PdfReader = None

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'outputs' / 'presentation-draft-v100'
SOURCE = OUT / 'fi003-mp-materials-10x-financing-draft-1.0.pdf'
ACCESSIBLE = OUT / 'fi003-mp-materials-10x-financing-draft-1.0-accessible.pdf'
RECEIPT = OUT / 'fi003-mp-materials-10x-financing-draft-1.0-accessible.receipt.json'
MANIFEST = OUT / 'fi003-mp-materials-10x-financing-draft-1.0.manifest.json'
SPEC = ROOT / 'presentation' / 'v100' / 'spec.json'
SOURCE_SHA256 = '24bb1a95cd732b1a4ef615d92d2ea5896dc24f02f7b9f351429566581e94a238'
PAGES = 18


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def kids(node):
    k = node.get('/K', [])
    return k if isinstance(k, list) else [k]


@unittest.skipIf(PdfReader is None, 'pypdf is not installed')
class AccessiblePdfV100Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.receipt = json.loads(RECEIPT.read_text())
        cls.manifest = json.loads(MANIFEST.read_text())
        cls.register = {s['id']: s['url'] for s in json.loads((ROOT / 'sources.json').read_text())}
        cls.pdf = PdfReader(ACCESSIBLE)
        cls.page_index = {p.indirect_reference.idnum: i for i, p in enumerate(cls.pdf.pages)}
        cls.nodes = []

        def walk(node):
            node = node.get_object()
            if not isinstance(node, DictionaryObject) or '/S' not in node:
                return
            cls.nodes.append(node)
            for k in kids(node):
                if not isinstance(k, NumberObject):
                    walk(k)
        for top in kids(cls.pdf.trailer['/Root']['/StructTreeRoot']):
            walk(top)

    def page_of(self, node):
        return self.page_index.get(node.raw_get('/Pg').idnum) if '/Pg' in node else None

    def test_files_match_receipt_and_original_is_untouched(self):
        self.assertEqual(sha256(SOURCE), SOURCE_SHA256)
        self.assertEqual(self.receipt['source_export_sha256'], SOURCE_SHA256)
        self.assertEqual(self.receipt['accessible_pdf_sha256'], sha256(ACCESSIBLE))
        self.assertEqual(self.receipt['status'], 'PASS')
        self.assertNotEqual(sha256(SOURCE), sha256(ACCESSIBLE))

    def test_document_metadata(self):
        root = self.pdf.trailer['/Root']
        self.assertTrue(root['/MarkInfo']['/Marked'])
        self.assertEqual(str(root['/Lang']), 'en-US')
        self.assertTrue(root['/ViewerPreferences']['/DisplayDocTitle'])
        self.assertEqual(len(self.pdf.pages), PAGES)

    def test_roles_match_receipt(self):
        roles = Counter(str(n['/S']) for n in self.nodes)
        self.assertEqual(dict(roles), self.receipt['roles_after'])
        self.assertEqual(roles['/Table'], 8)
        self.assertEqual(roles['/TH'], 30)
        self.assertEqual(roles['/TD'], 150)
        self.assertEqual(roles['/Link'], 64)

    def test_every_figure_has_alt_text(self):
        figures = [n for n in self.nodes if n['/S'] == '/Figure']
        self.assertEqual(len(figures), 10)
        for f in figures:
            self.assertTrue(str(f.get('/Alt', '')).strip(), self.page_of(f))

    def test_each_slide_opens_with_one_h1(self):
        by_page = {}
        for n in self.nodes:
            if n['/S'] in ('/H1', '/H2'):
                by_page.setdefault(self.page_of(n), []).append(str(n['/S']))
        self.assertEqual(sorted(by_page), list(range(PAGES)))
        for page, roles in by_page.items():
            self.assertEqual(roles.count('/H1'), 1, page + 1)

    def test_content_mcids_match_structure_tree(self):
        tree = {}
        for n in self.nodes:
            page = self.page_of(n)
            for k in kids(n):
                if isinstance(k, NumberObject):
                    tree.setdefault(page, []).append(int(k))
        parent_tree = self.pdf.trailer['/Root']['/StructTreeRoot']['/ParentTree']['/Nums']
        parents = {int(parent_tree[i]): parent_tree[i + 1].get_object() for i in range(0, len(parent_tree), 2)}
        artifacts = Counter()
        # The export already marks one artifact per page; count only those the remediation added.
        for i, page in enumerate(PdfReader(SOURCE).pages):
            for args, op in ContentStream(page.get_contents(), page.pdf).operations:
                if op in (b'BMC', b'BDC') and args[0] == '/Artifact':
                    artifacts[i + 1] -= 1
        for i, page in enumerate(self.pdf.pages):
            marked = []
            for args, op in ContentStream(page.get_contents(), self.pdf).operations:
                if op == b'BDC' and isinstance(args[1], DictionaryObject) and '/MCID' in args[1]:
                    marked.append(int(args[1]['/MCID']))
                elif op in (b'BMC', b'BDC') and args[0] == '/Artifact':
                    artifacts[i + 1] += 1
            self.assertEqual(sorted(marked), sorted(tree.get(i, [])), i + 1)
            slots = parents[int(page['/StructParents'])]
            for m in marked:
                owner = slots[m].get_object()
                self.assertIn(m, [int(k) for k in kids(owner) if isinstance(k, NumberObject)])
        expected = {int(k): v for k, v in self.receipt['artifacts_per_page'].items()}
        self.assertEqual({k: v for k, v in artifacts.items() if v}, expected)
        self.assertEqual(sum(expected.values()), self.receipt['decorative_vectors_artifacted'])

    def test_links_equal_evidence_refs_and_source_register(self):
        evidence = {e['id']: e['url'] for e in self.manifest['evidence']}
        for ref, url in evidence.items():
            self.assertEqual(self.register[ref], url, ref)
        spec = json.loads(SPEC.read_text())
        slides = spec['slides']
        # Draft 1.0's cover cites its five sources as live links.
        expected = [[evidence[r] for r in spec['cover']['evidence_refs']]] + [[evidence[r] for r in s['exhibit']['evidence_refs']] for s in slides]
        parent_tree = self.pdf.trailer['/Root']['/StructTreeRoot']['/ParentTree']['/Nums']
        parents = {int(parent_tree[i]): parent_tree[i + 1].get_object() for i in range(0, len(parent_tree), 2)}
        total = 0
        for i, page in enumerate(self.pdf.pages):
            annots = [a.get_object() for a in page.get('/Annots', [])]
            links = [a for a in annots if a['/Subtype'] == '/Link']
            self.assertEqual([str(a['/A']['/URI']) for a in links], expected[i], i + 1)
            for a in links:
                self.assertEqual(parents[int(a['/StructParent'])]['/S'], '/Link')
            total += len(links)
        self.assertEqual(total, 64)

    def test_text_identical_to_export(self):
        original = PdfReader(SOURCE)
        for a, b in zip(original.pages, self.pdf.pages):
            self.assertEqual(a.extract_text(), b.extract_text())

    def test_chart_alt_text_uses_drawn_labels(self):
        alts = {(a['page'], a['mcid']): a['after'] for a in self.receipt['alt_text']}
        waterfall = alts[(8, 0)]
        for label in ('1,830.3', '−420.3', '+20.9', '1,337.9'):
            self.assertIn(label, waterfall)
        for label in ('163.478', '+13.591', '177.069'):
            self.assertIn(label, alts[(6, 0)])
        for label in ('Letters of credit 72', 'Remaining capacity 203', 'total 275'):
            self.assertIn(label, alts[(7, 5)])

    def test_recommendation_tree_alt_names_highlighted_outcome(self):
        alts = {(a['page'], a['mcid']): a['after'] for a in self.receipt['alt_text']}
        self.assertIn('hypothetical inputs, not reported MP results', alts[(15, 24)])
        self.assertTrue(alts[(17, 32)].endswith('Highlighted outcome: Equity plus revolver.'))
        # Draft 1.0 adds the government-payment branch before the addback test.
        self.assertIn('Cost to finish above cash on hand', alts[(17, 32)])
        self.assertIn('Defense payments at risk of suspension or dispute', alts[(17, 32)])
        self.assertIn('Covenant EBITDA below about $232m', alts[(17, 32)])

    def test_default_path_alt_names_states_and_threshold(self):
        alts = {(a['page'], a['mcid']): a['after'] for a in self.receipt['alt_text']}
        state = alts[(9, 5)]
        for label in ('Available', 'Draws blocked', 'Grace extended', 'Event of Default', '$343.75m'):
            self.assertIn(label, state)
        self.assertIn('Current state as of 30 September 2026: Available', state)

    def test_milestone_alt_distinguishes_date_states(self):
        alts = {(a['page'], a['mcid']): a['after'] for a in self.receipt['alt_text']}
        alt = alts[(11, 19)]
        self.assertNotIn('illustrative', alt)
        self.assertIn('conditional dates apply only if a stated term is met', alt)
        for mark in ('Revolver signed, reported', 'Covenant trigger deadline, contractual', 'Springing maturity, conditional'):
            self.assertIn(mark, alt)

    def test_cover_keeps_publication_fields_as_text(self):
        # Letter-spaced runs extract with gaps, so compare without whitespace.
        flat = ''.join(self.pdf.pages[0].extract_text().split())
        for text in ('FINANCIAL INTELLIGENCE 003', 'Benjamin Yang', 'Research draft 1.0', 'Evidence to 6 November 2026',
                     'not commissioned or reviewed by JPMorgan or MP Materials', '$724.2m', '$275m', 'expired undrawn'):
            self.assertIn(''.join(text.split()), flat)

if __name__ == '__main__':
    unittest.main()
