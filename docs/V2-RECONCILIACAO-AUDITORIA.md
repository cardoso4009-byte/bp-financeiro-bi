# V2 — Reconciliação e Auditoria

A V2 passa a ter uma camada explícita de governança entre os motores de DRE, DFC e BP.

## Princípios

- DRE reconhece pela competência.
- DFC reconhece pela liquidação efetiva.
- BP é uma fotografia patrimonial acumulada até a competência.
- Diferença entre resultado e caixa é tratada como ponte de timing, não como erro automático.
- O movimento do Patrimônio Líquido é comparado ao resultado, mas não é fechado artificialmente: capital, distribuições, ajustes e lançamentos de encerramento continuam sendo fatos contábeis distintos.
- A equação patrimonial é testada sem criação de lançamentos de compensação.
- IDs externos duplicados são sinalizados como possível duplicidade de importação.
- Lançamentos sem liquidação e lançamentos marcados como caixa sem settlementDate ficam visíveis para governança.

## Status

- ok: sem inconsistência estrutural crítica detectada.
- pending: há classificação incompleta que impede confiança plena na visão.
- attention: há item relevante para revisão, como duplicidade ou desequilíbrio patrimonial.

A auditoria é diagnóstica. Ela não altera a Base Financeira V2 e não cria valores para fechar demonstrações.
