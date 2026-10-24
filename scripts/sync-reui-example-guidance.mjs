/**
 * Sincroniza critérios específicos de cada exemplo ReUI (somente texto público).
 * Não executa código externo e não edita contratos, JSX ou previews.
 * Atualização atômica: se qualquer item falhar, mantém o JSON anterior e falha.
 */
import {readFileSync, writeFileSync} from 'node:fs';

const guidance = JSON.parse(readFileSync('src/ui-catalog/reui-guidance.json', 'utf8'));
const outputPath = 'src/ui-catalog/reui-example-guidance.json';
const examples = Object.entries(guidance).flatMap(([name, guide]) =>
  guide.examples.map(([, id]) => ({
    name, id,
    sourceUrl: `https://reui.io/components/${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}/${id}`
  }))
);
const clean = (value) => value
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/<[^>]*>/g, '')
  .replace(/\*\*|__|`/g, '')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/\s+/g, ' ').trim();

function extract(markdown, id) {
  const lines = markdown.split(/\r?\n/);
  const plain = (line) => clean(line.replace(/^\s{0,3}#{1,6}\s+/, '').replace(/^\s*>\s?/, ''));
  const bestIndex = lines.findIndex((line) => /^best for\s*:?$/i.test(plain(line)));
  let bestFor = '';
  if (bestIndex >= 0) {
    for (let i = bestIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^#{1,6}\s/.test(line)) break;
      if (!bestFor && plain(line)) bestFor = plain(line);
    }
  }
  const sectionStart = lines.findIndex((line) => /^when not to use\s*:?$/i.test(plain(line)));
  const whenNotUse = [];
  if (sectionStart >= 0) {
    for (let i = sectionStart + 1; i < lines.length && i < sectionStart + 55; i++) {
      const line = lines[i].trim();
      const cleaned = plain(line);
      if (/^(agent notes|when to use|markdown|mcp|install|for ai agents|related|api reference)\s*:?$/i.test(cleaned) || /^#{1,6}\s/.test(line)) break;
      const match = line.match(/^(?:[-*+]\s+|\d+\.\s+)(.*)$/);
      if (match) {
        const item = clean(match[1]);
        if (item && item.length < 450) whenNotUse.push(item);
      }
    }
  }
  if (!bestFor || bestFor.length < 12 || bestFor.length > 450 || !whenNotUse.length) {
    throw new Error(`Missing specific Best for / When not to use for ${id} (best=${Boolean(bestFor)}, not=${whenNotUse.length})`);
  }
  return {bestFor, whenNotUse, sourceUrl: '', language: 'en'};
}

async function fetchMarkdown(url) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(url, {signal: controller.signal, headers: {Accept: 'text/markdown,text/plain;q=0.9', 'User-Agent': 'ui-contract-studio-metadata-sync/1.0'}});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const markdown = await response.text();
      if (markdown.length < 200 || markdown.length > 1_500_000) throw new Error('Unexpected response size');
      return markdown;
    } catch (error) {
      if (attempt === 4) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1400));
    } finally {
      clearTimeout(timer);
    }
  }
}

const results = {};
const failures = [];
let cursor = 0;
async function worker() {
  while (cursor < examples.length) {
    const example = examples[cursor++];
    try {
      const parsed = extract(await fetchMarkdown(`${example.sourceUrl}.md`), example.id);
      results[example.id] = {...parsed, sourceUrl: example.sourceUrl};
    } catch (error) {
      failures.push(`${example.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

await Promise.all(Array.from({length: 5}, worker));
if (failures.length > 0 || Object.keys(results).length !== examples.length) {
  console.error(`ReUI metadata incomplete: ${Object.keys(results).length}/${examples.length} examples`);
  failures.forEach((failure) => console.error(failure));
  process.exitCode = 1;
} else {
  const ordered = Object.fromEntries(examples.map(({id}) => [id, results[id]]));
  writeFileSync(outputPath, JSON.stringify(ordered, null, 2) + '\n');
  console.log(`ReUI example-specific metadata: ${Object.keys(ordered).length}/${examples.length} verified; output: ${outputPath}`);
}
