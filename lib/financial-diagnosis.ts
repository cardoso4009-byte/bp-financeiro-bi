import type { Indicator, AccountingIndicatorSnapshot } from './financial-indicators'

export type DiagnosisSeverity = 'critical' | 'attention' | 'positive'
export type Diagnosis = {
 key: string
 severity: DiagnosisSeverity
 title: string
 signal: string
 hypothesis: string
 action: string
}

const push = (items: Diagnosis[], item: Diagnosis) => items.push(item)

export function buildFinancialDiagnosis(snapshot: AccountingIndicatorSnapshot, gerencial: Indicator[]): Diagnosis[] {
 const items: Diagnosis[] = []
 const ebitda = gerencial.find(i => i.key === 'ebitdaMargin')
 const pmr = gerencial.find(i => i.key === 'pmr')
 const pmp = gerencial.find(i => i.key === 'pmp')
 const cycle = gerencial.find(i => i.key === 'cycle')

 if (snapshot.currentRatio < 1) push(items,{key:'liquidity-critical',severity:'critical',title:'Liquidez de curto prazo pressionada',signal:`Liquidez Corrente ${snapshot.currentRatio.toFixed(2)}x`,hypothesis:'Os ativos circulantes não cobrem integralmente as obrigações de curto prazo na posição analisada.',action:'Priorizar caixa, reprogramar saídas não essenciais e revisar vencimentos de curto prazo.'})
 else if (snapshot.currentRatio < 1.2) push(items,{key:'liquidity-attention',severity:'attention',title:'Folga de liquidez reduzida',signal:`Liquidez Corrente ${snapshot.currentRatio.toFixed(2)}x`,hypothesis:'A cobertura de curto prazo existe, mas a margem de segurança é estreita.',action:'Preservar caixa mínimo e acompanhar semanalmente recebimentos e vencimentos.'})

 if (snapshot.ncg > 0 && snapshot.currentRatio < 1.2) push(items,{key:'ncg-liquidity',severity:'critical',title:'Capital de giro é foco prioritário',signal:`NCG ${snapshot.ncg.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})}`,hypothesis:'A operação demanda recursos e a liquidez disponível apresenta pouca folga.',action:'Atacar simultaneamente recebíveis, estoques e prazo de fornecedores antes de ampliar despesas.'})
 else if (snapshot.ncg > 0) push(items,{key:'ncg',severity:'attention',title:'Operação consome capital de giro',signal:`NCG positiva de ${snapshot.ncg.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})}`,hypothesis:'Parte dos recursos permanece aplicada no ciclo operacional.',action:'Reduzir prazo de recebimento, estoques sem giro e negociar melhores prazos de pagamento.'})

 if (pmr && pmr.value > 60) push(items,{key:'pmr-critical',severity:'critical',title:'Recebimento lento',signal:`PMR ${pmr.value.toFixed(1)} dias`,hypothesis:'O caixa pode estar sendo pressionado por prazo elevado de conversão de vendas em recebimento.',action:'Priorizar cobrança, revisar crédito e negociar antecipações seletivas.'})
 else if (pmr && pmr.value > 45) push(items,{key:'pmr-attention',severity:'attention',title:'Prazo de recebimento merece atenção',signal:`PMR ${pmr.value.toFixed(1)} dias`,hypothesis:'O prazo de recebimento está acima de uma referência gerencial de 45 dias.',action:'Acompanhar aging e criar plano para reduzir atrasos e concentração de recebíveis.'})

 if (pmp && pmp.value < 30) push(items,{key:'pmp-critical',severity:'critical',title:'Prazo de pagamento curto',signal:`PMP ${pmp.value.toFixed(1)} dias`,hypothesis:'As saídas operacionais podem ocorrer antes de a receita se converter em caixa.',action:'Negociar prazo com fornecedores sem comprometer condições comerciais estratégicas.'})
 else if (pmp && pmp.value < 45) push(items,{key:'pmp-attention',severity:'attention',title:'PMP pode ser otimizado',signal:`PMP ${pmp.value.toFixed(1)} dias`,hypothesis:'Há espaço potencial para alinhar pagamentos ao ciclo de recebimento.',action:'Renegociar prazos e concentrar vencimentos de forma compatível com o fluxo de caixa.'})

 if (cycle && cycle.value > 45) push(items,{key:'cycle-critical',severity:'critical',title:'Ciclo financeiro elevado',signal:`Ciclo ${cycle.value.toFixed(1)} dias`,hypothesis:'O caixa permanece comprometido por período relevante entre pagamento e recebimento.',action:'Combinar redução do PMR com aumento responsável do PMP e redução de estoques.'})
 else if (cycle && cycle.value > 30) push(items,{key:'cycle-attention',severity:'attention',title:'Ciclo financeiro pode ser reduzido',signal:`Ciclo ${cycle.value.toFixed(1)} dias`,hypothesis:'O ciclo operacional ainda mantém recursos comprometidos por mais de 30 dias.',action:'Atuar nas duas pontas do ciclo: cobrança e negociação de prazos.'})

 if (snapshot.netMargin < 0) push(items,{key:'margin-critical',severity:'critical',title:'Margem líquida negativa',signal:`Margem líquida ${(snapshot.netMargin*100).toFixed(1)}%`,hypothesis:'O resultado líquido não remunera positivamente a estrutura atual.',action:'Revisar preço, margem de contribuição, OPEX, despesas financeiras e itens não recorrentes.'})
 else if (snapshot.netMargin < .05) push(items,{key:'margin-attention',severity:'attention',title:'Margem líquida estreita',signal:`Margem líquida ${(snapshot.netMargin*100).toFixed(1)}%`,hypothesis:'Pequenas variações de receita ou despesa podem afetar significativamente o lucro.',action:'Proteger margem por produto/serviço e estabelecer metas de redução de OPEX.'})

 if (ebitda && ebitda.value < 0) push(items,{key:'ebitda-critical',severity:'critical',title:'Operação sem geração de EBITDA',signal:`Margem EBITDA ${(ebitda.value*100).toFixed(1)}%`,hypothesis:'A receita atual não cobre o OPEX considerado na visão gerencial.',action:'Revisar preços, mix, produtividade e despesas operacionais antes de ampliar estrutura.'})
 else if (ebitda && ebitda.value < .05) push(items,{key:'ebitda-attention',severity:'attention',title:'Margem operacional apertada',signal:`Margem EBITDA ${(ebitda.value*100).toFixed(1)}%`,hypothesis:'A operação possui pouca proteção contra oscilações de receita e custos.',action:'Monitorar margem por centro de custo e buscar ganhos de produtividade.'})

 if (snapshot.debtRatio > .7) push(items,{key:'debt-critical',severity:'critical',title:'Endividamento elevado',signal:`Endividamento ${(snapshot.debtRatio*100).toFixed(1)}%`,hypothesis:'A estrutura apresenta forte dependência de capital de terceiros.',action:'Priorizar desalavancagem, serviço da dívida e análise de novas captações.'})
 else if (snapshot.debtRatio > .5) push(items,{key:'debt-attention',severity:'attention',title:'Endividamento merece acompanhamento',signal:`Endividamento ${(snapshot.debtRatio*100).toFixed(1)}%`,hypothesis:'Capital de terceiros representa parcela relevante da estrutura patrimonial.',action:'Controlar novas dívidas e acompanhar cobertura do serviço da dívida.'})

 if (snapshot.roic < 0) push(items,{key:'roic-critical',severity:'critical',title:'ROIC negativo',signal:`ROIC ${(snapshot.roic*100).toFixed(1)}%`,hypothesis:'O capital investido não está produzindo retorno operacional positivo na base atual.',action:'Revisar ativos que consomem capital, margem operacional e produtividade dos investimentos.'})
 else if (snapshot.roic < .1) push(items,{key:'roic-attention',severity:'attention',title:'Retorno sobre capital moderado',signal:`ROIC ${(snapshot.roic*100).toFixed(1)}%`,hypothesis:'O retorno operacional sobre o capital investido ainda pode ganhar eficiência.',action:'Comparar retorno por unidade de capital e priorizar investimentos com maior geração operacional.'})

 if (snapshot.fixedAssetToEquity > 1) push(items,{key:'fixed-assets-critical',severity:'critical',title:'Imobilização acima do PL',signal:`Imobilização ${(snapshot.fixedAssetToEquity*100).toFixed(1)}%`,hypothesis:'O ativo não circulante supera o patrimônio líquido na estrutura atual.',action:'Evitar imobilização excessiva e avaliar financiamento de longo prazo para ativos permanentes.'})
 else if (snapshot.fixedAssetToEquity > .7) push(items,{key:'fixed-assets-attention',severity:'attention',title:'Imobilização relevante do PL',signal:`Imobilização ${(snapshot.fixedAssetToEquity*100).toFixed(1)}%`,hypothesis:'Parcela relevante do patrimônio está concentrada em ativos não circulantes.',action:'Acompanhar retorno dos ativos e preservar recursos para financiar o giro.'})

 if (!items.length) push(items,{key:'healthy',severity:'positive',title:'Estrutura financeira sem alertas prioritários',signal:'Indicadores dentro das faixas gerenciais',hypothesis:'A base disponível não apresenta sinais relevantes de ruptura nos indicadores analisados.',action:'Manter disciplina financeira e buscar evolução de margem, ciclo e retorno sobre capital.'})

 return items.sort((a,b)=>({critical:0,attention:1,positive:2}[a.severity]-({critical:0,attention:1,positive:2}[b.severity])) )
}

export function diagnosisSummary(diagnoses:Diagnosis[]) {
 const critical=diagnoses.filter(d=>d.severity==='critical')
 const attention=diagnoses.filter(d=>d.severity==='attention')
 if(critical.length) return `Atenção máxima em ${critical.slice(0,3).map(d=>d.title).join(', ')}. Essas frentes devem entrar primeiro no plano de ação.`
 if(attention.length) return `Não há ruptura prioritária, mas ${attention.slice(0,3).map(d=>d.title).join(', ')} merecem acompanhamento.`
 return 'A base atual apresenta leitura financeira favorável, sem alertas prioritários.'
}
