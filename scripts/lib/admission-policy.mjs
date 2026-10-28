/** Shared authoritative Admission Engine policy gate. Never inferred from semantic advice. */
export function evaluatePolicy({ policy, recipes, scenarios, lock, pi, sources, protocols }) {
  const errors = [];
  if (policy.schemaVersion !== 1 || policy.mode !== "opt-in-experimental" ||
      !Array.isArray(policy.allowedScenarios) || !Array.isArray(policy.e2eEligible))
    errors.push("Invalid policy format");
  const allowed = policy.allowedScenarios ?? [];
  const recipeById = new Map(recipes.recipes.map(entry => [entry.id, entry]));
  const scenarioById = new Map(scenarios.scenarios.map(entry => [entry.id, entry]));
  const approved = new Set(lock.components.filter(entry => entry.status === "approved").map(entry => entry.name));
  const exported = new Set(pi.components.filter(entry => entry.tier!=='composition').map(entry => entry.type));
  const sourced = new Set(sources.components.map(entry => entry.name));
  if (new Set(allowed).size !== allowed.length) errors.push("Duplicate allowlisted scenario");
  if (new Set(policy.e2eEligible ?? []).size !== (policy.e2eEligible ?? []).length)
    errors.push("Duplicate E2E eligibility");
  for (const id of allowed) {
    const recipe = recipeById.get(id), scenario = scenarioById.get(id);
    if (!/^[a-z]+(?:-[a-z]+)*$/.test(id) || !recipe || !scenario ||
        recipe.review !== "required" || scenario.strategy !== "react-candidate" ||
        recipe.target !== scenario.target || !/^[A-Z][A-Za-z0-9]+$/.test(recipe.target)) {
      errors.push(id + ": unknown, unreviewed or invalid recipe");
      continue;
    }
    if (approved.has(recipe.target) || exported.has(recipe.target) || sourced.has(recipe.target))
      errors.push(id + ": already present in the authoritative stable Pi catalog");
    if (!Array.isArray(scenario.dependencies) ||
        scenario.dependencies.some(dependency => !approved.has(dependency)))
      errors.push(id + ": unapproved primitive dependency");
  }
  for (const id of policy.e2eEligible ?? []) {
    const protocol=protocols.candidates?.[id];
    const recipe=recipeById.get(id);
    if (!allowed.includes(id) || !protocol || protocol.target!==recipe?.target ||
      !/^[a-z]+(?:-[a-z]+)*$/.test(id) ||
      !/^[a-z]+(?:-[a-z]+)*$/.test(protocol.protocol??"") ||
      !Array.isArray(protocol.cases) || protocol.cases.length<3 ||
      new Set(protocol.cases).size!==protocol.cases.length ||
      protocol.cases.some(caseId=>!/^[a-z]+(?:-[a-z]+)*$/.test(caseId)))
      errors.push(id + ": no verified browser evidence protocol");
  }
  // CI admission is intentionally narrow: only the existing, no-event,
  // locally validated form candidate can be promoted without manual review.
  const automatic=policy.ciAutoAdmit??{};
  if(!automatic || typeof automatic!=="object" || Array.isArray(automatic))
    errors.push("Invalid CI auto-admission policy");
  else for(const [id,digest] of Object.entries(automatic)){
    const recipe=recipeById.get(id),protocol=protocols.candidates?.[id];
    if(id!=="form-declarative" || !allowed.includes(id) ||
       !(policy.e2eEligible??[]).includes(id) || recipe?.target!=="DeclarativeFormFlow" ||
       protocol?.target!==recipe?.target || !/^[a-f0-9]{64}$/.test(digest))
      errors.push(id+": CI auto-admission is restricted to a reviewed local-only form and fingerprint");
  }
  if (!allowed.length) errors.push("No explicit allowlisted candidates");
  return errors;
}
