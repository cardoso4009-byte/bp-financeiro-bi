# Critérios de Pronto — V2

## Objetivo
A V2 está pronta quando a operação gerencial puder percorrer, de forma rastreável, a cadeia:

**Base Financeira → Orçamento → Realizado → Forecast → Alerta → Causa → Ação**

## Critérios funcionais

### 1. Base financeira
- [ ] Dados de origem preservados.
- [ ] Importação/persistência V2 funcionando.
- [ ] Competência e período tratados de forma consistente.
- [ ] Dados não classificados permanecem identificáveis.
- [ ] Nenhum rateio ou redistribuição automática sem regra explícita.

### 2. Demonstrações
- [ ] DRE V2 validada.
- [ ] DFC V2 validada.
- [ ] BP V2 validado.
- [ ] Reconciliação executada.
- [ ] Visões mensal, acumulada e comparativa coerentes.

### 3. Gestão
- [ ] Centros de Resultado integrados.
- [ ] Orçamento × Realizado disponível.
- [ ] Desvios identificáveis.
- [ ] Alertas gerenciais rastreáveis.
- [ ] Causas registráveis.
- [ ] Plano de ação registrável e vinculado ao contexto gerencial.

### 4. Forecast
- [ ] Realizado e projetado separados.
- [ ] Forecast mensal disponível.
- [ ] Budget × Forecast disponível.
- [ ] Forecast × Actual disponível.
- [ ] Desvios e impactos apresentados.
- [ ] Forecast oficial permanece independente dos cenários.

### 5. Cenários
- [ ] Base, Conservador e Agressivo disponíveis.
- [ ] Fatores explícitos.
- [ ] Resultado dos cenários reproduzível.
- [ ] Cenários não alteram o Forecast oficial.

### 6. Governança
- [ ] Gates automatizados passando.
- [ ] Build passando.
- [ ] Rastreabilidade entre origem e resultado.
- [ ] Sem valores artificiais para forçar fechamento/reconciliação.
- [ ] Alterações relevantes documentadas.

### 7. Experiência
- [ ] Shell único.
- [ ] Navegação interna no mesmo aplicativo.
- [ ] Identidade visual consistente.
- [ ] Visões V2 acessíveis pelo menu principal.
- [ ] Produção refletindo a branch main homologada.

## Critério de encerramento

A V2 pode ser marcada como **Homologada** quando todos os critérios acima estiverem validados e não houver bloqueador funcional, financeiro ou de governança aberto.

Itens exclusivamente cosméticos podem ser registrados como melhoria posterior, desde que não comprometam leitura, navegação ou interpretação dos dados.
