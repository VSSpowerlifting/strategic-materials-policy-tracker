"""Build only the allowlisted FI002 public edition; never write approved masters.
Run with the Python runtime used for the approved report (reportlab, pypdf).
"""
from pathlib import Path
import hashlib, json, shutil, subprocess, tempfile, zipfile
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/research/fi002-bhp-copper'
OUT = ROOT / 'public/research/fi002'
OUT.mkdir(parents=True, exist_ok=True)
URL = 'https://strategic-materials-policy-tracker.vercel.app/research/fi002/model.xlsx'
PRIVATE = 'https://docs.google.com/spreadsheets/d/1MysAjBqAQ4-63XPo7YtncDle3q4faZDsBpTaVBWsg1k/edit?usp=drivesdk'
# Regenerate the identical narrative, charts and tables using the approved renderer.
# Only delivery references and edition labels change. Isolate all generated writes.
with tempfile.TemporaryDirectory(prefix='fi002-public-') as name:
    work = Path(name)
    shutil.copytree(SOURCE / 'build', work / 'build', ignore=shutil.ignore_patterns('node_modules', 'previews', '*.xlsx'))
    (work / 'output/figures').mkdir(parents=True)
    code = 'from reportlab import rl_config; rl_config.invariant = 1\n' + (SOURCE / 'build/report.py').read_text().replace(PRIVATE, URL)
    code = code.replace('Native Google Sheet', 'Downloadable Excel model')
    code = code.replace('private delivery folder', 'publication download collection')
    code = code.replace('Editorial review copy', 'Public research edition')
    (work / 'build/report.py').write_text(code)
    subprocess.run([__import__('sys').executable, str(work / 'build/report.py')], check=True)
    for ext in ['pdf', 'html', 'md']:
        shutil.copyfile(work / f'output/SMPT_FI002_BHP_Copper_Research_Report.{ext}', OUT / f'report.{ext}')
    shutil.copytree(work / 'output/figures', OUT / 'figures', dirs_exist_ok=True)
# Responsive standalone full-text reading, including explicit table scrolling.
html = (OUT / 'report.html').read_text()
html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="canonical" href="https://strategic-materials-policy-tracker.vercel.app/research/escondida-copper">')
html = html.replace('<h1>', '<nav aria-label="Publication"><a href="/research/escondida-copper">← FI002 overview and downloads</a></nav><main><h1>', 1).replace('</html>', '</main></html>')
html = html.replace('<svg ', '<svg role="img" aria-label="SMPT analytical exhibit; values and interpretation in adjacent text and caption" ')
html = html.replace('<table>', '<div role="region" aria-label="Research exhibit table" tabindex="0" style="overflow:auto"><table>').replace('</table>', '</table></div>')
(OUT / 'report.html').write_text(html)
copy = {
    'SMPT_FI002_BHP_Copper_Model.xlsx': 'model.xlsx',
    'SMPT_FI002_BHP_Copper_Strategy_Deck.pdf': 'executive-slides.pdf',
    'SMPT_FI002_BHP_Copper_Memo.pdf': 'executive-brief.pdf',
    'SMPT_FI002_Evidence_Register.csv': 'evidence-register.csv',
    'SMPT_FI002_Claim_Source_Matrix.csv': 'claim-source-matrix.csv',
    'SMPT_FI002_Price_Sensitivity.csv': 'price-sensitivity.csv',
    'SMPT_FI002_Threshold_Sensitivities.csv': 'threshold-sensitivities.csv',
    'SMPT_FI002_Price_Cost_Frontier.csv': 'price-cost-frontier.csv',
    'SMPT_FI002_Replacement_Margin_Frontier.csv': 'replacement-margin-frontier.csv',
}
for source, target in copy.items():
    shutil.copyfile(SOURCE / 'output' / source, OUT / target)
# Notes/relationship link only: all slide/chart/table/workbook bytes remain identical.
with zipfile.ZipFile(SOURCE / 'output/SMPT_FI002_BHP_Copper_Strategy_Deck.pptx') as source:
    with zipfile.ZipFile(OUT / 'executive-slides.pptx', 'w', zipfile.ZIP_DEFLATED) as target:
        for item in source.infolist():
            data = source.read(item.filename)
            if item.filename.endswith(('.xml', '.rels')):
                data = data.replace(PRIVATE.encode(), URL.encode()).replace(PRIVATE.replace('&', '&amp;').encode(), URL.encode())
                data = data.replace(b'Editable model:', b'Downloadable Excel model:')
            target.writestr(item, data)
methods = (SOURCE / 'output/SMPT_FI002_Methodology.md').read_text().split('## Reproduction and software')[0]
methods += '''## Using the public model\n\nOpen model.xlsx in Excel or import a copy into your own spreadsheet application. The 11-tab workbook retains six selectable scenarios. Near-term price sensitivity and the long-term replacement screen have separate assumptions. Change the input cells, preserve formula cells, and inspect the source and calculation tabs. Scenario outputs are deterministic assumption tests, with no assigned probabilities.\n\nThe published calculation CSVs expose the major sensitivity outputs. The report's analytical edition is frozen at 5 November 2026. This public distribution changes delivery links and edition labels only; the approved model and calculation files are unchanged. SMPT's internal checks are not external professional assurance.\n'''
(OUT / 'methodology.md').write_text(methods)
(OUT / 'citation.bib').write_text('''@techreport{yang2026escondida,\n  author = {Yang, Benjamin},\n  title = {Goldman Sachs' Copper Outlook and BHP's $6 Billion Escondida Decision},\n  institution = {Strategic Materials Policy Tracker},\n  number = {Financial Intelligence 002},\n  year = {2026},\n  note = {Research cutoff: 5 November 2026},\n  url = {https://strategic-materials-policy-tracker.vercel.app/research/escondida-copper}\n}\n''')
subprocess.run(['pdftoppm', '-f', '1', '-singlefile', '-scale-to', '1000', '-png', str(OUT/'report.pdf'), str(OUT/'report-cover')], check=True)
subprocess.run([__import__('sys').executable, str(ROOT/'scripts/fi002-review-assets.py')], check=True)
# Deterministic allowlist, no entire-folder or internal reproducibility archive upload.
allowed = {f'report.{ext}' for ext in ['pdf', 'html', 'md']} | set(copy.values()) | {'executive-slides.pptx', 'methodology.md', 'citation.bib', 'report-cover.png', 'social.png'} | {f'figures/exhibit-{i:02}.svg' for i in [2,3,4,5,9,10,11]}
actual = {str(p.relative_to(OUT)) for p in OUT.rglob('*') if p.is_file()}
assert actual <= allowed | {'publication-manifest.json', 'research-package.zip'}, ('Unexpected public files', actual - allowed)
assert allowed <= actual, ('Missing public files', allowed - actual)
files = [OUT / name for name in sorted(allowed)]
manifest = {'edition': 'SMPT FI002 public research edition', 'researchCutoff': '2026-11-05', 'approvedResearchCommit': '1c4288916abe8fa1df9f906c87a4278647e6adcb', 'files': {str(p.relative_to(OUT)): {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in files}}
(OUT / 'publication-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
with zipfile.ZipFile(OUT / 'research-package.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for p in files + [OUT / 'publication-manifest.json']:
        info = zipfile.ZipInfo(str(p.relative_to(OUT)), (2026, 11, 5, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(info, p.read_bytes())
print('Public distribution:', len(files), 'allowlisted files plus manifest and ZIP')
