import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

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
  assert.equal(canonical.length, 36, "review the inventory when adding Markdown docs")
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
