[English](admissao-componentes.md) | [Português](admissao-componentes.pt-BR.md)

# Component Admission

The current admission policy, including criteria, directories, versioning, security, tests, and human review, is centralized in [Components and Contracts](components.md).

For stateful components, implement a **strict Zod schema + React component + adapter in the registry**. For static compositions, prefer approved JSON templates and the generator. Record provenance and license in `src/ui-catalog/sources.json`, version information in `src/ui-catalog/contracts.lock.json`, and test the result before independent approval.

The catalog remains **closed** to agent-generated specs. Installing shadcn/ui or creating a ReUI composition does not automatically admit a Pi type.
