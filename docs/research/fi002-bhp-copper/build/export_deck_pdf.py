"""Export the accepted deck with installed system fonts, without font substitution.

The headless LibreOffice bundle otherwise sees only its bundled fonts. No font
binaries are copied, modified or distributed. Existing research stays untouched.
"""
from pathlib import Path
import os,subprocess,tempfile,html,argparse
R=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--input',type=Path,default=R/'output/SMPT_FI002_BHP_Copper_Strategy_Deck.pptx');parser.add_argument('--outdir',type=Path,default=R/'output');args=parser.parse_args()
args.outdir.mkdir(parents=True,exist_ok=True)
fontdirs=[Path('/System/Library/Fonts/Supplemental'),Path('/Library/Fonts'),Path.home()/'Library/Fonts',Path('/Users/benjaminyang/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype')]
with tempfile.TemporaryDirectory(prefix='fi002-fonts-')as temp:
 config=Path(temp)/'fonts.conf';config.write_text('<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig>'+''.join('<dir>'+html.escape(str(p))+'</dir>'for p in fontdirs if p.exists())+'<cachedir>'+temp+'/cache</cachedir></fontconfig>')
 env=dict(os.environ,FONTCONFIG_FILE=str(config))
 subprocess.run(['soffice','--headless','--convert-to','pdf','--outdir',str(args.outdir),str(args.input)],env=env,check=True)
