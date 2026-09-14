# BP Financeiro BI — Critérios de Aceite V1

## Bloqueantes

- Qualquer divergência entre DRE, BP, DFC ou DMPL.
- Reconciliação diferente de zero nas integrações contábeis.
- Filtro de período exibindo competência diferente dos dados.
- Acumulado calculado como repetição do mês selecionado em indicadores de fluxo.
- Comparativo sem período anterior ou com variação incorreta quando houver competência anterior disponível.
- Erro de build ou falha em qualquer gate financeiro.

## Correções antes da produção

- Layout inconsistente entre módulos.
- Rótulos ambíguos de mensal/acumulado/comparativo.
- Indicador sem explicação da natureza de fluxo ou posição.
- Alertas que não acompanham a competência selecionada.

## Melhorias futuras

- Importação automática de ERP.
- Autenticação e perfis de acesso.
- Multiempresa.
- Histórico de fechamentos.
- Exportação gerencial.
- Trilhas de auditoria persistentes.

## Regra de ouro

**Nenhum valor deve ser criado apenas para fechar uma reconciliação.** Toda divergência deve apontar para a origem do dado ou para uma regra de negócio explicitamente documentada.
