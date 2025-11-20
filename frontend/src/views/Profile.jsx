import React, {useState, useEffect} from 'react'
import AuthController from '../controllers/AuthController'
import UserModel from '../models/UserModel'

export default function Profile({ onNavigate, onUserChange }){
  const user = AuthController.current()
  const [mode, setMode] = useState('view')
  const [form, setForm] = useState({name:'', email:'', password:''})

  async function handleLogin(e){
    e.preventDefault()
    // simple email validation (must contain @ and .com)
    const emailOk = /@/.test(form.email) && /\.com\b/.test(form.email)
    if(!emailOk){ return alert('Insira um email válido (deve conter @ e .com)') }
    try{
      const u = await AuthController.login({email:form.email, password:form.password})
      onUserChange(u)
      setMode('view')
    }catch(err){ alert(err.message) }
  }

  async function handleRegister(e){
    e.preventDefault()
    // name: only letters (including accents) and spaces
    const nameOk = /^[A-Za-zÀ-ÿ\s]{2,}$/.test(form.name || '')
    if(!nameOk){ return alert('Nome inválido. Use apenas letras e espaços.') }
    const emailOk = /@/.test(form.email) && /\.com\b/.test(form.email)
    if(!emailOk){ return alert('Email inválido. Deve conter @ e .com') }
    try{ const u = await AuthController.register(form); onUserChange(u); setMode('view') }catch(err){ alert(err.message) }
  }

  if(!user){
    return (
      <div className="container" style={{paddingTop:20}}>
        <h2>Entre para comprar</h2>
        <div className="panel" style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap'}}>
          <div className="muted">Faça login ou crie sua conta para continuar.</div>
          <div style={{display:'flex', gap:8}}>
            <button className="btn" onClick={()=> onNavigate('auth')}>Ir para Login/Registro</button>
            <button className="btn-secondary" onClick={()=> onNavigate('home')}>Voltar</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{paddingTop:20}}>
      <h2>Perfil</h2>
  <div className="panel" style={{display:'grid', gap:10, maxWidth:720, marginBottom:56}}>
        <div style={{display:'grid', gap:10, gridTemplateColumns:'1fr 1fr'}}>
          <div>
            <div className="muted" style={{fontSize:12, marginBottom:4}}>Nome</div>
            <input value={user.name} readOnly />
          </div>
          <div>
            <div className="muted" style={{fontSize:12, marginBottom:4}}>Email</div>
            <input value={user.email} readOnly />
          </div>
        </div>
        {user.isAdmin && (
          <div className="chip info">Tipo de conta: Administrador</div>
        )}
        <div className="muted" style={{marginTop:4}}>Endereço de entrega</div>
        <ProfileAddressForm user={user} onUserChange={onUserChange} />
      </div>

      <h3>Meus pedidos</h3>
      <OrdersList onNavigate={onNavigate} userId={user.id} />
    </div>
  )
}

