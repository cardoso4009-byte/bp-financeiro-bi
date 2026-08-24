'use client'

import { useEffect, useMemo, useState } from 'react'
import { entryTypes, initialEntries, summarizeEntries, type FinancialEntry } from '@/lib/lancamentos-data'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const money = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const emptyForm = {
  date: '2026-03-01', type: 'Despesa' as FinancialEntry['type'], category: 'Administrativo', costCenter: 'Administrativo',
  description: '', competence: '2026-03', dueDate: '2026-03-01', paymentDate: '', status: 'Em aberto' as FinancialEntry['status'], value: ''
}

export default function Lancamentos() {
  const [entries, setEntries] = useState<FinancialEntry[]>(initialEntries)
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState('Todos')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('bp-financeiro-lancamentos')
    if (saved) setEntries(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('bp-financeiro-lancamentos', JSON.stringify(entries))
  }, [entries])

  const filtered = useMemo(() => entries.filter(e => {
    const typeOk = filter === 'Todos' || e.type === filter
    const term = search.toLowerCase()
    const searchOk = !term || [e.description, e.category, e.costCenter, e.type].join(' ').toLowerCase().includes(term)
    return typeOk && searchOk
  }), [entries, filter, search])

  const s = summarizeEntries(entries)

  function addEntry() {
    const value = Number(form.value.replace(',', '.'))
    if (!form.description.trim() || !value) return
    const signed = form.type === 'Receita' ? Math.abs(value) : -Math.abs(value)
    const next: FinancialEntry = { ...form, id: Date.now(), value: signed }
    setEntries(prev => [next, ...prev])
    setForm({ ...emptyForm, type: form.type, category: form.category, costCenter: form.costCenter, competence: form.competence, dueDate: form.dueDate })
  }

  function removeEntry(id: number) { setEntries(prev => prev.filter(e => e.id !== id)) }

  return <main className="content" style={{ marginLeft: 0, width: '100%', maxWidth: 1500, margin: '0 auto' }}>
    <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Base de Lançamentos</h1><p>Entrada financeira • Classificação • Competência • Vencimento • Integração gerencial</p></div><div className="period">Jan–Dez 2026</div></header>

    <div className="cards">
      <Card title="Receitas" value={s.revenue} sub={`${entries.filter(e => e.type === 'Receita').length} lançamentos`} />
      <Card title="OPEX" value={s.opex} sub="Despesas operacionais" />
      <Card title="CAPEX" value={s.capex} sub="Investimentos" />
      <Card title="Em aberto" value={s.open} sub="A pagar / receber" />
    </div>

    <div className="grid">
      <section className="panel"><div className="panel-title"><h2>Novo lançamento</h2><span>Entrada manual</span></div>
        <div className="entry-form">
          <Field label="Data"><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></Field>
          <Field label="Tipo"><select value={form.type} onChange={e=>setForm({...form,type:e.target.value as FinancialEntry['type']})}>{entryTypes.map(x=><option key={x}>{x}</option>)}</select></Field>
          <Field label="Categoria"><input value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></Field>
          <Field label="Centro de custo"><input value={form.costCenter} onChange={e=>setForm({...form,costCenter:e.target.value})}/></Field>
          <Field label="Descrição"><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Ex.: fornecedor, cliente..."/></Field>
          <Field label="Competência"><input type="month" value={form.competence} onChange={e=>setForm({...form,competence:e.target.value})}/></Field>
          <Field label="Vencimento"><input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/></Field>
          <Field label="Pagamento"><input type="date" value={form.paymentDate} onChange={e=>setForm({...form,paymentDate:e.target.value})}/></Field>
          <Field label="Status"><select value={form.status} onChange={e=>setForm({...form,status:e.target.value as FinancialEntry['status']})}><option>Pago</option><option>Em aberto</option></select></Field>
          <Field label="Valor"><input inputMode="decimal" value={form.value} onChange={e=>setForm({...form,value:e.target.value})} placeholder="0,00"/></Field>
          <button className="primary-btn" onClick={addEntry}>+ Adicionar lançamento</button>
        </div>
      </section>

      <section className="panel"><div className="panel-title"><h2>Resumo da base</h2><span>Motor financeiro</span></div>
        <div className="rows">
          <div className="row"><span>Resultado líquido dos lançamentos</span><b>{brl(s.net)}</b></div>
          <div className="row"><span>Financiamentos</span><b>{brl(s.financing)}</b></div>
          <div className="row"><span>Itens em aberto</span><b>{entries.filter(e=>e.status==='Em aberto').length}</b></div>
          <div className="row"><span>Total de lançamentos</span><b>{entries.length}</b></div>
        </div>
        <div className="note">A base está preparada para ser a origem dos módulos de DRE, DFC, Capital de Giro e Fluxo de Caixa. Nesta versão, os dados são persistidos no navegador por <strong>localStorage</strong>.</div>
      </section>
    </div>

    <section className="panel wide"><div className="panel-title"><h2>Lançamentos financeiros</h2><span>{filtered.length} registros exibidos</span></div>
      <div className="toolbar"><input placeholder="Pesquisar descrição, categoria ou centro de custo..." value={search} onChange={e=>setSearch(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>Todos</option>{entryTypes.map(x=><option key={x}>{x}</option>)}</select></div>
      <div className="table-wrap"><table><thead><tr><td>Data</td><td>Tipo</td><td>Categoria</td><td>Centro de custo</td><td>Descrição</td><td>Competência</td><td>Vencimento</td><td>Status</td><td>Valor</td><td></td></tr></thead><tbody>
        {filtered.map(e=><tr key={e.id}><td>{e.date.split('-').reverse().join('/')}</td><td><Tag type={e.type}/></td><td>{e.category}</td><td>{e.costCenter}</td><td>{e.description}</td><td>{e.competence}</td><td>{e.dueDate.split('-').reverse().join('/')}</td><td>{e.status}</td><td className={e.value>=0?'positive':'negative'}>{money(e.value)}</td><td><button className="delete-btn" onClick={()=>removeEntry(e.id)}>Excluir</button></td></tr>)}
      </tbody></table></div>
    </section>

    <section className="panel"><div className="panel-title"><h2>Integração planejada</h2><span>Arquitetura</span></div><div className="note"><strong>Base de Lançamentos → classificação contábil/gerencial → DRE → Balanço → DFC → Capital de Giro → Fluxo de Caixa → Indicadores → Diagnóstico.</strong> O próximo refinamento será substituir os dados demonstrativos dos módulos por agregações desta base.</div></section>
  </main>
}

function Card({title,value,sub}:{title:string,value:number,sub:string}) { return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div> }
function Field({label,children}:{label:string,children:React.ReactNode}) { return <label className="field"><span>{label}</span>{children}</label> }
function Tag({type}:{type:FinancialEntry['type']}) { return <span className="entry-tag">{type}</span> }
