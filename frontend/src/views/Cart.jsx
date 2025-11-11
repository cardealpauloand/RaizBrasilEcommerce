import React, {useState, useEffect} from 'react'
import CartController from '../controllers/CartController'

export default function Cart({ onNavigate }){
  const [cart, setCart] = useState(CartController.getCart())

  useEffect(()=>{
    setCart(CartController.getCart())
  }, [])

  function inc(id, size){ setCart(CartController.add(id, 1, size||'M')) }
  function dec(id, size){
    const cur = cart.items.find(i=>i.productId===id && (i.size||'M')===(size||'M'))
    const nextQty = ((cur?.qty)||1) - 1
    setCart(CartController.update(id, nextQty, size||'M'))
  }
  function remove(id, size){ setCart(CartController.remove(id, size||'M')) }

  const total = CartController.total()

  return (
    <div className="container" style={{paddingTop:20}}>
      <h2>Seu Carrinho</h2>
      {cart.items.length === 0 ? (
        <div className="muted">Seu carrinho está vazio.</div>
      ) : (
        <div style={{display:'grid', gap:12}}>
          {cart.items.map(item => (
            <div key={item.productId + '_' + (item.size||'M')} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--panel)', border:'1px solid rgba(255,255,255,0.12)', padding:12, borderRadius:10}}>
              <div>
                <div style={{fontWeight:700}}>{item.title}</div>
                <div className="muted">Tamanho: {item.size || 'M'} • R$ {item.price.toFixed(2)} x {item.qty}</div>
              </div>
              <div style={{display:'flex', gap:8}}>
                <button className="chip" style={{color:'#ffffff', fontWeight:700}} onClick={() => dec(item.productId, item.size)}>-</button>
                <div className="chip" style={{color:'#ffffff', fontWeight:600}}>{item.qty}</div>
                <button className="chip" style={{color:'#ffffff', fontWeight:700}} onClick={() => inc(item.productId, item.size)}>+</button>
                <button className="btn" onClick={() => remove(item.productId, item.size)}>Remover</button>
              </div>
            </div>
          ))}
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div className="muted">Total</div>
            <div style={{fontSize:20, fontWeight:800}}>R$ {total.toFixed(2)}</div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button className="btn" onClick={() => onNavigate('checkout')}>Finalizar Compra</button>
            <button className="chip add-btn" onClick={() => { CartController.clear(); setCart(CartController.getCart()) }}>Esvaziar</button>
          </div>
        </div>
      )}
    </div>
  )
}
