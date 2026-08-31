'use client'

import { useEffect, useMemo, useState } from 'react'
import { entryTypes, initialEntries, summarizeEntries, type FinancialEntry } from '@/lib/lancamentos-data'
import { FINANCIAL_STORAGE_KEY, readFinancialSource, writeFinancialSource } from '@/lib/financial-source'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const money = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const emptyForm = { date: '2026-03-01', type: 'Despesa' as FinancialEntry['type'], category: 'Administrativo', costCenter: 'Administrativo', description: '', competence: '2026-03', dueDate: '2026-03-01', paymentDate: '', status: 'Em aberto' as FinancialEntry['status'], value: '' }

export default function Lancamentos() {
  const [entries, setEntries] = useState<FinancialEntry[]>(initialEntries)
  const [sourceWarning, setSourceWarning] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [viewing, setViewing] = useState<FinancialEntry | null>(null)
  const [filter, setFilter] = useState('Todos')
  const [search, setSearch] = useState('')

  useEffect(() => { const source = readFinancialSource(); setEntries(source.entries); setSourceWarning(source.errors.join(' ')) }, [])
  useEffect(() => { writeFinancialSource(entries) }, [entries])

  const filtered = useMemo(() => entries.filter(e => {
    const typeOk = filter === 'Todos' || e.type === filter
    const term = search.toLowerCase()
    return typeOk && (!term || [e.description, e.category, e.costCenter, e.type].join(' ').toLowerCase().includes(term))
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

  function startEdit(entry: FinancialEntry) {
    setEditingId(entry.id)
    setForm({ ...entry, value: String(Math.abs(entry.value)) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function saveEdit() {
    if (editingId === null) return
    const value = Number(form.value.replace(',', '.'))
    if (!form.description.trim() || !value) return
    const signed = form.type === 'Receita' ? Math.abs(value) : -Math.abs(value)
    setEntries(prev => prev.map(e => e.id === editingId ? { ...form, id: editingId, value: signed } : e))
    cancelEdit()
  }

  function cancelEdit() { setEditingId(null); setForm(emptyForm) }
  function duplicateEntry(entry: FinancialEntry) { setEntries(prev => [{ ...entry, id: Date.now(), description: `${entry.description} (cópia)` }, ...prev]) }
  function removeEntry(id: number) { setEntries(prev => prev.filter(e => e.id !== id)) }

  return <main className="content" style={{ marginLeft: 0, width: '100%', maxWidth: 1500, margin: '0 auto' }}>
    <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Base de Lançamentos</h1><p>Entrada financeira • Classificação • Competência • Vencimento • Integração gerencial</p></div><div className="period">Jan–Dez 2026</div></header>
    <div className="cards"><Card title="Receitas" value={s.revenue} sub={`${entries.filter(e => e.type === 'Receita').length} lançamentos`} /><Card title="OPEX" value={s.opex} sub="Despesas operacionais" /><Card title="CAPEX" value={s.capex} sub="Investimentos" /><Card title="Em aberto" value={s.open} sub="A pagar / receber" /></div>
    {sourceWarning && <div className="note" style={{ marginBottom: 16, borderLeft: '4px solid #c33' }}><strong>Atenção à base:</strong> {sourceWarning}</div>}
    <div className="grid">
      <section className="panel"><div className="panel-title"><h2>{editingId === null ? 'Novo lançamento' : 'Editar lançamento'}</h2><span>{editingId === null ? 'Entrada manual' : `ID ${editingId}`}</span></div>
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
          {editingId === null ? <button className="primary-btn" onClick={addEntry}>+ Adicionar lançamento</button> : <div style={{display:'flex',gap:8}}><button className="primary-btn" onClick={saveEdit}>Salvar alteração</button><button className="delete-btn" onClick={cancelEdit}>Cancelar</button></div>}
        </div>
      </section>
      <section className="panel"><div className="panel-title"><h2>Resumo da base</h2><span>Motor financeiro</span></div><div className="rows"><div className="row"><span>Resultado líquido dos lançamentos</span><b>{brl(s.net)}</b></div><div className="row"><span>Financiamentos</span><b>{brl(s.financing)}</b></div><div className="row"><span>Itens em aberto</span><b>{entries.filter(e=>e.status==='Em aberto').length}</b></div><div className="row"><span>Total de lançamentos</span><b>{entries.length}</b></div></div><div className="note">Fonte única de dados: <strong>{FINANCIAL_STORAGE_KEY}</strong>. A base financeira alimenta a integração contábil e será a origem dos demonstrativos.</div></section>
    </div>
    <section className="panel wide"><div className="panel-title"><h2>Lançamentos financeiros</h2><span>{filtered.length} registros exibidos</span></div><div className="toolbar"><input placeholder="Pesquisar descrição, categoria ou centro de custo..." value={search} onChange={e=>setSearch(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>Todos</option>{entryTypes.map(x=><option key={x}>{x}</option>)}</select></div><div className="table-wrap"><table><thead><tr><td>Data</td><td>Tipo</td><td>Categoria</td><td>Centro de custo</td><td>Descrição</td><td>Competência</td><td>Vencimento</td><td>Status</td><td>Valor</td><td>Ações</td></tr></thead><tbody>{filtered.map(e=><tr key={e.id}><td>{e.date.split('-').reverse().join('/')}</td><td><Tag type={e.type}/></td><td>{e.category}</td><td>{e.costCenter}</td><td>{e.description}</td><td>{e.competence}</td><td>{e.dueDate.split('-').reverse().join('/')}</td><td>{e.status}</td><td className={e.value>=0?'positive':'negative'}>{money(e.value)}</td><td><div style={{display:'flex',gap:6,flexWrap:'wrap'}}><button className="delete-btn" onClick={()=>setViewing(e)}>Visualizar</button><button className="delete-btn" onClick={()=>startEdit(e)}>Editar</button><button className="delete-btn" onClick={()=>duplicateEntry(e)}>Duplicar</button><button className="delete-btn" onClick={()=>removeEntry(e.id)}>Excluir</button></div></td></tr>)}</tbody></table></div></section>
    {viewing && <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,zIndex:1000}} onClick={()=>setViewing(null)}><div className="panel" style={{width:'min(650px,100%)',maxHeight:'90vh',overflow:'auto'}} onClick={e=>e.stopPropagation()}><div className="panel-title"><h2>Detalhes do lançamento</h2><button className="delete-btn" onClick={()=>setViewing(null)}>Fechar</button></div><div className="rows">{[['ID',viewing.id],['Data',viewing.date],['Tipo',viewing.type],['Categoria',viewing.category],['Centro de custo',viewing.costCenter],['Descrição',viewing.description],['Competência',viewing.competence],['Vencimento',viewing.dueDate],['Pagamento',viewing.paymentDate || '—'],['Status',viewing.status],['Valor',money(viewing.value)]].map(([label,value])=><div className="row" key={String(label)}><span>{label}</span><b>{String(value)}</b></div>)}</div></div></div>}
    <section className="panel"><div className="panel-title"><h2>Próxima integração</h2><span>Arquitetura</span></div><div className="note"><strong>Base de Lançamentos → classificação contábil → Diário → Razão → Balancete → DRE / BP / DFC / DMPL → Indicadores → Diagnóstico.</strong> A camada de origem já está centralizada; agora vamos substituir os demonstrativos paralelos pelo Diário integrado de forma controlada.</div></section>
  </main>
}
function Card({title,value,sub}:{title:string,value:number,sub:string}) { return <div className="card"><span>{title}</span><strong>{brl(value)}</strong><small>{sub}</small></div> }
function Field({label,children}:{label:string,children:React.ReactNode}) { return <label className="field"><span>{label}</span>{children}</label> }
function Tag({type}:{type:FinancialEntry['type']}) { return <span className="entry-tag">{type}</span> }
