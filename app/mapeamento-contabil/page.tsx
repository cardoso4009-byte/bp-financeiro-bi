import { accountMappings } from '@/lib/account-mapping'

export default function MapeamentoContabil(){
  return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1400,margin:'0 auto'}}>
    <header><div><small>MOTOR CONTÁBIL V5</small><h1>Mapeamento Contábil</h1><p>Classificação das contas e destino nas demonstrações financeiras</p></div><div className="period">Modelo 2026</div></header>
    <section className="panel wide"><div className="panel-title"><h2>Plano de contas × demonstrações</h2><span>{accountMappings.length} contas</span></div><div className="table-wrap"><table><thead><tr><th>Código</th><th>Conta</th><th>Classe</th><th>Seção</th><th>Demonstrações</th><th>DFC</th></tr></thead><tbody>{accountMappings.map(a=><tr key={a.code}><td><strong>{a.code}</strong></td><td>{a.name}</td><td>{a.class}</td><td>{a.section}</td><td>{a.statements.join(' • ')}</td><td>{a.cashFlow}</td></tr>)}</tbody></table></div></section>
    <section className="grid"><div className="panel"><div className="panel-title"><h2>Regras</h2></div><div className="note"><strong>BP:</strong> contas patrimoniais formam Ativo, Passivo e PL.<br/><strong>DRE:</strong> receitas, custos e despesas formam o resultado pelo regime de competência.<br/><strong>DFC:</strong> o efeito de caixa é classificado em operacional, investimento ou financiamento.<br/><strong>DMPL:</strong> contas do patrimônio líquido participam da movimentação do PL.</div></div><div className="panel"><div className="panel-title"><h2>Controle</h2><span>Sem ajustes manuais</span></div><div className="note">O objetivo é que as demonstrações sejam consequência do razão e do balancete. Divergências devem gerar alerta, nunca um ajuste silencioso.</div></div></section>
  </main>
}
