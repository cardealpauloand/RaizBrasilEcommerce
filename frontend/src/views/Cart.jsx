import React, {useState, useEffect, useMemo} from 'react'
import CartController from '../controllers/CartController'
import SavedItemModel from '../models/SavedItemModel'
import ProductModel from '../models/ProductModel'

export default function Cart({ onNavigate }){
  const [cart, setCart] = useState({ items: [] })
  const [saved, setSaved] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    Promise.all([
      CartController.getCart().then(setCart),
      SavedItemModel.load().then(setSaved)
    ])
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function inc(id, size){
    try {
      const result = await CartController.add(id, 1, size||'M')
      setCart(result)
    } catch(err) {
      console.error('Erro ao adicionar:', err)
    }
  }

  async function dec(id, size){
    try {
      const cur = cart.items.find(i=>(i.product_id||i.productId)===id && (i.size||'M')===(size||'M'))
      const nextQty = ((cur?.qty)||1) - 1
      const result = await CartController.update(cur.id || id, nextQty, size||'M')
      setCart(result)
    } catch(err) {
      console.error('Erro ao decrementar:', err)
    }
  }

  async function remove(id, size){
    if(confirm('Remover este item do carrinho?')){
      try {
        const cur = cart.items.find(i=>(i.product_id||i.productId)===id && (i.size||'M')===(size||'M'))
        const result = await CartController.remove(cur.id || id, size||'M')
        setCart(result)
      } catch(err) {
        console.error('Erro ao remover:', err)
      }
    }
  }

  async function saveForLater(id, size){
    const it = cart.items.find(i=>(i.product_id||i.productId)===id && (i.size||'M')===(size||'M'))
    if(!it) return
    try {
      const savedItem = await SavedItemModel.add(id, size)
      setSaved([...saved, savedItem])
      const cur = cart.items.find(i=>(i.product_id||i.productId)===id && (i.size||'M')===(size||'M'))
      const result = await CartController.remove(cur.id || id, size||'M')
      setCart(result)
    } catch(err) {
      console.error('Erro ao salvar para depois:', err)
    }
  }

  async function moveToCart(id, size){
    try {
      const result = await CartController.add(id, 1, size||'M')
      setCart(result)
      // Find the saved item by product_id and size
      const savedItem = saved.find(s => s.product_id===id && (s.size||'M')===(size||'M'))
      if(savedItem) {
        await SavedItemModel.remove(savedItem.id)
        setSaved(saved.filter(s => s.id !== savedItem.id))
      }
    } catch(err) {
      console.error('Erro ao mover para carrinho:', err)
    }
  }

  const subtotal = useMemo(()=> cart.items.reduce((acc,it)=> acc + ((it.price || 0) * (it.qty || 1)), 0), [cart])
  const shipping = useMemo(()=> subtotal === 0 ? 0 : (subtotal >= 200 ? 0 : 19.9), [subtotal])
  const total = useMemo(()=> subtotal + shipping, [subtotal, shipping])
  const freeLeft = useMemo(()=> Math.max(0, 200 - subtotal), [subtotal])
  const freeProgress = useMemo(()=> Math.min(1, subtotal/200), [subtotal])

  if (loading) {
    return (
      <div className="container" style={{paddingTop:20}}>
        <h2 style={{margin:'0 0 12px'}}>Seu Carrinho</h2>
        <div className="panel" style={{display:'grid', gap:12, alignItems:'center', justifyItems:'center', padding:28}}>
          <div style={{fontSize:14}}>Carregando carrinho...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{paddingTop:20}}>
      <h2 style={{margin:'0 0 12px'}}>Seu Carrinho</h2>
      {cart.items.length === 0 ? (
        <div className="panel" style={{display:'grid', gap:12, alignItems:'center', justifyItems:'center', padding:28}}>
          <div style={{fontSize:18, fontWeight:700}}>Seu carrinho está vazio</div>
          <div className="muted">Explore nossas camisetas e adicione seus favoritos.</div>
          <button className="btn" onClick={()=>onNavigate('home')}>Começar a comprar</button>
        </div>
      ) : (
        <div className="cart-grid" style={{display:'grid', gridTemplateColumns:'1fr 360px', gap:18}}>
          {/* Lista de itens */}
          <section style={{display:'grid', gap:12}}>
            {/* Banner de frete */}
            <div className="panel" style={{padding:12, borderRadius:12}}>
              {freeLeft > 0 ? (
                <div style={{display:'grid', gap:8}}>
                  <div><strong>Faltam R$ {freeLeft.toFixed(2)}</strong> para frete grátis</div>
                  <div style={{height:8, background:'rgba(255,255,255,0.08)', borderRadius:999}}>
                    <div style={{width:(freeProgress*100)+'%', height:'100%', background:'linear-gradient(90deg,var(--accent,#18b06b),#126B36)', borderRadius:999}} />
                  </div>
                </div>
              ) : (
                <div className="chip success" style={{justifyContent:'center'}}>Parabéns! Frete grátis garantido</div>
              )}
            </div>

            {cart.items.map(item => {
              const productId = item.product_id || item.productId
              const p = ProductModel.findById(productId)
              const img = p?.images?.[0]
              return (
                <div key={productId + '_' + (item.size||'M')} className="panel" style={{display:'grid', gridTemplateColumns:'96px 1fr auto', gap:14, alignItems:'center'}}>
                  <div style={{width:96, height:96, borderRadius:12, overflow:'hidden', background:'rgba(255,255,255,0.04)'}}>
                    {img ? <img src={img} alt={item.title} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : null}
                  </div>
                  <div style={{display:'grid', gap:6}}>
                    <div style={{fontWeight:700}}>{item.title}</div>
                    <div className="muted" style={{fontSize:12}}>Tamanho: {item.size || 'M'} • Preço: R$ {(item.price || 0).toFixed(2)}</div>
                    <div className="muted" style={{fontSize:12}}>Entrega estimada: 3–7 dias úteis</div>
                    <div style={{display:'flex', gap:10, alignItems:'center', flexWrap:'wrap'}}>
                      <div className="qty" style={{display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.06)', borderRadius:999, padding:'4px 8px'}}>
                        <button className="chip" style={{color:'#ffffff', fontWeight:700}} onClick={() => dec(productId, item.size)} disabled={item.qty<=1}>-</button>
                        <div className="chip" style={{color:'#ffffff', fontWeight:600}}>{item.qty}</div>
                        <button className="chip" style={{color:'#ffffff', fontWeight:700}} onClick={() => inc(productId, item.size)}>+</button>
                      </div>
                      <button className="btn-secondary" onClick={() => saveForLater(productId, item.size)}>Salvar para depois</button>
                      <button className="btn" onClick={() => remove(productId, item.size)}>Remover</button>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div className="muted" style={{fontSize:12}}>Subtotal</div>
                    <div style={{fontWeight:800}}>R$ {((item.price || 0) * (item.qty || 1)).toFixed(2)}</div>
                  </div>
                </div>
              )
            })}

            {saved.length > 0 && (
              <div className="panel" style={{display:'grid', gap:10}}>
                <div style={{fontWeight:700}}>Salvos para depois</div>
                {saved.map((s, idx)=>{
                  const p = ProductModel.findById(s.productId)
                  if(!p) return null
                  const img = p.images?.[0]
                  return (
                    <div key={idx} style={{display:'grid', gridTemplateColumns:'64px 1fr auto', gap:12, alignItems:'center'}}>
                      <div style={{width:64, height:64, borderRadius:8, overflow:'hidden', background:'rgba(255,255,255,0.04)'}}>
                        {img ? <img src={img} alt={p.title} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : null}
                      </div>
                      <div>
                        <div style={{fontWeight:600}}>{p.title}</div>
                        <div className="muted" style={{fontSize:12}}>Tamanho: {s.size || 'M'}</div>
                      </div>
                      <button className="btn-secondary" onClick={()=>moveToCart(s.productId, s.size)}>Mover para carrinho</button>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Resumo */}
          <aside className="panel" style={{position:'sticky', top:90, alignSelf:'start', display:'grid', gap:12, height:'fit-content'}}>
            <div style={{display:'grid', gap:8}}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span className="muted">Itens</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span className="muted">Frete</span>
                <span>{shipping === 0 ? 'Grátis' : `R$ ${shipping.toFixed(2)}`}</span>
              </div>
              <div style={{height:1, background:'var(--border)'}}/>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span style={{fontWeight:800}}>Total</span>
                <span style={{fontWeight:800}}>R$ {total.toFixed(2)}</span>
              </div>
            </div>
            <button className="btn" onClick={() => onNavigate('checkout')}>Finalizar Compra</button>
            <button className="btn-secondary" onClick={() => onNavigate('home')}>Continuar comprando</button>
            <div className="muted" style={{fontSize:11}}>Pagamentos seguros • Devolução facilitada</div>
          </aside>
        </div>
      )}
    </div>
  )
}
