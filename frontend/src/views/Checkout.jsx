import React, {useState, useMemo} from 'react'
import CartController from '../controllers/CartController'
import AuthController from '../controllers/AuthController'

// Checkout com UX aprimorada inspirado em grandes e-commerces
export default function Checkout({ onComplete }){
  const cart = CartController.getCart()
  const cur = AuthController.current()
  const [address, setAddress] = useState({
    name: cur?.name || '',
    phone: cur?.phone || '',
    cep: '',
    street: cur?.address || '',
    city: '',
    state: '',
    number: '',
    complement: ''
  })
  const [payment, setPayment] = useState({ method:'cartao', cardName:'', cardNumber:'', cardExp:'', cardCvv:'' })
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState({})
  const STATES = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

  const subtotal = useMemo(()=> cart.items.reduce((acc,it)=> acc + (it.price * it.qty), 0), [cart])
  const shipping = useMemo(()=> subtotal === 0 ? 0 : (subtotal >= 200 ? 0 : 19.9), [subtotal])
  const total = useMemo(()=> subtotal + shipping, [subtotal, shipping])

  function validate(){
    const e = {}
    if(!address.name.trim()) e.name = 'Informe o nome'
    if(!/^\d{8}$/.test(address.cep)) e.cep = 'CEP inválido'
    if(!address.street.trim()) e.street = 'Informe a rua'
    if(!address.number.trim()) e.number = 'Número necessário'
    if(!address.city.trim()) e.city = 'Cidade obrigatória'
    if(!STATES.includes(address.state)) e.state = 'Selecione UF'
    if(!/^\d{10,11}$/.test(address.phone.replace(/\D/g,''))) e.phone = 'Telefone inválido'
    if(payment.method === 'cartao'){
      if(!/^\d{13,19}$/.test(payment.cardNumber.replace(/\D/g,''))) e.cardNumber = 'Número do cartão'
      if(!payment.cardName.trim()) e.cardName = 'Nome impresso'
      if(!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(payment.cardExp)) e.cardExp = 'Validade MM/AA'
      if(!/^\d{3,4}$/.test(payment.cardCvv)) e.cardCvv = 'CVV inválido'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function place(e){
    e.preventDefault()
    if(cart.items.length === 0) return alert('Carrinho vazio')
    if(!validate()) return
    setProcessing(true)
    setTimeout(()=>{
      const order = AuthController.placeOrder({
        items: cart.items,
        total,
        subtotal,
        shippingCost: shipping,
        payment: { method: payment.method },
        shipping: address
      })
      CartController.clear()
      setProcessing(false)
      onComplete(order)
    }, 900)
  }

  return (
    <div className="container" style={{paddingTop:24}}>
      <h2 style={{marginTop:0}}>Finalizar Compra</h2>
      <div style={{display:'grid', gap:24, gridTemplateColumns:'1fr 380px'}}>
        {/* Coluna principal */}
        <form onSubmit={place} style={{display:'grid', gap:24}}>
          <section className="panel" style={{display:'grid', gap:18}}>
            <h3 style={{margin:'0 0 4px 0'}}>Endereço</h3>
            <div style={{display:'grid', gap:12}}>
              <div style={{display:'grid', gap:12, gridTemplateColumns:'1fr 1fr'}}>
                <Input label="Nome completo" value={address.name} error={errors.name} onChange={v=>setAddress({...address,name:v})} />
                <Input label="Telefone" value={address.phone} error={errors.phone} onChange={v=>setAddress({...address,phone:v.replace(/\D/g,'')})} placeholder="(DDD)" />
              </div>
              <div style={{display:'grid', gap:12, gridTemplateColumns:'140px 1fr 100px'}}>
                <Input label="CEP" value={address.cep} error={errors.cep} onChange={v=>setAddress({...address,cep:v.replace(/\D/g,'')})} maxLength={8} />
                <Input label="Rua" value={address.street} error={errors.street} onChange={v=>setAddress({...address,street:v})} />
                <Input label="Número" value={address.number} error={errors.number} onChange={v=>setAddress({...address,number:v})} />
              </div>
              <div style={{display:'grid', gap:12, gridTemplateColumns:'1fr 120px'}}>
                <Input label="Cidade" value={address.city} error={errors.city} onChange={v=>setAddress({...address,city:v})} />
                <div style={{display:'grid', gap:4}}>
                  <span className="muted" style={{fontSize:12}}>UF</span>
                  <select className="themed-select" value={address.state} onChange={e=>setAddress({...address,state:e.target.value})} style={errors.state ? {borderColor:'var(--danger)'} : undefined}>
                    <option value="">UF</option>
                    {STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>
              <Input label="Complemento" value={address.complement} onChange={v=>setAddress({...address,complement:v})} optional />
            </div>
          </section>

          <section className="panel" style={{display:'grid', gap:18}}>
            <h3 style={{margin:'0 0 4px 0'}}>Pagamento</h3>
            <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
              {['cartao','pix','boleto'].map(m => (
                <button type="button" key={m} className={payment.method===m? 'btn':'btn-secondary'} onClick={()=>setPayment({...payment, method:m})} style={{minWidth:100}}>
                  {m === 'cartao' ? 'Cartão' : m === 'pix' ? 'Pix' : 'Boleto'}
                </button>
              ))}
            </div>
            {payment.method === 'cartao' && (
              <div style={{display:'grid', gap:12}}>
                <Input label="Nome impresso" value={payment.cardName} error={errors.cardName} onChange={v=>setPayment({...payment,cardName:v})} />
                <Input label="Número do cartão" value={payment.cardNumber} error={errors.cardNumber} onChange={v=>setPayment({...payment,cardNumber:v.replace(/\D/g,'')})} maxLength={19} placeholder="Somente números" />
                <div style={{display:'grid', gap:12, gridTemplateColumns:'1fr 1fr'}}>
                  <Input label="Validade (MM/AA)" value={payment.cardExp} error={errors.cardExp} onChange={v=>setPayment({...payment,cardExp:v})} placeholder="MM/AA" maxLength={5} />
                  <Input label="CVV" value={payment.cardCvv} error={errors.cardCvv} onChange={v=>setPayment({...payment,cardCvv:v.replace(/\D/g,'')})} maxLength={4} />
                </div>
              </div>
            )}
            {payment.method === 'pix' && <div className="muted" style={{fontSize:12}}>Você receberá um QR Code na próxima etapa (simulação).</div>}
            {payment.method === 'boleto' && <div className="muted" style={{fontSize:12}}>Geraremos um boleto válido por 3 dias (simulação).</div>}
          </section>

          <div style={{display:'flex', flexDirection:'column', gap:16}}>
            <button className="btn" type="submit" disabled={processing}>{processing ? 'Processando...' : 'Confirmar e Pagar'}</button>
            <div className="muted" style={{fontSize:12}}>Transação segura • Dados criptografados • Política de privacidade</div>
            {Object.keys(errors).length > 0 && <div className="chip danger">Verifique os campos destacados</div>}
          </div>
        </form>

        {/* Sidebar resumo */}
        <aside className="panel" style={{display:'grid', gap:18, alignSelf:'start', position:'sticky', top:90}}>
          <h3 style={{margin:'0 0 4px 0'}}>Resumo do Pedido</h3>
          {cart.items.length === 0 && <div className="muted">Carrinho vazio</div>}
          <div style={{display:'grid', gap:10}}>
            {cart.items.map((it,idx) => (
              <div key={idx} style={{display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13}}>
                <div style={{display:'grid', gap:2}}>
                  <span>{it.title}</span>
                  <span className="muted">Tam: {it.size || 'M'} • Qtd: {it.qty}</span>
                </div>
                <div style={{fontWeight:600}}>R$ {(it.price * it.qty).toFixed(2)}</div>
              </div>
            ))}
          </div>
          <hr style={{border:'none', borderTop:'1px solid var(--border)'}} />
          <div style={{display:'grid', gap:6, fontSize:14}}>
            <Row label="Subtotal" value={`R$ ${subtotal.toFixed(2)}`} />
            <Row label="Frete" value={shipping === 0 ? 'Grátis' : `R$ ${shipping.toFixed(2)}`} />
            <Row label="Total" value={`R$ ${total.toFixed(2)}`} bold />
          </div>
          <div className="chip free-shipping" style={{justifyContent:'center', fontWeight:500}}>🚚 Frete grátis em compras acima de R$ 200,00</div>
          <div className="muted" style={{fontSize:11}}>Ao confirmar você concorda com nossos termos e condições de compra.</div>
        </aside>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, error, placeholder, maxLength, optional }){
  return (
    <div style={{display:'grid', gap:4}}>
      <span className="muted" style={{fontSize:12}}>{label}{optional && ' (opcional)'}</span>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}
        style={error ? {borderColor:'var(--danger)'} : undefined} />
      {error && <span style={{color:'var(--danger)', fontSize:11}}>{error}</span>}
    </div>
  )
}

function Row({ label, value, bold }){
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
      <span className={bold ? '' : 'muted'} style={bold ? {fontWeight:700} : undefined}>{label}</span>
      <span style={bold ? {fontWeight:700} : {}}>{value}</span>
    </div>
  )
}
