# BP Financeiro BI — Manual de Homologação V1

## 1. Objetivo

Este documento orienta a validação funcional da V1 do BP Financeiro BI antes da utilização com dados reais.

## 2. Ordem recomendada de uso

1. **Visão Executiva** — identificar prioridades e confirmar a competência selecionada.
2. **DRE Gerencial** — validar resultado mensal, acumulado e comparativo.
3. **Balanço Patrimonial** — validar posição patrimonial e equação Ativo = Passivo + Patrimônio Líquido.
4. **DFC Gerencial** — validar geração e reconciliação de caixa.
5. **DMPL** — validar a ponte do patrimônio líquido.
6. **Indicadores / Capital de Giro** — avaliar liquidez, endividamento, ciclo financeiro e necessidade de capital de giro.
7. **Fechamento / Auditoria** — verificar pendências e integridade antes do fechamento.

## 3. Regra do filtro de período

Todas as telas que utilizam o filtro padronizado seguem:

- **Ano:** exercício de análise.
- **Mês:** competência de referência.
- **Mensal:** somente a competência selecionada.
- **Acumulado:** janeiro até a competência selecionada.
- **Comparativo:** competência selecionada contra a competência anterior.
- Em janeiro, a competência anterior é dezembro do exercício anterior quando houver dados disponíveis.

### Importante

Posições patrimoniais, caixa final e capital de giro não devem ser somadas no acumulado. Para esses indicadores, o acumulado representa a **posição de fechamento da competência selecionada**.

## 4. Checklist funcional

### Período

- [ ] Ano correto.
- [ ] Mês correto.
- [ ] Mensal altera para apenas o mês selecionado.
- [ ] Acumulado soma janeiro até o mês selecionado para indicadores de fluxo.
- [ ] Comparativo apresenta atual, anterior e variação.
- [ ] Janeiro trata corretamente a competência anterior.

### DRE

- [ ] Receita líquida correta.
- [ ] Lucro bruto correto.
- [ ] EBITDA correto.
- [ ] Resultado operacional correto.
- [ ] Resultado financeiro correto.
- [ ] Lucro líquido correto.
- [ ] Acumulado diferente do mensal quando o mês selecionado não for janeiro.
- [ ] Comparativo mostra variação contra o mês anterior.

### Balanço

- [ ] Ativo total correto.
- [ ] Passivo total correto.
- [ ] Patrimônio líquido correto.
- [ ] Ativo = Passivo + PL.
- [ ] Capital de giro coerente com a posição selecionada.
- [ ] Comparativo usa a competência anterior disponível.

### DFC

- [ ] Fluxo operacional reconciliado.
- [ ] Fluxo de investimentos correto.
- [ ] Fluxo de financiamentos correto.
- [ ] Variação líquida de caixa correta.
- [ ] Caixa final da DFC = caixa no razão.
- [ ] Acumulado representa o fluxo de janeiro até o mês selecionado.
- [ ] Comparativo mostra atual × anterior × variação.

### DMPL

- [ ] PL inicial correto.
- [ ] Lucro líquido correto.
- [ ] Dividendos/distribuições corretos.
- [ ] Outros movimentos corretos.
- [ ] PL calculado pela ponte = PL final contábil.
- [ ] Reconciliação igual a zero.
- [ ] Comparativo mostra atual × anterior × variação.

### Indicadores e gestão

- [ ] Liquidez corrente coerente.
- [ ] Endividamento coerente.
- [ ] PMR, PMP e ciclo financeiro coerentes.
- [ ] NCG coerente.
- [ ] Alertas refletem a competência selecionada.
- [ ] Visão Executiva não mistura competências entre seus blocos.

## 5. Critérios de aprovação da V1

A V1 pode ser considerada homologada quando:

1. Todos os itens críticos acima estiverem aprovados.
2. Zero Difference Gate estiver verde.
3. Period Gate estiver verde.
4. Integrated Financial Gate estiver verde.
5. O build estiver verde.
6. Não houver divergência visual entre Ano/Mês/Visão e o conteúdo apresentado.
7. As divergências encontradas forem classificadas como **bloqueante**, **correção antes da produção** ou **melhoria futura**.

## 6. Dados demonstrativos

A V1 atual utiliza dados demonstrativos do modelo financeiro. Antes da entrada em produção com uma empresa real, os dados devem ser substituídos por uma camada de entrada/importação controlada, preservando as regras de cálculo e reconciliação.

## 7. Próxima etapa após homologação

Depois da aprovação visual e funcional da V1, a evolução recomendada é:

- ingestão de dados reais;
- plano de contas e mapeamento contábil;
- importação de razão/balancete;
- orçamento e realizado com competência real;
- fechamento por competência;
- usuários, permissões e trilha de auditoria;
- documentação operacional definitiva.
