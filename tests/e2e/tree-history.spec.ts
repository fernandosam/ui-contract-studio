import { test, expect } from "@playwright/test";

test("E08: visual diff, validated commit, undo, redo and failed preview", async ({ page }) => {
  await page.goto("/?screen=explorador-exemplos");
  await page.getByLabel("Exemplo", { exact: true }).selectOption("blocos-login");
  const workbench = page.getByTestId("tree-patch-workbench");
  await expect(workbench).toBeVisible();
  const editor = workbench.getByTestId("tree-patch-json");
  const patch = (text: string) => JSON.stringify({ schemaVersion: 1, operations: [
    { op: "update", nodeId: "b002", setProps: { text } },
  ] });

  await editor.fill(patch("Revisado pelo E08"));
  await workbench.getByRole("button", { name: "Pré-visualizar diferenças" }).click();
  await expect(workbench.getByTestId("tree-patch-preview")).toContainText("b002");
  await expect(workbench.getByTestId("tree-diff-summary").first()).toContainText("~text");
  await expect(workbench.getByRole("button", { name: "Aplicar prévia" })).toBeEnabled();
  await expect(workbench.getByText(/Nenhuma alteração aplicada nesta sessão/)).toBeVisible();

  await workbench.getByRole("button", { name: "Aplicar prévia" }).click();
  await expect(workbench.getByTestId("tree-patch-history")).toContainText("#1 · aplicada");
  await expect(workbench.getByRole("button", { name: "Refazer" })).toBeDisabled();
  await workbench.getByRole("button", { name: "Desfazer" }).click();
  await expect(workbench.getByTestId("tree-patch-history")).toContainText("#1 · desfeita");
  await workbench.getByRole("button", { name: "Refazer" }).click();
  await expect(workbench.getByTestId("tree-patch-history")).toContainText("#1 · aplicada");

  await editor.fill(JSON.stringify({ schemaVersion: 1, operations: [
    { op: "update", nodeId: "b002", setProps: { forbidden: "not allowed" } },
  ] }));
  await workbench.getByRole("button", { name: "Pré-visualizar diferenças" }).click();
  await expect(workbench.getByRole("button", { name: "Aplicar prévia" })).toBeDisabled();
  await expect(workbench.getByTestId("tree-patch-history")).toContainText("#1 · aplicada");
});
