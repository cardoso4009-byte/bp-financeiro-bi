'use client'

import { useMemo, useState } from 'react'
import { readFinancialSource } from '@/lib/financial-source'
import { calculateFinancialIndicators, buildAccountingIndicatorCards } from '@/lib/financial-indicators'
import { buildFinancialDiagnosis, diagnosisSummary } from '@/lib/financial-diagnosis'
import { readActionPlan, ActionPlanItem, writeActionPlan } from '@/lib/action-plan-store'
import { GovernanceMeeting, GovernanceMeetingStatus, readGovernanceMeetings, upsertGovernanceMeeting } from '@/lib/governance-store'

const today = () => new Date().toISOString().slice(0, 10)

export default function Governanca() {
  const source = useMemo(() => readFinancialSource(), [])
  const [actions, setActions] = useState<ActionPlanItem[]>(() => readActionPlan())
  const [meetings, setMeetings] = useState<GovernanceMeeting[]>(() => readGovernanceMeetings())
  const [showMeeting, setShowMeeting] = useState(false)
  const [form, setForm] = useState({ date: today(), competence: '2026-09', title: 'Reunião de Resultado', participants: '', decisions: '', evidence: '' })

  const data = useMemo(() => calculateFinancialIndicators(source.entries), [source])
  const accounting = useMemo(() => buildAccountingIndicatorCards(), [])
  const diagnoses = useMemo(() => buildFinancialDiagnosis(accounting.snapshot, data.indicators), [accounting, data])
  const openActions = actions.filter((a) => a.status === 'Pendente' || a.status === 'Em andamento')
  const overdue = openActions.filter((a) => a.dueDate && a.dueDate < today())
  const dueSoon = openActions.filter((a) => a.dueDate && a.dueDate >= today() && a.dueDate <= addDays(today(), 7))
  const critical = openActions.filter((a) => a.priority === 'Crítica' || a.priority === 'Alta')

  function closeAction(item: ActionPlanItem) {
    const updated = { ...item, status: 'Concluído' as const, actualImpact: item.actualImpact || item.expectedImpact }
    const next = actions.map((a) => a.id === item.id ? updated : a)
    writeActionPlan(next)
    setActions(next)
  }

  function saveMeeting(status: GovernanceMeetingStatus = 'Realizada') {
    if (!form.title.trim() || !form.date) return
    const now = new Date().toISOString()
    const meeting: GovernanceMeeting = { id: `meeting-${Date.now()}`, createdAt: now, updatedAt: now, ...form, status }
    upsertGovernanceMeeting(meeting)
    setMeetings(readGovernanceMeetings())
    setShowMeeting(false)
    setForm({ date: today(), competence: '2026-09', title: 'Reunião de Resultado', participants: '', decisions: '', evidence: '' })
  }

  return <main className="content" style={{ marginLeft: 0, width: '100%', maxWidth: 1450, margin: '0 auto' }}>
    <header><div><small>CONTROLADORIA FINANCEIRA</small><h1>Governança Gerencial</h1><p>Alerta → Ação → Reunião → Responsável → Prazo → Evidência → Encerramento</p></div><div className="period">2026</div></header>

    <div className="cards">
      <Metric title="Ações abertas" value={String(openActions.length)} /><Metric title="Ações críticas" value={String(critical.length)} /><Metric title="Ações atrasadas" value={String(overdue.length)} /><Metric title="Vencem em 7 dias" value={String(dueSoon.length)} /><Metric title="Reuniões realizadas" value={String(meetings.filter((m) => m.status === 'Realizada').length)} />
    </div>

    <section className="panel wide"><div className="panel-title"><div><h2>1. Alertas que exigem gestão</h2><span>{diagnosisSummary(data, accounting)}</span></div><a href="/alertas-gerenciais" style={{ fontWeight: 800 }}>Ver cockpit de alertas →</a></div>
      <div style={{ display: 'grid', gap: 10 }}>{diagnoses.slice(0, 5).map((d) => <div className="note" key={d.key}><strong>{d.title}</strong><p style={{ margin: '4px 0' }}>{d.signal}</p><small>Hipótese: {d.hypothesis}</small></div>)}</div>
    </section>

    <section className="panel wide"><div className="panel-title"><div><h2>2. Plano de ação</h2><span>Transforme diagnóstico em responsável, prazo e evidência</span></div><a href="/plano-acao" style={{ fontWeight: 800 }}>Abrir plano completo →</a></div>
      {openActions.length === 0 ? <div className="note">Nenhuma ação aberta no momento.</div> : <div style={{ display: 'grid', gap: 10 }}>{openActions.map((a) => <ActionRow key={a.id} item={a} onClose={() => closeAction(a)} />)}</div>}
    </section>

    <section className="panel wide"><div className="panel-title"><div><h2>3. Reunião de Resultado</h2><span>Registre decisões e evidências da gestão</span></div><button onClick={() => setShowMeeting((v) => !v)}>{showMeeting ? 'Fechar' : '+ Registrar reunião'}</button></div>
      {showMeeting && <div className="panel" style={{ margin: 0 }}><div className="grid"><Field label="Data" value={form.date} onChange={(v) => setForm({ ...form, date: v })} type="date" /><Field label="Competência" value={form.competence} onChange={(v) => setForm({ ...form, competence: v })} type="month" /><Field label="Título" value={form.title} onChange={(v) => setForm({ ...form, title: v })} /><Field label="Participantes" value={form.participants} onChange={(v) => setForm({ ...form, participants: v })} /></div><TextArea label="Decisões e encaminhamentos" value={form.decisions} onChange={(v) => setForm({ ...form, decisions: v })} /><TextArea label="Evidência / ata / observações" value={form.evidence} onChange={(v) => setForm({ ...form, evidence: v })} /><button onClick={() => saveMeeting()}>Encerrar e registrar reunião</button></div>}
      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>{meetings.slice(0, 8).map((m) => <MeetingRow key={m.id} meeting={m} />)}</div>
    </section>

    <section className="panel wide"><div className="panel-title"><h2>4. Ritual de governança</h2><span>Fluxo recomendado</span></div><div className="grid"><div className="note"><strong>Antes da reunião</strong><p>Revisar alertas, ações atrasadas, caixa projetado e indicadores.</p></div><div className="note"><strong>Durante</strong><p>Definir decisão, responsável, prazo e impacto esperado.</p></div><div className="note"><strong>Depois</strong><p>Registrar evidência, acompanhar execução e encerrar somente com comprovação.</p></div></div></section>
  </main>
}

