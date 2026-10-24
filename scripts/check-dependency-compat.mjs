import { readFileSync } from 'node:fs';
const { dependencies = {}, devDependencies = {} } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);
function number(version) {
  const match = String(version ?? '').match(/^\d+\.\d+\.\d+$/);
  if (!match) throw new Error(`Versão exata esperada, recebido: ${version}`);
  return version.split('.').map(Number);
}
function atLeast(current, required) {
  const a = number(current), b = number(required);
  for (let i = 0; i < 3; i++) { if (a[i] !== b[i]) return a[i] > b[i]; }
  return true;
}
const checks = [
  [dependencies['class-variance-authority'] === '0.7.1', 'CVA 0.7.1 é dependência de runtime dos componentes shadcn/ui'],
  [dependencies.react === dependencies['react-dom'], 'react e react-dom devem estar alinhados'],
  [atLeast(dependencies.react, '19.2.3'), '@json-render/react@0.21.0 exige React >=19.2.3'],
  [number(devDependencies.vite)[0] === 7, 'Este projeto está configurado para Vite 7'],
  [devDependencies.tailwindcss === devDependencies['@tailwindcss/vite'], 'Versões do Tailwind e do plugin Vite devem estar alinhadas'],
  [atLeast(devDependencies['@tailwindcss/vite'], '4.1.11'), '@tailwindcss/vite para Vite 7 precisa ser >=4.1.11'],
  [atLeast(devDependencies['@vitejs/plugin-react'], '4.5.2'), 'Plugin React sem suporte declarado a Vite 7'],
  [atLeast(devDependencies.typescript, '5.9.2') && number(devDependencies.typescript)[0] === 5, 'Use uma versão TypeScript 5.9 estável (>=5.9.2 e <6); 5.9.0 foi beta e não existe como versão estável'],
];
const invalid = checks.filter(([ok]) => !ok).map(([, message]) => message);
if (invalid.length) {
  for (const message of invalid) console.error(`ERRO: ${message}`);
  process.exit(1);
}
console.log('Baseline de compatibilidade React 19 + Vite 7 + Tailwind 4 + TypeScript 5.9 verificada.');
console.log('Nota: esta checagem estática não substitui resolução de peers pelo npm nem build.');
