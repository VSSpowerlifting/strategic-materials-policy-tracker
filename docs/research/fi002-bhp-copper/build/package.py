"""Package the tracked research sources and unchanged PR202 baseline for private delivery."""
from pathlib import Path
import subprocess,json,hashlib,zipfile
R=Path(__file__).resolve().parents[1];repo=Path(subprocess.check_output(['git','rev-parse','--show-toplevel'],text=True).strip())
paths=subprocess.check_output(['git','ls-files','-z','--',str(R.relative_to(repo)),'research/fi002'],cwd=repo).decode().split('\0')
paths=[p for p in paths if p and not p.endswith('.zip') and '/audit/drive-'not in p and not p.endswith('Package_File_Hashes.json')]
items=[dict(path=p,bytes=(repo/p).stat().st_size,sha256=hashlib.sha256((repo/p).read_bytes()).hexdigest())for p in sorted(paths)]
manifest=R/'audit/Package_File_Hashes.json';manifest.write_text(json.dumps({'research_cutoff':'2026-11-05','baseline_commit':'649d5ab30c765e863bc237efbbff3e26dccc1531','files':items},indent=2)+'\n')
out=R/'output/SMPT_FI002_Reproducibility_Package.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED)as z:
 for x in items:z.write(repo/x['path'],x['path'])
 z.write(manifest,str(manifest.relative_to(repo)))
with zipfile.ZipFile(out)as z:assert z.testzip()is None
print(json.dumps({'files':len(items)+1,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}))
