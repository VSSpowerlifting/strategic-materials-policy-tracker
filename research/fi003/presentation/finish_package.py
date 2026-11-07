#!/usr/bin/env python3
"""Finish artifact-tool output with identity and accessible chart descriptions.

Metadata, evidence descriptions and chart-label no-wrap formatting change here.
Numeric evidence and literal chart workbooks remain the artifact-tool output.
"""
import json
from pathlib import Path
import re
import sys
from xml.sax.saxutils import quoteattr
from zipfile import ZipFile


def finish(path):
    manifest = json.loads(Path(__file__).with_name('slide-manifest.json').read_text())
    descriptions = {
        6: 'Isolated post-offering ownership: existing holders 92.324501%, new offering shares 7.675499%. Starting basic shares 163,477,816 plus 13,590,908 offering shares. Other dilution excluded.',
        7: 'USD million. At 31 December 2025: implied letters of credit 40, remaining capacity 235. At 30 June and 30 September 2026: letters of credit 72, remaining capacity 203. All snapshots show zero revolver loans. Total capacity 275; letter-of-credit sublimit is included.',
    }
    descriptions[11] = 'Hypothetical full-year CY2029 operating threshold, USD million. Before commercial operation, the operating threshold is withheld; this is not a zero-valued observation. COD to the production milestone at 50% annual capacity: 75.7702512. From the production milestone: 151.5405024. These are contractual threshold illustrations, not cash receipts or covenant EBITDA.'
    waterfall = manifest['slides'][12]['waterfall']
    descriptions[13] = 'Historical company liquid assets, USD million: ' + '; '.join(
        f'{label}: {value:+.3f}' for label, value in zip(waterfall['labels'], waterfall['values'])) + '. Opening and closing values are balances; intervening values are signed movements, not a remaining 10X budget.'
    with ZipFile(path) as z:
        members = [(item, z.read(item.filename)) for item in z.infolist()]
    result = []
    for item, data in members:
        if item.filename == 'docProps/core.xml':
            text = data.decode('utf-8-sig')
            text = re.sub(r'<dc:title>.*?</dc:title>', '<dc:title>FI003: JPMorgan and MP Materials, draft 0.5</dc:title>', text)
            text = re.sub(r'<dc:creator>.*?</dc:creator>', '<dc:creator>Benjamin Yang</dc:creator>', text)
            text = re.sub(r'<lastModifiedBy>.*?</lastModifiedBy>', '<lastModifiedBy>SMPT, Codex-assisted draft preparation</lastModifiedBy>', text)
            text = text.replace('</coreProperties>', '<dc:language>en-US</dc:language><dc:subject>Financing through 10X construction; source cutoff 2026-11-06</dc:subject><dc:description>Research draft 0.5. Financial/editorial review and publication authorization pending. Model 1.0 unchanged.</dc:description></coreProperties>')
            data = text.encode()
        # Keep native chart labels on one line in PowerPoint and LibreOffice.
        if re.fullmatch(r'ppt/(?:slides/)?charts/chart\d+\.xml', item.filename):
            data = data.replace(b'<a:bodyPr ', b'<a:bodyPr wrap="none" ')
        match = re.fullmatch(r'ppt/slides/slide(\d+)\.xml', item.filename)
        if match:
            number = int(match[1])
            text = data.decode('utf-8-sig')
            # The first chart's nonvisual frame is the native chart owner.
            if number in (6, 7, 11):
                text, count = re.subn(r'(<p:graphicFrame>.*?<p:cNvPr\b)([^>]*?)(/?>)',
                    lambda m: m[1] + m[2] + ' descr=' + quoteattr(descriptions[number]) + m[3], text, count=1, flags=re.S)
                assert count == 1, ('Missing native chart', number)
            if number == 13:
                # Each meaningful waterfall bar has its own description, while
                # the first also provides the complete numeric text equivalent.
                for i, (label, value) in enumerate(zip(waterfall['labels'], waterfall['values'])):
                    desc = descriptions[13] if i == 0 else f'{label}: {value:+.3f} USD million.'
                    pattern = r'(<p:cNvPr\b[^>]*name="waterfall-' + str(i) + r'")([^>]*?)(/?>)'
                    text, count = re.subn(pattern, lambda m: m[1] + m[2] + ' descr=' + quoteattr(desc) + m[3], text, count=1)
                    assert count == 1, ('Missing waterfall bar', i)
            data = text.encode()
        result.append((item, data))
    temporary = path.with_suffix('.finished.pptx')
    with ZipFile(temporary, 'w') as z:
        for item, data in result:
            z.writestr(item, data)
    temporary.replace(path)
    print('Finished identity metadata and 12 native evidence descriptions')


if __name__ == '__main__':
    finish(Path(sys.argv[1]))
