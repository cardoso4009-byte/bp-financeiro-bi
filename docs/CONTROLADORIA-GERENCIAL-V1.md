# Controladoria Gerencial V1

## Primeira camada: Orçado × Realizado

A Controladoria Gerencial começa sobre a Base Financeira V2 já homologada. O orçamento é uma camada de planejamento separada dos lançamentos realizados.

### Princípios

- O orçamento não altera a Base Financeira V2.
- Realizado é calculado diretamente dos lançamentos persistidos.
- A comparação usa a mesma competência, centro de resultado e classe de movimento quando informados.
- A variação é **Realizado − Orçado**.
- Valores orçados são explícitos; não são inferidos a partir do realizado.
- Ausência de centro de resultado permanece como **SEM-CC**.
- Não há rateio automático.
- Um orçamento sem realizado continua visível; um realizado sem orçamento também continua visível.

### Estrutura

Cada linha orçamentária contém:

**Empresa + Competência + Centro de Resultado + Classe de Movimento + Valor + identificação opcional da conta**

A conta pode ser usada para granularidade futura, mas a primeira camada compara por centro e classe para evitar falsa precisão.

### Leitura da variação

- Receita: variação positiva significa realizado acima do orçamento.
- Custos/OPEX: a variação segue o sinal gerencial da linha; portanto, uma despesa realizada mais negativa que o orçamento gera variação negativa.
- CAPEX: permanece separado do EBITDA e do resultado líquido.
- Resultado da comparação não cria ajustes contábeis.

### Critérios de aceite

- [x] Modelo de orçamento explícito
- [x] Validação de competência, empresa, valor e ID
- [x] Comparação Orçado × Realizado
- [x] Variação absoluta
- [x] Variação percentual quando houver base orçada
- [x] Dimensão por centro de resultado
- [x] Dimensão por classe de movimento
- [x] Sem rateio automático
- [x] Gate automatizado

### Próxima evolução

Adicionar a camada **Causa → Alerta → Ação**, com limites configuráveis e histórico das decisões gerenciais, sem transformar alertas em lançamentos financeiros.
