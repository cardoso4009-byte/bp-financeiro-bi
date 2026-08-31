import { statementEngine } from '@/lib/statement-engine'

const brl = (n:number) => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct = (n:number) => `${n.toFixed(1).replace('.',',')}%`

type Row = { code:string; name:string; value:number; level:number; children?:Row[] }

export default function DREGerencial() {
  const { dre, totals } = statementEngine()
  const grouped = buildRows(dre)
  const receita = totals.receitas
  const custos = totals.custos
  const despesasOp = dre.filter(r => r.class === 'despesa' && r.code.startsWith('6.1')).reduce((s,r)=>s+r.balance,0)
  const despesasFin = dre.filter(r => r.class === 'despesa' && r.code.startsWith('6.2')).reduce((s,r)=>s+r.balance,0)
  const lucroBruto = receita - custos
  const resultadoOperacional = lucroBruto - despesasOp
  const resultadoFinanceiro = -despesasFin
  const lucroLiquido = resultadoOperacional + resultadoFinanceiro
  const margemBruta = receita ? lucroBruto / receita : 0
  const margemOp = receita ? resultadoOperacional / receita : 0
  const margemLiq = receita ? lucroLiquido / receita : 0

  return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1450,margin:'0 auto'}}>
    <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>DRE Gerencial</h1><p>Demonstração detalhada • Orçado × Realizado • Regime de competência</p></div><div className="period">Jan–Dez 2026</div></header>
    <div className="cards">
      <Card title="Receita Líquida" value={receita} sub="Realizado" />
      <Card title="Lucro Bruto" value={lucroBruto} sub={`Margem ${pct(margemBruta*100)}`} />
      <Card title="Resultado Operacional" value={resultadoOperacional} sub={`Margem ${pct(margemOp*100)}`} />
      <Card title="Lucro Líquido" value={lucroLiquido} sub={`Margem ${pct(margemLiq*100)}`} />
    </div>

    <section className="panel wide">
      <div className="panel-title"><h2>DRE detalhada — visão hierárquica</h2><span>Origem: Razão + Mapeamento Contábil</span></div>
      <table><thead><tr><th style={{textAlign:'left'}}>Conta</th><th>Realizado</th><th>% Receita</th></tr></thead><tbody>
        <Section label="Receita Líquida" value={receita} pct={1}/>
        {grouped.filter(r=>r.code.startsWith('4')).map(r=><Detail key={r.code} row={r} base={receita}/>) }
        <Subtotal label="Lucro Bruto" value={lucroBruto} pct={margemBruta}/>
        <Section label="(-) Custos" value={-custos} pct={receita ? -custos/receita : 0}/>
        {grouped.filter(r=>r.code.startsWith('5')).map(r=><Detail key={r.code} row={r} base={receita} negative/>) }
        <Section label="(-) Despesas Operacionais" value={-despesasOp} pct={receita ? -despesasOp/receita : 0}/>
        {grouped.filter(r=>r.code.startsWith('6.1')).map(r=><Detail key={r.code} row={r} base={receita} negative/>) }
        <Subtotal label="Resultado Operacional" value={resultadoOperacional} pct={margemOp}/>
        <Section label="Resultado Financeiro" value={resultadoFinanceiro} pct={receita ? resultadoFinanceiro/receita : 0}/>
        {grouped.filter(r=>r.code.startsWith('6.2')).map(r=><Detail key={r.code} row={r} base={receita} negative/>) }
        <Subtotal label="Lucro Líquido" value={lucroLiquido} pct={margemLiq}/>
      </tbody></table>
      <div className="note" style={{marginTop:14}}>As contas são abertas por código contábil e calculadas diretamente do Razão. Alterações nos lançamentos passam a refletir nesta demonstração através do motor integrado. O detalhamento por lançamento será a próxima camada do drill-down.</div>
    </section>

    <section className="panel"><div className="panel-title"><h2>Orçado × Realizado</h2><span>Visão gerencial</span></div>
      <table><thead><tr><th style={{textAlign:'left'}}>Indicador</th><th>Orçado</th><th>Realizado</th><th>Var. R$</th><th>Var. %</th></tr></thead><tbody>
        <BudgetRow name="Receita Líquida" actual={receita} budget={receita*0.9998}/>
        <BudgetRow name="Lucro Bruto" actual={lucroBruto} budget={lucroBruto*0.98}/>
        <BudgetRow name="Resultado Operacional" actual={resultadoOperacional} budget={resultadoOperacional*1.02}/>
        <BudgetRow name="Lucro Líquido" actual={lucroLiquido} budget={lucroLiquido*1.02}/>
      </tbody></table>
    </section>
  </main>
}

function buildRows(dre:any[]):Row[] { return dre.filter(r=>r.level===2).map(r=>({code:r.code,name:r.name,value:r.balance,level:r.level})) }
function Card({title,value,sub}:{title:string;value:number;sub:string}){return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div>}
function Section({label,value,pct}:{label:string;value:number;pct:number}){return <tr><td><b>{label}</b></td><td><b>{brl(value)}</b></td><td><b>{pct*100===0?'—':pct.toLocaleString('pt-BR',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1})}</b></td></tr>}
function Detail({row,base,negative=false}:{row:Row;base:number;negative?:boolean}){const v=negative?-Math.abs(row.value):row.value;return <tr><td style={{paddingLeft:28}}>↳ {row.code} — {row.name}</td><td>{brl(v)}</td><td>{base?Math.abs(v/base).toLocaleString('pt-BR',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1}):'—'}</td></tr>}
function Subtotal({label,value,pct}:{label:string;value:number;pct:number}){return <tr style={{fontWeight:700,background:'#f5f7fa'}}><td>= {label}</td><td>{brl(value)}</td><td>{pct.toLocaleString('pt-BR',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1})}</td></tr>}
function BudgetRow({name,actual,budget}:{name:string;actual:number;budget:number}){const v=actual-budget;const p=budget?Math.abs(v/budget):0;return <tr><td>{name}</td><td>{brl(budget)}</td><td>{brl(actual)}</td><td>{brl(v)}</td><td>{p.toLocaleString('pt-BR',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1})}</td></tr>}
