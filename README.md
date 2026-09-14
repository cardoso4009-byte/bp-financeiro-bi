# BP Financeiro BI

Dashboard de Controladoria e Finanças Corporativas.

## V1 — Controladoria Financeira

A V1 consolida uma visão gerencial integrada para análise financeira, com:

- Visão Executiva / cockpit financeiro
- DRE Gerencial
- Balanço Patrimonial
- DFC pelo método indireto
- DMPL / ponte do Patrimônio Líquido
- Indicadores financeiros e capital de giro
- Orçamento, forecast e análises gerenciais
- Fechamento e auditoria contábil
- Checks automatizados de integridade e reconciliação
- Padronização de período: mensal, acumulado e comparativo

Os dados atuais são demonstrativos e reproduzem os números utilizados na modelagem inicial do projeto. A próxima etapa é separar dados, regras de negócio e apresentação para receber dados reais de empresas.

## Governança e homologação

A documentação da V1 está organizada em `docs/`, incluindo critérios de aceite, fluxo operacional, roteiro e manual de homologação e release.

Documentos principais:

- `docs/README-V1.md` — visão geral da V1
- `docs/CRITERIOS-V1.md` — critérios funcionais e de aceite
- `docs/FLUXO-OPERACIONAL-V1.md` — fluxo operacional da solução
- `docs/MANUAL-HOMOLOGACAO-V1.md` — manual de homologação
- `docs/ROTEIRO-HOMOLOGACAO-V1.md` — roteiro de validação executiva
- `docs/RELEASE-V1.md` — checklist de release

## Qualidade técnica

Antes da homologação visual, a V1 passou pelos gates automatizados de:

- reconciliação financeira (Zero Difference Gate)
- regras de período (Period Gate)
- integração entre demonstrações financeiras (Integrated Financial Gate)
- build da aplicação

A regra central é: **nenhum valor é inventado para forçar uma reconciliação**.

## Próxima etapa — V2

A V2 será orientada à operação com dados reais, evoluindo a arquitetura para:

1. ingestão e importação de dados;
2. mapeamento de plano de contas e centros de resultado;
3. separação definitiva entre dados, regras de negócio e apresentação;
4. trilha de auditoria e histórico de fechamentos;
5. suporte a empresas/entidades e perfis de acesso;
6. exportações e relatórios gerenciais.

## Deploy

O projeto está conectado ao Vercel para implantação automática a partir da branch `main`.
