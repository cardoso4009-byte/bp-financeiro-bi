# V2 — Centros de Resultado

## Objetivo

Adicionar uma dimensão gerencial explícita aos lançamentos V2 para analisar receita, custos, OPEX, CAPEX, financeiro e impostos por centro de resultado.

## Regras

- O centro de resultado é uma dimensão do lançamento e não substitui a classificação contábil.
- Lançamentos sem `costCenterId` permanecem visíveis em **Sem centro de resultado**.
- A V2 não infere centro de resultado a partir da descrição ou da conta.
- Receita segue a mesma convenção da DRE V2.
- Custos, OPEX, financeiro e impostos seguem a mesma contribuição da DRE V2.
- CAPEX é demonstrado separadamente e não entra no resultado líquido.
- O fechamento por centro não cria rateios ou ajustes artificiais.
- O relatório é mensal por competência, preservando a regra da DRE V2.

## Persistência

Os centros cadastrados no navegador ficam em `bp-financeiro-v2-cost-centers`.

Os lançamentos importados já suportam `cost_center_id` no CSV. A tela permite classificar individualmente lançamentos ainda sem centro e grava a alteração na Base Financeira V2.

## Próximo passo

A evolução natural é levar essa dimensão para OPEX, DRE e orçamento, mantendo a mesma Base Financeira V2.
