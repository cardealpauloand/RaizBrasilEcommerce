import React, {useState, useMemo, useEffect, useRef} from 'react'
import CartController from '../controllers/CartController'
import AuthController from '../controllers/AuthController'

// Checkout com UX aprimorada inspirado em grandes e-commerces
export default function Checkout({ onComplete }){
  const cart = CartController.getCart()
  const cur = AuthController.current()

  function parseProfileAddress(u){
    if(!u) return null
    // Prefer structured fields from Perfil; fallback to legacy 'address'
    let street = u.street || ''
    let number = u.number || ''
    let complement = u.complement || ''
    if(!(street && number) && u.address){
      const full = String(u.address)
      const m = full.match(/(\d{1,6})/)
      if(m){
        const i = m.index || 0
        number = number || m[1]
        street = street || full.slice(0, i).replace(/[ ,]+$/,'').trim()
        const rest = full.slice(i + m[1].length).replace(/^,?\s*/, '')
        complement = complement || rest
      }else{
        street = street || full
      }
    }
    return {
      name: u.name || '',
      phone: u.phone || '',
      cep: u.zip || '',
      street,
      number,
      complement,
      city: u.city || '',
      state: u.state || ''
    }
  }

  const prefill = useMemo(()=> parseProfileAddress(cur), [cur])
  const [address, setAddress] = useState(prefill || {
    name: '', phone: '', cep: '', street: '', city: '', state: '', number: '', complement: ''
  })
  useEffect(()=>{ if(prefill){ setAddress(a => ({...a, ...prefill})) } }, [prefill?.name, prefill?.phone, prefill?.cep, prefill?.street, prefill?.number, prefill?.complement, prefill?.city, prefill?.state])
  const [payment, setPayment] = useState({ method:'cartao', cardName:'', cardNumber:'', cardExp:'', cardCvv:'' })
  const [step, setStep] = useState('form') // 'form' | 'instructions' | 'done'
  const [pendingOrder, setPendingOrder] = useState(null)
  // PIX data
  const [pixKey, setPixKey] = useState('')
  const [pixCode, setPixCode] = useState('')
  const pixCanvasRef = useRef(null)
  // Boleto data
  const [boletoLinha, setBoletoLinha] = useState('')
  const [boletoDue, setBoletoDue] = useState('')
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState({})
  const STATES = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

  const subtotal = useMemo(()=> cart.items.reduce((acc,it)=> acc + (it.price * it.qty), 0), [cart])
  const shipping = useMemo(()=> subtotal === 0 ? 0 : (subtotal >= 200 ? 0 : 19.9), [subtotal])
  const total = useMemo(()=> subtotal + shipping, [subtotal, shipping])

  function luhnValid(num){
    const digits = num.replace(/\D/g,'')
    let sum = 0; let alt = false
    for(let i = digits.length -1; i >=0; i--){
      let d = parseInt(digits[i],10)
      if(alt){
        d *= 2; if(d > 9) d -= 9
      }
      sum += d; alt = !alt
    }
    return sum % 10 === 0
  }

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
      const rawCard = payment.cardNumber.replace(/\D/g,'')
      if(!/^\d{13,19}$/.test(rawCard)) e.cardNumber = 'Número do cartão'
      else if(!luhnValid(rawCard)) e.cardNumber = 'Cartão inválido'
      if(!payment.cardName.trim()) e.cardName = 'Nome impresso'
      if(!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(payment.cardExp)) e.cardExp = 'Validade MM/AA'
      if(!/^\d{3,4}$/.test(payment.cardCvv)) e.cardCvv = 'CVV inválido'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function generatePix(){
    const key = 'rbpix-' + Math.random().toString(36).slice(2,12)
    const code = `00020126360014BR.GOV.BCB.PIX0114${key}5204000053039865407${total.toFixed(2).replace('.','')}5802BR5924Raiz Brasil Ecommerce6009SAO PAULO62120507RB${Date.now().toString().slice(-6)}6304`
    setPixKey(key); setPixCode(code)
  }
  function drawPix(){
    const canvas = pixCanvasRef.current; if(!canvas) return
    const ctx = canvas.getContext('2d')
    const size = 180
    canvas.width = size; canvas.height = size
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,size,size)
    // simple pseudo QR pattern based on pixCode hash
    const hash = pixCode.split('').reduce((acc,ch)=> acc + ch.charCodeAt(0),0)
    const cell = 6
    for(let y=0;y<size;y+=cell){
      for(let x=0;x<size;x+=cell){
        const v = (x*y + hash) % 11
        if(v < 5){
          ctx.fillStyle = '#1d1f21'
          ctx.fillRect(x,y,cell,cell)
        }
      }
    }
    // three finder squares
    ctx.strokeStyle = '#1d1f21'; ctx.lineWidth = 4
    ctx.strokeRect(4,4,40,40)
    ctx.strokeRect(size-44,4,40,40)
    ctx.strokeRect(4,size-44,40,40)
  }
  useEffect(()=>{ if(step==='instructions' && payment.method==='pix' && pixCode) drawPix() }, [step,payment.method,pixCode])

  function generateBoleto(){
    const due = new Date(Date.now() + 3*24*3600*1000)
    const dueStr = due.toLocaleDateString('pt-BR')
    setBoletoDue(dueStr)
    // fake linha digitável pattern
    const base = '34191.79001 01043.510047 91020.150008'
    const valor = total.toFixed(2).replace('.','')
    const linha = `${base} 9 ${String(Date.now()).slice(-4)}${valor.padStart(10,'0')}`
    setBoletoLinha(linha)
  }

  function place(e){
    e.preventDefault()
    if(cart.items.length === 0) return alert('Carrinho vazio')
    if(!validate()) return
    setProcessing(true)
    setTimeout(()=>{
      const status = payment.method === 'cartao' ? 'pago' : 'aguardando'
      const order = AuthController.placeOrder({
        items: cart.items,
        total,
        subtotal,
        shippingCost: shipping,
        payment: { method: payment.method },
        shipping: address,
        status
      })
      if(payment.method === 'cartao'){
        CartController.clear(); setProcessing(false); setStep('done'); onComplete(order)
      }else{
        // generate payment artifacts
        if(payment.method === 'pix') generatePix()
        if(payment.method === 'boleto') generateBoleto()
        CartController.clear()
        setPendingOrder(order)
        setProcessing(false)
        setStep('instructions')
      }
    }, 900)
  }

  function finalizePayment(){
    if(pendingOrder){
      try{ AuthController.updateOrderStatus(pendingOrder.id, 'pago') }catch(err){ console.error(err) }
      setStep('done'); onComplete(pendingOrder)
    }
  }

  function copy(text){ navigator.clipboard.writeText(text).catch(()=>{}) }

  if(step === 'instructions' && pendingOrder){
    return (
      <div className="container" style={{paddingTop:24}}>
        <h2 style={{marginTop:0}}>Pagamento</h2>
        <div className="checkout-grid">
          <div className="panel" style={{display:'grid', gap:20}}>
            {payment.method === 'pix' && (
              <div style={{display:'grid', gap:16}}>
                <h3 style={{margin:'0 0 4px 0'}}>Pix • Aguardando pagamento</h3>
                <div className="muted" style={{fontSize:12}}>Escaneie o QR Code ou copie o código abaixo para pagar. Após o pagamento clique em "Confirmar Pagamento".</div>
                <canvas ref={pixCanvasRef} style={{background:'#ffffff', borderRadius:12, width:180, height:180, boxShadow:'0 8px 24px rgba(0,0,0,0.4)'}} />
                <div style={{display:'grid', gap:8}}>
                  <div style={{fontSize:12, wordBreak:'break-all', background:'var(--panel)', padding:10, borderRadius:8}}>{pixCode}</div>
                  <button type="button" className="btn-secondary" onClick={()=>copy(pixCode)}>Copiar Código Pix</button>
                </div>
              </div>
            )}
            {payment.method === 'boleto' && (
              <div style={{display:'grid', gap:16}}>
                <h3 style={{margin:'0 0 4px 0'}}>Boleto • Aguardando pagamento</h3>
                <div className="muted" style={{fontSize:12}}>Pague até a data de vencimento para confirmar sua compra.</div>
                <div style={{display:'grid', gap:8}}>
                  <div style={{background:'var(--panel)', padding:10, borderRadius:8, fontSize:13, fontFamily:'monospace'}}>{boletoLinha}</div>
                  <div className="muted" style={{fontSize:12}}>Vencimento: {boletoDue}</div>
                  <button type="button" className="btn-secondary" onClick={()=>copy(boletoLinha)}>Copiar Linha Digitável</button>
                </div>
              </div>
            )}
            <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
              <button className="btn" type="button" onClick={finalizePayment}>Confirmar Pagamento</button>
              <button className="btn-secondary" type="button" onClick={()=>{ setStep('form'); setPendingOrder(null) }}>Voltar</button>
            </div>
          </div>
          <aside className="panel checkout-summary" style={{display:'grid', gap:18, alignSelf:'start'}}>
            <h3 style={{margin:'0 0 4px 0'}}>Resumo</h3>
            <div style={{display:'grid', gap:10}}>
              {(pendingOrder.items||[]).map((it,idx) => (
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
            <div className="chip info" style={{justifyContent:'center'}}>Status: aguardando</div>
          </aside>
        </div>
      </div>
    )
  }

  if(step === 'done'){
    return (
      <div className="container" style={{paddingTop:24}}>
        <div className="panel" style={{display:'grid', gap:14, maxWidth:600}}>
          <h2 style={{margin:0}}>Pagamento confirmado</h2>
          <div className="muted" style={{fontSize:14}}>Seu pedido foi registrado com sucesso.</div>
          <div style={{display:'flex', gap:12}}>
            <button className="btn" onClick={()=>onComplete(pendingOrder || {})}>Ver confirmação</button>
            <button className="btn-secondary" onClick={()=>location.hash='#home'}>Voltar à Home</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{paddingTop:24}}>
      <h2 style={{marginTop:0}}>Finalizar Compra</h2>
      <div className="checkout-grid">
        {/* Coluna principal */}
        <form onSubmit={place} style={{display:'grid', gap:24}}>
          <section className="panel" style={{display:'grid', gap:18}}>
            <h3 style={{margin:'0 0 4px 0'}}>Endereço</h3>
            <div style={{display:'grid', gap:12}}>
              <div className="two-col" style={{display:'grid', gap:12}}>
                <Input label="Nome completo" value={address.name} error={errors.name} onChange={v=>setAddress({...address,name:v})} />
                <Input label="Telefone" value={address.phone} error={errors.phone} onChange={v=>setAddress({...address,phone:v.replace(/\D/g,'')})} placeholder="(DDD)" />
              </div>
              <div className="address-row-cep">
                <Input label="CEP" value={address.cep} error={errors.cep} onChange={v=>setAddress({...address,cep:v.replace(/\D/g,'')})} maxLength={8} />
                <Input label="Rua" value={address.street} error={errors.street} onChange={v=>setAddress({...address,street:v})} />
                <Input label="Número" value={address.number} error={errors.number} onChange={v=>setAddress({...address,number:v})} />
              </div>
              <div className="city-uf-row" style={{display:'grid', gap:12}}>
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
                <div className="two-col" style={{display:'grid', gap:12}}>
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
  <aside className="panel checkout-summary" style={{display:'grid', gap:18, alignSelf:'start'}}>
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
          <div className="chip info" style={{justifyContent:'center'}}>Frete grátis em compras acima de R$ 200,00</div>
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
