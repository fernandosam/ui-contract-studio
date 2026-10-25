[English](admissao-componentes.md) | [Português](admissao-componentes.pt-BR.md)

# Admissão de componentes

A política vigente de admissão, incluindo critérios, diretórios, versão, segurança, testes e revisão humana, está concentrada em [Componentes e contratos](components.md).

Para componentes com estado, implemente **schema Zod estrito + componente React + adapter no registry**. Para composições estáticas, prefira templates JSON aprovados e o gerador. Registre origem e licença em `src/ui-catalog/sources.json`, versionamento em `src/ui-catalog/contracts.lock.json` e teste o resultado antes da aprovação independente.

O catálogo permanece **fechado** para specs de agentes. Instalar shadcn/ui ou criar uma composição ReUI não admite automaticamente um tipo Pi.
