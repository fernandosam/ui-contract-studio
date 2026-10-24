#!/usr/bin/env python3
"""Strict visual evidence gate, does not infer/presume official baselines.
Requires an official screenshot for every local screenshot (same theme/viewport).
If Pillow is installed, computes normalized per-pixel mean absolute difference.
Any missing or differently sized references cause non-zero exit.
"""
from pathlib import Path
from json import dumps
from datetime import datetime,timezone
import sys
root=Path(__file__).resolve().parent.parent
local=root/'reports/gallery-fidelity/local'
reference=root/'reports/gallery-fidelity/reference'
record=root/'reports/gallery-fidelity/diff-report.json'
try:
 from PIL import Image,ImageChops,ImageStat
except ImportError:
 print('PENDENTE: Pillow não instalado, necessário para comparação em pixels.',file=sys.stderr)
 sys.exit(3)
files=sorted(local.glob('*/*.png'))
if not files:
 print('PENDENTE: nenhuma screenshot local do Playwright. Execute npm run gallery:visual:capture.',file=sys.stderr)
 sys.exit(2)
rows=[];pending=0
for path in files:
 ref=reference/path.parent.name/path.name
 entry={'name':path.stem,'viewport':path.parent.name,'local':str(path.relative_to(root)),'reference':str(ref.relative_to(root))}
 if not ref.exists():
  pending+=1;entry['status']='missing-reference'
 else:
  with Image.open(ref) as actual, Image.open(path) as baseline:
   a=actual.convert('RGB');b=baseline.convert('RGB')
   if a.size!=b.size:
    pending+=1;entry['status']='dimensions-differ';entry['referenceSize']=a.size;entry['localSize']=b.size
   else:
    d=ImageChops.difference(a,b);mae=sum(ImageStat.Stat(d).mean)/(3*255)
    entry.update(status='compared',meanAbsoluteDifference=round(mae,6),pixelDifferencePct=round(mae*100,2))
 rows.append(entry)
record.parent.mkdir(parents=True,exist_ok=True);record.write_text(dumps({'generatedAt':datetime.now(timezone.utc).isoformat(),'cases':rows,'missingOrIncompatible':pending},indent=2)+'\n')
print(f'{len(rows)} capturas locais, {pending} referências oficiais ausentes/incompatíveis; relatório: {record.relative_to(root)}')
if pending:sys.exit(2)
print('Comparação calculada; aprovação final depende de revisão humana (não há limiar automático de fidelidade).')
