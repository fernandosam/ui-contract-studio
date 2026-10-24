#!/usr/bin/env python3
"""Compare real official shadcn docs previews and local Explorer screenshots.

Examples can have DIFFERENT content, state and layout: numerical difference
is diagnostic ONLY, never a pass/fail certification of pixel-perfect fidelity.
Failure is reserved for missing screenshots or missing source provenance.
"""
from datetime import datetime, timezone
from pathlib import Path
from json import loads, dumps
import argparse
import html
import sys
from PIL import Image, ImageChops, ImageOps, ImageStat

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'reports/official-components'
MANIFEST = loads((ROOT / 'scripts/official-component-examples.json').read_text())
VIEWPORTS = ('desktop', 'mobile')
parser = argparse.ArgumentParser()
parser.add_argument('--strict', action='store_true')
args = parser.parse_args()

def normalize(img):
    # A fixed canvas produces a reviewable difference thumbnail without
    # cropping original screenshots or silently stretching component layouts.
    rgb = img.convert('RGB')
    return ImageOps.pad(rgb, (600, 450), color='#ffffff', method=Image.Resampling.LANCZOS)

cases = []
for vp in VIEWPORTS:
    (OUT / 'diff' / vp).mkdir(parents=True, exist_ok=True)
    for example in MANIFEST['examples']:
        slug = example['component']
        original = OUT / 'official' / vp / (slug + '.png')
        local = OUT / 'local' / vp / (slug + '.png')
        provenance = OUT / 'provenance' / vp / (slug + '.json')
        row = {
            'component': slug, 'viewport': vp, 'officialUrl': MANIFEST['upstream'] + example['docPath'],
            'exampleId': example['exampleId'], 'mode': 'qualitative-not-pixel-equivalent',
            'officialScreenshot': str(original.relative_to(OUT)),
            'localScreenshot': str(local.relative_to(OUT)) if example['localType'] else None,
            'localContract': example['localType']
        }
        required = [('official', original), ('provenance', provenance)]
        if example['localType']:
            required.append(('local', local))
        missing = [key for key, path in required if not path.is_file()]
        if missing:
            row.update(status='missing-evidence', missing=missing)
        else:
            try:
                evidence = loads(provenance.read_text())
                if evidence.get('sourceExampleId') != example['exampleId'] or evidence.get('documentationUrl') != row['officialUrl']:
                    raise ValueError('Proveniência do exemplo oficial não corresponde ao manifesto')
                if example['localType']:
                    with Image.open(original) as a, Image.open(local) as b:
                        row['officialDimensions'] = list(a.size)
                        row['localDimensions'] = list(b.size)
                        a = normalize(a)
                        b = normalize(b)
                        difference = ImageChops.difference(a, b)
                        dist = sum(ImageStat.Stat(difference).mean) / (3 * 255)
                        # The different contents mean this number must not be used
                        # as a pixel-fidelity threshold or CI approval.
                        row['diagnosticNormalizedDifferencePct'] = round(dist * 100, 2)
                        difference.save(OUT / 'diff' / vp / (slug + '.png'))
                        row['diagnosticDiff'] = 'diff/' + vp + '/' + slug + '.png'
                    row['status'] = 'compared-review-required'
                else:
                    if evidence.get('mappingStatus') != 'no-local-contract':
                        raise ValueError('A falta de contrato local exige registro explícito')
                    with Image.open(original) as a:
                        row['officialDimensions'] = list(a.size)
                    row['status'] = 'official-only-no-local-contract'
            except (OSError, ValueError, KeyError) as exc:
                row.update(status='invalid-evidence', error=str(exc))
        cases.append(row)

