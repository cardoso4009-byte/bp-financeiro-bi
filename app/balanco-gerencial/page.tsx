'use client'
import {useEffect, useMemo, useState} from 'react'
import {financialCore} from '@/lib/financial-core'
import {monthlyBalance} from '@/lib/monthly-data'
import ReportPeriodFilter from '@/components/report-period-filter'
import {DEFAULT_REPORT_PERIOD, monthLabel, type ReportPeriod} from '@/lib/report-period'
import {buildV2FinancialBase} from '@/lib/v2-financial-base'
import {buildV2Bp} from '@/lib/v2-bp'
import type {Account} from '@/lib/v2-data-model'
import {readV2BrowserStore} from '@/lib/v2-browser-storage'
import {readV2Accounts, writeV2Accounts} from '@/lib/v2-account-storage'

const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const pct=(n:number)=>`${(n*100).toFixed(1).replace('.',',')}%`
const months=monthlyBalance.map(m=>m.month)
const availableYears=Array.from(new Set(financialCore.map(x=>x.year))).sort((a,b)=>a-b)
const defaultYear=availableYears.at(-1)??2026
const defaultMonth=monthlyBalance.length||1

type GroupProps={title:string;value:number;children:React.ReactNode;defaultOpen?:boolean}
function Group({title,value,children,defaultOpen=true}:GroupProps){
 const[open,setOpen]=useState(defaultOpen)
 return <>
  <tr className="group-row" onClick={()=>setOpen(!open)}><td><button className="expand-btn" aria-label={open?'Recolher':'Expandir'}>{open?'−':'+'}</button><strong>{title}</strong></td><td className="amount"><strong>{brl(value)}</strong></td></tr>
  {open&&children}
 </>
}
function Item({label,value,indent=1}:{label:string;value:number;indent?:number}){return <tr className="item-row"><td style={{paddingLeft:`${28+indent*20}px`}}>{label}</td><td className="amount">{brl(value)}</td></tr>}
function Check({ok,label,value}:{ok:boolean;label:string;value:string}){return <div className={`check ${ok?'ok':'warning'}`}><span>{ok?'✓':'!'}</span><div><strong>{label}</strong><small>{value}</small></div></div>}

type AccountDraft={companyId:string;code:string;name:string;nature:Account['nature']|'';statement:Account['statement']|''}

