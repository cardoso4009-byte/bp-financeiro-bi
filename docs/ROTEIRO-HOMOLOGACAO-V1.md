# Roteiro de Homologação Visual V1

## Cenário 1 — Mensal

Selecionar Dezembro/2026 + Mensal.

Esperado:
- DRE apresenta somente Dezembro como competência de fluxo.
- DFC apresenta os fluxos de Dezembro.
- DMPL apresenta a movimentação de Dezembro.
- BP apresenta a posição de fechamento de Dezembro.

## Cenário 2 — Acumulado

Selecionar Dezembro/2026 + Acumulado.

Esperado:
- DRE acumula Janeiro–Dezembro.
- DFC acumula os fluxos de Janeiro–Dezembro.
- DMPL acumula a movimentação do exercício.
- BP, caixa final e capital de giro permanecem como posição de Dezembro, e não como soma dos meses.

## Cenário 3 — Comparativo

Selecionar Dezembro/2026 + Comparativo.

Esperado:
- Comparar Dezembro/2026 com Novembro/2026.
- Exibir Atual, Anterior e Variação.
- DRE/DFC/DMPL mostram variação do fluxo.
- BP e indicadores patrimoniais mostram variação da posição.

## Cenário 4 — Virada de ano

Selecionar Janeiro/2026 + Comparativo.

Esperado:
- Se Dezembro/2025 estiver disponível, comparar Janeiro/2026 × Dezembro/2025.
- Se não houver competência anterior disponível, informar explicitamente a indisponibilidade, sem reutilizar Janeiro/2026 como comparação.

## Evidências

Para cada cenário, registrar um print contendo Ano, Mês, Visão e os principais valores da tela. O print deve permitir verificar que o conteúdo acompanha o filtro.