function ProfileAddressForm({ user, onUserChange }){
  const STATES = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']
  function parseAddress(u){
    const full = String(u.address || '')
    let street = u.street || ''
    let number = u.number || ''
    let complement = u.complement || ''
    if(!street && full){
      const m = full.match(/(\d{1,6})/)
      if(m){
        const i = m.index || 0
        number = number || m[1]
        street = full.slice(0, i).replace(/[ ,]+$/,'').trim()
        const rest = full.slice(i + m[1].length).replace(/^,?\s*/, '')
        complement = complement || rest
      }else{
        street = full
      }
    }
    return { street, number, complement }
  }
  const parsed = parseAddress(user)
  const [addr, setAddr] = useState({
    phone: user.phone || '',
    street: parsed.street,
    number: parsed.number,
    complement: parsed.complement,
    city: user.city || '',
    state: user.state || '',
    zip: user.zip || ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  function save(e){
    e.preventDefault()
    setSaving(true)
    // simple required validation
    const required = ['phone','street','number','city','state','zip']
    const missing = required.filter(k => !String(addr[k]||'').trim())
    if(missing.length){ setError('Preencha todos os campos de endereço'); setSaving(false); return }
  if(!String(addr.city).trim()){ setError('Informe a cidade'); setSaving(false); return }
    // cep: only 8 digits
    if(!/^\d{8}$/.test(addr.zip)){ setError('CEP inválido. Use 8 números (ex: 01001000).'); setSaving(false); return }
    // city: only letters/spaces
  if(!/^[A-Za-zÀ-ÿ\s]{2,}$/.test(addr.city)){ setError('Cidade inválida. Use apenas letras e espaços.'); setSaving(false); return }
    // state: must be a valid UF
    if(!STATES.includes(addr.state)){ setError('Selecione um estado válido.'); setSaving(false); return }
    try{
      const legacyAddress = `${addr.street || ''} ${addr.number || ''}${addr.complement ? ', ' + addr.complement : ''}`.trim()
      const updated = UserModel.updateCurrent({
        phone: addr.phone,
        street: addr.street,
        number: addr.number,
        complement: addr.complement,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        address: legacyAddress
      })
      onUserChange && onUserChange(updated)
      setError(null)
      setSaved(true)
      setTimeout(()=> setSaved(false), 1800)
    }catch(err){ alert(err.message) }
    setSaving(false)
  }

  return (
    <form onSubmit={save} style={{display:'grid', gap:10}}>
      <div style={{display:'grid', gap:10, gridTemplateColumns:'1fr 1fr'}}>
        <input required type="tel" placeholder="Telefone (apenas números)" value={addr.phone} inputMode="numeric" onChange={e=>{ const v=e.target.value.replace(/\D/g,''); setAddr({...addr, phone:v}); if(error) setError(null) }} maxLength={11} style={{border: (!String(addr.phone).trim() && error) ? '1px solid #ff6b6b' : undefined}} />
        <input required placeholder="CEP (apenas números)" value={addr.zip} onChange={e=>{ const v=e.target.value.replace(/\D/g,''); setAddr({...addr, zip:v}); if(error) setError(null) }} maxLength={8} style={{border: ((!/^\d{8}$/.test(addr.zip)) && error) ? '1px solid #ff6b6b' : undefined}} />
      </div>
      <div style={{display:'grid', gap:10, gridTemplateColumns:'2fr 1fr'}}>
        <input required placeholder="Rua" value={addr.street} onChange={e=>{ setAddr({...addr, street:e.target.value}); if(error) setError(null) }} style={{border: (!String(addr.street).trim() && error) ? '1px solid #ff6b6b' : undefined}} />
        <input required placeholder="Número" value={addr.number} onChange={e=>{ const v=e.target.value.replace(/\D/g,''); setAddr({...addr, number:v}); if(error) setError(null) }} style={{border: (!String(addr.number).trim() && error) ? '1px solid #ff6b6b' : undefined}} />
      </div>
      <input placeholder="Complemento (opcional)" value={addr.complement} onChange={e=>{ setAddr({...addr, complement:e.target.value}); if(error) setError(null) }} />
      <div style={{display:'grid', gap:10, gridTemplateColumns:'1fr 1fr'}}>
        <input required placeholder="Cidade" value={addr.city} onChange={e=>{ setAddr({...addr, city:e.target.value}); if(error) setError(null) }} style={{border: ((!/^[A-Za-zÀ-ÿ\s]{2,}$/.test(addr.city)) && error) ? '1px solid #ff6b6b' : undefined}} />
        <select className="themed-select" required value={addr.state} onChange={e=>{ setAddr({...addr, state:e.target.value}); if(error) setError(null) }} style={{border: ((!addr.state) && error) ? '1px solid #ff6b6b' : undefined}}>
          <option value="">Estado (UF)</option>
          {STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
        </select>
      </div>
      <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
        <button className="btn" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar endereço'}</button>
        {error && <div className="chip" role="alert" style={{borderColor:'#ff6b6b'}}>Preencha todos os campos de endereço</div>}
  {saved && <div className="chip success" role="status">Informações salvas com sucesso</div>}
      </div>
    </form>
  )
}

function OrdersList({ onNavigate, userId }){
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AuthController.listOrders()
      .then(setOrders)
      .catch(err => console.error('Erro ao carregar pedidos:', err))
      .finally(() => setLoading(false))
  }, [])

  if(loading){
    return (
      <div className="panel" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:56}}>
        <div className="muted">Carregando pedidos...</div>
      </div>
    )
  }

  if(orders.length === 0){
    return (
      <div className="panel" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:56}}>
        <div className="muted">Você ainda não possui pedidos.</div>
        <button className="btn" onClick={()=> onNavigate('products')}>Explorar Produtos</button>
      </div>
    )
  }
  return (
    <div className="panel" style={{display:'grid', gap:10, marginBottom:56}}>
      {orders.slice().reverse().map(o => (
        <div key={o.id} style={{display:'grid', gap:6, border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:10, background:'var(--panel)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{fontWeight:800}}>Pedido {o.id}</div>
            <div className="muted">{new Date(o.created_at).toLocaleDateString('pt-BR')}</div>
          </div>
          <div className="muted">Total: R$ {Number(o.total).toFixed(2)}</div>
          <div style={{display:'grid', gap:6}}>
            {o.items && o.items.map((it, idx) => (
              <div key={idx} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>{it.title} <span className="muted">• Tam: {it.size || 'M'}</span></div>
                <div className="muted">Qtd: {it.qty}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
