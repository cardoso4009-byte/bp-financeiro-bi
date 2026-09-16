'use client'

import { useEffect, useMemo, useState } from 'react'
import { statementEngine } from '@/lib/statement-engine'
import { sampleJournal } from '@/lib/contabil-model'
import ReportPeriodFilter, { type ReportPeriod } from '@/components/report-period-filter'
import { DEFAULT_REPORT_PERIOD, competence } from '@/lib/report-period'
import { buildV2FinancialBase } from '@/lib/v2-financial-base'
import { buildV2Dre } from '@/lib/v2-dre'
import { buildV2Dfc } from '@/lib/v2-dfc'
import { buildV2Bp } from '@/lib/v2-bp'
import { readV2BrowserStore } from '@/lib/v2-browser-storage'
import { readV2Accounts } from '@/lib/v2-account-storage'
import type { Account } from '@/lib/v2-data-model'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

export default function DemonstracoesIntegradas(){
 const [period,setPeriod]=useState<ReportPeriod>(DEFAULT_REPORT_PERIOD)
 const [v2Entries,setV2Entries]=useState<ReturnType<typeof readV2BrowserStore>['entries']>([])
 const [v2Accounts,setV2Accounts]=useState<Account[]>([])

 useEffect(()=>{
  setV2Entries(readV2BrowserStore().entries)
  setV2Accounts(readV2Accounts())
 },[])

 const years=useMemo(()=>Array.from(new Set(sampleJournal.map(e=>Number(String(e.competence??'').slice(0,4))).filter(y=>y>2000))).sort((a,b)=>a-b),[])
 const selected=competence(period.year,period.month)
 const previous=period.month===1?competence(period.year-1,12):competence(period.year,period.month-1)
 const selectedV2Period=selected
 const v2Base=useMemo(()=>buildV2FinancialBase(v2Entries),[v2Entries])
 const v2Dre=useMemo(()=>buildV2Dre(v2Base,selectedV2Period).selectedPeriod,[v2Base,selectedV2Period])
 const v2Dfc=useMemo(()=>buildV2Dfc(v2Base,selectedV2Period).selectedPeriod,[v2Base,selectedV2Period])
 const classifiedAccountIds=new Set(v2Accounts.map(account=>account.id))
 const v2AccountIds=new Set(v2Entries.map(entry=>entry.accountId))
 const v2BpReady=v2Entries.length>0 && v2AccountIds.size>0 && [...v2AccountIds].every(id=>classifiedAccountIds.has(id)) && [...v2Accounts].filter(account=>v2AccountIds.has(account.id)).every(account=>Boolean(account.companyId&&account.nature&&account.statement))
 const v2Bp=useMemo(()=>v2BpReady?buildV2Bp(v2Base,v2Accounts,selectedV2Period):null,[v2Base,v2Accounts,v2BpReady,selectedV2Period])

 const periodEntries=useMemo(()=>sampleJournal.filter(e=>{const c=e.competence??e.date.slice(0,7);if(period.view==='mensal'||period.view==='comparativo') return c===selected;return c>=competence(period.year,1)&&c<=selected}),[period.view,period.year,selected])
 const opening=useMemo(()=>sampleJournal.filter(e=>(e.competence??e.date.slice(0,7))<competence(period.year,1)),[period.year])
 const balanceEntries=useMemo(()=>[...opening,...periodEntries.filter(e=>(e.competence??e.date.slice(0,7))>=competence(period.year,1))],[opening,periodEntries,period.year])
 const bp=statementEngine(balanceEntries).totals
 const dre=statementEngine(periodEntries).totals
 const resultado=dre.receitas-dre.custos-dre.despesas
 const valid=Math.abs(bp.ativo-(bp.passivo+bp.patrimonio))<0.01
 const priorEntries=sampleJournal.filter(e=>(e.competence??e.date.slice(0,7))===previous)
 const priorOpening=sampleJournal.filter(e=>(e.competence??e.date.slice(0,7))<previous)
 const priorBp=statementEngine([...priorOpening,...priorEntries]).totals
 const priorDre=statementEngine(priorEntries).totals

 return <main className="content" style={{marginLeft:0,width:'100%',maxWidth:1400,margin:'0 auto'}}>
  <header><div><small>CONTROLADORIA FINANCEIRA · V2</small><h1>Demonstrações Integradas</h1><p>DRE + DFC + BP em uma única visão gerencial</p></div><ReportPeriodFilter value={period} onChange={setPeriod} years={years.length?years:[2025,2026]}/></header>

  <section className="panel" style={{marginBottom:24}}>
   <div className="panel-title"><div><h2>Cockpit Financeiro V2</h2><span>Período {selectedV2Period}</span></div><span>{v2Entries.length?'Dados reais persistidos':'Aguardando dados V2'}</span></div>
   {v2Entries.length===0 ? <div className="note">Nenhum lançamento V2 persistido neste navegador. Acesse <strong>Importação</strong>, aprove um CSV e volte a esta visão. A V1 permanece disponível abaixo.</div> : <>
    <div className="cards">
     <div className="card"><span>Receita V2</span><strong>{brl(v2Dre?.receita??0)}</strong><small>Competência {selectedV2Period}</small></div>
     <div className="card"><span>EBITDA V2</span><strong>{brl(v2Dre?.ebitda??0)}</strong><small>Receita + custos + OPEX</small></div>
     <div className="card"><span>Resultado Líquido V2</span><strong>{brl(v2Dre?.resultadoLiquido??0)}</strong><small>Após financeiro e impostos</small></div>
     <div className="card"><span>Variação de Caixa V2</span><strong>{brl(v2Dfc?.variacaoCaixa??0)}</strong><small>Liquidações em {selectedV2Period}</small></div>
    </div>

    <div className="grid" style={{marginTop:20}}>
     <section className="panel">
      <div className="panel-title"><h2>DRE V2</h2><span>{v2Dre?`${v2Dre.entries} lançamentos`:'Sem competência'}</span></div>
      <div className="rows">
       <div className="row"><span>Receitas</span><b>{brl(v2Dre?.receita??0)}</b></div>
       <div className="row"><span>Custos</span><b>{brl(v2Dre?.custos??0)}</b></div>
       <div className="row"><span>OPEX</span><b>{brl(v2Dre?.opex??0)}</b></div>
       <div className="row"><span>EBITDA</span><b>{brl(v2Dre?.ebitda??0)}</b></div>
       <div className="row"><span>Resultado financeiro</span><b>{brl(v2Dre?.resultadoFinanceiro??0)}</b></div>
       <div className="row"><span>Impostos</span><b>{brl(v2Dre?.impostos??0)}</b></div>
       <div className="row"><span>Resultado líquido</span><b>{brl(v2Dre?.resultadoLiquido??0)}</b></div>
      </div>
     </section>

     <section className="panel">
      <div className="panel-title"><h2>DFC V2</h2><span>{v2Dfc?`${v2Dfc.entries} liquidações`:'Sem liquidação'}</span></div>
      <div className="rows">
       <div className="row"><span>Operacional</span><b>{brl(v2Dfc?.operacional??0)}</b></div>
       <div className="row"><span>Investimentos</span><b>{brl(v2Dfc?.investimento??0)}</b></div>
       <div className="row"><span>Financeiro</span><b>{brl(v2Dfc?.financeiro??0)}</b></div>
       <div className="row"><span>Transferências</span><b>{brl(v2Dfc?.transferencia??0)}</b></div>
       <div className="row"><span>Outros</span><b>{brl(v2Dfc?.outros??0)}</b></div>
       <div className="row"><span>Variação de caixa</span><b>{brl(v2Dfc?.variacaoCaixa??0)}</b></div>
      </div>
     </section>
    </div>

    <section className="panel" style={{marginTop:20}}>
     <div className="panel-title"><h2>BP V2</h2><span>{v2BpReady?'Classificação completa':'Classificação pendente'}</span></div>
     {v2Bp ? <div className="cards">
      <div className="card"><span>Ativo</span><strong>{brl(v2Bp.ativo)}</strong><small>Fotografia até {selectedV2Period}</small></div>
      <div className="card"><span>Passivo</span><strong>{brl(v2Bp.passivo)}</strong><small>Fotografia até {selectedV2Period}</small></div>
      <div className="card"><span>Patrimônio Líquido</span><strong>{brl(v2Bp.patrimonioLiquido)}</strong><small>Fotografia até {selectedV2Period}</small></div>
      <div className="card"><span>Diferença patrimonial</span><strong>{brl(v2Bp.diferencaPatrimonial)}</strong><small>{v2Bp.balanced?'Equação conciliada':'Sem ajuste artificial'}</small></div>
     </div> : <div className="note">Classifique todas as contas em <strong>Balanço Patrimonial Gerencial</strong> para habilitar o BP V2. O cockpit não infere contas nem cria ajustes para fechar a equação.</div>}
    </section>

    <div className="note" style={{marginTop:20}}><strong>Governança de período:</strong> DRE usa competência; DFC usa liquidação efetiva; BP é uma fotografia acumulada até a competência selecionada. As três visões compartilham a mesma Base Financeira V2, mas não misturam critérios de reconhecimento.</div>
    <div className="note" style={{marginTop:12}}><strong>Controle de caixa:</strong> {v2Dfc?.cashSettledEntries??0} lançamento(s) liquidado(s), {v2Dfc?.unsettledEntries??v2Entries.length} sem liquidação e {v2Dfc?.cashBasisWithoutSettlement??0} marcado(s) como caixa sem data de liquidação. Esses últimos não entram na variação de caixa até existir a data efetiva.</div>
   </>}
  </section>

  <section className="panel" style={{marginBottom:24}}>
   <div className="panel-title"><h2>Visão legada V1</h2><span>{valid?'✓ OK':'! Revisar'} • Razão</span></div>
   <div className="cards"><div className="card"><span>Ativo</span><strong>{brl(bp.ativo)}</strong><small>Posição {selected}</small></div><div className="card"><span>Passivo</span><strong>{brl(bp.passivo)}</strong><small>Posição {selected}</small></div><div className="card"><span>Patrimônio Líquido</span><strong>{brl(bp.patrimonio)}</strong><small>Posição {selected}</small></div><div className="card"><span>Resultado</span><strong>{brl(resultado)}</strong><small>{period.view==='acumulado'?'Acumulado':'Mensal'} {selected}</small></div></div>
   <div className="grid" style={{marginTop:20}}><section className="panel"><div className="panel-title"><h2>Balanço Patrimonial</h2><span>{valid?'✓ OK':'! Revisar'}</span></div><div className="rows"><div className="row"><span>Ativo</span><b>{brl(bp.ativo)}</b></div><div className="row"><span>Passivo</span><b>{brl(bp.passivo)}</b></div><div className="row"><span>Patrimônio Líquido</span><b>{brl(bp.patrimonio)}</b></div><div className="row"><span>Passivo + PL</span><b>{brl(bp.passivo+bp.patrimonio)}</b></div></div></section><section className="panel"><div className="panel-title"><h2>DRE</h2><span>{period.view==='comparativo'?`${selected} × ${previous}`:period.view==='acumulado'?`Jan → ${selected}`:selected}</span></div><div className="rows"><div className="row"><span>Receitas</span><b>{brl(dre.receitas)}</b></div><div className="row"><span>Custos</span><b>{brl(dre.custos)}</b></div><div className="row"><span>Despesas</span><b>{brl(dre.despesas)}</b></div><div className="row"><span>Resultado</span><b>{brl(resultado)}</b></div></div></section></div>
   {period.view==='comparativo'&&<section className="panel" style={{marginTop:20}}><div className="panel-title"><h2>Análise comparativa</h2><span>{selected} × {previous}</span></div><div className="grid"><div className="note"><small>Resultado DRE</small><p><strong>{brl(resultado)}</strong> atual · {brl(priorDre.receitas-priorDre.custos-priorDre.despesas)} anterior</p></div><div className="note"><small>Patrimônio Líquido</small><p><strong>{brl(bp.patrimonio)}</strong> atual · {brl(priorBp.patrimonio)} anterior</p></div><div className="note"><small>Ativo</small><p><strong>{brl(bp.ativo)}</strong> atual · {brl(priorBp.ativo)} anterior</p></div></div></section>}
  </section>
 </main>
}
