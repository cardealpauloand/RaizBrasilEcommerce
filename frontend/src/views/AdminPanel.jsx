import React, { useMemo, useState } from 'react'
import AuthController from '../controllers/AuthController'

export default function AdminPanel(){
  if(!AuthController.isAdmin()) return <div className="container" style={{paddingTop:20}}>Acesso negado</div>
  const [rawOrders, setRawOrders] = useState(AuthController.listOrders())
  const [query, setQuery] = useState('')
  const [showGuestsOnly, setShowGuestsOnly] = useState(false)
  const [expanded, setExpanded] = useState(() => new Set())
  const STATUSES = ['novo','pago','processando','enviado','entregue','cancelado']

  const orders = useMemo(() => {
    const sorted = rawOrders.slice().sort((a,b) => new Date(b.date) - new Date(a.date))
    const q = query.trim().toLowerCase()
    return sorted.filter(o => {
      if(showGuestsOnly && o.user) return false
      if(!q) return true
      const hay = [
        o.id,
        o.user?.name,
        o.user?.email,
        ...o.items.map(it => it.title)
      ].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [rawOrders, query, showGuestsOnly])

  const totalRevenue = useMemo(() => orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0), [orders])

  function toggle(id){
    setExpanded(prev => {
      const next = new Set(prev)
      if(next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function handleStatusChange(id, status){
    try{
      AuthController.updateOrderStatus(id, status)
      setRawOrders(AuthController.listOrders())
    }catch(err){ alert(err.message) }
  }

  function exportCsv(){
    const header = ['id','data','status','total','cliente_nome','cliente_email','convidado','itens_qtd','itens_titulos']
    const rows = orders.map(o => {
      const titulos = (o.items||[]).map(it=>`${it.title} (x${it.qty})`).join('; ')
      const data = new Date(o.date).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' })
      return [
        o.id,
        data,
        o.status || 'pago',
        Number(o.total).toFixed(2),
        o.user?.name || '',
        o.user?.email || '',
        o.user ? 'não' : 'sim',
        (o.items||[]).length,
        titulos.replace(/\n/g,' ')
      ]
    })
    const escape = (v)=>{
      const s = String(v ?? '')
      if(s.includes(';') || s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g,'""') + '"'
      return s
    }
    const csv = [header, ...rows].map(r => r.map(escape).join(',')).join('\n')
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pedidos.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container" style={{paddingTop:20}}>
      <h2>Painel Administrativo</h2>
      <p className="muted">Apenas visível para administradores.</p>

      <section style={{marginTop:12}}>
        <h3 style={{marginBottom:8}}>Pedidos</h3>
          <div className="panel" style={{display:'grid', gap:10}}>
          <div style={{display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', justifyContent:'space-between'}}>
            <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
              <input placeholder="Buscar por ID, cliente, email ou produto" value={query} onChange={e=>setQuery(e.target.value)} style={{minWidth:260}} />
              <label style={{display:'flex', alignItems:'center', gap:6, fontSize:12}}>
                <input type="checkbox" checked={showGuestsOnly} onChange={e=>setShowGuestsOnly(e.target.checked)} /> Somente convidados
              </label>
            </div>
              <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                <button className="btn-secondary" onClick={exportCsv}>Exportar CSV</button>
                <div className="chip info">Pedidos: {orders.length} • Receita: R$ {totalRevenue.toFixed(2)}</div>
              </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="muted" style={{marginTop:12}}>Nenhum pedido encontrado</div>
        ) : (
          <div style={{display:'grid', gap:10, marginTop:12}}>
            {orders.map(o => {
              const isOpen = expanded.has(o.id)
              return (
                <div key={o.id} className="panel" style={{display:'grid', gap:8, transition:'transform .15s ease, box-shadow .15s ease'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:10}}>
                    <div style={{display:'grid', gap:2}}>
                      <div style={{fontWeight:700}}>#{o.id}</div>
                      <div className="muted" style={{fontSize:12}}>
                        {new Date(o.date).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' })} • Cliente: {o.user ? `${o.user.name} (${o.user.email})` : 'Convidado'}
                      </div>
                    </div>
                    <div style={{display:'flex', gap:8, alignItems:'center'}}>
                      <select className="themed-select" value={(o.status||'pago')} onChange={e=>handleStatusChange(o.id, e.target.value)}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div className="chip">Total R$ {Number(o.total).toFixed(2)}</div>
                      <button className="btn-secondary" onClick={()=>toggle(o.id)}>{isOpen ? 'Ocultar itens' : 'Ver itens'}</button>
                    </div>
                  </div>

                  <div style={{display:'grid', gap:6, opacity: isOpen ? 1 : 0, maxHeight: isOpen ? 1000 : 0, overflow:'hidden', transition:'all .25s ease'}}>
                      {o.items.map((it, idx) => (
                        <div key={(it.productId||'p') + '_' + idx} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--panel)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'8px 10px'}}>
                          <div>
                            {it.title} <span className="muted">• Tam: {it.size || 'M'}</span>
                          </div>
                          <div className="muted">Qtd: {it.qty} • R$ {(Number(it.price)*Number(it.qty)).toFixed(2)}</div>
                        </div>
                      ))}
                      {o.shipping && (
                        <div className="muted" style={{marginTop:6, fontSize:12}}>Entrega: {o.shipping.name} • {o.shipping.phone} • {o.shipping.address}</div>
                      )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
