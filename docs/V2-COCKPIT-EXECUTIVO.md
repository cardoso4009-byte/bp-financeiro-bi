# V2 — Cockpit Executivo

A visão executiva V2 consolida os motores financeiros existentes em uma camada de leitura gerencial, sem criar uma segunda fonte de verdade.

## Indicadores
- Receita e margem EBITDA por competência.
- Resultado líquido e margem líquida.
- Caixa operacional e variação total de caixa por liquidação.
- Diferença patrimonial quando o BP está classificado.

## Variações
O cockpit compara o período selecionado com o período imediatamente anterior para resultado e caixa. Percentuais só são calculados quando existe uma base anterior diferente de zero.

## Qualidade
A visão executiva reutiliza a auditoria V2 para expor classificação incompleta, lançamentos sem liquidação, IDs externos duplicados e pendências estruturais.

## Evolução
As últimas competências disponíveis na DRE/DFC são exibidas em uma série compacta de Receita, EBITDA, Resultado e Caixa.

## Governança
DRE continua baseada em competência, DFC em liquidação e BP em fotografia acumulada. O cockpit apenas apresenta os resultados dos motores existentes; não cria ajustes, encerramentos automáticos ou classificações artificiais.

## Centros de resultado

O cockpit também consolida a DRE por centro de resultado, exibindo Receita, Custos, OPEX, EBITDA, margem EBITDA, Resultado líquido e margem líquida por centro na competência selecionada. Lançamentos sem centro permanecem em uma linha separada para governança e não recebem rateio, inferência ou redistribuição automática.

A dimensão de centro de resultado é uma leitura derivada dos lançamentos V2 já classificados. Ela não cria uma nova fonte de verdade nem altera os motores de DRE, DFC ou BP.
