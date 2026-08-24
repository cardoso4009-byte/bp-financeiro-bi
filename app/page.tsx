'use client'

import { useState } from 'react'
import { checks, financialData as d, indicators } from '@/lib/financial-data'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const pct = (n: number) => `${(n * 100).toFixed(1).replace('.', ',')}%`
const nav = [['Visão Executiva','exec'],['DRE Gerencial','dre'],['Balanço','bp'],['DFC','dfc'],['DMPL','dmpl'],['Indicadores','ind']] as const

export default function Home() {
  const [page, setPage] = useState('exec')
  const item = nav.find(x => x[1] === page)?.[0]
  return <main className="shell">
    <aside className="side">
      <div className="brand"><b>BP</b><div><strong>BP Financeiro</strong><span>Controladoria & BI</span></div></div>
      <div className="company"><small>EMPRESA DEMONSTRATIVA</small><strong>Grupo Exemplo</strong><span>2026 • Modelo integrado</span></div>
      <nav>{nav.map(([label,id]) => <button key={id} className={page===id?'active':''} onClick={()=>setPage(id)}>{label}</button>)}</nav>
      <footer>V1.1 • Projeto Consultoria Financeira</footer>
    </aside>
    <section className="content">
      <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>{item}</h1><p>Demonstrações integradas • Regime de competência</p></div><div className="period">Jan–Dez 2026</div></header>
      {page==='exec' && <Executive/>}{page==='dre' && <DRE/>}{page==='bp' && <BP/>}{page==='dfc' && <DFC/>}{page==='dmpl' && <DMPL/>}{page==='ind' && <Indicators/>}
    </section>
  </main>
}

