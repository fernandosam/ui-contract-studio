import {test,expect} from "@playwright/test";
import {createServer,type Server} from "node:http";
import {randomBytes} from "node:crypto";
import {once} from "node:events";
import {createControlledDemoHttpHandler} from "../../src/ui-requirements/submission-http";
import {createInMemoryDemoService} from "../../src/ui-requirements/submission-demo";

/** Browser/network integration for a TEST HOST, not a production Pi submit handler. */
test("T32: browser form remains local; an explicit trusted demo HTTP call can persist a test record",async({page})=>{
 const demo=createInMemoryDemoService();
 const token=randomBytes(32).toString("base64url"),csrf=randomBytes(24).toString("base64url");
 const service=createControlledDemoHttpHandler({
  allowedOrigin:"http://127.0.0.1:5173",services:[demo.service],
  resolveSession:async bearer=>bearer===token?{
   userId:"test-user",tenantId:"test-tenant",
   allowedServices:new Set(["users-demo"]),csrfToken:csrf
  }:null
 });
 const server:Server=createServer(service);
 server.listen(0,"127.0.0.1");await once(server,"listening");
 const addr=server.address();
 if(!addr||typeof addr==="string")throw Error("Invalid server address");
 const url="http://127.0.0.1:"+addr.port+"/__demo__/submit";
 try{
  await page.goto("/?screen=criador-interfaces");
  const wizard=page.getByTestId("requirements-wizard");
  await wizard.getByLabel("O cadastro será demonstrativo ou salvará no servidor?").selectOption("local-demo");
  await wizard.getByLabel("Mostrar confirmação antes de salvar?").check();
  await wizard.getByRole("button",{name:"Gerar prévia JSON"}).click();
  const form=wizard.getByTestId("registration-flow-demo");
  await expect(form).toBeVisible();
  await form.getByRole("button",{name:"Revisar e confirmar"}).click();
  await expect(form.getByText("Campo obrigatório").first()).toBeVisible();
  assertRecordCount(demo.records().length,0);
  await form.getByLabel(/^Nome/).fill("Ana");
  await form.getByLabel(/^E-mail/).fill("ana@example.org");
  await form.getByLabel(/^Senha/).fill("example-password");
  await form.getByRole("button",{name:"Revisar e confirmar"}).click();
  const dialog=page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button",{name:"Cancelar"}).click();
  assertRecordCount(demo.records().length,0);
  await form.getByRole("button",{name:"Revisar e confirmar"}).click();
  await dialog.getByRole("button",{name:"Confirmar simulação"}).click();
  await expect(form.getByRole("status")).toContainText("Nenhum registro foi salvo");
  assertRecordCount(demo.records().length,0);
  // An EXPLICIT test-host-only request is required to use the approved service;
  // the Pi candidate did not get network permissions or automatically transmit fields.
  const result=await page.evaluate(async args=>{
   const response=await fetch(args.url,{
    method:"POST",headers:{"authorization":"Bearer "+args.token,
     "x-csrf-token":args.csrf,"content-type":"application/json"},
    body:JSON.stringify({serviceId:"users-demo",idempotencyKey:"browser_demo_12345",
     values:{name:"Ana",email:"ana@example.org"}})
   });
   return {status:response.status,body:await response.json()};
  },{url,token,csrf});
  expect(result.status).toBe(200);
  expect(result.body.ok).toBe(true);
  assertRecordCount(demo.records().length,1);
 }finally{
  server.close();await once(server,"close");
 }
});
function assertRecordCount(actual:number,expected:number){expect(actual).toBe(expected);}