completed = sum(c['status'] == 'compared-review-required' for c in cases)
official_only = sum(c['status'] == 'official-only-no-local-contract' for c in cases)
expected_comparable = 2 * sum(bool(e['localType']) for e in MANIFEST['examples'])
report = {
    'schemaVersion': 1,
    'generatedAt': datetime.now(timezone.utc).isoformat(),
    'upstream': MANIFEST['upstream'],
    'examples': len(MANIFEST['examples']),
    'expectedCases': len(cases), 'expectedComparableCases': expected_comparable,
    'comparedCases': completed, 'officialOnlyCases': official_only,
    'unmappedComponents': [e['component'] for e in MANIFEST['examples'] if not e['localType']],
    'missingCases': len(cases) - completed - official_only,
    'pixelFidelityApproval': 'not-applicable-different-demo-content',
    'manualReviewStatus': 'pending',
    'galleryCardsAreSeparateAudit': True,
    'cases': cases
}
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'comparison.json').write_text(dumps(report, ensure_ascii=False, indent=2) + '\n')

def esc(s):
    return html.escape(str(s), quote=True)

blocks = []
for item in cases:
    title = esc(item['component'] + ' / ' + item['viewport'])
    if item['status'] == 'compared-review-required':
        figures = ''.join(
            '<figure><figcaption>' + esc(caption) + '</figcaption><img loading="lazy" src="' +
            esc(file) + '" alt="' + esc(caption + ' ' + item['component']) + '"></figure>'
            for caption, file in (
                ('Oficial (shadcn/ui)', item['officialScreenshot']),
                ('Local (Explorer)', item['localScreenshot']),
                ('Diferença diagnóstica', item['diagnosticDiff']))
        )
        details = f"Tamanhos: {esc(item['officialDimensions'])} × {esc(item['localDimensions'])}; índice diagnóstico: {item['diagnosticNormalizedDifferencePct']}%"
    elif item['status'] == 'official-only-no-local-contract':
        figures = ('<figure><figcaption>Oficial (sem contrato json-render local equivalente)</figcaption>'
                   '<img loading="lazy" src="' + esc(item['officialScreenshot']) + '" alt="' + title + '"></figure>')
        details = 'O componente oficial está instalado, porém não tem contrato próprio no Explorer; nenhuma imagem local equivalente foi inventada.'
    else:
        figures = ''
        details = 'Evidência ausente/inválida: ' + esc(item.get('missing', item.get('error', '')))
    blocks.append(
        f'<article><h2>{title} — {esc(item["status"])}</h2>'
        f'<p><a href="{esc(item["officialUrl"])}" target="_blank" rel="noopener noreferrer">Abrir exemplo oficial</a></p>'
        f'<div class="compare">{figures}</div><p>{details}</p></article>'
    )
document = '''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>shadcn/ui · Comparação de exemplos oficiais</title>
<style>body{font:14px system-ui,sans-serif;color:#18212f;background:#f1f5f9;max-width:1540px;margin:auto;padding:24px}
article{background:white;border:1px solid #d6dce5;border-radius:12px;margin:18px 0;padding:16px}
h1{font-size:25px}h2{font-size:17px}.compare{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
figure{min-width:0;margin:0;background:#f8fafc;border:1px solid #e5e7eb;padding:8px}
figcaption{font-weight:600;margin-bottom:6px}img{display:block;max-width:100%;height:auto}
@media(max-width:850px){.compare{grid-template-columns:1fr}}</style></head><body>
<h1>shadcn/ui · Referências oficiais versus implementações locais</h1>
<p>Estes exemplos têm conteúdos e estados distintos. O valor numérico mede apenas a diferença entre telas normalizadas; não comprova fidelidade. Revisão humana ainda é necessária.</p>
''' + '\n'.join(blocks) + '</body></html>'
(OUT / 'index.html').write_text(document)
print(dumps({k: report[k] for k in ('expectedCases', 'comparedCases', 'missingCases', 'pixelFidelityApproval')}, indent=2))
if args.strict and (completed != expected_comparable or report['missingCases']):
    print('Falha na cobertura das referências oficiais ou pares locais: veja reports/official-components/comparison.json', file=sys.stderr)
    sys.exit(2)
