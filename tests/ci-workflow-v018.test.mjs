import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const read=p=>readFileSync(p,'utf8');
test('CI exige npm ci, primitivas versionadas, Zod schema real e Playwright',()=>{
 const quality=read('.github/workflows/quality.yml');
 for(const flag of ['npm run pi:zod-schema','npm run doctor:strict','npm run check','npm run lint','npx tsx --test tests/*.integration.test.ts','npm run build'])assert.ok(quality.includes(flag),flag);
 const deps=read('.github/actions/setup-deps/action.yml');
 assert.ok(deps.includes('package-lock.json')&&deps.includes('npm ci --no-audit --no-fund'));
 assert.ok(quality.includes('./.github/actions/setup-deps'));
 const e2e=read('.github/workflows/e2e-manual.yml');
 assert.ok(e2e.includes('workflow_dispatch')&&e2e.includes('npm run test:e2e'),'Playwright deve ser executável manualmente em workflow dedicado');
});
test('avaliação paga e reparo nunca iniciam sem consentimento explícito',()=>{
 const run=spawnSync(process.execPath,['scripts/run-pi-evals.mjs','--execute','--repair'],{encoding:'utf8',env:{...process.env,PI_EVAL_CONFIRM:'no',PI_EVAL_REPAIR_CONFIRM:'no'}});
 assert.notEqual(run.status,0);
 assert.match(run.stderr,/PI_EVAL_REPAIR_CONFIRM/);
 const evalWorkflow=read('.github/workflows/pi-evaluation.yml');
 assert.ok(evalWorkflow.includes('workflow_dispatch'));
 assert.ok(evalWorkflow.includes('PI_EVAL_REPAIR_CONFIRM=yes'));
});
test('feedback do Pi usa validação real e estrutura sem despejar valores secretos',()=>{
 const s=read('scripts/validate-pi-spec.ts');
 for(const v of ['catalog.validate(spec)','graphErrors','pointer','suggestion','unrecognized_keys'])assert.ok(s.includes(v));
 assert.ok(!s.includes('console.log(spec)'));
});
