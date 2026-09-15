# V2 — Importação CSV

## Objetivo

Definir o contrato inicial para entrada de dados financeiros por CSV, sem alterar os cálculos ou a interface da V1.

## Fluxo

`CSV → parser → staging → validação → aprovados/rejeitados → FinancialEntry`

O staging deve manter o número da linha original para que cada rejeição possa ser localizada no arquivo de origem.

## Cabeçalho canônico

```text
company_id,account_id,description,date,competence,amount,nature,cash_basis,movement_class,external_id
```

Campos opcionais aceitos pelo contrato também podem ser enviados:

```text
id,cost_center_id,document,due_date,settlement_date
```

## Formatos

- `date`: `YYYY-MM-DD`.
- `competence`: `YYYY-MM`.
- `amount`: aceita formato decimal com ponto ou padrão brasileiro com ponto de milhar e vírgula decimal.
- `nature`: `debit` ou `credit`.
- `cash_basis`: `caixa` ou `competencia`.
- `movement_class`: `receita`, `custo`, `opex`, `capex`, `financeiro`, `imposto`, `transferencia` ou `outros`.
- `external_id`: recomendado para rastreabilidade e detecção de duplicidade.

## Resultado do staging

Cada linha recebe:

- número da linha;
- lançamento normalizado;
- lista de erros;
- status `accepted` ou `rejected`.

O lote consolida `rowsReceived`, `rowsAccepted` e `rowsRejected`.

## Regra de segurança

Linhas rejeitadas não devem alimentar os demonstrativos. Nenhum valor deve ser alterado artificialmente para produzir reconciliação.

## Próximo incremento

Adicionar uma interface de upload com pré-visualização, resumo do lote e download/visualização das rejeições antes da persistência definitiva.
