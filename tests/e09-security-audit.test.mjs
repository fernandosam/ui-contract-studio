import test from "node:test";
import assert from "node:assert/strict";
import {inspectTrackedFile,auditTrackedFiles} from "../scripts/audit-security.mjs";

test("detect high-confidence committed credentials without printing their values",()=>{
 const cases=[
  ["src/accidental.ts","const token = \""+["ghp_","A".repeat(36)].join("")+"\";","github-token"],
  ["docs/leak.txt",["-----BEGIN"," PRIVATE KEY-----"].join("")+"\\nFAKE","private-key"],
  ["config/.env.production","PLACEHOLDER=true","tracked-environment-file"],
  ["config/client.key","not actually a key","tracked-private-key-file"],
  [".npmrc","//registry.npmjs.org/:_authToken=hardcoded","npm-credential"],
 ];
 for(const [path,content,kind] of cases){
  assert.ok(inspectTrackedFile(path,content).includes(kind),path);
 }
 assert.deepEqual(inspectTrackedFile(".env.example","API_KEY=replace-me"),[]);
 assert.deepEqual(inspectTrackedFile("examples/docs.md","OPENAI_API_KEY=${OPENAI_API_KEY}"),[]);
});

test("CI evidence must be short lived and never contain raw Pi specs",()=>{
 const template=retention=>`name: sample
jobs:
  example:
    steps:
      - name: evidence
        uses: actions/upload-artifact@v4
        with:
          name: report
          path: reports/pi-evaluation.json
          ${retention}
      - name: next
        run: echo done
`;
 const file=".github/workflows/sample.yml";
 assert.deepEqual(inspectTrackedFile(file,template("retention-days: 7")),[]);
 assert.ok(inspectTrackedFile(file,template("")).includes("artifact-retention-missing-or-over-14d"));
 assert.ok(inspectTrackedFile(file,template("retention-days: 30")).includes("artifact-retention-missing-or-over-14d"));
 assert.ok(inspectTrackedFile(file,template("retention-days: 7").replace("reports/pi-evaluation.json","eval-results/"))
  .includes("raw-pi-output-in-artifact"));
});

test("audit surfaces paths and finding identifiers, not secret contents",()=>{
 const secret=["gho_","Z".repeat(36)].join("");
 const findings=auditTrackedFiles([{path:"src/leak.ts",content:secret}]);
 assert.deepEqual(findings,[{path:"src/leak.ts",issue:"github-token"}]);
 assert.equal(JSON.stringify(findings).includes(secret),false);
});
