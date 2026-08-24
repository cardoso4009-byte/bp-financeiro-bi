'use client'

import { useEffect, useMemo, useState } from 'react'
import { initialEntries, type FinancialEntry } from '@/lib/lancamentos-data'
import { buildIntegratedModel } from '@/lib/integrated-model'

const brl = (n:number) => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

export default function Integracao(){
  const [entries,setEntries]=useState<FinancialEntry[]>(initialEntries)
  useEffect(()=>{ const raw=localStorage.getItem('bp-financeiro-lancamentos'); if(raw) setEntries(JSON.parse(raw)) },[])
  const m=useMemo(()=>buildIntegratedModel(entries),[entries])
  const check = m.caixaFinal - (m.caixaInicial+m.caixaOperacional+m.investimentos+m.financiamentos)
  return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1500,margin:'0 auto'}}>
    <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Integração Financeira</h1><p>Lançamentos → DRE → DFC → Caixa • Motor integrado</p></div><div className="period">Base atual</div></header>
    <div className="cards">
      <Card title="Receita Bruta" value={m.receitaBruta} sub={`${m.lancamentos} lançamentos`}/>
      <Card title="Lucro Líquido" value={m.lucroLiquido} sub="Regime de competência"/>
      <Card title="Caixa Operacional" value={m.caixaOperacional} sub="Somente pagos"/>
      <Card title="Caixa Final" value={m.caixaFinal} sub="Conciliação automática"/>
    </div>
    <div className="grid">
      <section className="panel"><div className="panel-title"><h2>DRE derivada dos lançamentos</h2><span>Competência</span></div>
        <Rows rows={[["Receita Bruta",m.receitaBruta],["(-) Deduções",m.deducoes],["= Receita Líquida",m.receitaLiquida],["(-) Custos",m.custos],["= Lucro Bruto",m.lucroBruto],["(-) Despesas Comerciais",m.despesasComerciais],["(-) Despesas Administrativas",m.despesasAdministrativas],["(-) Outras Operacionais",m.outrasDespesasOperacionais],["= Resultado Operacional",m.resultadoOperacional],["(+/-) Resultado Financeiro",m.resultadoFinanceiro],["(-) IR/CSLL",m.irCsll],["= LUCRO LÍQUIDO",m.lucroLiquido]]}/>
      </section>
      <section className="panel"><div className="panel-title"><h2>DFC derivada dos pagamentos</h2><span>Caixa</span></div>
        <Rows rows={[["Caixa Inicial",m.caixaInicial],["(+) Operacional",m.caixaOperacional],["(-) Investimentos",m.investimentos],["(+) Financiamentos",m.financiamentos],["= CAIXA FINAL",m.caixaFinal]]}/>
        <div className="check"><i className={check===0?'ok':'bad'}>{check===0?'✓':'!'}</i><div><b>Conciliação de caixa</b><small>{check===0?'Caixa final fecha matematicamente.':'Revisar integração.'}</small></div></div>
      </section>
    </div>
    <section className="panel"><div className="panel-title"><h2>Regras do motor</h2><span>Governança</span></div><div className="rows">
      <div className="row"><span>Competência alimenta</span><b>DRE</b></div>
      <div className="row"><span>Pago alimenta</span><b>DFC / Caixa</b></div>
      <div className="row"><span>CAPEX pago alimenta</span><b>Investimento</b></div>
      <div className="row"><span>Financiamento pago alimenta</span><b>Financiamento</b></div>
      <div className="row"><span>Saldo em aberto</span><b>{brl(m.saldoAberto)}</b></div>
    </div></section>
    <section className="panel"><div className="panel-title"><h2>Próxima camada</h2><span>BP e Capital de Giro</span></div><div className="note">Para o Balanço Patrimonial deixar de ser demonstrativo, cada lançamento precisará também ter conta contábil e contrapartida (Caixa, Clientes, Estoques, Fornecedores, Imobilizado, Empréstimos, PL etc.). A partir daí o BI poderá montar automaticamente Ativo = Passivo + PL e reconciliar a DFC com o Caixa.</div></section>
  </main>
}
function Card({title,value,sub}:{title:string,value:number,sub:string}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div>}
function Rows({rows}:{rows:(string|number)[][]}){return <div className="rows">{rows.map(([x,v])=><div className="row" key={x as string}><span>{x}</span><b>{brl(v as number)}</b></div>)}</div>}
