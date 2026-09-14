# V2 — Arquitetura de Dados Reais

## Objetivo

Transformar o BP Financeiro de uma aplicação com dados demonstrativos em uma plataforma capaz de receber, classificar, validar e consolidar dados financeiros reais.

## Camadas

1. **Entrada** — manual, CSV, Excel, ERP ou API.
2. **Staging** — preserva o arquivo/origem e registra o lote de importação.
3. **Normalização** — converte datas, competências, valores e naturezas para o contrato canônico.
4. **Classificação** — plano de contas, centro de custo e classe gerencial.
5. **Validação** — empresa, conta, competência, valores, duplicidade e consistência.
6. **Conciliação** — DRE × BP × DFC × DMPL.
7. **Apresentação** — reutiliza os relatórios e filtros da V1.

## Entidades principais

- `Company`: empresa/entidade econômica.
- `Account`: plano de contas e vínculo com demonstrações.
- `CostCenter`: centro de custo.
- `FinancialEntry`: lançamento financeiro/contábil canônico.
- `ImportBatch`: lote e rastreabilidade da origem.

## Regras fundamentais

- Toda entrada deve pertencer a uma empresa.
- Toda entrada deve possuir conta e competência.
- Valores não são ajustados artificialmente para fechar demonstrações.
- Competência e caixa são atributos distintos.
- A origem do dado deve ser preservada.
- Importações devem ser rastreáveis por lote e identificador externo quando disponível.
- A V1 não deve ser quebrada pela introdução da V2.

## Ordem de implementação

### Fase 1 — contrato
Modelo canônico e regras de validação.

### Fase 2 — importação
CSV/Excel com pré-visualização, validação e relatório de rejeições.

### Fase 3 — classificação
Mapeamento de plano de contas e centros de custo.

### Fase 4 — motores reais
Substituir progressivamente o dado demonstrativo por dados persistidos, mantendo os mesmos contratos dos relatórios.

### Fase 5 — governança
Fechamento, auditoria, permissões, histórico e preparação para multiempresa.

## Decisão arquitetural

Os relatórios da V1 devem consumir um modelo financeiro intermediário estável. Assim, a origem do dado pode evoluir de demonstrativa para importada/ERP sem reescrever DRE, BP, DFC e DMPL.
