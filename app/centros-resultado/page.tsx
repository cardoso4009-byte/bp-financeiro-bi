'use client'

import { useEffect, useMemo, useState } from 'react'
import { buildV2FinancialBase } from '@/lib/v2-financial-base'
import { buildV2CostCenterReport } from '@/lib/v2-cost-center'
import { readV2BrowserStore, writeV2BrowserStore } from '@/lib/v2-browser-storage'
import { readV2CostCenters, writeV2CostCenters } from '@/lib/v2-cost-center-storage'
import type { CostCenter, FinancialEntry } from '@/lib/v2-data-model'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export default function CentrosResultadoPage() {
  const [entries, setEntries] = useState<FinancialEntry[]>([])
  const [centers, setCenters] = useState<CostCenter[]>([])
  const [period, setPeriod] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const store = readV2BrowserStore()
    setEntries(store.entries)
    const saved = readV2CostCenters()
    setCenters(saved)
    const periods = [...new Set(store.entries.map(entry => entry.competence))].sort()
    setPeriod(periods.at(-1) ?? '')
  }, [])

  const periods = useMemo(() => [...new Set(entries.map(entry => entry.competence))].sort(), [entries])
  const report = useMemo(() => period
    ? buildV2CostCenterReport(buildV2FinancialBase(entries), centers, period)
    : null, [entries, centers, period])

  const unassigned = useMemo(
    () => entries.filter(entry => entry.competence === period && !entry.costCenterId),
    [entries, period],
  )

  function createCenter() {
    const code = newCode.trim()
    const name = newName.trim()
    if (!code || !name) return
    if (centers.some(center => center.code.toLowerCase() === code.toLowerCase())) {
      setMessage('Já existe um centro com esse código.')
      return
    }
    const companyId = entries[0]?.companyId ?? 'c1'
    const center: CostCenter = {
      id: `cc-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      companyId,
      code,
      name,
      active: true,
    }
    const next = [...centers, center]
    writeV2CostCenters(next)
    setCenters(next)
    setNewCode('')
    setNewName('')
    setMessage(`Centro ${code} criado.`)
  }

  function assignCenter(entryId: string, costCenterId: string) {
    const store = readV2BrowserStore()
    const nextEntries = store.entries.map(entry =>
      entry.id === entryId
        ? { ...entry, costCenterId: costCenterId || undefined }
        : entry,
    )
    writeV2BrowserStore({ ...store, entries: nextEntries })
    setEntries(nextEntries)
    setMessage('Lançamento atualizado. A auditoria V2 passa a enxergar a nova classificação.')
  }

  return (
    <main className="content" style={{ marginLeft: 0, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      <header>
        <div>
          <small>BASE FINANCEIRA · V2</small>
          <h1>Centros de Resultado</h1>
          <p>Dimensão gerencial para Receita, OPEX, Custos e CAPEX</p>
        </div>
        <div className="period">
          Período
          <select value={period} onChange={e => setPeriod(e.target.value)} style={{ marginLeft: 8 }}>
            {periods.length === 0 ? <option value="">Sem dados</option> : periods.map(item => <option key={item}>{item}</option>)}
          </select>
        </div>
      </header>

      <section className="cards">
        <div className="card"><span>Lançamentos do período</span><strong>{report?.totalEntries ?? 0}</strong><small>Base Financeira V2</small></div>
        <div className="card"><span>Com centro</span><strong>{report?.assignedEntries ?? 0}</strong><small>Classificados</small></div>
        <div className="card"><span>Sem centro</span><strong>{report?.unassignedEntries ?? 0}</strong><small>Precisam de análise</small></div>
        <div className="card"><span>Centros cadastrados</span><strong>{centers.length}</strong><small>Dimensão gerencial</small></div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <div><h2>Cadastro de centros</h2><span>Sem rateios automáticos</span></div>
        </div>
        <div className="grid">
          <label className="field"><span>Código</span><input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="CC-ADM" /></label>
          <label className="field"><span>Nome</span><input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Administrativo" /></label>
          <div style={{ display: 'flex', alignItems: 'end' }}><button className="primary-btn" onClick={createCenter}>Criar centro</button></div>
        </div>
        {message && <div className="note success-note" style={{ marginTop: 16 }}>✓ {message}</div>}
      </section>

      <section className="panel">
        <div className="panel-title">
          <div><h2>Resultado por centro</h2><span>{period || 'sem competência'}</span></div>
          <span>{report ? `${report.rows.length} agrupamento(s)` : 'Aguardando dados'}</span>
        </div>
        {!report ? <div className="note">Importe e persista lançamentos V2 para habilitar a análise por centro de resultado.</div> :
          <div className="table-wrap">
            <table>
              <thead><tr><th>Centro</th><th>Lançamentos</th><th>Receita</th><th>OPEX</th><th>EBITDA</th><th>CAPEX</th><th>Resultado</th></tr></thead>
              <tbody>
                {report.rows.map(row => (
                  <tr key={row.costCenterId ?? 'sem'}>
                    <td><strong>{row.code}</strong><small style={{ display: 'block' }}>{row.name}</small></td>
                    <td>{row.entries}</td>
                    <td>{brl(row.receita)}</td>
                    <td>{brl(row.opex)}</td>
                    <td>{brl(row.ebitdaImpact)}</td>
                    <td>{brl(row.capex)}</td>
                    <td><strong>{brl(row.resultadoLiquido)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </section>

      <section className="panel">
        <div className="panel-title">
          <div><h2>Lançamentos sem centro</h2><span>Classificação manual e rastreável</span></div>
          <span>{unassigned.length} no período</span>
        </div>
        {unassigned.length === 0 ? <div className="note success-note">Nenhum lançamento sem centro de resultado neste período.</div> :
          <div className="table-wrap">
            <table>
              <thead><tr><th>Data</th><th>Descrição</th><th>Classe</th><th>Valor</th><th>Centro de resultado</th></tr></thead>
              <tbody>
                {unassigned.slice(0, 30).map(entry => (
                  <tr key={entry.id}>
                    <td>{entry.date}</td>
                    <td><strong>{entry.description}</strong><small style={{ display: 'block' }}>{entry.externalId ?? entry.id}</small></td>
                    <td>{entry.movementClass}</td>
                    <td>{brl(entry.amount)}</td>
                    <td>
                      <select defaultValue="" onChange={e => assignCenter(entry.id, e.target.value)}>
                        <option value="">Selecionar</option>
                        {centers.filter(center => center.active).map(center => <option key={center.id} value={center.id}>{center.code} — {center.name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {unassigned.length > 30 && <div className="note" style={{ marginTop: 12 }}>Exibindo os primeiros 30 lançamentos sem classificação.</div>}
          </div>}
      </section>

      <div className="note">
        <strong>Governança:</strong> centro de resultado é uma dimensão gerencial, não altera a natureza contábil do lançamento. CAPEX fica separado do resultado; lançamentos sem centro permanecem explícitos e não recebem rateio automático.
      </div>
    </main>
  )
}