export default function BalancoGerencial(){
 const[period,setPeriod]=useState<ReportPeriod>({...DEFAULT_REPORT_PERIOD,year:defaultYear,month:defaultMonth})
 const[mode,setMode]=useState<'estrutura'|'indicadores'>('estrutura')
 const[v2Entries,setV2Entries]=useState<ReturnType<typeof readV2BrowserStore>['entries']>([])
 const[accountDrafts,setAccountDrafts]=useState<Record<string,AccountDraft>>({})
 const[accountsSaved,setAccountsSaved]=useState(false)
 useEffect(()=>{
  const store=readV2BrowserStore()
  const entries=store.entries
  setV2Entries(entries)
  const saved=readV2Accounts()
  const byId=new Map(saved.map(account=>[account.id,account]))
  const drafts:Record<string,AccountDraft>={}
  Array.from(new Set(entries.map(entry=>entry.accountId))).forEach(accountId=>{
   const first=entries.find(entry=>entry.accountId===accountId)
   const account=byId.get(accountId)
   drafts[accountId]=account
    ? {companyId:account.companyId,code:account.code,name:account.name,nature:account.nature,statement:account.statement}
    : {companyId:first?.companyId??'',code:accountId,name:accountId,nature:'',statement:''}
  })
  setAccountDrafts(drafts)
  setAccountsSaved(saved.length>0)
 },[])
 const baseIndex=Math.min(Math.max(period.month-1,0),Math.max(months.length-1,0))
 const m=monthlyBalance[baseIndex] ?? monthlyBalance[0]
 const prevIndex=period.month===1 ? -1 : baseIndex-1
 const prev=prevIndex>=0 ? monthlyBalance[prevIndex] : null
 const variance=(a:number,b:number)=>b!==0?(a-b)/Math.abs(b):0
 const patrimonioCheck=m.ativoTotal-(m.passivoTotal+m.pl)
 const capitalGiro=m.ativoCirculante-m.passivoCirculante
 const prevCapitalGiro=prev?prev.ativoCirculante-prev.passivoCirculante:null
 const rows=useMemo(()=>[
  ['Liquidez Corrente',m.ativoCirculante/m.passivoCirculante],['Participação do PL',m.pl/m.ativoTotal],['Endividamento',m.passivoTotal/m.ativoTotal],['Imobilização do PL',m.ativoNaoCirculante/m.pl],['Caixa / Ativo',m.caixa/m.ativoTotal]
 ],[m])
 const viewLabel=period.view==='acumulado'?'Posição no fechamento do mês selecionado (acumulado não soma saldos)':period.view==='comparativo'?'Comparativo com o período anterior':'Posição patrimonial do mês selecionado'
 const previousLabel=period.month===1?`Dez/${period.year-1}`:`${monthLabel(period.month-1)}/${period.year}`
 const selectedV2Period=`${period.year}-${String(period.month).padStart(2,'0')}`
 const v2Base=useMemo(()=>buildV2FinancialBase(v2Entries),[v2Entries])
 const draftRows=Object.entries(accountDrafts)
 const v2Ready=v2Entries.length>0 && draftRows.length>0 && draftRows.every(([,draft])=>Boolean(draft.nature&&draft.statement&&draft.companyId))
 const v2Accounts=useMemo<Account[]>(()=>draftRows.map(([id,draft])=>({id,companyId:draft.companyId,code:draft.code||id,name:draft.name||id,nature:draft.nature as Account['nature'],statement:draft.statement as Account['statement'],active:true})),[accountDrafts])
 const v2Report=v2Ready?buildV2Bp(v2Base,v2Accounts,selectedV2Period):null
 function updateDraft(id:string,field:'nature'|'statement',value:string){
  setAccountDrafts(current=>({...current,[id]:{...current[id],[field]:value} as AccountDraft}))
  setAccountsSaved(false)
 }
 function saveAccounts(){
  if(!v2Ready) return
  writeV2Accounts(v2Accounts)
  setAccountsSaved(true)
 }
 return <main className="bp-page"><div className="bp-container">
  <header className="bp-header"><div><small>CONTROLADORIA FINANCEIRA</small><h1>Balanço Patrimonial Gerencial</h1><p>Posição patrimonial • visão mensal, acumulada e comparativa</p></div><ReportPeriodFilter value={period} onChange={setPeriod} years={availableYears}/></header>

  <section className="bp-card" style={{marginBottom:24}}>
   <div className="bp-card-title"><div><small>BASE FINANCEIRA · V2</small><h2>BP V2 — posição patrimonial</h2><p className="muted">Fotografia por competência • contas de ativo, passivo e patrimônio líquido</p></div><span>{selectedV2Period}</span></div>
   {v2Entries.length===0 ? <div className="note">Nenhum lançamento V2 persistido. Importe um CSV aprovado para habilitar a nova visão, sem alterar a V1.</div> : <>
    <div className="bp-summary"><div><span>Lançamentos V2</span><strong>{v2Entries.length}</strong></div><div><span>Competências</span><strong>{v2Base.periods.length}</strong></div><div><span>Contas identificadas</span><strong>{draftRows.length}</strong></div><div><span>Classificação</span><strong>{v2Ready?'Pronta':'Pendente'}</strong></div></div>
    <div className="toolbar" style={{marginTop:20}}><div><h3>Plano de contas V2</h3><p className="muted">A classificação patrimonial é explícita. Nenhum ativo, passivo ou PL é inferido automaticamente.</p></div><button className="primary-btn" disabled={!v2Ready} onClick={saveAccounts}>{accountsSaved?'Classificação salva':'Salvar classificação'}</button></div>
    <div className="table-wrap"><table><thead><tr><th>Conta / ID importado</th><th>Natureza</th><th>Classificação BP</th></tr></thead><tbody>{draftRows.map(([id,draft])=><tr key={id}><td><strong>{draft.name}</strong><small style={{display:'block'}}>{id}</small></td><td><select value={draft.nature} onChange={e=>updateDraft(id,'nature',e.target.value)}><option value="">Selecionar</option><option value="debit">Débito</option><option value="credit">Crédito</option></select></td><td><select value={draft.statement} onChange={e=>updateDraft(id,'statement',e.target.value)}><option value="">Selecionar</option><option value="ativo">Ativo</option><option value="passivo">Passivo</option><option value="patrimonio_liquido">Patrimônio Líquido</option><option value="resultado">Resultado</option></select></td></tr>)}</tbody></table></div>
    {v2Report ? <>
      <div className="bp-summary" style={{marginTop:20}}><div><span>Ativo V2</span><strong>{brl(v2Report.ativo)}</strong></div><div><span>Passivo V2</span><strong>{brl(v2Report.passivo)}</strong></div><div><span>Patrimônio Líquido V2</span><strong>{brl(v2Report.patrimonioLiquido)}</strong></div><div><span>Diferença patrimonial</span><strong>{brl(v2Report.diferencaPatrimonial)}</strong></div></div>
      <div className="bp-checks"><Check ok={v2Report.balanced} label="Equação patrimonial" value={v2Report.balanced?'Ativo = Passivo + PL':'Diferença medida, sem ajuste artificial: '+brl(v2Report.diferencaPatrimonial)}/><Check ok={v2Report.excludedResultEntries>=0} label="Governança da fotografia" value={`${v2Report.entriesInSnapshot} lançamento(s) até ${selectedV2Period}; ${v2Report.excludedResultEntries} de resultado fora do BP.`}/></div>
      <div className="table-wrap" style={{marginTop:20}}><table><thead><tr><th>Conta</th><th>Grupo</th><th>Lançamentos</th><th>Saldo</th></tr></thead><tbody>{v2Report.accounts.map(account=><tr key={account.accountId}><td>{account.name}<small style={{display:'block'}}>{account.code}</small></td><td>{account.statement==='ativo'?'Ativo':account.statement==='passivo'?'Passivo':account.statement==='patrimonio_liquido'?'Patrimônio Líquido':'Resultado'}</td><td>{account.entries}</td><td className="amount">{brl(account.balance)}</td></tr>)}</tbody></table></div>
     </> : <div className="note" style={{marginTop:16}}>Classifique natureza e grupo patrimonial de todas as contas para calcular o BP V2. A regra é deliberadamente conservadora: o sistema não inventa classificações.</div>}
   </>}
  </section>

  <div className="bp-tabs">{(['estrutura','indicadores'] as const).map(x=><button key={x} className={mode===x?'active':''} onClick={()=>setMode(x)}>{x[0].toUpperCase()+x.slice(1)}</button>)}</div>
  {period.view!=='comparativo'&&mode==='estrutura'&&<>
   <div className="bp-summary"><div><span>Ativo Total</span><strong>{brl(m.ativoTotal)}</strong></div><div><span>Passivo Total</span><strong>{brl(m.passivoTotal)}</strong></div><div><span>Patrimônio Líquido</span><strong>{brl(m.pl)}</strong></div><div><span>Capital de Giro Líquido</span><strong>{brl(capitalGiro)}</strong></div></div>
   <section className="bp-card"><div className="bp-card-title"><div><small>ESTRUTURA PATRIMONIAL · V1</small><h2>Ativo, Passivo e Patrimônio Líquido</h2></div><span>{monthLabel(period.month)}/{period.year}</span></div><div className="table-wrap"><table className="bp-table"><thead><tr><th>Valores em R$</th><th>Saldo</th></tr></thead><tbody>
    <Group title="ATIVO" value={m.ativoTotal}><Group title="Ativo Circulante" value={m.ativoCirculante}><Item label="Caixa" value={m.caixa}/><Item label="Contas a Receber" value={m.contasReceber}/><Item label="Estoques" value={m.estoques}/><Item label="Outros Ativos" value={m.outrosAtivos}/></Group><Group title="Ativo Não Circulante" value={m.ativoNaoCirculante}><Item label="Imobilizado" value={m.imobilizado}/></Group></Group>
    <Group title="PASSIVO" value={m.passivoTotal}><Group title="Passivo Circulante" value={m.passivoCirculante}><Item label="Fornecedores" value={m.fornecedores}/><Item label="Obrigações" value={m.obrigacoes}/><Item label="Outros Passivos" value={m.outrosPassivos}/></Group><Group title="Passivo Não Circulante" value={m.passivoNaoCirculante}><Item label="Dívidas de Longo Prazo" value={m.dividasLongoPrazo}/></Group></Group>
    <Group title="PATRIMÔNIO LÍQUIDO" value={m.pl} defaultOpen={false}><Item label="Patrimônio Líquido" value={m.pl}/></Group>
   </tbody></table></div></section>
   <div className="bp-checks"><Check ok={Math.abs(patrimonioCheck)<1} label="Ativo = Passivo + PL" value={Math.abs(patrimonioCheck)<1?'Estrutura patrimonial conciliada':`Diferença: ${brl(patrimonioCheck)}`}/><Check ok={Number.isFinite(capitalGiro)} label="Capital de Giro Líquido" value={prev&&prevCapitalGiro!==null?`${brl(capitalGiro)} • variação vs. ${previousLabel}: ${pct(variance(capitalGiro,prevCapitalGiro))}`:`${brl(capitalGiro)} • sem competência anterior disponível para comparação`}/></div>
  </>}
  {period.view==='comparativo'&&<section className="bp-card"><div className="bp-card-title"><div><small>ANÁLISE COMPARATIVA</small><h2>{monthLabel(period.month)}/{period.year} × {previousLabel}</h2></div><span>Período anterior</span></div>{prev?<div className="bp-grid">{[['Ativo Total',m.ativoTotal,prev.ativoTotal],['Passivo Total',m.passivoTotal,prev.passivoTotal],['Patrimônio Líquido',m.pl,prev.pl],['Capital de Giro Líquido',capitalGiro,prevCapitalGiro!]].map(([label,value,previous])=><div className="metric-card" key={label as string}><span>{label}</span><h2>{brl(value as number)}</h2><small>Anterior: {brl(previous as number)} • variação: {variance(value as number,previous as number)>=0?'+':''}{pct(variance(value as number,previous as number))}</small></div>)}</div>:<div className="note">Não há competência anterior disponível para comparação.</div>}</section>}
  {mode==='indicadores'&&<div className="indicator-grid">{rows.map(([label,value])=><div className="metric-card" key={label as string}><span>{label}</span><h2>{label==='Liquidez Corrente'?(value as number).toFixed(2):pct(value as number)}</h2><small>{viewLabel} • {monthLabel(period.month)}/{period.year}</small></div>)}<div className="metric-card"><span>Capital de Giro Líquido</span><h2>{brl(capitalGiro)}</h2><small>Ativo Circulante − Passivo Circulante</small></div></div>}
  <div className="report-period-context"><strong>{viewLabel}</strong><span>Data-base: {monthLabel(period.month)}/{period.year}</span></div>
 </div></main>
}