function Executive(){return <>
  <div className="cards"><Card title="Receita Líquida" value={d.receitaLiquida}/><Card title="Lucro Líquido" value={d.lucroLiquido}/><Card title="Caixa Final" value={d.caixaFinal}/><Card title="Patrimônio Líquido" value={d.plFinal}/></div>
  <div className="grid"><Panel title="DRE resumida"><Rows rows={[["Receita Líquida",d.receitaLiquida],["Lucro Bruto",d.lucroBruto],["Resultado Operacional",d.resultadoOperacional],["Lucro Líquido",d.lucroLiquido]]}/></Panel><Panel title="Geração de caixa"><Rows rows={[["Operacional",d.caixaOperacional],["Investimento",d.investimentos],["Financiamento",d.financiamentos],["Variação líquida",d.caixaFinal-d.caixaInicial]]}/></Panel></div>
  <div className="grid"><Panel title="Estrutura patrimonial"><Bar label="Ativo" value={d.ativoTotal} max={d.ativoTotal}/><Bar label="Passivo" value={d.passivoTotal} max={d.ativoTotal}/><Bar label="Patrimônio Líquido" value={d.plFinal} max={d.ativoTotal}/></Panel><Panel title="Checks de integridade"><Check text="Ativo = Passivo + PL" value={checks.patrimonial===0?'OK':'Revisar'} ok={checks.patrimonial===0}/><Check text="DFC = Caixa do Balanço" value={checks.caixa===0?'OK':'Revisar'} ok={checks.caixa===0}/><Check text="DMPL = PL Final" value={checks.dmpl===0?'OK':'Revisar'} ok={checks.dmpl===0}/></Panel></div>
  <Panel title="Leitura gerencial"><div className="note">O modelo demonstra lucro líquido de R$ 120 mil, geração operacional de caixa de R$ 120 mil e caixa final de R$ 100 mil. O próximo passo será substituir os dados demonstrativos por uma base mensal e acrescentar Orçado x Realizado, capital de giro e alertas.</div></Panel>
</>}
function DRE(){return <Panel title="DRE — Demonstração do Resultado" wide><Table rows={[["Receita Bruta",d.receitaBruta],["(-) Deduções / Impostos",d.deducoes],["= Receita Líquida",d.receitaLiquida],["(-) Custos",d.custos],["= Lucro Bruto",d.lucroBruto],["(-) Despesas Comerciais",d.despesasComerciais],["(-) Despesas Administrativas",d.despesasAdministrativas],["(-) Outras despesas operacionais",d.outrasDespesasOperacionais],["= Resultado Operacional",d.resultadoOperacional],["(+/-) Resultado Financeiro",d.resultadoFinanceiro],["= Resultado antes do IR/CSLL",d.resultadoOperacional+d.resultadoFinanceiro],["(-) IR / CSLL",d.irCsll],["= LUCRO LÍQUIDO",d.lucroLiquido]]}/></Panel>}
function BP(){return <Panel title="Balanço Patrimonial" wide><div className="tables"><Table rows={[["Ativo Circulante",d.ativoCirculante],["Ativo Não Circulante",d.ativoNaoCirculante],["ATIVO TOTAL",d.ativoTotal]]}/><Table rows={[["Passivo Circulante",d.passivoCirculante],["Passivo Não Circulante",d.passivoNaoCirculante],["PASSIVO TOTAL",d.passivoTotal],["Patrimônio Líquido",d.plFinal],["PASSIVO + PL",d.passivoTotal+d.plFinal]]}/></div></Panel>}
function DFC(){return <Panel title="DFC — Método Indireto" wide><Table rows={[["Lucro Líquido",d.lucroLiquido],["(+) Depreciação",d.depreciacao],["(-) Aumento de Contas a Receber",d.aumentoContasReceber],["(-) Aumento de Estoques",d.aumentoEstoques],["(+) Aumento de Fornecedores",d.aumentoFornecedores],["(+) Aumento de Obrigações",d.aumentoObrigacoes],["= Caixa Operacional",d.caixaOperacional],["Investimentos",d.investimentos],["Financiamentos",d.financiamentos],["= Variação Líquida",d.caixaFinal-d.caixaInicial],["Caixa Inicial",d.caixaInicial],["= CAIXA FINAL",d.caixaFinal]]}/></Panel>}
function DMPL(){return <Panel title="DMPL — Ponte do Patrimônio Líquido" wide><Table rows={[["PL Inicial",d.plInicial],["(+) Lucro Líquido",d.lucroLiquido],["(-) Dividendos / Distribuições",d.dividendos],["(+/-) Outros movimentos",0],["= PL Final",d.plFinal]]}/><div className="note">O Lucro Líquido de R$ 120 mil é o resultado do período. Lucros acumulados é um saldo patrimonial e não precisa ser igual ao Lucro Líquido.</div></Panel>}
function Indicators(){const rows=[['Margem Bruta',indicators.margemBruta],['Margem Operacional',indicators.margemOperacional],['Margem Líquida',indicators.margemLiquida],['PL / Ativo',indicators.participacaoPL],['Passivo / Ativo',indicators.participacaoPassivo]];return <div className="indicator-grid">{rows.map(([x,v])=><div className="indicator" key={x as string}><span>{x}</span><strong>{pct(v as number)}</strong><div className="progress"><i style={{width:`${Math.min((v as number)*100,100)}%`}}/></div></div>)}</div>}
function Panel({title,children,wide=false}:{title:string,children:React.ReactNode,wide?:boolean}){return <section className={`panel ${wide?'wide':''}`}><div className="panel-title"><h2>{title}</h2><span>2026</span></div>{children}</section>}
function Card({title,value}:{title:string,value:number}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>modelo demonstrativo</small></div>}
function Rows({rows}:{rows:(string|number)[][]}){return <div className="rows">{rows.map(([x,v])=><div className="row" key={x as string}><span>{x}</span><b>{brl(v as number)}</b></div>)}</div>}
function Table({rows}:{rows:(string|number)[][]}){return <table><tbody>{rows.map(([x,v])=><tr className={(x as string).startsWith('=')?'total':''} key={x as string}><td>{x}</td><td>{brl(v as number)}</td></tr>)}</tbody></table>}
function Bar({label,value,max}:{label:string,value:number,max:number}){return <div className="bar"><div><span>{label}</span><b>{brl(value)}</b></div><div className="track"><i style={{width:`${value/max*100}%`}}/></div></div>}
function Check({text,value,ok}:{text:string,value:string,ok:boolean}){return <div className="check"><i className={ok?'ok':'bad'}>{ok?'✓':'!'}</i><div><b>{text}</b><small>{value}</small></div></div>}