function addDays(date: string, days: number) { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10) }
function Metric({ title, value }: { title: string; value: string }) { return <div className="card"><span>{title}</span><strong>{value}</strong><small>Governança</small></div> }
function ActionRow({ item, onClose }: { item: ActionPlanItem; onClose: () => void }) { const late = !!item.dueDate && item.dueDate < today(); return <article className="note" style={{ borderLeft: `4px solid ${item.priority === 'Crítica' || late ? '#ef4444' : '#f59e0b'}` }}><div className="panel-title"><div><strong>{item.title}</strong><p style={{ margin: '4px 0' }}>{item.area} • {item.responsible || 'Responsável não definido'}</p></div><span>{item.priority}</span></div><small>Prazo: {item.dueDate || 'não definido'} {late ? '• ATRASADA' : ''}</small><p style={{ margin: '6px 0' }}>{item.action}</p><button onClick={onClose}>Marcar como concluída</button></article> }
function MeetingRow({ meeting }: { meeting: GovernanceMeeting }) { return <article className="note"><div className="panel-title"><strong>{meeting.title}</strong><span>{meeting.status}</span></div><small>{meeting.date} • {meeting.competence}</small><p><strong>Participantes:</strong> {meeting.participants || 'Não informado'}</p><p><strong>Decisões:</strong> {meeting.decisions || 'Não informado'}</p><p><strong>Evidência:</strong> {meeting.evidence || 'Não registrada'}</p></article> }
function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) { return <label style={{ display: 'grid', gap: 5 }}><small>{label}</small><input type={type} value={value} onChange={(e) => onChange(e.target.value)} /></label> }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return <label style={{ display: 'grid', gap: 5, margin: '12px 0' }}><small>{label}</small><textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} /></label> }
