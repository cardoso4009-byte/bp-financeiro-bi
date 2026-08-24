'use client'

import { useState } from 'react'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const pct = (n: number) => `${n.toFixed(1).replace('.', ',')}%`

const d = { receita: 900000, lucroBruto: 400000, operacional: 210000, lucro: 120000, caixaInicial: 50000, operacionalCaixa: 120000, investimento: -110000, financiamento: 40000, caixa: 100000, ativo: 770000, passivo: 420000, pl: 350000 }
const nav = [['Visão Executiva','exec'],['DRE Gerencial','dre'],['Balanço','bp'],['DFC','dfc'],['DMPL','dmpl'],['Indicadores','ind']]

export default function Home() {
  const [page,setPage] = useState('exec')
  const item = nav.find(x=>x[1]===page)?.[0]
  return <main className="shell">
    <aside className="side"><div className="brand"><b>BP</b><div><strong>BP Financeiro</strong><span>Controladoria & BI</span></div></div><div className="company"><small>EMPRESA DEMONSTRATIVA</small><strong>Grupo Exemplo</strong><span>2026 • Modelo integrado</span></div><nav>{nav.map(([label,id])=><button key={id} className={page===id?'active':''} onClick={()=>setPage(id)}>{label}</button>)}</nav><footer>V1.0 • Projeto Consultoria Financeira</footer></aside>
    <section className="content"><header><div><small>CONTROLADORIA FINANCEIRA</small><h1>{item}</h1><p>Demonstrações integradas • Regime de competência</p></div><div className="period">Jan–Dez 2026</div></header>
      {page==='exec' && <Executive/>}{page==='dre' && <DRE/>}{page==='bp' && <BP/>}{page==='dfc' && <DFC/>}{page==='dmpl' && <DMPL/>}{page==='ind' && <Indicators/>}
    </section>
  </main>
}

function Executive(){const check=d.ativo-d.passivo-d.pl; return <><div className="cards"><Card title="Receita Líquida" value={d.receita}/><Card title="Lucro Líquido" value={d.lucro}/><Card title="Caixa Final" value={d.caixa}/><Card title="Patrimônio Líquido" value={d.pl}/></div><div className="grid"><Panel title="DRE resumida"><Rows rows={[["Receita Líquida",d.receita],["Lucro Bruto",d.lucroBruto],["Resultado Operacional",d.operacional],["Lucro Líquido",d.lucro]]}/></Panel><Panel title="Geração de caixa"><Rows rows={[["Operacional",d.operacionalCaixa],["Investimento",d.investimento],["Financiamento",d.financiamento],["Variação líquida",d.caixa-d.caixaInicial]]}/></Panel></div><div className="grid"><Panel title="Estrutura patrimonial"><Bar label="Ativo" value={d.ativo} max={d.ativo}/><Bar label="Passivo" value={d.passivo} max={d.ativo}/><Bar label="Patrimônio Líquido" value={d.pl} max={d.ativo}/></Panel><Panel title="Checks de integridade"><Check text="Ativo = Passivo + PL" value={check===0?'OK':'Revisar'} ok={check===0}/><Check text="DFC = Caixa do Balanço" value="OK" ok/><Check text="Lucro Líquido integrado ao PL" value="OK" ok/></Panel></div></>}
function DRE(){return <Panel title="DRE — Demonstração do Resultado" wide><Table rows={[["Receita Bruta",1000000],["(-) Deduções / Impostos",-100000],["= Receita Líquida",900000],["(-) Custos",-500000],["= Lucro Bruto",400000],["(-) Despesas Operacionais",-190000],["= Resultado Operacional",210000],["(+/-) Resultado Financeiro",-40000],["(-) IR / CSLL",-50000],["= LUCRO LÍQUIDO",120000]]}/></Panel>}
function BP(){return <Panel title="Balanço Patrimonial" wide><div className="tables"><Table rows={[["Ativo Circulante",420000],["Ativo Não Circulante",350000],["ATIVO TOTAL",770000]]}/><Table rows={[["Passivo Circulante",250000],["Passivo Não Circulante",170000],["PASSIVO TOTAL",420000],["Patrimônio Líquido",350000],["PASSIVO + PL",770000]]}/></div></Panel>}
function DFC(){return <Panel title="DFC — Método Indireto" wide><Table rows={[["Lucro Líquido",120000],["(+) Depreciação",30000],["(-) Capital de Giro",-30000],["= Caixa Operacional",120000],["Investimentos",-110000],["Financiamentos",40000],["= Variação Líquida",50000],["Caixa Inicial",50000],["= CAIXA FINAL",100000]]}/></Panel>}
function DMPL(){return <Panel title="DMPL — Ponte do Patrimônio Líquido" wide><Table rows={[["PL Inicial",230000],["(+) Lucro Líquido",120000],["(+/-) Outros movimentos",0],["= PL Final",350000]]}/><div className="note">O Lucro Líquido de R$ 120 mil é o resultado do período. Lucros acumulados é saldo patrimonial e não precisa ser igual ao Lucro Líquido.</div></Panel>}
function Indicators(){const rows=[['Margem Bruta',44.4],['Margem Operacional',23.3],['Margem Líquida',13.3],['PL / Ativo',45.5],['Passivo / Ativo',54.5]];return <div className="indicator-grid">{rows.map(([x,v])=><div className="indicator" key={x as string}><span>{x}</span><strong>{v as number}%</strong><div className="progress"><i style={{width:`${v}%`}}/></div></div>)}</div>}
function Panel({title,children,wide=false}:{title:string,children:React.ReactNode,wide?:boolean}){return <section className={`panel ${wide?'wide':''}`}><div className="panel-title"><h2>{title}</h2><span>2026</span></div>{children}</section>}
function Card({title,value}:{title:string,value:number}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>modelo demonstrativo</small></div>}
function Rows({rows}:{rows:(string|number)[][]}){return <div className="rows">{rows.map(([x,v])=><div className="row" key={x as string}><span>{x}</span><b>{brl(v as number)}</b></div>)}</div>}
function Table({rows}:{rows:(string|number)[][]}){return <table><tbody>{rows.map(([x,v])=><tr className={(x as string).startsWith('=')?'total':''} key={x as string}><td>{x}</td><td>{brl(v as number)}</td></tr>)}</tbody></table>}
function Bar({label,value,max}:{label:string,value:number,max:number}){return <div className="bar"><div><span>{label}</span><b>{brl(value)}</b></div><div className="track"><i style={{width:`${value/max*100}%`}}/></div></div>}
function Check({text,value,ok}:{text:string,value:string,ok:boolean}){return <div className="check"><i className={ok?'ok':'bad'}>{ok?'✓':'!'}</i><div><b>{text}</b><small>{value}</small></div></div>}
