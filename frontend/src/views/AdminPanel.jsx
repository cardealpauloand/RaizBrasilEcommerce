import React, { useEffect, useMemo, useState } from 'react'
import AuthController from '../controllers/AuthController'
import { api } from '../lib/api'

export default function AdminPanel(){
  if(!AuthController.isAdmin()) return <div className="container" style={{paddingTop:20}}>Acesso negado</div>
  const [rawOrders, setRawOrders] = useState(AuthController.listOrders())
  const [kpiOrders, setKpiOrders] = useState([])
  const [products, setProducts] = useState([])
  const [kpiLoading, setKpiLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [showGuestsOnly, setShowGuestsOnly] = useState(false)
  const [expanded, setExpanded] = useState(() => new Set())
  const STATUSES = ['novo','aguardando','pago','processando','enviado','entregue','cancelado']

  useEffect(()=>{
    let alive = true
    ;(async()=>{
      try{
        const data = await api.get('/api/orders')
        if(alive) setKpiOrders(Array.isArray(data) ? data : [])
      }catch{
        if(alive) setKpiOrders(AuthController.listOrders())
      }finally{
        if(alive) setKpiLoading(false)
      }
    })()
    ;(async()=>{
      try{
        const p = await api.get('/api/products')
        if(alive && Array.isArray(p)) setProducts(p)
      }catch{ /* ignore, fallback widget will compute */ }
    })()
    return ()=>{ alive = false }
  }, [])

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

  // Dashboard KPIs based on backend list (fallback to localStorage)
  const KPIs = useMemo(() => {
    const list = kpiOrders || []
    const total = list.length
    const revenue = list.reduce((a,o)=> a + (Number(o.total)||0), 0)
    const byStatus = list.reduce((m,o)=>{ const s=(o.status||'').toLowerCase(); m[s]=(m[s]||0)+1; return m }, {})
    return { total, revenue, byStatus }
  }, [kpiOrders])

  const formatBRL = (n)=> `R$ ${Number(n||0).toFixed(2)}`

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

      {/* Dashboard de Indicadores */}
      <section style={{marginTop:12}}>
        <h3 style={{marginBottom:8}}>Dashboard</h3>
        <div className="panel" style={{display:'grid', gap:14}}>
          {kpiLoading ? (
            <div className="muted">Carregando indicadores...</div>
          ) : (
            <>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12}}>
                <KpiCard title="Pedidos" value={KPIs.total} />
                <KpiCard title="Receita" value={formatBRL(KPIs.revenue)} />
                <KpiCard title="Aguardando" value={KPIs.byStatus['aguardando']||0} subtle />
                <KpiCard title="Pago" value={KPIs.byStatus['pago']||0} subtle />
                <KpiCard title="Enviado" value={KPIs.byStatus['enviado']||0} subtle />
              </div>
              <OrdersPerDayChart orders={kpiOrders} />
              {/* Estoque agregado */}
              <div>
                <div className="muted" style={{margin:'8px 0 6px 0'}}>Estoque</div>
                <StockWidget orders={kpiOrders} products={products} />
              </div>
            </>
          )}
        </div>
      </section>

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

function KpiCard({ title, value, subtle }){
  return (
    <div className="panel" style={{padding:'10px 12px', background: subtle ? 'var(--panel)' : undefined}}>
      <div className="muted" style={{fontSize:12, marginBottom:4}}>{title}</div>
      <div style={{fontWeight:800, fontSize:20}}>{value}</div>
    </div>
  )
}

function StockWidget({ orders, products }){
  // Prefer real backend stock when available
  let entries = []
  if(Array.isArray(products) && products.length && products[0].stock !== undefined){
    entries = products.map(p => [p.title, Number(p.stock||0)])
  } else {
    // Fallback: 3 SKUs com estoque inicial 100 cada (total 300) menos pedidos
    const initial = {
      'Camiseta Raiz Brasil Agrícola': 100,
      'Camiseta Raiz Brasil Azul': 100,
      'Camiseta Raiz Brasil Azul & Cinza': 100
    }
    const map = { ...initial }
    ;(orders||[]).forEach(o => {
      (o.items||[]).forEach(it => {
        const title = it.title || ''
        const qty = Number(it.qty||1)
        if(map[title] !== undefined){ map[title] = Math.max(0, map[title] - qty) }
      })
    })
    entries = Object.entries(map)
  }
  const total = entries.reduce((a, [,v])=> a + Number(v||0), 0)
  return (
    <div className="panel" style={{display:'grid', gap:8}}>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:10}}>
        {entries.map(([name, qty]) => (
          <div key={name} className="panel" style={{padding:'8px 10px'}}>
            <div className="muted" style={{fontSize:12, marginBottom:4}}>{name}</div>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <div style={{fontWeight:800, fontSize:18}}>{qty}</div>
              <div className="muted" style={{fontSize:12}}>em estoque</div>
            </div>
            <div style={{height:6, background:'rgba(255,255,255,0.12)', borderRadius:4, marginTop:6}}>
              <div style={{height:'100%', width: `${Math.max(0, Math.min(100, (qty/100)*100))}%`, background: qty>20 ? 'var(--focus)' : '#ff6b6b', borderRadius:4}} />
            </div>
          </div>
        ))}
      </div>
      <div className="chip" style={{justifyContent:'center'}}>Total em estoque: {total} de 300</div>
    </div>
  )
}

function OrdersPerDayChart({ orders }){
  // Build last 30 days with week separators and tooltips
  const today = new Date()
  const days = Array.from({length:30}, (_,i)=>{
    const d = new Date(today); d.setDate(d.getDate() - (29 - i))
    const key = d.toISOString().slice(0,10)
    const label = d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })
    const dow = d.getDay() // 0=Dom .. 6=Sab
    return { key, label, dow, value:0 }
  })
  const idxByKey = Object.fromEntries(days.map((d,i)=>[d.key,i]))
  ;(orders||[]).forEach(o=>{
    const dt = (o.created_at || o.date || '').slice(0,10)
    const i = idxByKey[dt]
    if(i!==undefined) days[i].value += 1
  })
  const max = Math.max(1, ...days.map(d=>d.value))
  const sum = days.reduce((a,d)=>a+d.value,0)
  const avg = sum / days.length

  return (
    <div className="panel" style={{display:'grid', gap:10}}>
      <div className="muted">Pedidos por dia (30 dias)</div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(30, 1fr)', gap:6, alignItems:'end'}}>
        {days.map((d,i)=>{
          const h = Math.round((d.value/max)*90)
          const isWeekend = d.dow === 0 || d.dow === 6
          return (
            <div key={i} style={{display:'grid', gap:4}}>
              <div title={`${d.label}: ${d.value}`} style={{height:90, display:'flex', alignItems:'flex-end'}}>
                <div style={{height:h, width:'100%', background: isWeekend ? 'rgba(255,221,87,0.85)' : 'var(--focus)', borderRadius:4}} />
              </div>
              <div className="muted" style={{fontSize:10, textAlign:'center'}}>{d.label.slice(0,5)}</div>
            </div>
          )
        })}
      </div>
      <div style={{display:'flex', justifyContent:'space-between', fontSize:11}}>
        <div className="muted">Média diária: {avg.toFixed(2)}</div>
        <div className="muted">Total 30d: {sum}</div>
      </div>
    </div>
  )
}
