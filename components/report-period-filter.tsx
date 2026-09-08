'use client'

import { useMemo } from 'react'
import type { ReportPeriod } from '@/lib/report-period'

export type { ReportPeriod, ReportView } from '@/lib/report-period'

type Props = {
  value: ReportPeriod
  onChange: (value: ReportPeriod) => void
  years?: number[]
  showView?: boolean
}

const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function ReportPeriodFilter({ value, onChange, years, showView = true }: Props) {
  const availableYears = useMemo(() => years?.length ? years : [2026], [years])
  return <div className="report-period-filter">
    <style>{`
      .report-period-filter{display:flex;align-items:flex-end;gap:9px;flex-wrap:wrap}
      .report-period-field{display:grid;gap:5px}
      .report-period-field label{font-size:9px;font-weight:800;letter-spacing:.08em;color:#718098;text-transform:uppercase}
      .report-period-field select{min-width:112px;padding:9px 10px;border:1px solid #dbe1e8;border-radius:8px;background:#fff;color:#172033;font:inherit;font-size:11px}
      .report-period-field.month select{min-width:132px}
      .report-period-view{display:flex;border:1px solid #dbe1e8;border-radius:8px;overflow:hidden;background:#fff}
      .report-period-view button{border:0;border-right:1px solid #e7ebf0;background:#fff;color:#40516a;padding:9px 11px;font-size:10px;font-weight:700;cursor:pointer}
      .report-period-view button:last-child{border-right:0}
      .report-period-view button.active{background:#173f70;color:#fff}
      @media(max-width:650px){.report-period-filter{align-items:stretch}.report-period-field select{width:100%}.report-period-field{flex:1;min-width:105px}.report-period-field.month{min-width:130px}.report-period-view{width:100%}.report-period-view button{flex:1}}
    `}</style>
    <div className="report-period-field"><label>Ano</label><select value={value.year} onChange={e=>onChange({...value,year:Number(e.target.value)})}>{availableYears.map(year=><option key={year} value={year}>{year}</option>)}</select></div>
    <div className="report-period-field month"><label>Mês</label><select value={value.month} onChange={e=>onChange({...value,month:Number(e.target.value)})}>{months.map((month,index)=><option key={month} value={index+1}>{month}</option>)}</select></div>
    {showView&&<div className="report-period-field"><label>Visão</label><div className="report-period-view"><button className={value.view==='mensal'?'active':''} onClick={()=>onChange({...value,view:'mensal'})}>Mensal</button><button className={value.view==='acumulado'?'active':''} onClick={()=>onChange({...value,view:'acumulado'})}>Acumulado</button><button className={value.view==='comparativo'?'active':''} onClick={()=>onChange({...value,view:'comparativo'})}>Comparativo</button></div></div>}
  </div>
}
