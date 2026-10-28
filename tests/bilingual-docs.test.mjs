import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { checkLinks } from "../scripts/check-docs.mjs"

const allMarkdown = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = join(directory, entry.name).replaceAll("\\", "/")
    return entry.isDirectory() ? allMarkdown(full) : entry.isFile() && full.endsWith(".md") ? [full] : []
  })

test("every Markdown guide has an English original and a Portuguese copy with a working language switch", () => {
  const files = [
    ...readdirSync(".").filter(name => name.endsWith(".md")),
    ...["docs", ".pi", "sandbox"].flatMap(allMarkdown),
  ]
  const canonical = files.filter(name => !name.endsWith(".pt-BR.md"))
  const translations = files.filter(name => name.endsWith(".pt-BR.md"))
  assert.equal(canonical.length, 49, "T23, T25, T29 and T30 add four distinct bilingual guide pairs")
  assert.equal(translations.length, canonical.length)
  for(const english of canonical) {
    const portuguese = english.replace(/\.md$/, ".pt-BR.md")
    assert.ok(existsSync(portuguese), "missing translation: " + english)
    const baseName = english.split("/").at(-1)
    const switcher = `[English](${baseName}) | [Português](${baseName.replace(/\.md$/, ".pt-BR.md")})`
    for(const path of [english, portuguese]) {
      const content = readFileSync(path, "utf8")
      assert.ok(content.includes(switcher), path + ": language navigation missing")
      assert.ok(content.indexOf(switcher) < 300, path + ": language navigation must appear near the top")
      assert.ok(content.replace(switcher,"").trim().length > 80, path + ": content unexpectedly empty")
    }
  }
})
test("Pi's operational prompt and skill retain YAML front matter as the first block in both languages", () => {
  for(const file of [".pi/prompts/ui.md",".pi/skills/ui-catalog/SKILL.md"]) {
    for(const path of [file,file.replace(/\.md$/,".pt-BR.md")]) {
      const content = readFileSync(path, "utf8")
      assert.match(content, /^---\n[\s\S]+?\n---\n\n\[English\]/,path)
      if(file.includes("/skills/")) assert.match(content,/^---\nname: ui-catalog\n/)
      else assert.match(content,/^---\ndescription: /)
    }
  }
})
test("bilingual versions keep the mandatory safety and license markers", () => {
  for(const name of ["AGENTS.md","SECURITY.md","THIRD_PARTY_NOTICES.md"]) {
    const [en,pt]=[name,name.replace(".md",".pt-BR.md")].map(p=>readFileSync(p,"utf8"))
    assert.ok(en.length>200 && pt.length>200,name)
  }
  for(const path of ["THIRD_PARTY_NOTICES.md","THIRD_PARTY_NOTICES.pt-BR.md"]) {
    const txt=readFileSync(path,"utf8")
    assert.match(txt,/Copyright \(c\) 2023 shadcn/)
    assert.match(txt,/Copyright \(c\) 2025 Keenthemes Inc/)
    assert.match(txt,/Permission is hereby granted, free of charge/)
    assert.match(txt,/THE SOFTWARE IS PROVIDED "AS IS"/)
  }
})

test("Portuguese documentation keeps internal links in pt-BR and the English switch functional", () => {
  const translated = [
    ...readdirSync(".").filter(name => name.endsWith(".pt-BR.md")),
    ...["docs", ".pi", "sandbox"].flatMap(allMarkdown).filter(name => name.endsWith(".pt-BR.md")),
  ]
  assert.equal(translated.length, 49)
  for (const path of translated) {
    assert.deepEqual(checkLinks(process.cwd(), path), [], "Incorrect or broken link: " + path)
  }
  const read = path => readFileSync(path, "utf8")
  assert.match(read("README.pt-BR.md"), /\[índice da documentação\]\(docs\/README\.pt-BR\.md\)/)
  assert.match(read("docs/README.pt-BR.md"), /\[README\]\(\.\.\/README\.pt-BR\.md\)/)
  assert.match(read("AGENTS.pt-BR.md"), /\[skill Pi\]\(\.pi\/skills\/ui-catalog\/SKILL\.pt-BR\.md\)/)
  assert.match(read("README.pt-BR.md"), /\[English\]\(README\.md\)/)
})

test("documentation link checker rejects English guides only when a Portuguese counterpart exists", () => {
  const root = mkdtempSync(join(tmpdir(), "ui-contract-docs-"))
  try {
    mkdirSync(join(root, "docs"))
    writeFileSync(join(root, "docs", "guide.md"), "# English guide\n")
    writeFileSync(join(root, "docs", "guide.pt-BR.md"), "# Guia em português\n")
    writeFileSync(join(root, "docs", "reference.md"), "# Only English\n")
    const page = "docs/page.pt-BR.md"
    writeFileSync(join(root, page), [
      "[English](page.md) | [Português](page.pt-BR.md)",
      "[Guia](guide.md#section)",
      "[Sem tradução](reference.md)",
      "[Outro site](https://example.com/docs/page.md)",
    ].join("\n"))
    writeFileSync(join(root, "docs", "page.md"), "# English version\n")
    assert.deepEqual(checkLinks(root, page), [
      "docs/page.pt-BR.md: link para documento em inglês guide.md#section; use a versão .pt-BR.md",
    ])
    writeFileSync(join(root, page), [
      "[English](page.md) | [Português](page.pt-BR.md)",
      "[Guia](guide.pt-BR.md#section)",
      "[Sem tradução](reference.md)",
    ].join("\n"))
    assert.deepEqual(checkLinks(root, page), [])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
