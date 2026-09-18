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
import { buildV2ReconciliationAudit } from '@/lib/v2-reconciliation'
import { buildV2ExecutiveCockpit } from '@/lib/v2-executive-cockpit'
import { buildV2CostCenterReport } from '@/lib/v2-cost-center'
import { readV2BrowserStore } from '@/lib/v2-browser-storage'
import { readV2Accounts } from '@/lib/v2-account-storage'
import { readV2CostCenters } from '@/lib/v2-cost-center-storage'
import type { Account } from '@/lib/v2-data-model'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

export default function DemonstracoesIntegradas(){
 const [period,setPeriod]=useState<ReportPeriod>(DEFAULT_REPORT_PERIOD)
 const [v2Entries,setV2Entries]=useState<ReturnType<typeof readV2BrowserStore>['entries']>([])
 const [v2Accounts,setV2Accounts]=useState<Account[]>([])
 const [v2Centers,setV2Centers]=useState<ReturnType<typeof readV2CostCenters>>([])

 useEffect(()=>{
  setV2Entries(readV2BrowserStore().entries)
  setV2Accounts(readV2Accounts())
  setV2Centers(readV2CostCenters())
 },[])

 const years=useMemo(()=>Array.from(new Set(sampleJournal.map(e=>Number(String(e.competence??'').slice(0,4))).filter(y=>y>2000))).sort((a,b)=>a-b),[])
 const selected=competence(period.year,period.month)
 const previous=period.month===1?competence(period.year-1,12):competence(period.year,period.month-1)
 const selectedV2Period=selected
 const v2Base=useMemo(()=>buildV2FinancialBase(v2Entries),[v2Entries])
 const v2Dre=useMemo(()=>buildV2Dre(v2Base,selectedV2Period).selectedPeriod,[v2Base,selectedV2Period])
 const v2DfcReport=useMemo(()=>buildV2Dfc(v2Base,selectedV2Period),[v2Base,selectedV2Period])
 const v2Dfc=v2DfcReport.selectedPeriod
 const classifiedAccountIds=new Set(v2Accounts.map(account=>account.id))
 const v2AccountIds=new Set(v2Entries.map(entry=>entry.accountId))
 const v2BpReady=v2Entries.length>0 && v2AccountIds.size>0 && [...v2AccountIds].every(id=>classifiedAccountIds.has(id)) && [...v2Accounts].filter(account=>v2AccountIds.has(account.id)).every(account=>Boolean(account.companyId&&account.nature&&account.statement))
 const v2Bp=useMemo(()=>v2BpReady?buildV2Bp(v2Base,v2Accounts,selectedV2Period):null,[v2Base,v2Accounts,v2BpReady,selectedV2Period])
 const previousV2Bp=useMemo(()=>v2BpReady?buildV2Bp(v2Base,v2Accounts,previous):null,[v2Base,v2Accounts,v2BpReady,previous])
 const v2Audit=useMemo(()=>buildV2ReconciliationAudit(v2Base,v2Accounts,buildV2Dre(v2Base,selectedV2Period),v2DfcReport,v2Bp,selectedV2Period,previous,previousV2Bp),[v2Base,v2Accounts,v2DfcReport,v2Bp,previousV2Bp,selectedV2Period,previous])
 const v2CostCenterReport=useMemo(()=>buildV2CostCenterReport(v2Base,v2Centers,selectedV2Period),[v2Base,v2Centers,selectedV2Period])
 const v2Executive=useMemo(()=>buildV2ExecutiveCockpit(v2Base,buildV2Dre(v2Base),v2DfcReport,v2Bp,v2Audit,selectedV2Period,previous,v2CostCenterReport),[v2Base,v2DfcReport,v2Bp,v2Audit,selectedV2Period,previous,v2CostCenterReport])

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
   {v2Entries.length===0 ? <div className="note">Nenhum lançamento V2 persistido neste navegador. Acesse <strong>Importação</strong>, aprove um CSV e volte a esta visão. A V1 permanece disponível abaixo.</div> : <div>
    <section className="panel" style={{marginBottom:20}}>
     <div className="panel-title"><div><h2>Resumo Executivo</h2><span>{selectedV2Period} × {previous}</span></div><span>{v2Executive.qualityStatus==='ok'?'✓ Sem bloqueios estruturais':v2Executive.qualityStatus==='pending'?'! Classificação pendente':'! Atenção de governança'}</span></div>
     <div className="cards">
      <div className="card"><span>Receita</span><strong>{brl(v2Executive.receita)}</strong><small>Competência {selectedV2Period}</small></div>
      <div className="card"><span>Margem EBITDA</span><strong>{v2Executive.margemEbitda===undefined?'—':(v2Executive.margemEbitda*100).toFixed(1).replace('.',',')+'%'}</strong><small>EBITDA {brl(v2Executive.ebitda)}</small></div>
      <div className="card"><span>Resultado líquido</span><strong>{brl(v2Executive.resultadoLiquido)}</strong><small>Margem {v2Executive.margemLiquida===undefined?'—':(v2Executive.margemLiquida*100).toFixed(1).replace('.',',')+'%'}</small></div>
      <div className="card"><span>Caixa operacional</span><strong>{brl(v2Executive.caixaOperacional)}</strong><small>Variação total {brl(v2Executive.variacaoCaixa)}</small></div>
     </div>
     <div className="grid" style={{marginTop:20}}>
      <section className="panel">
       <div className="panel-title"><h2>Movimento do período</h2><span>vs. {previous}</span></div>
       <div className="rows">
        <div className="row"><span>Resultado líquido</span><b>{brl(v2Executive.resultadoVariacao)}</b></div>
        <div className="row"><span>Variação de caixa</span><b>{brl(v2Executive.caixaVariacao)}</b></div>
        <div className="row"><span>Caixa operacional</span><b>{brl(v2Executive.caixaOperacional)}</b></div>
        <div className="row"><span>Diferença patrimonial</span><b>{brl(v2Executive.diferencaPatrimonial??0)}</b></div>
       </div>
      </section>
      <section className="panel">
       <div className="panel-title"><h2>Qualidade & fechamento</h2><span>{v2Executive.pendingIssues} item(ns)</span></div>
       <div className="rows">
        <div className="row"><span>Lançamentos sem classificação</span><b>{v2Executive.unclassifiedEntries}</b></div>
        <div className="row"><span>Lançamentos sem liquidação</span><b>{v2Executive.unsettledEntries}</b></div>
        <div className="row"><span>IDs externos duplicados</span><b>{v2Executive.duplicateExternalIds}</b></div>
        <div className="row"><span>Status da auditoria</span><b>{v2Executive.qualityStatus==='ok'?'OK':v2Executive.qualityStatus==='pending'?'Pendente':'Atenção'}</b></div>
       </div>
      </section>
     </div>
     <section className="panel" style={{marginTop:20}}>
      <div className="panel-title"><h2>Principais movimentos da DRE</h2><span>por impacto no resultado</span></div>
      <div className="rows">
       {v2Executive.drivers.map(driver=><div className="row" key={driver.label}><span>{driver.label}</span><b>{brl(driver.value)}</b></div>)}
      </div>
     </section>
     <section className="panel" style={{marginTop:20}}>
      <div className="panel-title"><h2>Evolução recente</h2><span>últimas {v2Executive.trend.length} competências</span></div>
      <div style={{display:'grid',gridTemplateColumns:'0.9fr repeat(4,1fr)',gap:12,padding:'10px 0',fontSize:12,fontWeight:600,borderBottom:'1px solid rgba(127,127,127,.25)'}}>
       <span>Período</span><span>Receita</span><span>EBITDA</span><span>Resultado</span><span>Caixa</span>
      </div>
      {v2Executive.trend.map(item=><div key={item.period} style={{display:'grid',gridTemplateColumns:'0.9fr repeat(4,1fr)',gap:12,padding:'10px 0',fontSize:13,borderBottom:'1px solid rgba(127,127,127,.15)'}}>
       <span>{item.period}</span><span>{brl(item.receita)}</span><span>{brl(item.ebitda)}</span><span>{brl(item.resultadoLiquido)}</span><span>{brl(item.variacaoCaixa)}</span>
      </div>)}
     </section>

     <section className="panel" style={{marginTop:20}}>
      <div className="panel-title"><div><h2>Resultado por centro de resultado</h2><span>{selectedV2Period} • dimensão gerencial explícita</span></div><span>{v2Executive.costCenterCount} centro(s) com dados</span></div>
      {v2Executive.costCenters.length===0 ? (
       <div className="note">Nenhum lançamento com centro de resultado na competência selecionada. A ausência de classificação não é redistribuída automaticamente.</div>
      ) : (
       <div>
        <div className="cards">
         <div className="card"><span>Centros com dados</span><strong>{v2Executive.costCenterCount}</strong><small>Classificação explícita</small></div>
         <div className="card"><span>Sem centro</span><strong>{v2Executive.unassignedCostCenterEntries}</strong><small>Lançamentos sem rateio</small></div>
         <div className="card"><span>Receita por centros</span><strong>{brl(v2Executive.costCenters.filter(row=>row.costCenterId).reduce((sum,row)=>sum+row.receita,0))}</strong><small>Competência {selectedV2Period}</small></div>
         <div className="card"><span>OPEX por centros</span><strong>{brl(v2Executive.costCenters.filter(row=>row.costCenterId).reduce((sum,row)=>sum+row.opex,0))}</strong><small>Sem redistribuição automática</small></div>
        </div>
        <div className="table-wrap" style={{marginTop:16,overflowX:'auto'}}>
         <table>
          <thead><tr><th>Centro</th><th>Receita</th><th>Custos</th><th>OPEX</th><th>EBITDA</th><th>Margem EBITDA</th><th>Resultado</th><th>Margem líquida</th></tr></thead>
          <tbody>
           {v2Executive.costCenters.map(row=>{
            const margemEbitda=Math.abs(row.receita)>=0.005?row.ebitdaImpact/row.receita:undefined
            const margemLiquida=Math.abs(row.receita)>=0.005?row.resultadoLiquido/row.receita:undefined
            return <tr key={row.costCenterId??'sem'}>
             <td><strong>{row.code}</strong><small style={{display:'block'}}>{row.name}</small></td>
             <td className="amount">{brl(row.receita)}</td>
             <td className="amount">{brl(row.custos)}</td>
             <td className="amount">{brl(row.opex)}</td>
             <td className="amount"><strong>{brl(row.ebitdaImpact)}</strong></td>
             <td className="amount">{margemEbitda===undefined?'—':(margemEbitda*100).toFixed(1).replace('.',',')+'%'}</td>
             <td className="amount"><strong>{brl(row.resultadoLiquido)}</strong></td>
             <td className="amount">{margemLiquida===undefined?'—':(margemLiquida*100).toFixed(1).replace('.',',')+'%'}</td>
            </tr>
           })}
          </tbody>
         </table>
        </div>
        <div className="note" style={{marginTop:12}}><strong>Rastreabilidade:</strong> os valores acima vêm diretamente dos lançamentos V2 classificados no centro selecionado. Lançamentos sem centro permanecem separados e não são rateados, inferidos ou redistribuídos.</div>
       </div>
      )}
     </section>

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
    <div className="note" style={{marginTop:12}}><strong>Controle de caixa:</strong> {v2DfcReport.cashSettledEntries} lançamento(s) liquidado(s), {v2DfcReport.unsettledEntries} sem liquidação e {v2DfcReport.cashBasisWithoutSettlement} marcado(s) como caixa sem data de liquidação. Esses últimos não entram na variação de caixa até existir a data efetiva.</div>
    <section className="panel" style={{marginTop:20}}>
     <div className="panel-title"><div><h2>Reconciliação e Auditoria V2</h2><span>{selectedV2Period} × {previous}</span></div><span>{v2Audit.status==='ok'?'✓ Estruturalmente OK':v2Audit.status==='pending'?'! Classificação pendente':'! Atenção'}</span></div>
     <div className="cards">
      <div className="card"><span>Classificação</span><strong>{v2Audit.classification.classifiedEntries}/{v2Audit.classification.totalEntries}</strong><small>{v2Audit.classification.unclassifiedEntries} sem classificação completa</small></div>
      <div className="card"><span>Liquidação</span><strong>{v2Audit.settlement.settledEntries}</strong><small>{v2Audit.settlement.unsettledEntries} sem liquidação</small></div>
      <div className="card"><span>Diferença BP</span><strong>{brl(v2Audit.bpVsResult.bpDifference)}</strong><small>{v2Audit.bpVsResult.balanced?'Equação conciliada':'Revisão necessária'}</small></div>
      <div className="card"><span>IDs externos duplicados</span><strong>{v2Audit.duplicateExternalIds}</strong><small>Na base persistida</small></div>
     </div>
     <div className="grid" style={{marginTop:20}}>
      <section className="panel">
       <div className="panel-title"><h2>DRE × DFC</h2><span>{v2Audit.dreVsDfc.interpretation==='aligned'?'Valores alinhados':'Ponte de timing'}</span></div>
       <div className="rows">
        <div className="row"><span>Resultado líquido DRE</span><b>{brl(v2Audit.dreVsDfc.dreResult)}</b></div>
        <div className="row"><span>Variação de caixa DFC</span><b>{brl(v2Audit.dreVsDfc.cashVariation)}</b></div>
        <div className="row"><span>Diferença da ponte</span><b>{brl(v2Audit.dreVsDfc.bridgeDifference)}</b></div>
       </div>
       <div className="note" style={{marginTop:12}}>A diferença não é tratada como erro automático: DRE usa competência e DFC usa liquidação. Capital, capex, transferências e capital de giro também podem explicar a ponte.</div>
      </section>
      <section className="panel">
       <div className="panel-title"><h2>BP × Resultado</h2><span>{v2Audit.bpVsResult.interpretation==='balanced'?'Conciliado':'Requer análise'}</span></div>
       <div className="rows">
        <div className="row"><span>Diferença patrimonial</span><b>{brl(v2Audit.bpVsResult.bpDifference)}</b></div>
        <div className="row"><span>Resultado do período</span><b>{brl(v2Audit.bpVsResult.currentResult??0)}</b></div>
        <div className="row"><span>Movimento do PL</span><b>{brl(v2Audit.bpVsResult.plMovement??0)}</b></div>
        <div className="row"><span>Movimento de PL não explicado pelo resultado</span><b>{brl(v2Audit.bpVsResult.unexplainedPlMovement??0)}</b></div>
       </div>
       <div className="note" style={{marginTop:12}}>O resultado não é encerrado automaticamente no PL. Diferenças podem decorrer de capital, distribuições, ajustes ou ausência de lançamento de encerramento.</div>
      </section>
     </div>
     <section className="panel" style={{marginTop:20}}>
      <div className="panel-title"><h2>Variação período a período</h2><span>{selectedV2Period} × {previous}</span></div>
      <div className="grid">
       <div className="note"><small>Resultado líquido</small><p><strong>{brl(v2Audit.periodVariation.dreResultVariation)}</strong> de variação</p></div>
       <div className="note"><small>Caixa</small><p><strong>{brl(v2Audit.periodVariation.cashVariation)}</strong> de variação</p></div>
       <div className="note"><small>Diferença patrimonial</small><p><strong>{brl(v2Audit.periodVariation.bpDifferenceVariation??0)}</strong> de variação</p></div>
      </div>
     </section>
     <section className="panel" style={{marginTop:20}}>
      <div className="panel-title"><h2>Pendências e trilha de qualidade</h2><span>{v2Audit.issues.length} item(ns)</span></div>
      {v2Audit.issues.length===0 ? <div className="note">Nenhuma pendência estrutural detectada no período.</div> : <div className="rows">{v2Audit.issues.map(issue=><div className="row" key={issue.code}><span>{issue.title}<small style={{display:'block'}}>{issue.detail}</small></span><b>{issue.count}</b></div>)}</div>}
     </section>
    </section>
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
