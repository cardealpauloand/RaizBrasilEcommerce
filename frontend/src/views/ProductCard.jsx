import React, { useState } from 'react'

export default function ProductCard({product, onView, onAdd}){
  const imgs = product.images || [product.image]
  const [idx, setIdx] = useState(0)
  const toggle = () => setIdx(prev => (imgs.length > 1 ? (prev === 0 ? 1 : 0) : 0))
  return (
    <div className="product-card">
      <img
        src={imgs[idx]}
        alt={product.title}
        className={`product-img ${idx === 1 ? 'flipped' : ''}`}
        onClick={toggle}
        title="Clique para ver frente/costas"
        style={{cursor: imgs.length>1 ? 'pointer':'default'}}
      />
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{fontSize:16}}>{product.title}</div>
        <div className="price">R$ {product.price.toFixed(2)}</div>
      </div>
      <div className="muted" style={{fontSize:13}}>{product.category}</div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10}}>
        <button className="btn-secondary" style={{height:40}} onClick={() => onView('product', product.id)} aria-label="Ver detalhes do produto">Ver detalhes</button>
        <button className="btn" style={{height:40}} onClick={() => onAdd(product.id)} aria-label="Adicionar ao carrinho">Adicionar</button>
      </div>
    </div>
  )
}
