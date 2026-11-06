#!/usr/bin/env python3
"""Build/check the bounded draft review package; never publish or share it."""
import hashlib
from io import BytesIO
import json
from pathlib import Path
import sys
from zipfile import ZipFile, ZIP_DEFLATED, ZipInfo

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'outputs/review-candidate-v03'
ARCHIVE = OUT/'FI003_Review_Candidate_v03.zip'
FILES = [
    'READER_GUIDE.md', 'evidence.csv', 'sources.json', 'inputs.json', 'chronology.csv',
    'prototype.py', 'model.py', 'test_prototype.py', 'test_model.py', 'verify_workbook.py',
    'presentation/prepare.py', 'presentation/slide-manifest.json',
    'outputs/fi003-model-v1/model_spec.json',
    'outputs/fi003-model-v1/recalculated/FI003_Working_Model_v1.xlsx',
    'outputs/presentation-draft-v03/SMPT_FI003_JPMorgan_MP_Draft_v03.pptx',
    'outputs/presentation-draft-v03/SMPT_FI003_JPMorgan_MP_Draft_v03.pdf',
] + [f'exhibits/{name}.csv' for name in (
    'support_accounting', 'underwriting', 'replacement', 'revolver_snapshots',
    'ppa_sensitivity', 'financing_economics', 'offtake_threshold',
    'revolver_sensitivity', 'liquidity_bridge', 'liquid_assets', 'covenant_adjustment')]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def inspect(data, name):
    # Inspect recursively, including notes, chart relationships and XLSX cells.
    if name.endswith(('.pptx', '.xlsx')):
        with ZipFile(BytesIO(data)) as z:
            for member in z.namelist():
                assert not any(x in member for x in ('oleObject', 'vbaProject', 'externalLink', 'ppt/media/', 'ppt/fonts/')), member
                inspect(z.read(member), member)
    elif name.endswith(('.pdf',)):
        # Exact PDF annotations are checked separately by presentation/verify.py.
        assert b'docs.google.com' not in data
    else:
        assert b'docs.google.com' not in data and b'drive.google.com' not in data, name
        assert b'file://' not in data and b'/Users/benjaminyang' not in data, name


def main():
    payload = {f'research/fi003/{name}': (ROOT/name).read_bytes() for name in FILES}
    manifest = {
        'status': 'DRAFT: ready for human financial/editorial review; publication HOLD',
        'source_cutoff': '2026-11-06',
        'presentation_version': '0.3', 'model_version': '1.0',
        'baseline_sha': '3975390968968da63059fb0fa4a5c9175de46ec3',
        'release_gates': ['Human financial/editorial and exact-file/source-rights approval',
                          'Native Microsoft PowerPoint compatibility',
                          'Remaining PDF accessibility remediation and review',
                          'Separate publication authorization'],
        'files': {name: {'bytes': len(data), 'sha256': digest(data)} for name, data in sorted(payload.items())},
        'exclusions': ['Internal trackers and README', 'Native Sheets/access records',
                       'Original filings/bank articles/transcripts/screenshots', 'Standalone fonts',
                       'Historical presentation binaries and unrelated repository files'],
    }
    for name, data in payload.items():
        inspect(data, name)
    content = (json.dumps(manifest, indent=2)+'\n').encode()
    if '--check' not in sys.argv:
        OUT.mkdir(parents=True, exist_ok=True)
        assert not ARCHIVE.exists(), 'Preserve existing package; check it or version a successor'
        with ZipFile(ARCHIVE, 'x', compression=ZIP_DEFLATED) as z:
            for name, data in {**payload, 'PACKAGE_MANIFEST.json': content}.items():
                info = ZipInfo(name, date_time=(2026, 11, 6, 0, 0, 0))
                info.compress_type = ZIP_DEFLATED
                z.writestr(info, data)
        (OUT/'contents.json').write_bytes(content)
    with ZipFile(ARCHIVE) as z:
        assert set(z.namelist()) == set(payload) | {'PACKAGE_MANIFEST.json'}
        assert z.read('PACKAGE_MANIFEST.json') == content
        assert all(z.read(name) == data for name, data in payload.items())
    assert (OUT/'contents.json').read_bytes() == content
    receipt = {'result': 'PASS', 'allowlisted_files': len(payload),
               'archive': ARCHIVE.name, 'sha256': digest(ARCHIVE.read_bytes()),
               'bytes': ARCHIVE.stat().st_size, 'private_links_or_originals': False}
    if '--check' not in sys.argv:
        (OUT/'verification.json').write_text(json.dumps(receipt, indent=2)+'\n')
    print(json.dumps(receipt, indent=2))


if __name__ == '__main__':
    main()
