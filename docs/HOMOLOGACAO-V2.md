# Matriz de Homologação Gerencial V2

## Objetivo

Formalizar os critérios de aceite da camada financeira V2 antes da evolução para Controladoria Gerencial.

## H1 — Integridade

- [x] Base Financeira V2 persistida e validada
- [x] Importação CSV validada
- [x] Persistência validada
- [x] Classificação explícita
- [x] Controle de liquidação
- [x] IDs externos e duplicidades auditáveis
- [x] V1 preservada

## H2 — Cálculo

- [x] DRE V2
- [x] DFC V2
- [x] BP V2
- [x] Reconciliação V2
- [x] Cockpit Executivo V2
- [x] Centros de Resultado
- [x] Drill-down por centro
- [x] Períodos mensal, acumulado e comparativo
- [x] Build e gates automatizados

## H3 — Gestão

- [x] Receita, EBITDA e Resultado Líquido no Cockpit
- [x] Margens e variações
- [x] Drivers da DRE
- [x] Evolução por competência
- [x] Visão por Centro de Resultado
- [x] Acesso aos lançamentos que formam o resultado
- [x] Separação de lançamentos sem classificação

## H4 — Auditoria

- [x] Rastreabilidade até o lançamento V2
- [x] Conta, classe, natureza, competência e liquidação identificáveis
- [x] DRE x DFC tratado por critérios de reconhecimento distintos
- [x] BP x Resultado sem fechamento artificial
- [x] Pendências estruturais explicitadas
- [x] Ausência de rateios automáticos

## Critérios de aceite

A V2 pode avançar para a camada de Controladoria Gerencial quando:

1. H1 estiver íntegro;
2. H2 estiver coberto pelos gates automatizados;
3. H3 permitir leitura gerencial dos principais indicadores;
4. H4 preservar rastreabilidade e governança;
5. nenhuma regra financeira depender de rateio ou inferência não documentada.

## Próxima fase

**Controladoria Gerencial**

Orçado × Realizado → Variação → Causa → Alerta → Ação gerencial.
