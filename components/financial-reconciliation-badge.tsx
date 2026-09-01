'use client'

import type { ReactNode } from 'react'

export function FinancialReconciliationBadge({status='ok', details, children}:{status?:'ok'|'attention';details?:string;children?:ReactNode}){
  const ok=status==='ok'
  return <span title={details} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 9px',borderRadius:999,border:'1px solid #d0d5dd',fontSize:12,fontWeight:600,background:ok?'#f6fef9':'#fffaeb',color:ok?'#027a48':'#b54708'}}>
    <span aria-hidden>{ok?'✓':'⚠'}</span>{children ?? (ok?'Dados conciliados':'Verificar divergências')}
  </span>
}
